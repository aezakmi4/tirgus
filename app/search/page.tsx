import { supabase } from "../lib/supabase";
import SiteHeader from "../components/SiteHeader";
import ListingCard, { Listing } from "../components/ListingCard";
import { getFavoriteContext } from "../lib/favorites";
import Link from "next/link";
import { SearchX } from "lucide-react";

export const revalidate = 0;

type Category = { id: number; name: string; slug: string; count: number };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // В этой версии Next searchParams асинхронные — обязательно await.
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const categorySlug = typeof sp.category === "string" ? sp.category : "";

  // Цена из URL: нечисловое/пустое/отрицательное — игнорируем.
  function parsePrice(v: string | string[] | undefined): number | undefined {
    if (typeof v !== "string" || v.trim() === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  }
  const priceMin = parsePrice(sp.price_min);
  const priceMax = parsePrice(sp.price_max);

  // Категории нужны для шапки и для названия выбранной категории.
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("id")
    .returns<Category[]>();

  const activeCategory = categorySlug
    ? categories?.find((c) => c.slug === categorySlug) ?? null
    : null;

  // Строим запрос к listings: поиск по названию + фильтр по категории + цена.
  let query = supabase.from("listings").select("*");
  if (q) query = query.ilike("title", `%${q}%`);
  if (activeCategory) query = query.eq("category_id", activeCategory.id);
  // price = null («Договорная») при заданном диапазоне отсекается gte/lte автоматически.
  if (priceMin !== undefined) query = query.gte("price", priceMin);
  if (priceMax !== undefined) query = query.lte("price", priceMax);

  const { data: listings } = await query
    .order("created_at", { ascending: false })
    .returns<Listing[]>();

  const results = listings ?? [];
  const hasFilter = Boolean(q || activeCategory || priceMin !== undefined || priceMax !== undefined);

  // Метка активного диапазона цены для подзаголовка.
  const priceLabel =
    priceMin !== undefined && priceMax !== undefined ? `${priceMin}–${priceMax} €`
    : priceMin !== undefined ? `от ${priceMin} €`
    : priceMax !== undefined ? `до ${priceMax} €`
    : "";

  // Один запрос на страницу: избранное текущего пользователя для сердечек.
  const { isAuthed, favIds } = await getFavoriteContext();

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <SiteHeader categories={categories ?? []} />

      <main className="max-w-6xl mx-auto px-5 py-10">
        <div className="sec-head">
          <div>
            <h2>
              {hasFilter
                ? [
                    q && `Результаты по запросу «${q}»`,
                    activeCategory && `Категория: ${activeCategory.name}`,
                    priceLabel && `Цена: ${priceLabel}`,
                  ].filter(Boolean).join(" · ")
                : "Все объявления"}
            </h2>
            <p>Найдено: {results.length}</p>
          </div>
          {hasFilter && (
            <Link href="/search" className="sec-head-link">Сбросить</Link>
          )}
        </div>

        {/* Фильтр по цене — обычная GET-форма, сохраняет q и категорию скрытыми полями. */}
        <form method="get" action="/search" className="form-card mb-6 flex flex-wrap items-end gap-4">
          {q && <input type="hidden" name="q" value={q} />}
          {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
          <div>
            <label className="field-label">Цена от, €</label>
            <input type="number" name="price_min" min="0" inputMode="numeric"
                   defaultValue={priceMin ?? ""} placeholder="0"
                   className="form-input" style={{ width: 150 }} />
          </div>
          <div>
            <label className="field-label">Цена до, €</label>
            <input type="number" name="price_max" min="0" inputMode="numeric"
                   defaultValue={priceMax ?? ""} placeholder="без ограничения"
                   className="form-input" style={{ width: 170 }} />
          </div>
          <button type="submit" className="btn btn-grad" style={{ height: 46 }}>Применить</button>
        </form>

        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 text-gray-400">
            <SearchX size={40} />
            <p className="mt-4 text-lg font-semibold text-gray-600">Ничего не найдено</p>
            <span className="mt-1 text-sm">
              Попробуйте изменить запрос, выбрать другую категорию или диапазон цены.
            </span>
          </div>
        ) : (
          <div className="grid-cards">
            {results.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFavorite={favIds.has(listing.id)}
                isAuthed={isAuthed}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
