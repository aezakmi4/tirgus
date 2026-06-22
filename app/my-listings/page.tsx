'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ImageOff, Pencil, Trash2, LogIn, Plus } from 'lucide-react';
import { createClient } from '../lib/supabaseClient';

type MyListing = {
  id: number;
  title: string;
  price: number | null;
  location: string;
  image_url: string | null;
  created_at: string;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });

export default function MyListingsPage() {
  // Аутентифицированный клиент: под ним delete пройдёт RLS (auth.uid() = user_id).
  const [supabase] = useState(() => createClient());
  // undefined — ещё проверяем сессию, null — гость, иначе id пользователя.
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [listings, setListings] = useState<MyListing[] | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  // Грузим объявления текущего пользователя, когда он известен.
  useEffect(() => {
    if (!userId) return;
    supabase
      .from('listings')
      .select('id, title, price, location, image_url, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setListings((data as MyListing[]) ?? []));
  }, [supabase, userId]);

  async function handleDelete(id: number) {
    if (!window.confirm('Удалить объявление? Это действие нельзя отменить.')) return;
    setDeletingId(id);
    const { error } = await supabase.from('listings').delete().eq('id', id);
    setDeletingId(null);
    if (error) {
      alert('Не удалось удалить: ' + error.message);
      return;
    }
    setListings((prev) => (prev ? prev.filter((l) => l.id !== id) : prev));
  }

  const PageHeader = (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-3xl mx-auto px-5 py-4">
        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-blue-700 transition-colors text-sm font-semibold">
          <ArrowLeft size={18} /> Назад
        </Link>
      </div>
    </header>
  );

  // Ещё проверяем сессию.
  if (userId === undefined) {
    return (
      <div className="min-h-screen bg-[#f4f6f9]">
        {PageHeader}
        <main className="max-w-3xl mx-auto px-5 py-8 text-gray-400 text-sm">Загрузка…</main>
      </div>
    );
  }

  // Гость.
  if (userId === null) {
    return (
      <div className="min-h-screen bg-[#f4f6f9]">
        {PageHeader}
        <main className="max-w-3xl mx-auto px-5 py-8">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Мои объявления</h1>
          <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 grid place-items-center">
              <LogIn size={26} />
            </div>
            <div>
              <div className="text-lg font-extrabold text-gray-900">Войдите, чтобы видеть свои объявления</div>
              <p className="text-sm text-gray-500 mt-1">Здесь будут все объявления, привязанные к вашему аккаунту.</p>
            </div>
            <Link href="/login" className="post-btn justify-center !h-12 w-full max-w-xs">Войти</Link>
            <p className="text-sm text-gray-500">
              Нет аккаунта?{' '}
              <Link href="/register" className="font-bold text-blue-700 hover:underline">Зарегистрироваться</Link>
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      {PageHeader}
      <main className="max-w-3xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">Мои объявления</h1>
          <Link href="/submit" className="post-btn !h-10 px-4">
            <Plus size={16} /><span className="post-label">Подать</span>
          </Link>
        </div>

        {listings === null ? (
          <div className="text-gray-400 text-sm">Загрузка…</div>
        ) : listings.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <p className="text-gray-600 font-semibold mb-1">У вас пока нет объявлений</p>
            <p className="text-sm text-gray-500 mb-4">Создайте первое — это займёт пару минут.</p>
            <Link href="/submit" className="font-bold text-blue-700 hover:underline">Подать объявление</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {listings.map((l) => (
              <div key={l.id} className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-4">
                <Link href={`/listings/${l.id}`} className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 grid place-items-center flex-none">
                    {l.image_url
                      ? <img src={l.image_url} alt={l.title} className="w-full h-full object-cover" />
                      : <ImageOff size={22} className="text-gray-400" />}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 truncate">{l.title}</div>
                    <div className="text-blue-700 font-extrabold text-sm mt-0.5">
                      {l.price ? `${l.price.toLocaleString('ru-RU')} €` : 'Договорная'}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 truncate">{l.location} · {formatDate(l.created_at)}</div>
                  </div>
                </Link>
                <div className="flex items-center gap-2 flex-none">
                  <Link
                    href={`/my-listings/${l.id}/edit`}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-700 transition-colors"
                  >
                    <Pencil size={15} /><span className="hidden sm:inline">Редактировать</span>
                  </Link>
                  <button
                    onClick={() => handleDelete(l.id)}
                    disabled={deletingId === l.id}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-gray-200 text-sm font-semibold text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={15} /><span className="hidden sm:inline">{deletingId === l.id ? 'Удаляем…' : 'Удалить'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
