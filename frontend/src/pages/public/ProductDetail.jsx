import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { addToCart, updateQuantity } from '@/store/slices/cartSlice'
import menuApi from '@/api/menuApi'
import { mediaUrl } from '@/utils/constants'
import {
  Loader2, ArrowLeft, ChevronRight, Clock, Flame, Users, Plus, Minus,
  ChefHat, Star, ShoppingCart, Leaf, Egg
} from 'lucide-react'
import ProductCard from '@/components/cards/ProductCard'

const FOOD_TYPE_INFO = {
  veg: { label: 'Vegetarian', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-800/40', dot: 'bg-green-500', icon: Leaf },
  non_veg: { label: 'Non-Vegetarian', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800/40', dot: 'bg-red-500', icon: Flame },
  egg: { label: 'Contains Egg', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/30', border: 'border-yellow-200 dark:border-yellow-800/40', dot: 'bg-yellow-500', icon: Egg },
}

const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

export default function ProductDetail() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const cartItems = useSelector((state) => state.cart.items)
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [relatedItems, setRelatedItems] = useState([])

  const cartItem = cartItems.find((i) => i.id === Number(id))

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true)
      try {
        const res = await menuApi.getItemDetail(id)
        setItem(res.data)

        // Fetch related items from same category
        if (res.data.category) {
          const relRes = await menuApi.getItems({ category_slug: res.data.category_slug || '', page_size: 4 })
          const items = (relRes.data.results || relRes.data).filter((i) => i.id !== res.data.id)
          setRelatedItems(items.slice(0, 3))
        }
      } catch (err) {
        console.error('Failed to fetch item:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchItem()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <ShoppingCart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Dish not found</h2>
        <p className="text-muted-foreground mb-4">This item may no longer be available.</p>
        <Link to="/products" className="text-primary hover:underline">Browse all dishes</Link>
      </div>
    )
  }

  const discountPercent = item.discounted_price
    ? Math.round(((item.price - item.discounted_price) / item.price) * 100)
    : 0

  const foodInfo = FOOD_TYPE_INFO[item.food_type] || FOOD_TYPE_INFO.veg
  const FoodIcon = foodInfo.icon

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
    <div className="min-h-screen bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/products" className="hover:text-primary transition-colors">Menu</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          {item.category_name && (
            <>
              <Link to={`/products?category=${item.category_slug || ''}`} className="hover:text-primary transition-colors">{item.category_name}</Link>
              <ChevronRight className="h-3.5 w-3.5" />
            </>
          )}
          <span className="text-foreground font-medium truncate">{item.name}</span>
        </nav>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200/30 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-600/30 aspect-[4/3]">
            {item.image ? (
              <img src={mediaUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-8xl opacity-30">🍽️</span>
              </div>
            )}

            {/* Food type badge */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm rounded-full px-3 py-1.5">
              <span className={`w-3 h-3 rounded-full ${foodInfo.dot}`} />
              <span className={`text-sm font-medium ${foodInfo.color}`}>{foodInfo.label}</span>
            </div>

            {/* Discount */}
            {discountPercent > 0 && (
              <div className="absolute top-4 right-4 bg-green-600 text-white text-sm font-bold px-3 py-1.5 rounded-xl">
                {discountPercent}% OFF
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {/* Category & Meal type */}
            <div className="flex items-center gap-2 mb-3">
              {item.category_name && (
                <span className="text-xs text-primary font-semibold uppercase tracking-wide bg-primary/10 px-2.5 py-1 rounded-full">
                  {item.category_name}
                </span>
              )}
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide bg-muted px-2.5 py-1 rounded-full capitalize">
                {MEAL_LABELS[item.meal_type] || item.meal_type}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground">{item.name}</h1>

            {/* Seller */}
            <Link to={`/vendors/${item.seller_slug}`} className="inline-flex items-center gap-2 mt-3 text-muted-foreground hover:text-primary transition-colors">
              <ChefHat className="h-4 w-4" />
              <span className="text-sm font-medium">by {item.seller_name}</span>
            </Link>

            {/* Price */}
            <div className="flex items-baseline gap-3 mt-5">
              <span className="text-3xl font-bold text-foreground">
                ₹{Math.round(item.discounted_price || item.effective_price || item.price)}
              </span>
              {item.discounted_price && (
                <span className="text-lg text-muted-foreground line-through">
                  ₹{Math.round(item.price)}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="text-sm font-semibold text-green-600">Save ₹{Math.round(item.price - item.discounted_price)}</span>
              )}
            </div>

            {/* Description */}
            {item.description && (
              <p className="text-muted-foreground mt-4 leading-relaxed">{item.description}</p>
            )}

            {/* Nutrition & Info cards */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              {item.preparation_time_mins && (
                <div className="bg-card border border-border rounded-xl p-3 text-center">
                  <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold">{item.preparation_time_mins}</p>
                  <p className="text-xs text-muted-foreground">Minutes</p>
                </div>
              )}
              {item.calories && (
                <div className="bg-card border border-border rounded-xl p-3 text-center">
                  <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                  <p className="text-lg font-bold">{item.calories}</p>
                  <p className="text-xs text-muted-foreground">Calories</p>
                </div>
              )}
              {item.serves && (
                <div className="bg-card border border-border rounded-xl p-3 text-center">
                  <Users className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-bold">{item.serves}</p>
                  <p className="text-xs text-muted-foreground">Serves</p>
                </div>
              )}
            </div>

            {/* Food type info */}
            <div className={`flex items-center gap-3 mt-5 ${foodInfo.bg} ${foodInfo.border} border rounded-xl px-4 py-3`}>
              <FoodIcon className={`h-5 w-5 ${foodInfo.color}`} />
              <div>
                <p className={`text-sm font-semibold ${foodInfo.color}`}>{foodInfo.label}</p>
                <p className="text-xs text-muted-foreground">
                  {item.food_type === 'veg' ? 'Pure vegetarian dish' : item.food_type === 'non_veg' ? 'Contains meat/poultry' : 'Contains egg'}
                </p>
              </div>
            </div>

            {/* Add to cart */}
            <div className="mt-6">
              {cartItem ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 bg-primary rounded-xl overflow-hidden">
                    <button
                      onClick={() => handleQuantityChange(cartItem.quantity - 1)}
                      className="px-4 py-3 text-white hover:bg-primary/80 transition-colors"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="text-lg font-bold text-white min-w-[2rem] text-center">
                      {cartItem.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(cartItem.quantity + 1)}
                      className="px-4 py-3 text-white hover:bg-primary/80 transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                  <Link
                    to="/customer/cart"
                    className="flex items-center gap-2 px-6 py-3 border-2 border-primary text-primary rounded-xl font-medium hover:bg-primary/5 transition-colors"
                  >
                    <ShoppingCart className="h-5 w-5" /> Go to Cart
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleAdd}
                  className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 text-lg"
                >
                  <Plus className="h-5 w-5" /> Add to Cart — ₹{Math.round(item.discounted_price || item.effective_price || item.price)}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Related items */}
        {relatedItems.length > 0 && (
          <div className="border-t border-border pt-8">
            <h2 className="text-xl font-bold mb-6">You might also like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {relatedItems.map((ri) => (
                <ProductCard key={ri.id} item={ri} showSeller />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
