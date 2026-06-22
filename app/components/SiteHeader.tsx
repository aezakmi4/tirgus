"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, Bell, X, LogOut } from "lucide-react";
import { createClient } from "../lib/supabaseClient";

type NavCategory = { id: number; name: string; slug: string };

export default function SiteHeader({ categories }: { categories: NavCategory[] }) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Состояние входа: undefined — ещё не знаем, null — гость, иначе email вошедшего.
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  // Закрываем меню по клику вне его.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  async function signOut() {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.refresh();
  }

  const submit = () => {
    const value = q.trim();
    if (!value) return;
    router.push(`/search?q=${encodeURIComponent(value)}`);
    setSearchOpen(false);
  };

  return (
    <header className="app">
      <div className="max-w-6xl mx-auto px-5 flex items-center gap-3.5 h-[68px]">
        <Link href="/" className="brand">
          <span className="brand-mark"><span /></span>
          tirgus<span className="brand-dim">.lv</span>
        </Link>

        <nav className="nav-desk">
          {categories.slice(0, 4).map((c) => (
            <Link key={c.id} href={`/search?category=${c.slug}`} className="nav-link">
              {c.name}
            </Link>
          ))}
          <Link href="/search" className="nav-link">Все</Link>
        </nav>

        <div className="flex items-center gap-1 ml-auto">
          <button className="iconbtn" aria-label="Поиск" onClick={() => setSearchOpen((v) => !v)}>
            <Search size={20} />
          </button>
          <button className="iconbtn" aria-label="Уведомления">
            <Bell size={20} />
          </button>
          <Link href="/submit" className="post-btn">
            <Plus size={17} /><span className="post-label">Подать</span>
          </Link>

          {/* Состояние входа. Пока грузим (undefined) — место под аватар не дёргается. */}
          {email === undefined ? (
            <div className="avatar" style={{ background: "var(--bg-2)" }} aria-hidden />
          ) : email === null ? (
            <Link href="/login" className="nav-link" style={{ fontSize: 14, fontWeight: 700, color: "var(--blue-700)" }}>
              Войти
            </Link>
          ) : (
            <div ref={menuRef} style={{ position: "relative" }}>
              <button
                className="avatar"
                style={{ fontWeight: 700, fontSize: 15 }}
                aria-label="Аккаунт"
                title={email}
                onClick={() => setMenuOpen((v) => !v)}
              >
                {email[0]?.toUpperCase() || "?"}
              </button>
              {menuOpen && (
                <div
                  style={{
                    position: "absolute", top: "calc(100% + 8px)", right: 0, minWidth: 220,
                    background: "var(--surface)", border: "1px solid var(--line)",
                    borderRadius: "var(--r-md)", boxShadow: "var(--shadow-lg)",
                    padding: 8, zIndex: 70,
                  }}
                >
                  <div style={{ padding: "8px 10px", fontSize: 13, color: "var(--ink-3)", wordBreak: "break-all" }}>
                    {email}
                  </div>
                  <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "4px 0" }} />
                  <button
                    onClick={signOut}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, width: "100%",
                      padding: "9px 10px", borderRadius: 10, background: "none", border: "none",
                      cursor: "pointer", fontSize: 14, fontWeight: 600, color: "var(--ink-2)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <LogOut size={17} /> Выйти
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* разворачивающийся поиск — Enter ведёт на /?q=…, сам поиск сделаем позже */}
      <div className={`header-search ${searchOpen ? "open" : ""}`}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="header-search-inner">
            <Search size={20} style={{ color: "var(--ink-3)" }} />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
                if (e.key === "Escape") setSearchOpen(false);
              }}
              placeholder="Найти что угодно по всей Латвии…"
            />
            <button className="header-search-go" onClick={submit}>Найти</button>
            <button
              className="iconbtn"
              style={{ width: 36, height: 36 }}
              aria-label="Закрыть"
              onClick={() => setSearchOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
