import { Search, Plus, Bell, User, Car, Home, Briefcase,
         Smartphone, Sofa, Shirt, Bike, PawPrint } from "lucide-react";
import { supabase } from "./lib/supabase";

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

export default async function Page() {
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('id');

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
      <main className="max-w-6xl mx-auto px-5 py-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
          Найти и продать можно <span className="text-blue-700">всё</span>
        </h1>
        <p className="text-gray-500 mb-10">Объявления по всей Латвии — от квартиры до велосипеда.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {categories?.map((cat) => {
            const Icon = iconMap[cat.slug] || Car;
            return (
              <button key={cat.id} className="bg-white border border-gray-200 rounded-2xl p-4 text-left hover:border-blue-400 hover:shadow-md transition-all group">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                  <Icon size={20} className="text-blue-700" />
                </div>
                <div className="font-bold text-gray-900 text-sm">{cat.name}</div>
                <div className="text-xs text-gray-400 mt-1">{cat.count?.toLocaleString("ru-RU")} объявл.</div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}