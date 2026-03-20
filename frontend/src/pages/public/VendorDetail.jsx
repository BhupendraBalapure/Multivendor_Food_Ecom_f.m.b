import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import sellerApi from '@/api/sellerApi'
import menuApi from '@/api/menuApi'
import orderApi from '@/api/orderApi'
import { formatCurrency } from '@/utils/formatters'
import { mediaUrl } from '@/utils/constants'
import {
  MapPin, Star, Clock, ChefHat, Loader2,
  ShoppingBag, CalendarCheck, Bike, ChevronRight, ImageIcon, MessageSquare
} from 'lucide-react'
import ProductCard from '@/components/cards/ProductCard'

const MEAL_TABS = [
  { value: '', label: 'All' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snacks' },
]

export default function VendorDetail() {
  const { slug } = useParams()
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  const [vendor, setVendor] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [plans, setPlans] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('')
  const [activeSection, setActiveSection] = useState('menu')

  useEffect(() => {
    fetchVendor()
  }, [slug])

  useEffect(() => {
    if (vendor) {
      fetchMenu()
      fetchPlans()
      fetchReviews()
    }
  }, [vendor, activeTab])

  const fetchVendor = async () => {
    setLoading(true)
    try {
      const res = await sellerApi.getVendorBySlug(slug)
      setVendor(res.data)
    } catch (err) {
      console.error('Vendor not found:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMenu = async () => {
    try {
      const params = { seller_slug: slug, is_available: true }
      if (activeTab) params.meal_type = activeTab
      const res = await menuApi.getItems(params)
      setMenuItems(res.data.results || res.data)
    } catch (err) {
      console.error('Failed to fetch menu:', err)
    }
  }

  const fetchPlans = async () => {
    try {
      const res = await menuApi.getPlans({ seller_slug: slug })
      setPlans(res.data.results || res.data)
    } catch (err) {
      console.error('Failed to fetch plans:', err)
    }
  }

  const fetchReviews = async () => {
    if (!vendor?.id) return
    try {
      const res = await orderApi.getSellerReviews(vendor.id)
      setReviews(res.data || [])
    } catch (err) {
      console.error('Failed to fetch reviews:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <ChefHat className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Kitchen not found</h2>
        <p className="text-muted-foreground mb-4">This vendor may no longer be available.</p>
        <Link to="/vendors" className="text-primary hover:underline">Browse all kitchens</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Banner with vendor info */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#fff7ed] via-[#fed7aa] to-[#fdba74] dark:from-[#27272a] dark:via-[#3f3f46] dark:to-[#fb923c]/15 py-8 sm:py-10 px-4">
        <div className="absolute top-0 right-0 w-72 h-72 bg-orange-300/15 dark:bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-300/15 dark:bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />

        {/* Decorative right side */}
        <div className="hidden md:flex absolute right-8 lg:right-16 top-1/2 -translate-y-1/2 items-center justify-center">
          <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full bg-orange-400/10 dark:bg-white/5 flex items-center justify-center border border-orange-300/20 dark:border-zinc-600/30">
            <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-full bg-orange-400/10 dark:bg-white/5 flex items-center justify-center">
              <span className="text-5xl lg:text-6xl">👨‍🍳</span>
            </div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-sm text-orange-700/60 dark:text-zinc-400 mb-4">
            <Link to="/" className="hover:text-orange-900 dark:hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to="/vendors" className="hover:text-orange-900 dark:hover:text-white transition-colors">Kitchens</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-orange-900 dark:text-white font-medium">{vendor.kitchen_name}</span>
          </nav>

          <div className="flex items-start gap-4 max-w-2xl">
            {/* Logo */}
            <div className="shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white dark:bg-zinc-800 shadow-lg border-2 border-white/80 dark:border-zinc-600 overflow-hidden flex items-center justify-center">
                {vendor.logo ? (
                  <img src={mediaUrl(vendor.logo)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">🏠</span>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-orange-950 dark:text-white">{vendor.kitchen_name}</h1>
                {vendor.is_online && (
                  <span className="bg-success text-white text-xs font-medium px-2.5 py-0.5 rounded-full">Open</span>
                )}
              </div>
              {vendor.description && (
                <p className="text-orange-800/70 dark:text-zinc-400 mt-1 line-clamp-2">{vendor.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                {vendor.average_rating > 0 && (
                  <span className="flex items-center gap-1 bg-white/60 dark:bg-zinc-700/60 px-2.5 py-1 rounded-full font-medium text-amber-600 dark:text-amber-400">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {vendor.average_rating}
                    <span className="text-orange-800/50 dark:text-zinc-400 font-normal">({vendor.total_ratings})</span>
                  </span>
                )}
                <span className="flex items-center gap-1 text-orange-800/60 dark:text-zinc-400">
                  <MapPin className="h-3.5 w-3.5" />
                  {vendor.city}, {vendor.state}
                </span>
                {vendor.opening_time && vendor.closing_time && (
                  <span className="flex items-center gap-1 text-orange-800/60 dark:text-zinc-400">
                    <Clock className="h-3.5 w-3.5" />
                    {vendor.opening_time?.slice(0, 5)} - {vendor.closing_time?.slice(0, 5)}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {vendor.delivery_radius_km && (
                  <span className="flex items-center gap-1 text-xs bg-white/50 dark:bg-zinc-700/50 px-3 py-1 rounded-full text-orange-800/70 dark:text-zinc-300">
                    <Bike className="h-3 w-3" /> {vendor.delivery_radius_km} km delivery
                  </span>
                )}
                {vendor.minimum_order_amount > 0 && (
                  <span className="text-xs bg-orange-600/10 dark:bg-orange-500/15 text-orange-700 dark:text-orange-400 px-3 py-1 rounded-full font-medium">
                    Min. order {formatCurrency(vendor.minimum_order_amount)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-6">

        {/* Section Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveSection('menu')}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeSection === 'menu'
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShoppingBag className="h-4 w-4" /> Menu
          </button>
          {plans.length > 0 && (
            <button
              onClick={() => setActiveSection('plans')}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeSection === 'plans'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <CalendarCheck className="h-4 w-4" /> Subscription Plans
            </button>
          )}
          <button
            onClick={() => setActiveSection('reviews')}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeSection === 'reviews'
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageSquare className="h-4 w-4" /> Reviews {reviews.length > 0 && `(${reviews.length})`}
          </button>
        </div>

        {/* MENU SECTION */}
        {activeSection === 'menu' && (
          <div className="pb-12">
            {/* Meal Type Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
              {MEAL_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.value
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Menu Items Grid */}
            {menuItems.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No items available{activeTab ? ` for ${activeTab}` : ''}.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {menuItems.map((item) => (
                  <ProductCard key={item.id} item={item} showSeller={false} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* REVIEWS SECTION */}
        {activeSection === 'reviews' && (
          <div className="pb-12">
            {reviews.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No reviews yet.</p>
              </div>
            ) : (
              <div className="space-y-4 max-w-2xl">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-card rounded-xl border border-border p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{review.customer_name}</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-4 w-4 ${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PLANS SECTION */}
        {activeSection === 'plans' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="mb-4">
                  <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                    {plan.plan_type.replace('_', ' ')}
                  </span>
                  <h3 className="font-semibold text-lg mt-2">{plan.name}</h3>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{plan.description}</p>
                  )}
                </div>

                <div className="flex items-baseline gap-2 mb-5">
                  <span className="text-3xl font-bold text-primary">{formatCurrency(plan.price)}</span>
                  <span className="text-sm text-muted-foreground">/ {plan.duration_days} days</span>
                </div>

                <div className="space-y-2.5 text-sm text-muted-foreground mb-6 border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span>Daily cost</span>
                    <span className="font-medium text-foreground">{formatCurrency(plan.daily_price)}/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weekends</span>
                    <span>{plan.includes_weekends ? 'Included' : 'Excluded'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Skip days</span>
                    <span>Up to {plan.max_skips_allowed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pause allowed</span>
                    <span>{plan.max_pauses_allowed} times</span>
                  </div>
                </div>

                {isAuthenticated && user?.role === 'customer' ? (
                  <Link
                    to={`/customer/subscribe/${plan.id}`}
                    className="block w-full text-center px-4 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
                  >
                    Subscribe Now
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="block w-full text-center px-4 py-3 bg-muted text-muted-foreground rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors"
                  >
                    Login to Subscribe
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
