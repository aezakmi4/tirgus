"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { createClient } from "../lib/supabaseClient";

// Кнопка «Написать продавцу». Гость → /login. Иначе ищет существующий диалог
// (listing_id + buyer = я) или создаёт новый и переходит в него. Все операции —
// под authed-клиентом (RLS: создавать может только покупатель, seller — владелец).
export default function ContactSellerButton({
  listingId,
  sellerId,
  isAuthed,
}: {
  listingId: number;
  sellerId: string;
  isAuthed: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function contact() {
    if (!isAuthed) {
      router.push("/login");
      return;
    }
    if (busy) return;
    setBusy(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      router.push("/login");
      return;
    }

    // 1. Существующий диалог?
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listingId)
      .eq("buyer_id", user.id)
      .maybeSingle();
    if (existing) {
      router.push(`/messages/${existing.id}`);
      return;
    }

    // 2. Создаём новый.
    const { data: created, error } = await supabase
      .from("conversations")
      .insert({ listing_id: listingId, buyer_id: user.id, seller_id: sellerId })
      .select("id")
      .single();
    if (created) {
      router.push(`/messages/${created.id}`);
      return;
    }

    // 3. Гонка: другой таб успел создать (unique listing_id+buyer_id) — берём его.
    const { data: again } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listingId)
      .eq("buyer_id", user.id)
      .maybeSingle();
    setBusy(false);
    if (again) {
      router.push(`/messages/${again.id}`);
      return;
    }
    alert("Не удалось открыть диалог: " + (error?.message ?? "неизвестная ошибка"));
  }

  return (
    <button type="button" onClick={contact} disabled={busy} className="btn btn-grad btn-lg w-full disabled:opacity-50" style={{ marginTop: 18 }}>
      <MessageCircle size={18} /> {busy ? "Открываем…" : "Написать продавцу"}
    </button>
  );
}
