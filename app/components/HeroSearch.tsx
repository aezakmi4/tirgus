"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Grid3x3, Car, Home, Briefcase, Search, ChevronDown } from "lucide-react";

const TABS = [
  { id: "all",       label: "Все",          icon: Grid3x3 },
  { id: "transport", label: "Транспорт",    icon: Car },
  { id: "realty",    label: "Недвижимость", icon: Home },
  { id: "jobs",      label: "Работа",       icon: Briefcase },
];

const PILLS = ["BMW", "Квартира в Риге", "iPhone 15", "Работа в IT", "Зимние шины"];

export default function HeroSearch() {
  const router = useRouter();
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");

  const search = (term?: string) => {
    const value = (term ?? q).trim();
    if (!value) return;
    router.push(`/?q=${encodeURIComponent(value)}`);
  };

  return (
    <>
      <div className="hero-tabs">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              className={`hero-tab ${tab === t.id ? "on" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="hero-search">
        <button className="seg-cat" type="button">
          <Grid3x3 size={18} /> Категории <ChevronDown size={15} />
        </button>
        <div className="hero-search-input">
          <Search size={20} style={{ color: "var(--ink-3)" }} />
          <input
            className="hero-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Что ищешь? Например, BMW или квартира в Риге…"
          />
        </div>
        <button className="hero-go" type="button" onClick={() => search()}>
          Найти
        </button>
      </div>

      <div className="hero-pills">
        <span className="hero-pills-label">Популярно:</span>
        {PILLS.map((p) => (
          <button key={p} className="pill" type="button" onClick={() => search(p)}>
            {p}
          </button>
        ))}
      </div>
    </>
  );
}
