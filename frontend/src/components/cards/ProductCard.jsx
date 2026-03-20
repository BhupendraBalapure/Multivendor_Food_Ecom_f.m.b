import { Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { addToCart, updateQuantity } from '@/store/slices/cartSlice'
import { Plus, Minus, Clock, Users, Flame } from 'lucide-react'
import { mediaUrl } from '@/utils/constants'

const FOOD_TYPE_COLORS = {
  veg: 'bg-green-500',
  non_veg: 'bg-red-500',
  egg: 'bg-yellow-500',
}

const FOOD_TYPE_LABELS = {
  veg: 'Veg',
  non_veg: 'Non-Veg',
  egg: 'Egg',
}

const MEAL_TYPE_COLORS = {
  breakfast: 'bg-amber-500/80',
  lunch: 'bg-blue-500/80',
  dinner: 'bg-purple-500/80',
  snack: 'bg-emerald-500/80',
}

const FOOD_EMOJIS = {
  breakfast: '🍳',
  lunch: '🍱',
  dinner: '🍲',
  snack: '🥪',
}

export default function ProductCard({ item, showSeller = true }) {
  const dispatch = useDispatch()
  const cartItems = useSelector((state) => state.cart.items)
  const cartItem = cartItems.find((i) => i.id === item.id)

  const discountPercent = item.discounted_price
    ? Math.round(((item.price - item.discounted_price) / item.price) * 100)
    : 0

  const handleAdd = () => {
    dispatch(
      addToCart({
        item: {
          id: item.id,
          name: item.name,
          price: Number(item.price),
          discounted_price: item.discounted_price ? Number(item.discounted_price) : null,
          image: item.image,
        },
        seller: {
          id: item.seller,
          kitchen_name: item.seller_name,
        },
      })
    )
  }

  const handleQuantityChange = (newQty) => {
    dispatch(updateQuantity({ id: item.id, quantity: newQty }))
  }

  return (
    <div className="group bg-card rounded-xl sm:rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      {/* Image area */}
      <Link to={`/products/${item.id}`} className="block relative h-32 sm:h-44 bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200/30 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-600/30 overflow-hidden">
        {item.image ? (
          <img
            src={mediaUrl(item.image)}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl sm:text-5xl opacity-40">{FOOD_EMOJIS[item.meal_type] || '🍽️'}</span>
          </div>
        )}

        {/* Food type indicator */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex items-center gap-1 sm:gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1">
          <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${FOOD_TYPE_COLORS[item.food_type] || 'bg-gray-400'}`} />
          <span className="text-[10px] sm:text-xs font-medium">{FOOD_TYPE_LABELS[item.food_type] || item.food_type}</span>
        </div>

        {/* Meal type badge */}
        <span className={`absolute top-2 sm:top-3 right-2 sm:right-3 ${MEAL_TYPE_COLORS[item.meal_type] || 'bg-gray-500/80'} text-white text-[10px] sm:text-xs font-medium px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full capitalize`}>
          {item.meal_type}
        </span>

        {/* Discount badge */}
        {discountPercent > 0 && (
          <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 bg-green-600 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg">
            {discountPercent}% OFF
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-2.5 sm:p-4">
        {/* Category */}
        {item.category_name && (
          <p className="text-[10px] sm:text-xs text-primary font-medium uppercase tracking-wide mb-0.5 sm:mb-1 line-clamp-1">
            {item.category_name}
          </p>
        )}

        {/* Name */}
        <Link to={`/products/${item.id}`} className="block">
          <h3 className="font-semibold text-sm sm:text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {item.name}
          </h3>
        </Link>

        {/* Seller */}
        {showSeller && item.seller_name && (
          <Link
            to={`/vendors/${item.seller_slug}`}
            className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors line-clamp-1"
            onClick={(e) => e.stopPropagation()}
          >
            by {item.seller_name}
          </Link>
        )}

        {/* Price + Cart */}
        <div className="flex items-center justify-between mt-2 sm:mt-3">
          <div className="flex items-baseline gap-1 sm:gap-2">
            <span className="text-base sm:text-lg font-bold text-foreground">
              ₹{Math.round(item.discounted_price || item.effective_price || item.price)}
            </span>
            {item.discounted_price && (
              <span className="text-[10px] sm:text-sm text-muted-foreground line-through">
                ₹{Math.round(item.price)}
              </span>
            )}
          </div>

          {/* Cart controls */}
          {cartItem ? (
            <div className="flex items-center gap-1 sm:gap-2 bg-primary rounded-lg sm:rounded-xl overflow-hidden">
              <button
                onClick={handleQuantityChange.bind(null, cartItem.quantity - 1)}
                className="px-1.5 sm:px-2.5 py-1 sm:py-1.5 text-white hover:bg-primary/80 transition-colors"
              >
                <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </button>
              <span className="text-xs sm:text-sm font-bold text-white min-w-[1rem] sm:min-w-[1.25rem] text-center">
                {cartItem.quantity}
              </span>
              <button
                onClick={handleQuantityChange.bind(null, cartItem.quantity + 1)}
                className="px-1.5 sm:px-2.5 py-1 sm:py-1.5 text-white hover:bg-primary/80 transition-colors"
              >
                <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="flex items-center gap-1 bg-primary/10 text-primary font-semibold text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl hover:bg-primary hover:text-white transition-all duration-200"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> ADD
            </button>
          )}
        </div>

        {/* Meta info - hidden on mobile */}
        <div className="hidden sm:flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          {item.preparation_time_mins && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {item.preparation_time_mins} min
            </span>
          )}
          {item.calories && (
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3" /> {item.calories} cal
            </span>
          )}
          {item.serves && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> Serves {item.serves}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
