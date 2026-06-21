import Link from "next/link";
import { MapPin, Clock, Heart, ImageOff } from "lucide-react";

export type Listing = {
  id: number;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  category_id: number;
  location: string;
  image_url: string | null;
  created_at: string;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

export default function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={`/listings/${listing.id}`} className="card">
      <div className="media">
        {listing.image_url
          ? <img src={listing.image_url} alt={listing.title} />
          : <div className="card-ph"><ImageOff size={28} /></div>
        }
        {/* сердечко — пока только визуально, без сохранения */}
        <span className="save" aria-hidden="true"><Heart size={18} /></span>
      </div>
      <div className="cbody">
        <div className="price">
          {listing.price ? `${listing.price.toLocaleString("ru-RU")} €` : "Договорная"}
        </div>
        <p className="title">{listing.title}</p>
        <hr className="hr" />
        <div className="card-foot">
          <div className="card-foot-loc">
            <span><MapPin size={13} />{listing.location}</span>
            <span><Clock size={13} />{formatDate(listing.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
