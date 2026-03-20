import { Link } from 'react-router-dom'

const CATEGORY_EMOJIS = {
  'thali': '🍱',
  'biryani-rice': '🍚',
  'roti-bread': '🫓',
  'dal-curry': '🍛',
  'snacks-chaat': '🥘',
  'sweets-desserts': '🍮',
  'tiffin': '🥡',
}

export default function CategoryCard({ category }) {
  const emoji = CATEGORY_EMOJIS[category.slug] || '🍽️'

  return (
    <Link
      to={`/products?category=${category.slug}`}
      className="group flex flex-col items-center gap-3 shrink-0"
    >
      <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-orange-50 to-orange-200/40 dark:from-zinc-700 dark:to-zinc-600/60 border border-border dark:border-zinc-500/40 flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg group-hover:border-primary/50 transition-all duration-300">
        <span className="text-4xl md:text-5xl">{emoji}</span>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {category.name}
        </p>
        {category.items_count > 0 && (
          <p className="text-xs text-muted-foreground">{category.items_count} items</p>
        )}
      </div>
    </Link>
  )
}
