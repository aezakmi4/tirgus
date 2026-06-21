"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, Bell, User, X } from "lucide-react";

type NavCategory = { id: number; name: string; slug: string };

export default function SiteHeader({ categories }: { categories: NavCategory[] }) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const submit = () => {
    const value = q.trim();
    if (!value) return;
    router.push(`/?q=${encodeURIComponent(value)}`);
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
            <Link key={c.id} href={`/?category=${c.slug}`} className="nav-link">
              {c.name}
            </Link>
          ))}
          <Link href="/?category=all" className="nav-link">Все</Link>
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
          <button className="avatar" aria-label="Кабинет">
            <User size={19} />
          </button>
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
