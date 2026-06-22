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

  // Категории нужны для шапки и для названия выбранной категории.
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("id")
    .returns<Category[]>();

  const activeCategory = categorySlug
    ? categories?.find((c) => c.slug === categorySlug) ?? null
    : null;

  // Строим запрос к listings: поиск по названию + фильтр по категории.
  let query = supabase.from("listings").select("*");
  if (q) query = query.ilike("title", `%${q}%`);
  if (activeCategory) query = query.eq("category_id", activeCategory.id);

  const { data: listings } = await query
    .order("created_at", { ascending: false })
    .returns<Listing[]>();

  const results = listings ?? [];
  const hasFilter = Boolean(q || activeCategory);

  // Один запрос на страницу: избранное текущего пользователя для сердечек.
  const { isAuthed, favIds } = await getFavoriteContext();

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <SiteHeader categories={categories ?? []} />

      <main className="max-w-6xl mx-auto px-5 py-10">
        <div className="sec-head">
          <div>
            <h2>
              {q && <>Результаты по запросу «{q}»</>}
              {q && activeCategory && " · "}
              {activeCategory && <>Категория: {activeCategory.name}</>}
              {!hasFilter && <>Все объявления</>}
            </h2>
            <p>Найдено: {results.length}</p>
          </div>
          {hasFilter && (
            <Link href="/search" className="sec-head-link">Сбросить</Link>
          )}
        </div>

        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 text-gray-400">
            <SearchX size={40} />
            <p className="mt-4 text-lg font-semibold text-gray-600">Ничего не найдено</p>
            <span className="mt-1 text-sm">
              Попробуйте изменить запрос или выбрать другую категорию.
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
