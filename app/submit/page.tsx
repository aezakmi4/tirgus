'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type Category = { id: number; name: string };
type Field = { name: string; label: string; type?: string; placeholder?: string; options?: string[] };

const categoryFields: Record<number, Field[]> = {
  1: [
    { name: 'vehicle_type', label: 'Тип ТС', type: 'select', options: ['Легковая', 'Грузовая', 'Мотоцикл', 'Автобус', 'Спецтехника'] },
    { name: 'brand', label: 'Марка', placeholder: 'Toyota, BMW, VW...' },
    { name: 'model', label: 'Модель', placeholder: 'Camry, X5, Golf...' },
    { name: 'year', label: 'Год выпуска', type: 'number', placeholder: '2019' },
    { name: 'mileage', label: 'Пробег (км)', type: 'number', placeholder: '85000' },
    { name: 'engine', label: 'Объём двигателя (л)', type: 'number', placeholder: '2.0' },
    { name: 'power', label: 'Мощность (л.с.)', type: 'number', placeholder: '150' },
    { name: 'fuel', label: 'Тип топлива', type: 'select', options: ['Бензин', 'Дизель', 'Электро', 'Гибрид', 'Газ'] },
    { name: 'transmission', label: 'Коробка передач', type: 'select', options: ['Автомат', 'Механика', 'Робот', 'Вариатор'] },
    { name: 'drive', label: 'Привод', type: 'select', options: ['Передний', 'Задний', 'Полный'] },
    { name: 'body', label: 'Кузов', type: 'select', options: ['Седан', 'Хэтчбек', 'Универсал', 'Внедорожник', 'Купе', 'Кабриолет', 'Минивэн', 'Пикап'] },
    { name: 'color', label: 'Цвет', placeholder: 'Чёрный, Белый, Серый...' },
    { name: 'condition', label: 'Состояние', type: 'select', options: ['Новое', 'Б/у', 'На запчасти'] },
    { name: 'owners', label: 'Количество владельцев', type: 'number', placeholder: '1' },
    { name: 'customs', label: 'Таможня', type: 'select', options: ['Растаможен', 'Не растаможен'] },
  ],
  2: [
    { name: 'property_type', label: 'Тип недвижимости', type: 'select', options: ['Квартира', 'Дом', 'Комната', 'Участок', 'Коммерческая', 'Гараж'] },
    { name: 'deal_type', label: 'Операция', type: 'select', options: ['Продажа', 'Аренда'] },
    { name: 'area_total', label: 'Общая площадь (м²)', type: 'number', placeholder: '52' },
    { name: 'area_living', label: 'Жилая площадь (м²)', type: 'number', placeholder: '32' },
    { name: 'area_kitchen', label: 'Площадь кухни (м²)', type: 'number', placeholder: '10' },
    { name: 'rooms', label: 'Количество комнат', type: 'number', placeholder: '2' },
    { name: 'floor', label: 'Этаж', type: 'number', placeholder: '4' },
    { name: 'total_floors', label: 'Этажей в доме', type: 'number', placeholder: '9' },
    { name: 'building_type', label: 'Тип здания', type: 'select', options: ['Панельный', 'Кирпичный', 'Новостройка', 'Деревянный', 'Монолитный'] },
    { name: 'build_year', label: 'Год постройки', type: 'number', placeholder: '1985' },
    { name: 'condition', label: 'Состояние', type: 'select', options: ['Без ремонта', 'Косметический ремонт', 'Евроремонт', 'Дизайнерский'] },
    { name: 'furniture', label: 'Мебель', type: 'select', options: ['С мебелью', 'Без мебели', 'Частично'] },
    { name: 'balcony', label: 'Балкон', type: 'select', options: ['Есть', 'Нет'] },
    { name: 'elevator', label: 'Лифт', type: 'select', options: ['Есть', 'Нет'] },
    { name: 'parking', label: 'Парковка', type: 'select', options: ['Есть', 'Нет', 'Гараж'] },
    { name: 'heating', label: 'Отопление', type: 'select', options: ['Центральное', 'Автономное', 'Электрическое'] },
  ],
  3: [
    { name: 'sphere', label: 'Сфера', type: 'select', options: ['IT', 'Медицина', 'Строительство', 'Торговля', 'Образование', 'Транспорт', 'Производство', 'Финансы', 'Юриспруденция', 'Другое'] },
    { name: 'employment', label: 'Тип занятости', type: 'select', options: ['Полный день', 'Частичная занятость', 'Удалённо', 'Проектная', 'Стажировка'] },
    { name: 'schedule', label: 'График работы', type: 'select', options: ['5/2', '2/2', 'Свободный', 'Сменный'] },
    { name: 'salary_from', label: 'Зарплата от (€)', type: 'number', placeholder: '1000' },
    { name: 'salary_to', label: 'Зарплата до (€)', type: 'number', placeholder: '2000' },
    { name: 'experience', label: 'Опыт', type: 'select', options: ['Без опыта', 'От 1 года', 'От 3 лет', 'От 5 лет'] },
    { name: 'education', label: 'Образование', type: 'select', options: ['Не требуется', 'Среднее', 'Среднее специальное', 'Высшее'] },
    { name: 'language', label: 'Язык', type: 'select', options: ['Латышский', 'Русский', 'Английский', 'Латышский + Русский', 'Несколько языков'] },
  ],
  4: [
    { name: 'subcategory', label: 'Подкатегория', type: 'select', options: ['Телефоны', 'Ноутбуки', 'Планшеты', 'Телевизоры', 'Фото/Видео', 'Игровые консоли', 'Комплектующие', 'Аудио', 'Умный дом'] },
    { name: 'brand', label: 'Бренд', placeholder: 'Apple, Samsung, Sony...' },
    { name: 'model', label: 'Модель', placeholder: 'iPhone 14 Pro' },
    { name: 'year', label: 'Год выпуска', type: 'number', placeholder: '2023' },
    { name: 'memory', label: 'Память / Объём', placeholder: '256GB, 16GB RAM...' },
    { name: 'color', label: 'Цвет', placeholder: 'Space Black, White...' },
    { name: 'condition', label: 'Состояние', type: 'select', options: ['Новое', 'Как новое', 'Хорошее', 'Удовлетворительное', 'На запчасти'] },
    { name: 'completeness', label: 'Комплектация', type: 'select', options: ['Полная', 'Без коробки', 'Только устройство'] },
  ],
  5: [
    { name: 'subcategory', label: 'Подкатегория', type: 'select', options: ['Мебель', 'Бытовая техника', 'Посуда', 'Декор', 'Инструменты', 'Сантехника', 'Освещение', 'Текстиль'] },
    { name: 'brand', label: 'Бренд', placeholder: 'IKEA, Bosch, Samsung...' },
    { name: 'color', label: 'Цвет', placeholder: 'Белый, Серый, Чёрный...' },
    { name: 'material', label: 'Материал', placeholder: 'Дерево, металл, ткань...' },
    { name: 'dimensions', label: 'Размеры (ДxШxВ)', placeholder: '200x90x75 см' },
    { name: 'condition', label: 'Состояние', type: 'select', options: ['Новое', 'Как новое', 'Хорошее', 'Б/у'] },
  ],
  6: [
    { name: 'subcategory', label: 'Подкатегория', type: 'select', options: ['Одежда', 'Обувь', 'Аксессуары', 'Украшения', 'Часы', 'Сумки'] },
    { name: 'for_whom', label: 'Для кого', type: 'select', options: ['Мужское', 'Женское', 'Детское', 'Унисекс'] },
    { name: 'brand', label: 'Бренд', placeholder: 'Nike, Zara, Gucci...' },
    { name: 'size', label: 'Размер', placeholder: 'M, 42, XL, 38EU...' },
    { name: 'color', label: 'Цвет', placeholder: 'Чёрный, Синий...' },
    { name: 'condition', label: 'Состояние', type: 'select', options: ['Новое с бирками', 'Новое без бирок', 'Отличное', 'Хорошее', 'Б/у'] },
  ],
  7: [
    { name: 'subcategory', label: 'Подкатегория', type: 'select', options: ['Спорт', 'Музыкальные инструменты', 'Книги', 'Коллекционирование', 'Рыбалка', 'Охота', 'Туризм', 'Велосипеды', 'Игры'] },
    { name: 'brand', label: 'Бренд', placeholder: '' },
    { name: 'model', label: 'Модель / Название', placeholder: '' },
    { name: 'year', label: 'Год', type: 'number', placeholder: '2022' },
    { name: 'condition', label: 'Состояние', type: 'select', options: ['Новое', 'Как новое', 'Хорошее', 'Б/у'] },
  ],
  8: [
    { name: 'animal_type', label: 'Вид животного', type: 'select', options: ['Собака', 'Кошка', 'Птица', 'Рыба', 'Грызун', 'Рептилия', 'Другое'] },
    { name: 'breed', label: 'Порода', placeholder: 'Лабрадор, Мейн-кун...' },
    { name: 'age', label: 'Возраст', placeholder: '2 месяца, 3 года...' },
    { name: 'gender', label: 'Пол', type: 'select', options: ['Мальчик', 'Девочка'] },
    { name: 'color', label: 'Окрас', placeholder: 'Золотистый, Чёрно-белый...' },
    { name: 'vaccinated', label: 'Вакцинация', type: 'select', options: ['Да', 'Нет', 'Частично'] },
    { name: 'documents', label: 'Документы', type: 'select', options: ['Есть', 'Нет'] },
    { name: 'sterilized', label: 'Стерилизация', type: 'select', options: ['Да', 'Нет'] },
  ],
};

export default function SubmitPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', price: '', category_id: '', location: '' });
  const [details, setDetails] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from('categories').select('*').order('id').then(({ data }) => {
      if (data) setCategories(data as Category[]);
    });
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    if (e.target.name === 'category_id') setDetails({});
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleDetailChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setDetails({ ...details, [e.target.name]: e.target.value });
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
      details: Object.keys(details).length > 0 ? details : null,
    }).select().single();
    setLoading(false);
    if (error) { alert('Ошибка: ' + error.message); return; }
    router.push(`/listings/${data.id}`);
  }

  const fields = form.category_id ? categoryFields[Number(form.category_id)] || [] : [];

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 bg-white placeholder:text-gray-600 text-gray-900";
  const labelClass = "block text-sm font-bold text-gray-700 mb-1";

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-5 py-4">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-blue-700 transition-colors text-sm font-semibold">
            <ArrowLeft size={18} /> Назад
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Подать объявление</h1>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-5">

          <div>
            <label className={labelClass}>Название *</label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="Например: iPhone 14 Pro 256GB" className={inputClass} />
          </div>

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

          <button onClick={handleSubmit} disabled={loading} className="w-full bg-blue-700 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-800 transition-colors disabled:opacity-50">
            {loading ? 'Публикуем…' : 'Опубликовать объявление'}
          </button>

        </div>
      </main>
    </div>
  );
}