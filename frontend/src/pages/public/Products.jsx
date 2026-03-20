import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X, ChevronDown, Loader2 } from 'lucide-react'
import menuApi from '@/api/menuApi'
import axiosInstance from '@/api/axiosInstance'
import ProductCard from '@/components/cards/ProductCard'
import { mediaUrl } from '@/utils/constants'

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
]

const FOOD_TYPES = [
  { value: 'veg', label: 'Veg', color: 'bg-green-500' },
  { value: 'non_veg', label: 'Non-Veg', color: 'bg-red-500' },
  { value: 'egg', label: 'Egg', color: 'bg-yellow-500' },
]

const SORT_OPTIONS = [
  { value: '-created_at', label: 'Newest First' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A to Z' },
]

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [nextPage, setNextPage] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Read filters from URL
  const activeCategory = searchParams.get('category') || ''
  const activeMealType = searchParams.get('meal_type') || ''
  const activeFoodType = searchParams.get('food_type') || ''
  const activeSearch = searchParams.get('search') || ''
  const activeSort = searchParams.get('ordering') || '-created_at'

  const [searchInput, setSearchInput] = useState(activeSearch)
  const [suggestions, setSuggestions] = useState([])
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [suggestIndex, setSuggestIndex] = useState(-1)
  const suggestDebounce = useRef(null)
  const filterDebounce = useRef(null)
  const searchWrapperRef = useRef(null)

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setSuggestOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Fetch categories once
  useEffect(() => {
    menuApi.getCategories().then((res) => setCategories(res.data)).catch(() => {})
  }, [])

  // Fetch items when filters change
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true)
      try {
        const params = { ordering: activeSort, page_size: 12 }
        if (activeCategory) params.category_slug = activeCategory
        if (activeMealType) params.meal_type = activeMealType
        if (activeFoodType) params.food_type = activeFoodType
        if (activeSearch) params.search = activeSearch

        const res = await menuApi.getItems(params)
        const data = res.data
        setItems(data.results || data)
        setTotalCount(data.count || (data.results || data).length)
        setNextPage(data.next || null)
      } catch (err) {
        console.error('Failed to fetch items:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [activeCategory, activeMealType, activeFoodType, activeSearch, activeSort])

  const loadMore = async () => {
    if (!nextPage || loadingMore) return
    setLoadingMore(true)
    try {
      // nextPage is a full URL from DRF pagination, extract the path+query
      const url = new URL(nextPage)
      const res = await axiosInstance.get(url.pathname + url.search)
      const data = res.data
      setItems((prev) => [...prev, ...(data.results || data)])
      setNextPage(data.next || null)
    } catch (err) {
      console.error('Load more failed:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  const updateFilter = useCallback(
    (key, value) => {
      const newParams = new URLSearchParams(searchParams)
      if (value) {
        newParams.set(key, value)
      } else {
        newParams.delete(key)
      }
      setSearchParams(newParams)
    },
    [searchParams, setSearchParams]
  )

  const clearFilters = () => {
    setSearchParams({})
    setSearchInput('')
  }

  const handleSearchChange = (val) => {
    setSearchInput(val)

    // Auto-filter with debounce
    if (filterDebounce.current) clearTimeout(filterDebounce.current)
    filterDebounce.current = setTimeout(() => {
      updateFilter('search', val.trim())
    }, 500)

    // Auto-suggest with debounce
    if (suggestDebounce.current) clearTimeout(suggestDebounce.current)
    if (!val.trim() || val.trim().length < 2) {
      setSuggestions([])
      setSuggestOpen(false)
      return
    }
    suggestDebounce.current = setTimeout(async () => {
      setSuggestLoading(true)
      try {
        const res = await menuApi.getItems({ search: val.trim(), page_size: 6 })
        const items = res.data.results || res.data
        const seen = new Set()
        const unique = []
        for (const item of items) {
          if (!seen.has(item.name)) { seen.add(item.name); unique.push(item) }
        }
        setSuggestions(unique)
        setSuggestOpen(unique.length > 0)
        setSuggestIndex(-1)
      } catch { setSuggestions([]) }
      finally { setSuggestLoading(false) }
    }, 300)
  }

  const applySuggestion = (name) => {
    setSearchInput(name)
    setSuggestOpen(false)
    setSuggestions([])
    if (filterDebounce.current) clearTimeout(filterDebounce.current)
    updateFilter('search', name.trim())
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') { setSuggestOpen(false); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSuggestIndex((p) => (p < suggestions.length - 1 ? p + 1 : 0))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSuggestIndex((p) => (p > 0 ? p - 1 : suggestions.length - 1))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestIndex >= 0 && suggestions[suggestIndex]) {
        applySuggestion(suggestions[suggestIndex].name)
      } else {
        setSuggestOpen(false)
        if (filterDebounce.current) clearTimeout(filterDebounce.current)
        updateFilter('search', searchInput.trim())
      }
    }
  }

  const hasActiveFilters = activeCategory || activeMealType || activeFoodType || activeSearch

  // Sidebar content (shared between desktop and mobile)
  const filtersContent = (
    <div className="space-y-6">
      {/* Search */}
      <div ref={searchWrapperRef}>
        <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Search</h3>
        <div className="relative">
          <button type="button" onClick={() => { setSuggestOpen(false); updateFilter('search', searchInput.trim()) }} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors z-10">
            <Search className="h-4 w-4" />
          </button>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => suggestions.length > 0 && setSuggestOpen(true)}
            placeholder="Search dishes..."
            className="w-full pl-10 pr-8 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-card"
          />
          {searchInput && (
            <button type="button" onClick={() => { setSearchInput(''); setSuggestions([]); setSuggestOpen(false); updateFilter('search', '') }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {suggestLoading && <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-primary" />}

          {/* Suggestions dropdown */}
          {suggestOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-2xl z-[100] overflow-hidden">
              {suggestions.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => applySuggestion(item.name)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors ${i === suggestIndex ? 'bg-muted' : ''}`}
                >
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-muted shrink-0">
                    {item.image ? (
                      <img src={mediaUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-zinc-700 dark:to-zinc-600">🍽️</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate text-xs">{item.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.seller_name}</p>
                  </div>
                  {item.effective_price && (
                    <span className="text-xs font-medium text-primary shrink-0">₹{Math.round(item.effective_price)}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Category</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateFilter('category', activeCategory === cat.slug ? '' : cat.slug)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                activeCategory === cat.slug
                  ? 'bg-primary text-white border-primary'
                  : 'bg-card text-foreground border-border hover:border-primary/50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Meal Type */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Meal Type</h3>
        <div className="flex flex-wrap gap-2">
          {MEAL_TYPES.map((mt) => (
            <button
              key={mt.value}
              onClick={() => updateFilter('meal_type', activeMealType === mt.value ? '' : mt.value)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                activeMealType === mt.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-card text-foreground border-border hover:border-primary/50'
              }`}
            >
              {mt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Food Type */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Food Type</h3>
        <div className="flex flex-wrap gap-2">
          {FOOD_TYPES.map((ft) => (
            <button
              key={ft.value}
              onClick={() => updateFilter('food_type', activeFoodType === ft.value ? '' : ft.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-all ${
                activeFoodType === ft.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-card text-foreground border-border hover:border-primary/50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${activeFoodType === ft.value ? 'bg-white' : ft.color}`} />
              {ft.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Sort By</h3>
        <select
          value={activeSort}
          onChange={(e) => updateFilter('ordering', e.target.value)}
          className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full py-2.5 text-sm font-medium text-destructive border border-destructive/30 rounded-xl hover:bg-destructive/5 transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Page header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#fff7ed] via-[#fed7aa] to-[#fdba74] dark:from-[#27272a] dark:via-[#3f3f46] dark:to-[#fb923c]/15 py-8 px-4">
        <div className="absolute top-0 right-0 w-72 h-72 bg-orange-300/15 dark:bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-300/15 dark:bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />

        {/* Decorative right side */}
        <div className="hidden md:flex absolute right-8 lg:right-16 top-1/2 -translate-y-1/2 items-center justify-center">
          <div className="w-28 h-28 lg:w-36 lg:h-36 rounded-full bg-orange-400/10 dark:bg-white/5 flex items-center justify-center border border-orange-300/20 dark:border-zinc-600/30">
            <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-orange-400/10 dark:bg-white/5 flex items-center justify-center">
              <span className="text-4xl lg:text-5xl">🍽️</span>
            </div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-orange-950 dark:text-white">
            {activeCategory
              ? categories.find((c) => c.slug === activeCategory)?.name || 'Products'
              : activeSearch
                ? `Results for "${activeSearch}"`
                : 'All Dishes'}
          </h1>
          <p className="text-orange-800/70 dark:text-zinc-400 mt-1">
            {totalCount} {totalCount === 1 ? 'dish' : 'dishes'} available
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Mobile filter toggle */}
        <div className="lg:hidden mb-4 flex gap-3">
          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium hover:border-primary/50 transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">!</span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/5 rounded-xl transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Mobile filters drawer */}
        {mobileFiltersOpen && (
          <div className="lg:hidden mb-6 p-5 bg-card rounded-2xl border border-border shadow-lg animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Filters</h2>
              <button onClick={() => setMobileFiltersOpen(false)} className="p-1 hover:bg-muted rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            {filtersContent}
          </div>
        )}

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 bg-card rounded-2xl border border-border p-5">
              <h2 className="font-semibold text-lg mb-5">Filters</h2>
              {filtersContent}
            </div>
          </aside>

          {/* Product grid */}
          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-card rounded-xl sm:rounded-2xl border border-border overflow-hidden animate-pulse">
                    <div className="h-32 sm:h-44 bg-muted" />
                    <div className="p-2.5 sm:p-4 space-y-2 sm:space-y-3">
                      <div className="h-3 bg-muted rounded w-1/4" />
                      <div className="h-4 sm:h-5 bg-muted rounded w-3/4" />
                      <div className="h-3 sm:h-4 bg-muted rounded w-1/2" />
                      <div className="flex justify-between">
                        <div className="h-5 sm:h-6 bg-muted rounded w-16" />
                        <div className="h-7 sm:h-8 bg-muted rounded w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-20">
                <span className="text-6xl block mb-4">🍽️</span>
                <h3 className="text-xl font-semibold text-foreground mb-2">No dishes found</h3>
                <p className="text-muted-foreground mb-6">Try adjusting your filters or search query</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
                  {items.map((item) => (
                    <ProductCard key={item.id} item={item} showSeller />
                  ))}
                </div>

                {/* Load More */}
                {nextPage && (
                  <div className="text-center mt-8">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="px-8 py-3 bg-card border border-border rounded-xl font-medium text-foreground hover:border-primary/50 hover:shadow-md transition-all disabled:opacity-50"
                    >
                      {loadingMore ? 'Loading...' : 'Load More Dishes'}
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
