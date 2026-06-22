"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { createClient } from "../lib/supabaseClient";

// Клиентский остров: сердечко сохранения. Вкладывается в серверный ListingCard
// и в страницу объявления. Все операции с favorites — под authed-клиентом (RLS).
export default function FavoriteButton({
  listingId,
  initialFavorite,
  isAuthed,
  className = "save",
  size = 18,
  refreshOnToggle = false,
}: {
  listingId: number;
  initialFavorite: boolean;
  isAuthed: boolean;
  className?: string;
  size?: number;
  refreshOnToggle?: boolean;
}) {
  const router = useRouter();
  const [fav, setFav] = useState(initialFavorite);
  const [busy, setBusy] = useState(false);

  async function toggle(e: React.MouseEvent) {
    // Не открываем карточку-ссылку, в которую вложено сердечко.
    e.preventDefault();
    e.stopPropagation();

    // Гость — ведём на вход.
    if (!isAuthed) {
      router.push("/login");
      return;
    }
    if (busy) return;

    const next = !fav;
    setFav(next); // оптимистично
    setBusy(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Сессия устарела — откатываемся и ведём на вход.
      setFav(!next);
      setBusy(false);
      router.push("/login");
      return;
    }

    const { error } = next
      ? await supabase.from("favorites").insert({ user_id: user.id, listing_id: listingId })
      : await supabase.from("favorites").delete().eq("user_id", user.id).eq("listing_id", listingId);

    setBusy(false);
    if (error) {
      setFav(!next); // откат
      alert("Не удалось обновить избранное: " + error.message);
      return;
    }
    if (refreshOnToggle) router.refresh();
  }

  return (
    <button
      type="button"
      className={className}
      onClick={toggle}
      disabled={busy}
      aria-pressed={fav}
      aria-label={fav ? "Убрать из избранного" : "В избранное"}
    >
      <Heart size={size} fill={fav ? "currentColor" : "none"} style={{ color: fav ? "#ef4444" : undefined }} />
    </button>
  );
}
