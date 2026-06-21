import { Search, Plus, Bell, User, Car, Home, Briefcase,
         Smartphone, Sofa, Shirt, Bike, PawPrint, MapPin,
         Heart, Clock, ImageOff } from "lucide-react";
import { supabase } from "./lib/supabase";
import HeroSearch from "./components/HeroSearch";
import Link from "next/link";

export const revalidate = 0;

const iconMap: Record<string, React.ComponentType<{size?: number, className?: string}>> = {
  transport: Car,
  realty: Home,
  jobs: Briefcase,
  electronics: Smartphone,
  home_cat: Sofa,
  personal: Shirt,
  hobby: Bike,
  animals: PawPrint,
};

// Цвет плитки-иконки по категории — по одному аккуратному градиенту на slug.
const catColors: Record<string, string> = {
  transport:   "linear-gradient(135deg, #3b82f6, #2563eb)",
  realty:      "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  jobs:        "linear-gradient(135deg, #10b981, #059669)",
  electronics: "linear-gradient(135deg, #06b6d4, #0891b2)",
  home_cat:    "linear-gradient(135deg, #f59e0b, #d97706)",
  personal:    "linear-gradient(135deg, #ec4899, #db2777)",
  hobby:       "linear-gradient(135deg, #6366f1, #4f46e5)",
  animals:     "linear-gradient(135deg, #14b8a6, #0d9488)",
};

// Подкатегории в БД отсутствуют — статический маппинг типовых разделов (на русском).
const catSubs: Record<string, string[]> = {
  transport:   ["Легковые", "Мото", "Грузовые", "Запчасти"],
  realty:      ["Квартиры", "Дома", "Аренда", "Участки"],
  jobs:        ["IT", "Стройка", "Логистика", "Услуги"],
  electronics: ["Телефоны", "Ноутбуки", "ТВ", "Игры"],
  home_cat:    ["Мебель", "Техника", "Декор", "Сад"],
  personal:    ["Одежда", "Обувь", "Аксессуары", "Красота"],
  hobby:       ["Спорт", "Музыка", "Книги", "Туризм"],
  animals:     ["Собаки", "Кошки", "Птицы", "Аквариум"],
};

type Category = { id: number; name: string; slug: string; count: number };
type Listing  = { id: number; title: string; description: string; price: number | null; currency: string; category_id: number; location: string; image_url: string | null; created_at: string };

export default async function Page() {
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('id')
    .returns<Category[]>();

  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Listing[]>();

  // Реальные цифры для статистики — считаем из уже загруженных категорий, ничего не выдумываем.
  const totalAds       = categories?.reduce((s, c) => s + (c.count || 0), 0) ?? 0;
  const transportCount = categories?.find((c) => c.slug === "transport")?.count ?? 0;
  const jobsCount      = categories?.find((c) => c.slug === "jobs")?.count ?? 0;
  const numCategories  = categories?.length ?? 0;
  const fmt = (n: number) => n.toLocaleString("ru-RU");
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center gap-3">
          <div className="text-2xl font-extrabold text-blue-700 shrink-0">
            tirgus<span className="text-gray-900">.lv</span>
          </div>
          <div className="flex-1 flex items-center bg-gray-100 border border-gray-200 rounded-xl px-4 max-w-lg">
            <Search size={17} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Найти что угодно…"
              className="flex-1 bg-transparent border-none outline-none px-3 py-2.5 text-sm"
            />
          </div>
          <button className="bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
            <Plus size={17} />
            Подать
          </button>
          <button className="relative p-2">
            <Bell size={20} className="text-gray-500" />
            <span className="absolute top-1 right-1 w-4 h-4 bg-blue-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
          </button>
          <button className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-600 flex items-center gap-2">
            <User size={17} />
            Кабинет
          </button>
        </div>
        <div className="border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-5 flex gap-1 overflow-x-auto">
            {categories?.map((cat) => {
              const Icon = iconMap[cat.slug] || Car;
              return (
                <button key={cat.id} className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-gray-500 hover:text-blue-700 border-b-2 border-transparent hover:border-blue-700 transition-colors whitespace-nowrap">
                  <Icon size={15} />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-orb o1" />
        <div className="hero-orb o2" />
        <div className="hero-grid-lines" />
        <div className="hero-inner max-w-6xl mx-auto px-5">
          <div className="hero-chip">
            <span className="live-dot" /> {fmt(totalAds)} объявлений по всей Латвии
          </div>
          <h1 className="hero-title">
            Всё, что ищешь.<br />
            <span className="grad-text">В одном месте.</span>
          </h1>
          <p className="hero-sub">
            Современная торговая площадка Латвии — авто, жильё, работа и всё
            остальное. Безопасные сделки и проверенные продавцы.
          </p>

          <HeroSearch />

          <div className="hero-stats">
            <div className="hero-stat"><b>{fmt(totalAds)}</b><span>объявлений</span></div>
            <div className="hero-stat-d" />
            <div className="hero-stat"><b>{fmt(transportCount)}</b><span>транспорт</span></div>
            <div className="hero-stat-d" />
            <div className="hero-stat"><b>{fmt(jobsCount)}</b><span>вакансий</span></div>
            <div className="hero-stat-d" />
            <div className="hero-stat"><b>{numCategories}</b><span>категорий</span></div>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-5 py-10">
        <div className="sec-head">
          <div>
            <h2>Категории</h2>
            <p>Выбери раздел — от авто до животных, по всей Латвии</p>
          </div>
          <Link href="/?category=all" className="sec-head-link">Все категории →</Link>
        </div>
        <div className="cat-grid">
          {categories?.map((cat) => {
            const Icon = iconMap[cat.slug] || Car;
            const subs = catSubs[cat.slug] || [];
            return (
              <Link key={cat.id} href={`/?category=${cat.slug}`} className="cat-card">
                <div className="cat-ic" style={{ background: catColors[cat.slug] ?? catColors.transport }}>
                  <Icon size={26} />
                </div>
                <div className="cat-name">{cat.name}</div>
                <div className="cat-count">{cat.count?.toLocaleString("ru-RU")} объявлений</div>
                <div className="cat-subs">
                  {subs.map((s) => <span key={s} className="cat-sub">{s}</span>)}
                </div>
              </Link>
            );
          })}
        </div>

        <h2 className="text-2xl font-extrabold text-gray-900 mt-12 mb-6">Свежие объявления</h2>
        <div className="grid-cards">
          {listings?.map((listing) => (
            <Link key={listing.id} href={`/listings/${listing.id}`} className="card">
              <div className="media">
                {listing.image_url
                  ? <img src={listing.image_url} alt={listing.title} />
                  : <div className="card-ph"><ImageOff size={28} /></div>
                }
                {/* сердечко — пока только визуально, без сохранения */}
                <span className="save" aria-hidden="true"><Heart size={18} /></span>
              </div>
              <div className="cbody">
                <div className="price">
                  {listing.price ? `${listing.price.toLocaleString('ru-RU')} €` : 'Договорная'}
                </div>
                <p className="title">{listing.title}</p>
                <hr className="hr" />
                <div className="card-foot">
                  <div className="card-foot-loc">
                    <span><MapPin size={13} />{listing.location}</span>
                    <span><Clock size={13} />{formatDate(listing.created_at)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}