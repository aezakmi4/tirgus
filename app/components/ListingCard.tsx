import Link from "next/link";
import { MapPin, Clock, ImageOff } from "lucide-react";
import FavoriteButton from "./FavoriteButton";

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

export default function ListingCard({
  listing,
  isFavorite = false,
  isAuthed = false,
  refreshOnToggle = false,
}: {
  listing: Listing;
  isFavorite?: boolean;
  isAuthed?: boolean;
  refreshOnToggle?: boolean;
}) {
  return (
    <Link href={`/listings/${listing.id}`} className="card">
      <div className="media">
        {listing.image_url
          ? <img src={listing.image_url} alt={listing.title} />
          : <div className="card-ph"><ImageOff size={28} /></div>
        }
        <FavoriteButton
          listingId={listing.id}
          initialFavorite={isFavorite}
          isAuthed={isAuthed}
          refreshOnToggle={refreshOnToggle}
        />
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
