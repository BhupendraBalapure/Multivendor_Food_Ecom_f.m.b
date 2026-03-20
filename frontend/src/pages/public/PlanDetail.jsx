import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import menuApi from '@/api/menuApi'
import {
  Loader2, ChevronRight, CalendarDays, CalendarCheck, SkipForward,
  Pause, Utensils, ChefHat, ArrowRight, Check, X, MapPin
} from 'lucide-react'

const PLAN_TYPE_STYLES = {
  breakfast: { label: 'Breakfast Only', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', accent: 'from-amber-500 to-orange-500' },
  lunch: { label: 'Lunch Only', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', accent: 'from-blue-500 to-cyan-500' },
  dinner: { label: 'Dinner Only', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', accent: 'from-purple-500 to-pink-500' },
  lunch_dinner: { label: 'Lunch + Dinner', bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400', accent: 'from-indigo-500 to-violet-500' },
  all_meals: { label: 'All Meals', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', accent: 'from-emerald-500 to-teal-500' },
}

export default function PlanDetail() {
  const { id } = useParams()
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlan = async () => {
      setLoading(true)
      try {
        const res = await menuApi.getPlanDetail(id)
        setPlan(res.data)
      } catch (err) {
        console.error('Failed to fetch plan:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPlan()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <CalendarDays className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Plan not found</h2>
        <p className="text-muted-foreground mb-4">This plan may no longer be available.</p>
        <Link to="/plans" className="text-primary hover:underline">Browse all plans</Link>
      </div>
    )
  }

  const style = PLAN_TYPE_STYLES[plan.plan_type] || PLAN_TYPE_STYLES.lunch

  const features = [
    { icon: CalendarDays, label: 'Duration', value: `${plan.duration_days} days`, color: 'text-blue-500' },
    { icon: CalendarCheck, label: 'Weekends', value: plan.includes_weekends ? 'Included' : 'Excluded', color: plan.includes_weekends ? 'text-green-500' : 'text-red-500' },
    { icon: SkipForward, label: 'Max Skips', value: `${plan.max_skips_allowed} days`, color: 'text-amber-500' },
    { icon: Pause, label: 'Max Pauses', value: `${plan.max_pauses_allowed} times`, color: 'text-purple-500' },
    { icon: Utensils, label: 'Items / Meal', value: plan.items_per_meal, color: 'text-orange-500' },
  ]

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/plans" className="hover:text-primary transition-colors">Plans</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium truncate">{plan.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Details */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${style.bg} ${style.text}`}>
                  {style.label}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">{plan.name}</h1>
              <Link
                to={`/vendors/${plan.seller_slug}`}
                className="inline-flex items-center gap-2 mt-3 text-muted-foreground hover:text-primary transition-colors"
              >
                <ChefHat className="h-4 w-4" />
                <span className="text-sm font-medium">by {plan.seller_name}</span>
              </Link>
            </div>

            {/* Description */}
            {plan.description && (
              <div className="bg-card border border-border rounded-2xl p-6 mb-6">
                <h2 className="text-lg font-semibold mb-2">About this plan</h2>
                <p className="text-muted-foreground leading-relaxed">{plan.description}</p>
              </div>
            )}

            {/* Features grid */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Plan Features</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {features.map((f) => (
                  <div key={f.label} className="bg-muted/50 rounded-xl p-4 text-center">
                    <f.icon className={`h-6 w-6 ${f.color} mx-auto mb-2`} />
                    <p className="text-lg font-bold">{f.value}</p>
                    <p className="text-xs text-muted-foreground">{f.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* What's included */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">What's Included</h2>
              <ul className="space-y-3">
                {[
                  { included: true, text: `${style.label} delivered daily to your doorstep` },
                  { included: plan.includes_weekends, text: plan.includes_weekends ? 'Weekend deliveries included' : 'Weekdays only (no weekend delivery)' },
                  { included: true, text: `Skip up to ${plan.max_skips_allowed} days during your subscription` },
                  { included: true, text: `Pause subscription up to ${plan.max_pauses_allowed} times` },
                  { included: true, text: 'Fresh, home-cooked meals prepared daily' },
                  { included: true, text: 'Cancel anytime with prorated refund' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    {item.included ? (
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <span className="text-sm text-muted-foreground">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Plan items (if available from API) */}
            {plan.plan_items && plan.plan_items.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">Sample Menu Items</h2>
                <div className="space-y-2">
                  {plan.plan_items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm font-medium">{item.menu_item_name}</span>
                      <span className="text-xs bg-muted px-2.5 py-1 rounded-full capitalize">{item.meal_type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column - Pricing sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Price card */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {/* Gradient top */}
                <div className={`h-3 bg-gradient-to-r ${style.accent}`} />

                <div className="p-6">
                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-foreground">₹{Math.round(plan.price)}</span>
                      <span className="text-muted-foreground">/ {plan.duration_days} days</span>
                    </div>
                    <div className={`mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full ${style.bg}`}>
                      <span className={`text-sm font-bold ${style.text}`}>₹{Math.round(plan.daily_price)}/day</span>
                    </div>
                  </div>

                  {/* Quick features */}
                  <div className="space-y-3 mb-6 pb-6 border-b border-border">
                    {[
                      { label: 'Duration', value: `${plan.duration_days} days` },
                      { label: 'Daily price', value: `₹${Math.round(plan.daily_price)}` },
                      { label: 'Weekends', value: plan.includes_weekends ? 'Included' : 'Excluded' },
                      { label: 'Skip days', value: `Up to ${plan.max_skips_allowed}` },
                      { label: 'Pause allowed', value: `${plan.max_pauses_allowed} times` },
                    ].map((f) => (
                      <div key={f.label} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{f.label}</span>
                        <span className="font-medium text-foreground">{f.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  {isAuthenticated && user?.role === 'customer' ? (
                    <Link
                      to={`/customer/subscribe/${plan.id}`}
                      className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                    >
                      Subscribe Now <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
                    >
                      Login to Subscribe
                    </Link>
                  )}
                </div>
              </div>

              {/* Seller mini card */}
              <Link
                to={`/vendors/${plan.seller_slug}`}
                className="block mt-4 bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <ChefHat className="h-6 w-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{plan.seller_name}</p>
                    <p className="text-xs text-muted-foreground">View kitchen & menu</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 ml-auto" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
