import { supabase } from "../../lib/supabase";
import { ArrowLeft, MapPin, Calendar, Tag } from "lucide-react";
import Link from "next/link";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single();

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('id', listing?.category_id)
    .single();

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Объявление не найдено</h1>
          <Link href="/" className="text-blue-700 hover:underline">← На главную</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-5 py-4">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-blue-700 transition-colors text-sm font-semibold">
            <ArrowLeft size={18} />
            Назад
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="w-full h-72 bg-gray-100 flex items-center justify-center">
            {listing.image_url
              ? <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
              : <span className="text-8xl">📷</span>
            }
          </div>

          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-extrabold text-gray-900 mb-2">{listing.title}</h1>
                <div className="text-3xl font-extrabold text-blue-700 mb-4">
                  {listing.price ? `${listing.price.toLocaleString('ru-RU')} €` : 'Договорная'}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
                  <div className="flex items-center gap-1">
                    <MapPin size={15} />
                    {listing.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Tag size={15} />
                    {category?.name || 'Категория'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={15} />
                    {new Date(listing.created_at).toLocaleDateString('ru-RU')}
                  </div>
                </div>

                <h2 className="font-bold text-gray-900 mb-2">Описание</h2>
                <p className="text-gray-600 leading-relaxed">{listing.description}</p>
              </div>

              <div className="md:w-64 shrink-0">
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                  <button className="w-full bg-blue-700 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-800 transition-colors mb-3">
                    Написать продавцу
                  </button>
                  <button className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:border-blue-400 transition-colors">
                    Позвонить
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}