import { supabase } from "../lib/supabase";
import { createClient } from "../lib/supabaseServer";
import SiteHeader from "../components/SiteHeader";
import ListingCard, { Listing } from "../components/ListingCard";
import Link from "next/link";
import { LogIn, HeartOff } from "lucide-react";

export const revalidate = 0;

type Category = { id: number; name: string; slug: string };

export default async function FavoritesPage() {
  // Категории нужны для шапки (как на главной/поиске) — публичное чтение.
  const { data: categories } = await supabase
    .from("categories").select("*").order("id").returns<Category[]>();

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();

  // Гость — гейт «Войдите».
  if (!user) {
    return (
      <div className="min-h-screen bg-[#f4f6f9]">
        <SiteHeader categories={categories ?? []} />
        <main className="max-w-6xl mx-auto px-5 py-10">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col items-center text-center gap-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 grid place-items-center">
              <LogIn size={26} />
            </div>
            <div className="text-lg font-extrabold text-gray-900">Войдите, чтобы видеть избранное</div>
            <Link href="/login" className="post-btn justify-center !h-12 w-full max-w-xs">Войти</Link>
          </div>
        </main>
      </div>
    );
  }

  // Избранное пользователя вместе с самими объявлениями.
  const { data: rows } = await sb
    .from("favorites")
    .select("listing_id, listings(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Вложенный listings приходит как один объект (связь many-to-one); типы
  // supabase-js без генерации схемы считают его массивом — нормализуем обе формы.
  const listings = ((rows ?? []) as unknown as { listings: Listing | Listing[] | null }[])
    .map((r) => (Array.isArray(r.listings) ? r.listings[0] : r.listings))
    .filter((l): l is Listing => Boolean(l));

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <SiteHeader categories={categories ?? []} />

      <main className="max-w-6xl mx-auto px-5 py-10">
        <div className="sec-head">
          <div>
            <h2>Избранное</h2>
            <p>Сохранённые объявления — {listings.length}</p>
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 text-gray-400">
            <HeartOff size={40} />
            <p className="mt-4 text-lg font-semibold text-gray-600">В избранном пока пусто</p>
            <span className="mt-1 text-sm">Нажимайте на сердечко в объявлениях, чтобы сохранить их сюда.</span>
            <Link href="/" className="mt-4 font-bold text-blue-700 hover:underline">На главную</Link>
          </div>
        ) : (
          <div className="grid-cards">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFavorite={true}
                isAuthed={true}
                refreshOnToggle={true}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
