"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Camera, ImageOff } from "lucide-react";

export default function ListingGallery({
  images,
  imageUrl,
  title,
}: {
  images: string[] | null;
  imageUrl: string | null;
  title: string;
}) {
  // Источник фото: массив images, иначе одиночная обложка, иначе пусто.
  const photos = images && images.length > 0 ? images : imageUrl ? [imageUrl] : [];
  const [active, setActive] = useState(0);

  // Нет фото — заглушка-фотоаппарат.
  if (photos.length === 0) {
    return (
      <div className="gallery">
        <div className="gallery-main">
          <div className="gallery-ph"><ImageOff size={48} /></div>
        </div>
      </div>
    );
  }

  const total = photos.length;
  const idx = active % total;
  const go = (delta: number) => setActive((a) => (a + delta + total) % total);

  return (
    <div className="gallery">
      <div className="gallery-main">
        <img src={photos[idx]} alt={`${title} — фото ${idx + 1}`} />
        {total > 1 && (
          <>
            <button className="nav-arrow l" aria-label="Предыдущее фото" onClick={() => go(-1)}>
              <ChevronLeft size={20} />
            </button>
            <button className="nav-arrow r" aria-label="Следующее фото" onClick={() => go(1)}>
              <ChevronRight size={20} />
            </button>
            <div className="count-pill"><Camera size={13} /> {idx + 1} / {total}</div>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="gallery-thumbs">
          {photos.map((src, i) => (
            <button
              key={i}
              className={`th ${idx === i ? "on" : ""}`}
              aria-label={`Фото ${i + 1}`}
              onClick={() => setActive(i)}
            >
              <img src={src} alt={`${title} — миниатюра ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
