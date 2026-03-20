import { Link } from 'react-router-dom'
import { Star, MapPin, Clock, Bike } from 'lucide-react'
import { mediaUrl } from '@/utils/constants'

export default function SellerCard({ seller }) {
  return (
    <Link
      to={`/vendors/${seller.slug}`}
      className="group block bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      {/* Banner + Logo */}
      <div className="relative">
        <div className="h-44 bg-gradient-to-br from-[#fff7ed] via-[#fed7aa] to-[#fb923c] dark:from-[#27272a] dark:via-[#3f3f46] dark:to-[#fb923c]/20 overflow-hidden">
          {seller.banner_image ? (
            <img
              src={mediaUrl(seller.banner_image)}
              alt={seller.kitchen_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl opacity-30">🍳</span>
            </div>
          )}
          {/* Online badge */}
          {seller.is_online && (
            <span className="absolute top-3 right-3 bg-success text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
              Open Now
            </span>
          )}
        </div>
        {/* Logo */}
        <div className="absolute -bottom-6 left-4 z-10">
          <div className="w-14 h-14 rounded-xl bg-white dark:bg-card shadow-md border-2 border-white dark:border-border overflow-hidden flex items-center justify-center">
            {seller.logo ? (
              <img src={mediaUrl(seller.logo)} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">🏠</span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-8 pb-4 px-4">
        <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {seller.kitchen_name}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {seller.description}
        </p>

        {/* Info row */}
        <div className="flex items-center gap-4 mt-3 text-sm">
          {seller.average_rating && (
            <span className="flex items-center gap-1 text-amber-500 font-medium">
              <Star className="h-3.5 w-3.5 fill-current" />
              {seller.average_rating}
              <span className="text-muted-foreground font-normal">({seller.total_ratings})</span>
            </span>
          )}
          <span className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {seller.city}
          </span>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          {seller.opening_time && seller.closing_time && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {seller.opening_time?.slice(0, 5)} - {seller.closing_time?.slice(0, 5)}
            </span>
          )}
          {seller.delivery_radius_km && (
            <span className="flex items-center gap-1">
              <Bike className="h-3 w-3" />
              {seller.delivery_radius_km} km
            </span>
          )}
          {seller.minimum_order_amount && (
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              Min ₹{Math.round(seller.minimum_order_amount)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
