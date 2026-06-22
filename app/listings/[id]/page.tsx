import { supabase } from "../../lib/supabase";
import { ArrowLeft, MapPin, Calendar, Tag, Phone } from "lucide-react";
import ListingGallery from "../../components/ListingGallery";
import FavoriteButton from "../../components/FavoriteButton";
import ContactSellerButton from "../../components/ContactSellerButton";
import { getFavoriteContext } from "../../lib/favorites";
import { categoryFields } from "../../lib/categoryFields";
import Link from "next/link";

const fieldLabels: Record<string, string> = {
  vehicle_type: 'Тип ТС', brand: 'Марка', model: 'Модель', year: 'Год',
  mileage: 'Пробег (км)', engine: 'Объём двигателя', power: 'Мощность (л.с.)',
  fuel: 'Топливо', transmission: 'Коробка передач', drive: 'Привод',
  body: 'Кузов', color: 'Цвет', condition: 'Состояние', owners: 'Владельцев',
  customs: 'Таможня', property_type: 'Тип недвижимости', deal_type: 'Операция',
  area_total: 'Площадь общая (м²)', area_living: 'Площадь жилая (м²)',
  area_kitchen: 'Кухня (м²)', rooms: 'Комнат', floor: 'Этаж',
  total_floors: 'Этажей в доме', building_type: 'Тип здания',
  build_year: 'Год постройки', furniture: 'Мебель', balcony: 'Балкон',
  elevator: 'Лифт', parking: 'Парковка', heating: 'Отопление',
  sphere: 'Сфера', employment: 'Занятость', schedule: 'График',
  salary_from: 'Зарплата от (€)', salary_to: 'Зарплата до (€)',
  experience: 'Опыт', education: 'Образование', language: 'Язык',
  subcategory: 'Подкатегория', memory: 'Память', completeness: 'Комплектация',
  material: 'Материал', dimensions: 'Размеры', for_whom: 'Для кого',
  size: 'Размер', animal_type: 'Вид животного', breed: 'Порода',
  age: 'Возраст', gender: 'Пол', vaccinated: 'Вакцинация',
  documents: 'Документы', sterilized: 'Стерилизация',
};

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: listing } = await supabase
    .from('listings').select('*').eq('id', id).single();

  const { data: category } = await supabase
    .from('categories').select('*').eq('id', listing?.category_id).single();

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

  const details = listing.details as Record<string, string> | null;

  // Состояние избранного + текущий пользователь (один запрос).
  const { isAuthed, userId, favIds } = await getFavoriteContext();

  // Кнопку «Написать продавцу» показываем, только если у объявления есть автор
  // и это не я (писать самому себе нельзя; гостю кнопка ведёт на /login).
  const sellerId = listing.user_id as string | null;
  const showContact = Boolean(sellerId) && sellerId !== userId;

  // Характеристики: подписи по name из categoryFields, в порядке полей категории
  // (fallback — таблица fieldLabels, затем сам ключ).
  const fieldDefs = categoryFields[listing.category_id] || [];
  const labelOf = (key: string) =>
    fieldDefs.find((f) => f.name === key)?.label || fieldLabels[key] || key;
  const specKeys = [
    ...fieldDefs.map((f) => f.name),
    ...Object.keys(details || {}).filter((k) => !fieldDefs.some((f) => f.name === k)),
  ].filter((k) => details?.[k]);

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-5 py-4">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-blue-700 transition-colors text-sm font-semibold">
            <ArrowLeft size={18} /> Назад
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8">
        <div className="listing-layout">
          {/* ЛЕВО: галерея + контент */}
          <div>
            <ListingGallery images={listing.images} imageUrl={listing.image_url} title={listing.title} />

            <div className="lst-head">
              <h1>{listing.title}</h1>
              <div className="lst-submeta">
                <span className="row"><MapPin size={15} />{listing.location}</span>
                <span className="d" />
                <span className="row"><Calendar size={15} />{new Date(listing.created_at).toLocaleDateString('ru-RU')}</span>
                {category?.name && (
                  <>
                    <span className="d" />
                    <span className="row"><Tag size={15} />{category.name}</span>
                  </>
                )}
              </div>
            </div>

            {details && specKeys.length > 0 && (
              <div className="lst-specs">
                <div className="lst-spec-grp">
                  <h3>Характеристики</h3>
                  <div className="lst-spec-grid">
                    {specKeys.map((key) => (
                      <div key={key} className="lst-spec-row">
                        <span className="k">{labelOf(key)}</span>
                        <span className="v">{details[key]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {listing.description && (
              <div className="lst-prose">
                <h3>Описание</h3>
                <p>{listing.description}</p>
              </div>
            )}
          </div>

          {/* ПРАВО: липкий блок с ценой и кнопками */}
          <div className="lst-side">
            <div className="lst-price">
              <div className="flex items-start justify-between gap-4">
                <div className="price-big">
                  {listing.price ? `${listing.price.toLocaleString('ru-RU')} €` : 'Договорная'}
                </div>
                <FavoriteButton
                  listingId={listing.id}
                  initialFavorite={favIds.has(listing.id)}
                  isAuthed={isAuthed}
                  size={20}
                  className="flex-none w-11 h-11 rounded-full border border-gray-200 grid place-items-center text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50"
                />
              </div>
              {showContact && (
                <ContactSellerButton listingId={listing.id} sellerId={sellerId!} isAuthed={isAuthed} />
              )}
              <button type="button" title="Скоро" className="btn btn-ghost btn-lg" style={{ width: '100%', marginTop: 10 }}>
                <Phone size={17} /> Позвонить
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}