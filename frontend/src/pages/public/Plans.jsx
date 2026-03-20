import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2, CalendarCheck, SlidersHorizontal } from 'lucide-react'
import menuApi from '@/api/menuApi'
import PlanCard from '@/components/cards/PlanCard'

const PLAN_TYPES = [
  { value: '', label: 'All Plans' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'lunch_dinner', label: 'Lunch + Dinner' },
  { value: 'all_meals', label: 'All Meals' },
]

const SORT_OPTIONS = [
  { value: 'price', label: 'Price: Low → High' },
  { value: '-price', label: 'Price: High → Low' },
  { value: 'daily_price', label: 'Daily Cost: Low → High' },
]

export default function Plans() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  const activeType = searchParams.get('type') || ''
  const activeSort = searchParams.get('sort') || 'price'

  useEffect(() => {
    fetchPlans()
  }, [activeType, activeSort])

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const params = {}
      if (activeType) params.plan_type = activeType
      const res = await menuApi.getPlans(params)
      let items = res.data.results || res.data

      // Client-side sort
      if (activeSort === 'price') {
        items.sort((a, b) => Number(a.price) - Number(b.price))
      } else if (activeSort === '-price') {
        items.sort((a, b) => Number(b.price) - Number(a.price))
      } else if (activeSort === 'daily_price') {
        items.sort((a, b) => Number(a.daily_price) - Number(b.daily_price))
      }

      setPlans(items)
    } catch (err) {
      console.error('Failed to fetch plans:', err)
    } finally {
      setLoading(false)
    }
  }

  const setFilter = (key, value) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    setSearchParams(params)
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#fff7ed] via-[#fed7aa] to-[#fdba74] dark:from-[#27272a] dark:via-[#3f3f46] dark:to-[#fb923c]/15 py-10 px-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-300/15 dark:bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-orange-300/15 dark:bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />

        {/* Decorative right side */}
        <div className="hidden md:flex absolute right-8 lg:right-16 top-1/2 -translate-y-1/2 items-center gap-4">
          <div className="flex flex-col gap-3 items-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-400/10 dark:bg-white/5 flex items-center justify-center border border-orange-300/20 dark:border-zinc-600/30 rotate-6">
              <span className="text-3xl">📅</span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-orange-400/10 dark:bg-white/5 flex items-center justify-center border border-orange-300/20 dark:border-zinc-600/30 -rotate-6">
              <span className="text-2xl">🍱</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 items-center -mt-6">
            <div className="w-14 h-14 rounded-2xl bg-orange-400/10 dark:bg-white/5 flex items-center justify-center border border-orange-300/20 dark:border-zinc-600/30 -rotate-3">
              <span className="text-2xl">🥡</span>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-orange-400/10 dark:bg-white/5 flex items-center justify-center border border-orange-300/20 dark:border-zinc-600/30 rotate-3">
              <span className="text-3xl">🍛</span>
            </div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-orange-950 dark:text-white mb-2">Subscription Plans</h1>
          <p className="text-orange-800/70 dark:text-zinc-400 max-w-lg">
            Subscribe to daily meals from your favourite kitchens. Save money, skip the hassle of ordering every day.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          {/* Plan type pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {PLAN_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setFilter('type', type.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeType === type.value
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <select
              value={activeSort}
              onChange={(e) => setFilter('sort', e.target.value)}
              className="text-sm bg-card border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/20"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-16">
            <CalendarCheck className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">No subscription plans found.</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different filter or check back later.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              {plans.length} plan{plans.length !== 1 ? 's' : ''} available
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
