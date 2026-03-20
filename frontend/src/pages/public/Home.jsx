import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Utensils, CalendarCheck, Truck } from 'lucide-react'
import menuApi from '@/api/menuApi'
import sellerApi from '@/api/sellerApi'
import ProductCard from '@/components/cards/ProductCard'
import SellerCard from '@/components/cards/SellerCard'
import CategoryCard from '@/components/cards/CategoryCard'
import SectionHeader from '@/components/ui/SectionHeader'
import PlanCard from '@/components/cards/PlanCard'
import SearchBar from '@/components/ui/SearchBar'

export default function Home() {
  const [categories, setCategories] = useState([])
  const [popularItems, setPopularItems] = useState([])
  const [topSellers, setTopSellers] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const results = await Promise.allSettled([
        menuApi.getCategories(),
        menuApi.getItems({ page_size: 8, ordering: '-created_at' }),
        sellerApi.getVendors({ ordering: '-average_rating' }),
        menuApi.getPlans({ page_size: 6 }),
      ])

      if (results[0].status === 'fulfilled') setCategories(results[0].value.data)
      if (results[1].status === 'fulfilled') setPopularItems(results[1].value.data.results || results[1].value.data)
      if (results[2].status === 'fulfilled') setTopSellers((results[2].value.data.results || results[2].value.data).slice(0, 6))
      if (results[3].status === 'fulfilled') setPlans((results[3].value.data.results || results[3].value.data).slice(0, 6))

      setLoading(false)
    }
    fetchData()
  }, [])

  const quickTags = [
    { label: 'Thali', slug: 'thali' },
    { label: 'Biryani', slug: 'biryani-rice' },
    { label: 'Dosa', slug: 'snacks-chaat' },
    { label: 'Roti', slug: 'roti-bread' },
    { label: 'Sweets', slug: 'sweets-desserts' },
  ]

  return (
    <div>
      {/* ====== HERO SECTION ====== */}
      <section className="relative overflow-x-clip bg-gradient-to-br from-[#fff7ed] via-[#fed7aa] to-[#fb923c] dark:from-[#27272a] dark:via-[#3f3f46] dark:to-[#fb923c]/20">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 dark:bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/20 dark:bg-orange-500/5 rounded-full translate-y-1/2 -translate-x-1/3" />
        <div className="absolute top-1/2 right-1/4 w-4 h-4 bg-orange-400/30 rounded-full" />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-orange-400/20 rounded-full" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-orange-950 dark:text-white leading-tight">
              Homemade Meals,
              <br />
              <span className="text-orange-700 dark:text-orange-400">Delivered Fresh</span>
            </h1>
            <p className="text-lg text-orange-900/70 dark:text-zinc-400 mt-4 max-w-lg">
              Subscribe to your favorite local kitchen. Get fresh, homemade meals
              delivered to your doorstep every day.
            </p>

            {/* Search bar */}
            <div className="relative z-20 mt-8 max-w-xl">
              <SearchBar variant="hero" placeholder="Search for dishes, kitchens, or cuisines..." />
            </div>

            {/* Quick tags */}
            <div className="flex flex-wrap gap-2 mt-5">
              {quickTags.map((tag) => (
                <Link
                  key={tag.slug}
                  to={`/products?category=${tag.slug}`}
                  className="px-4 py-1.5 bg-orange-900/10 hover:bg-orange-900/20 text-orange-900 dark:bg-white/10 dark:hover:bg-white/15 dark:text-zinc-300 text-sm rounded-full transition-colors border border-orange-900/10 dark:border-white/10"
                >
                  {tag.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Hero right - decorative food display */}
          <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="w-72 h-72 rounded-full bg-white/20 dark:bg-white/5 backdrop-blur-sm flex items-center justify-center border border-white/30 dark:border-white/10">
                <div className="w-56 h-56 rounded-full bg-white/20 dark:bg-white/5 flex items-center justify-center border border-white/20 dark:border-white/5">
                  <span className="text-8xl">🍱</span>
                </div>
              </div>
              <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full bg-orange-400/20 backdrop-blur-sm flex items-center justify-center text-2xl animate-bounce border border-orange-400/20" style={{ animationDuration: '3s' }}>
                🍛
              </div>
              <div className="absolute -bottom-2 -right-2 w-14 h-14 rounded-full bg-orange-400/20 backdrop-blur-sm flex items-center justify-center text-2xl animate-bounce border border-orange-400/20" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
                🥘
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== CATEGORIES SECTION ====== */}
      {categories.length > 0 && (
        <section className="py-12 md:py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <SectionHeader
              title="What's on your mind?"
              subtitle="Browse by category"
              linkText="View All"
              linkTo="/categories"
            />
            <div className="flex gap-6 md:gap-8 overflow-x-auto scrollbar-hide pb-4 pt-2 -mx-4 px-4">
              {categories.map((cat) => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ====== POPULAR DISHES ====== */}
      {popularItems.length > 0 && (
        <section className="py-12 md:py-16 px-4 bg-secondary/40 dark:bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <SectionHeader
              title="Popular Dishes"
              subtitle="Most loved by our customers"
              linkText="View All"
              linkTo="/products"
            />
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-card rounded-xl sm:rounded-2xl border border-border overflow-hidden animate-pulse">
                    <div className="h-32 sm:h-44 bg-muted" />
                    <div className="p-2.5 sm:p-4 space-y-2 sm:space-y-3">
                      <div className="h-3 sm:h-4 bg-muted rounded w-1/3" />
                      <div className="h-4 sm:h-5 bg-muted rounded w-2/3" />
                      <div className="h-3 sm:h-4 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                {popularItems.map((item) => (
                  <ProductCard key={item.id} item={item} showSeller />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ====== TOP KITCHENS ====== */}
      {topSellers.length > 0 && (
        <section className="py-12 md:py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <SectionHeader
              title="Top Rated Kitchens"
              subtitle="Discover the best home chefs"
              linkText="View All"
              linkTo="/vendors"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {topSellers.map((seller) => (
                <SellerCard key={seller.id || seller.slug} seller={seller} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ====== SUBSCRIPTION PLANS ====== */}
      {plans.length > 0 && (
        <section className="py-12 md:py-16 px-4 bg-secondary/40 dark:bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <SectionHeader
              title="Subscription Plans"
              subtitle="Save more with daily meal subscriptions"
              linkText="View All Plans"
              linkTo="/plans"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ====== HOW IT WORKS ====== */}
      <section className="py-16 md:py-20 px-4 bg-secondary/40 dark:bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">How It Works</h2>
            <p className="text-muted-foreground mt-2">Get started in 3 simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-orange-200/30 via-orange-400/40 to-orange-200/30" />

            {[
              { icon: Utensils, num: '1', title: 'Choose Your Kitchen', desc: 'Browse through verified local mess and tiffin services near you.' },
              { icon: CalendarCheck, num: '2', title: 'Subscribe or Order', desc: 'Pick a meal plan or order instantly. Skip or pause anytime.' },
              { icon: Truck, num: '3', title: 'Get Fresh Delivery', desc: 'Fresh homemade food delivered to your door, right on time.' },
            ].map((step) => (
              <div key={step.num} className="relative text-center p-6">
                <div className="relative mx-auto mb-5">
                  <div className="h-20 w-20 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-orange-400/20 rotate-3 hover:rotate-0 transition-transform">
                    <step.icon className="h-9 w-9 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-orange-600 text-white text-sm font-bold rounded-full flex items-center justify-center">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== STATS ====== */}
      <section className="py-16 px-4 bg-gradient-to-r from-[#fff7ed] via-[#fed7aa] to-[#fb923c] dark:from-[#27272a] dark:via-[#3f3f46] dark:to-[#fb923c]/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '500+', label: 'Home Kitchens' },
              { value: '10K+', label: 'Happy Subscribers' },
              { value: '50K+', label: 'Meals Delivered' },
              { value: '20+', label: 'Cities' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl font-bold text-orange-950 dark:text-white">{stat.value}</div>
                <div className="text-orange-800/60 dark:text-zinc-400 mt-1 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Eat <span className="text-primary">Homemade?</span>
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Join thousands of happy customers who enjoy fresh meals every day.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-colors shadow-lg shadow-primary/25"
            >
              Browse Menu <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/signup?role=seller"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-primary text-primary rounded-xl font-medium hover:bg-primary/5 transition-colors"
            >
              Start Selling
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
