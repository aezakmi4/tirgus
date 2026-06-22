import { supabase } from "../lib/supabase";
import { createClient } from "../lib/supabaseServer";
import SiteHeader from "../components/SiteHeader";
import Link from "next/link";
import { LogIn, MessageSquare, ImageOff } from "lucide-react";

export const revalidate = 0;

type Category = { id: number; name: string; slug: string };
type ListingMini = { title: string; image_url: string | null };
type Conversation = {
  id: number;
  listing_id: number;
  buyer_id: string;
  seller_id: string;
  last_message_at: string | null;
  listings: ListingMini | ListingMini[] | null;
};

const formatTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

export default async function MessagesPage() {
  // Категории нужны для шапки.
  const { data: categories } = await supabase
    .from("categories").select("*").order("id").returns<Category[]>();

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f4f6f9]">
        <SiteHeader categories={categories ?? []} />
        <main className="max-w-3xl mx-auto px-5 py-10">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col items-center text-center gap-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 grid place-items-center">
              <LogIn size={26} />
            </div>
            <div className="text-lg font-extrabold text-gray-900">Войдите, чтобы видеть сообщения</div>
            <Link href="/login" className="post-btn justify-center !h-12 w-full max-w-xs">Войти</Link>
          </div>
        </main>
      </div>
    );
  }

  // Диалоги, где я участник (RLS и так это гарантирует; .or — для наглядности).
  const { data: rows } = await sb
    .from("conversations")
    .select("id, listing_id, buyer_id, seller_id, last_message_at, listings(title, image_url)")
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  const conversations = (rows ?? []) as unknown as Conversation[];

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <SiteHeader categories={categories ?? []} />

      <main className="max-w-3xl mx-auto px-5 py-10">
        <div className="sec-head">
          <div>
            <h2>Сообщения</h2>
            <p>Диалоги по объявлениям — {conversations.length}</p>
          </div>
        </div>

        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 text-gray-400">
            <MessageSquare size={40} />
            <p className="mt-4 text-lg font-semibold text-gray-600">Диалогов пока нет</p>
            <span className="mt-1 text-sm">Напишите продавцу со страницы объявления — диалог появится здесь.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {conversations.map((c) => {
              const listing = Array.isArray(c.listings) ? c.listings[0] : c.listings;
              const role = c.buyer_id === user.id ? "Вы покупатель" : "Вы продавец";
              return (
                <Link
                  key={c.id}
                  href={`/messages/${c.id}`}
                  className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-4 hover:border-blue-300 transition-colors"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 grid place-items-center flex-none">
                    {listing?.image_url
                      ? <img src={listing.image_url} alt="" className="w-full h-full object-cover" />
                      : <ImageOff size={20} className="text-gray-400" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-gray-900 truncate">{listing?.title ?? "Объявление"}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{role}</div>
                  </div>
                  <div className="text-xs text-gray-400 flex-none">{formatTime(c.last_message_at)}</div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
