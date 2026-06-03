export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <div className="text-2xl font-bold text-blue-700">
          tirgus<span className="text-gray-900">.lv</span>
        </div>
        <input
          type="text"
          placeholder="Найти что угодно..."
          className="flex-1 max-w-md border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-400"
        />
        <button className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
          Подать объявление
        </button>
      </header>

      {/* Главная */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Найти и продать можно <span className="text-blue-700">всё</span>
        </h1>
        <p className="text-gray-500 mb-10">
          Лучшая доска объявлений Латвии
        </p>

        {/* Категории */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { name: "Транспорт", count: "5 310" },
            { name: "Недвижимость", count: "8 421" },
            { name: "Работа", count: "2 987" },
            { name: "Электроника", count: "6 644" },
            { name: "Для дома", count: "4 102" },
            { name: "Личные вещи", count: "3 210" },
            { name: "Хобби", count: "1 980" },
            { name: "Животные", count: "932" },
          ].map((cat) => (
            <div
              key={cat.name}
              className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all"
            >
              <div className="font-semibold text-gray-900">{cat.name}</div>
              <div className="text-sm text-gray-400 mt-1">{cat.count} объявл.</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}