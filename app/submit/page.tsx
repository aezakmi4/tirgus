'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type Category = { id: number; name: string };

export default function SubmitPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '',
    location: '',
  });

  useEffect(() => {
    supabase.from('categories').select('*').order('id').then(({ data }) => {
      if (data) setCategories(data as Category[]);
    });
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.category_id || !form.location) {
      alert('Заполни название, категорию и город');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.from('listings').insert({
      title: form.title,
      description: form.description,
      price: form.price ? Number(form.price) : null,
      category_id: Number(form.category_id),
      location: form.location,
    }).select().single();
    setLoading(false);
    if (error) {
      alert('Ошибка: ' + error.message);
      return;
    }
    router.push(`/listings/${data.id}`);
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-5 py-4">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-blue-700 transition-colors text-sm font-semibold">
            <ArrowLeft size={18} />
            Назад
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Подать объявление</h1>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Название *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Например: iPhone 14 Pro 256GB"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Описание</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Расскажи подробнее о товаре…"
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Цена (€)</label>
            <input
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="Оставь пустым если договорная"
              type="number"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Категория *</label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 bg-white"
            >
              <option value="">Выбери категорию</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Город *</label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Rīga, Daugavpils, Liepāja…"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-700 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Публикуем…' : 'Опубликовать объявление'}
          </button>
        </div>
      </main>
    </div>
  );
}