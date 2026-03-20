import { Link } from 'react-router-dom'
import { CalendarDays, ChefHat, ArrowRight, Check } from 'lucide-react'

const PLAN_TYPE_STYLES = {
  breakfast: { label: 'Breakfast', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', accent: 'from-amber-500 to-orange-500' },
  lunch: { label: 'Lunch', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', accent: 'from-blue-500 to-cyan-500' },
  dinner: { label: 'Dinner', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', accent: 'from-purple-500 to-pink-500' },
  lunch_dinner: { label: 'Lunch + Dinner', bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400', accent: 'from-indigo-500 to-violet-500' },
  all_meals: { label: 'All Meals', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', accent: 'from-emerald-500 to-teal-500' },
}

export default function PlanCard({ plan }) {
  const style = PLAN_TYPE_STYLES[plan.plan_type] || PLAN_TYPE_STYLES.lunch

  return (
    <div className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {/* Gradient accent bar */}
      <div className={`h-2 bg-gradient-to-r ${style.accent}`} />

      <div className="p-5 flex flex-col flex-1">
        {/* Plan type + Duration */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}>
            {style.label}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            {plan.duration_days} days
          </span>
        </div>

        {/* Name */}
        <h3 className="font-semibold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {plan.name}
        </h3>

        {/* Seller */}
        <Link
          to={`/vendors/${plan.seller_slug}`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <ChefHat className="h-3.5 w-3.5" />
          {plan.seller_name}
        </Link>

        {/* Description */}
        {plan.description && (
          <p className="text-sm text-muted-foreground mt-3 line-clamp-2 leading-relaxed">{plan.description}</p>
        )}

        {/* Features */}
        <div className="flex flex-wrap gap-2 mt-4">
          {plan.includes_weekends && (
            <span className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
              <Check className="h-3 w-3 text-green-500" /> Weekends
            </span>
          )}
          <span className="text-xs bg-muted px-2 py-1 rounded-full">
            {plan.max_skips_allowed} skips
          </span>
          <span className="text-xs bg-muted px-2 py-1 rounded-full">
            {plan.max_pauses_allowed} pauses
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Pricing + CTA */}
        <div className="flex items-end justify-between mt-5 pt-4 border-t border-border">
          <div>
            <span className="text-2xl font-bold text-foreground">₹{Math.round(plan.price)}</span>
            <span className="text-sm text-muted-foreground ml-1">/ {plan.duration_days}d</span>
            <p className={`text-sm font-semibold mt-0.5 ${style.text}`}>
              ₹{Math.round(plan.daily_price)}/day
            </p>
          </div>
          <Link
            to={`/plans/${plan.id}`}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary font-semibold text-sm rounded-xl hover:bg-primary hover:text-white transition-all duration-200"
          >
            View <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
