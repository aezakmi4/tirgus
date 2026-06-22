'use client';
import { useState, useEffect } from 'react';
import { createClient } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ImagePlus, X, LogIn } from 'lucide-react';
import { categoryFields } from '../lib/categoryFields';

type Category = { id: number; name: string };

export default function SubmitPage() {
  const router = useRouter();
  // Аутентифицированный клиент: под ним сработает RLS-правило user_id = auth.uid().
  const [supabase] = useState(() => createClient());
  // Состояние входа: undefined — ещё проверяем, null — гость, иначе вошедший пользователь.
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', price: '', category_id: '', location: '' });
  const [details, setDetails] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    if (e.target.name === 'category_id') setDetails({});
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleDetailChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setDetails({ ...details, [e.target.name]: e.target.value });
  }

  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    setPhotos((prev) => [...prev, ...selected.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
    e.target.value = ''; // позволяет выбрать тот же файл повторно
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      alert('Войдите, чтобы подать объявление');
      return;
    }
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

    // Загружаем выбранные фото в Storage и собираем публичные ссылки
    const imageUrls: string[] = [];
    if (photos.length > 0) {
      setUploading(true);
      for (const { file } of photos) {
        const ext = file.name.includes('.') ? file.name.split('.').pop() : '';
        const path = ext ? `${crypto.randomUUID()}.${ext}` : crypto.randomUUID();
        const { error: uploadError } = await supabase.storage.from('listing-images').upload(path, file);
        if (uploadError) {
          alert('Ошибка загрузки фото: ' + uploadError.message);
          setUploading(false);
          setLoading(false);
          return;
        }
        const { data: pub } = supabase.storage.from('listing-images').getPublicUrl(path);
        imageUrls.push(pub.publicUrl);
      }
      setUploading(false);
    }

    const { data, error } = await supabase.from('listings').insert({
      title: finalTitle,
      description: form.description,
      price: form.price ? Number(form.price) : null,
      category_id: Number(form.category_id),
      location: form.location,
      details: Object.keys(details).length > 0 ? details : null,
      user_id: userId,
      ...(imageUrls.length > 0 ? { images: imageUrls, image_url: imageUrls[0] } : {}),
    }).select().single();
    setLoading(false);
    if (error) { alert('Ошибка: ' + error.message); return; }
    router.push(`/listings/${data.id}`);
  }

  const fields = form.category_id ? categoryFields[Number(form.category_id)] || [] : [];

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 bg-white placeholder:text-gray-400 placeholder:italic text-gray-900";
  const labelClass = "block text-sm font-bold text-gray-700 mb-1";

  // Общая шапка с кнопкой «Назад» — используется во всех состояниях страницы.
  const PageHeader = (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-2xl mx-auto px-5 py-4">
        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-blue-700 transition-colors text-sm font-semibold">
          <ArrowLeft size={18} /> Назад
        </Link>
      </div>
    </header>
  );

  // Ещё проверяем сессию — лёгкий placeholder, чтобы не мигало.
  if (userId === undefined) {
    return (
      <div className="min-h-screen bg-[#f4f6f9]">
        {PageHeader}
        <main className="max-w-2xl mx-auto px-5 py-8 text-gray-400 text-sm">Загрузка…</main>
      </div>
    );
  }

  // Гость — форму не показываем, предлагаем войти.
  if (userId === null) {
    return (
      <div className="min-h-screen bg-[#f4f6f9]">
        {PageHeader}
        <main className="max-w-2xl mx-auto px-5 py-8">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Подать объявление</h1>
          <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 grid place-items-center">
              <LogIn size={26} />
            </div>
            <div>
              <div className="text-lg font-extrabold text-gray-900">Войдите, чтобы подать объявление</div>
              <p className="text-sm text-gray-500 mt-1">Объявление будет привязано к вашему аккаунту.</p>
            </div>
            <Link href="/login" className="post-btn justify-center !h-12 w-full max-w-xs">
              Войти
            </Link>
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

      <main className="max-w-2xl mx-auto px-5 py-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Подать объявление</h1>

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
              <input type="file" multiple accept="image/*" onChange={handlePhotos} className="hidden" />
            </label>
            {photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
                {photos.map((photo, i) => (
                  <div key={photo.url} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
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
            {uploading ? 'Загружаем фото…' : loading ? 'Публикуем…' : 'Опубликовать объявление'}
          </button>

        </div>
      </main>
    </div>
  );
}