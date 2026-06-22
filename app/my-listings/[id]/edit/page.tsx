'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, LogIn, ImagePlus, X } from 'lucide-react';
import { createClient } from '../../../lib/supabaseClient';
import { categoryFields } from '../../../lib/categoryFields';
import { uploadListingImages } from '../../../lib/uploadListingImages';

type Category = { id: number; name: string };

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);

  // Аутентифицированный клиент: под ним UPDATE проходит RLS (auth.uid() = user_id).
  const [supabase] = useState(() => createClient());
  // undefined — ещё проверяем сессию, null — гость, иначе id пользователя.
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  const [categories, setCategories] = useState<Category[]>([]);
  // undefined — ещё грузим, null — не найдено.
  const [ownerId, setOwnerId] = useState<string | null | undefined>(undefined);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ title: '', description: '', price: '', category_id: '', location: '' });
  const [details, setDetails] = useState<Record<string, string>>({});

  // Фото: существующие (уже URL) и новые (файлы для загрузки) — раздельно.
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<{ file: File; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    supabase.from('categories').select('*').order('id').then(({ data }) => {
      if (data) setCategories(data as Category[]);
    });
  }, [supabase]);

  // Грузим объявление, когда пользователь известен.
  useEffect(() => {
    if (!userId) return;
    supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) {
          setNotFound(true);
          return;
        }
        setOwnerId(data.user_id ?? null);
        // Предзаполняем форму текущими значениями.
        setForm({
          title: data.title ?? '',
          description: data.description ?? '',
          price: data.price != null ? String(data.price) : '',
          category_id: String(data.category_id ?? ''),
          location: data.location ?? '',
        });
        setDetails((data.details as Record<string, string>) ?? {});
        // Существующие фото: массив images, иначе одиночная обложка (для старых объявлений).
        setExistingPhotos((data.images as string[] | null) ?? (data.image_url ? [data.image_url] : []));
      });
  }, [supabase, userId, id]);

  function handleNewPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    setNewPhotos((prev) => [...prev, ...selected.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
    e.target.value = ''; // позволяет выбрать тот же файл повторно
  }

  function removeExisting(index: number) {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function removeNew(index: number) {
    setNewPhotos((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    if (e.target.name === 'category_id') setDetails({});
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleDetailChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setDetails({ ...details, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category_id || !form.location) {
      alert('Заполни категорию и город');
      return;
    }
    if (form.category_id !== '1' && !form.title) {
      alert('Заполни название');
      return;
    }
    let finalTitle = form.title;
    if (form.category_id === '1') {
      const parts = [details.brand, details.model, details.engine ? details.engine + 'л' : '', details.year].filter(Boolean);
      finalTitle = parts.join(' ');
      if (!finalTitle) {
        alert('Заполни хотя бы марку и модель');
        return;
      }
    }
    setLoading(true);

    // Грузим ТОЛЬКО новые файлы; старые уже URL — повторно не загружаем.
    let newUrls: string[] = [];
    if (newPhotos.length > 0) {
      setUploading(true);
      try {
        newUrls = await uploadListingImages(supabase, newPhotos.map((p) => p.file));
      } catch (err) {
        setUploading(false);
        setLoading(false);
        alert('Ошибка загрузки фото: ' + (err as Error).message);
        return; // в БД не пишем, если загрузка не удалась
      }
      setUploading(false);
    }

    const finalImages = [...existingPhotos, ...newUrls]; // оставшиеся старые + новые, в порядке отображения
    const cover = finalImages[0] ?? null;                // обложка или null, если фото не осталось

    // user_id НЕ включаем — Supabase обновляет только переданные колонки, автор не трогается.
    // images / image_url теперь обновляем намеренно.
    const { error } = await supabase.from('listings').update({
      title: finalTitle,
      description: form.description,
      price: form.price ? Number(form.price) : null,
      category_id: Number(form.category_id),
      location: form.location,
      details: Object.keys(details).length > 0 ? details : null,
      images: finalImages,
      image_url: cover,
    }).eq('id', id);
    setLoading(false);
    if (error) { alert('Ошибка: ' + error.message); return; }
    router.push(`/listings/${id}`);
    router.refresh();
  }

  const fields = form.category_id ? categoryFields[Number(form.category_id)] || [] : [];
  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 bg-white placeholder:text-gray-400 placeholder:italic text-gray-900";
  const labelClass = "block text-sm font-bold text-gray-700 mb-1";

  const PageHeader = (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-2xl mx-auto px-5 py-4">
        <Link href="/my-listings" className="flex items-center gap-2 text-gray-500 hover:text-blue-700 transition-colors text-sm font-semibold">
          <ArrowLeft size={18} /> К моим объявлениям
        </Link>
      </div>
    </header>
  );

  // Ещё проверяем сессию.
  if (userId === undefined) {
    return (
      <div className="min-h-screen bg-[#f4f6f9]">
        {PageHeader}
        <main className="max-w-2xl mx-auto px-5 py-8 text-gray-400 text-sm">Загрузка…</main>
      </div>
    );
  }

  // Гость.
  if (userId === null) {
    return (
      <div className="min-h-screen bg-[#f4f6f9]">
        {PageHeader}
        <main className="max-w-2xl mx-auto px-5 py-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 grid place-items-center">
              <LogIn size={26} />
            </div>
            <div className="text-lg font-extrabold text-gray-900">Войдите, чтобы редактировать объявление</div>
            <Link href="/login" className="post-btn justify-center !h-12 w-full max-w-xs">Войти</Link>
          </div>
        </main>
      </div>
    );
  }

  // Объявление не найдено.
  if (notFound) {
    return (
      <div className="min-h-screen bg-[#f4f6f9]">
        {PageHeader}
        <main className="max-w-2xl mx-auto px-5 py-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-600 font-semibold">
            Объявление не найдено
          </div>
        </main>
      </div>
    );
  }

  // Ещё грузим объявление.
  if (ownerId === undefined) {
    return (
      <div className="min-h-screen bg-[#f4f6f9]">
        {PageHeader}
        <main className="max-w-2xl mx-auto px-5 py-8 text-gray-400 text-sm">Загрузка…</main>
      </div>
    );
  }

  // Не владелец (UX-гейт; RLS на UPDATE всё равно не пропустит чужого).
  if (ownerId !== userId) {
    return (
      <div className="min-h-screen bg-[#f4f6f9]">
        {PageHeader}
        <main className="max-w-2xl mx-auto px-5 py-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <p className="text-gray-600 font-semibold mb-3">Это не ваше объявление</p>
            <Link href="/my-listings" className="font-bold text-blue-700 hover:underline">К моим объявлениям</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      {PageHeader}

      <main className="max-w-2xl mx-auto px-5 py-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Редактировать объявление</h1>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-5">

          {form.category_id !== '1' && (
            <div>
              <label className={labelClass}>Название *</label>
              <input name="title" value={form.title} onChange={handleChange} placeholder="Например: iPhone 14 Pro 256GB" className={inputClass} />
            </div>
          )}

          <div>
            <label className={labelClass}>Категория *</label>
            <select name="category_id" value={form.category_id} onChange={handleChange} className={inputClass}>
              <option value="">Выбери категорию</option>
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>

          {fields.length > 0 && (
            <div className="border border-gray-200 bg-white rounded-2xl p-4 flex flex-col gap-4">
              <div className="text-sm font-bold text-blue-700">Характеристики</div>
              {fields.map((field) => (
                <div key={field.name}>
                  <label className={labelClass}>{field.label}</label>
                  {field.type === 'select' ? (
                    <select name={field.name} value={details[field.name] || ''} onChange={handleDetailChange} className={inputClass}>
                      <option value="">Выбрать...</option>
                      {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input name={field.name} value={details[field.name] || ''} onChange={handleDetailChange} placeholder={field.placeholder} type={field.type || 'text'} className={inputClass} />
                  )}
                </div>
              ))}
            </div>
          )}

          <div>
            <label className={labelClass}>Фото</label>
            <label className="flex items-center justify-center gap-2 border border-dashed border-gray-300 rounded-xl px-4 py-3 text-sm font-semibold text-gray-500 cursor-pointer hover:border-blue-400 hover:text-blue-700 transition-colors">
              <ImagePlus size={18} /> Добавить фото
              <input type="file" multiple accept="image/*" onChange={handleNewPhotos} className="hidden" />
            </label>
            {(existingPhotos.length > 0 || newPhotos.length > 0) && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
                {/* Существующие фото (URL) */}
                {existingPhotos.map((url, i) => (
                  <div key={url} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExisting(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {/* Новые фото (превью до загрузки) */}
                {newPhotos.map((photo, i) => (
                  <div key={photo.url} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNew(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>Описание</label>
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Расскажи подробнее..." rows={4} className={`${inputClass} resize-none`} />
          </div>

          <div>
            <label className={labelClass}>Цена (€)</label>
            <input name="price" value={form.price} onChange={handleChange} placeholder="Оставь пустым если договорная" type="number" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Город *</label>
            <input name="location" value={form.location} onChange={handleChange} placeholder="Rīga, Daugavpils, Liepāja..." className={inputClass} />
          </div>

          <button onClick={handleSubmit} disabled={loading || uploading} className="w-full bg-blue-700 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-800 transition-colors disabled:opacity-50">
            {uploading ? 'Загружаем фото…' : loading ? 'Сохраняем…' : 'Сохранить изменения'}
          </button>

        </div>
      </main>
    </div>
  );
}
