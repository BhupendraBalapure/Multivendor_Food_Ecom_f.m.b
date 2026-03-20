import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import menuApi from '@/api/menuApi'
import { Loader2, ChevronRight } from 'lucide-react'

const CATEGORY_EMOJIS = {
  'thali': '🍱',
  'biryani-rice': '🍚',
  'roti-bread': '🫓',
  'dal-curry': '🍛',
  'snacks-chaat': '🥘',
  'sweets-desserts': '🍮',
  'tiffin': '🥡',
}

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await menuApi.getCategories()
        setCategories(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  }

  return (
    <div>
      {/* Banner */}
      <div className="bg-gradient-to-br from-[#fff7ed] via-[#fed7aa] to-[#fdba74] dark:from-[#27272a] dark:via-[#3f3f46] dark:to-[#fb923c]/15 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center gap-1 text-sm text-orange-700/60 dark:text-zinc-400 mb-3">
            <Link to="/" className="hover:text-orange-900 dark:hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-orange-900 dark:text-white font-medium">Categories</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-orange-950 dark:text-white">All Categories</h1>
          <p className="text-orange-800/70 dark:text-zinc-400 mt-1">Browse meals by category</p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {categories.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">No categories found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {categories.map((cat) => {
              const emoji = CATEGORY_EMOJIS[cat.slug] || '🍽️'
              return (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.slug}`}
                  className="group flex flex-col items-center gap-3 p-5 bg-card rounded-2xl border border-border hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 transition-all"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-50 to-orange-200/40 dark:from-zinc-700 dark:to-zinc-600/60 border border-border dark:border-zinc-500/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-4xl">{emoji}</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {cat.name}
                    </p>
                    {cat.items_count > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">{cat.items_count} items</p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
