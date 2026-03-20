import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Loader2 } from 'lucide-react'
import menuApi from '@/api/menuApi'
import { mediaUrl } from '@/utils/constants'

export default function SearchBar({ placeholder = 'Search dishes or kitchens...', variant = 'default', onSearchDone }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapperRef = useRef(null)
  const debounceRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Debounced fetch suggestions
  const fetchSuggestions = useCallback((q) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!q.trim() || q.trim().length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await menuApi.getItems({ search: q.trim(), page_size: 6 })
        const items = res.data.results || res.data
        // Deduplicate by name
        const seen = new Set()
        const unique = []
        for (const item of items) {
          if (!seen.has(item.name)) {
            seen.add(item.name)
            unique.push(item)
          }
        }
        setSuggestions(unique)
        setOpen(unique.length > 0)
        setActiveIndex(-1)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [])

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    fetchSuggestions(val)
  }

  const doNavigate = (searchTerm) => {
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`)
      setQuery('')
      setSuggestions([])
      setOpen(false)
      onSearchDone?.()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        doNavigate(suggestions[activeIndex].name)
      } else {
        doNavigate(query)
      }
    }
  }

  const handleSuggestionClick = (item) => {
    doNavigate(item.name)
  }

  const clearQuery = () => {
    setQuery('')
    setSuggestions([])
    setOpen(false)
  }

  const isHero = variant === 'hero'

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className={
        isHero
          ? 'flex items-center bg-white dark:bg-[#3f3f46] rounded-2xl shadow-xl shadow-orange-900/10 dark:shadow-black/20 border border-transparent dark:border-zinc-500/50'
          : 'relative'
      }>
        {isHero ? (
          <>
            <Search className="h-5 w-5 text-orange-400 dark:text-zinc-400 ml-4 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setOpen(true)}
              placeholder={placeholder}
              className="w-full px-4 py-4 text-gray-900 dark:text-white placeholder:text-orange-300 dark:placeholder:text-zinc-500 outline-none bg-transparent"
            />
            {query && (
              <button type="button" onClick={clearQuery} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300">
                <X className="h-4 w-4" />
              </button>
            )}
            {loading && <Loader2 className="h-4 w-4 animate-spin text-orange-400 mr-2 shrink-0" />}
            <button
              type="button"
              onClick={() => doNavigate(query)}
              className="bg-orange-500 text-white px-6 py-4 font-medium hover:bg-orange-600 transition-colors shrink-0 rounded-r-2xl"
            >
              Search
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => doNavigate(query)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
              <Search className="h-4 w-4" />
            </button>
            <input
              type="text"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setOpen(true)}
              placeholder={placeholder}
              className="w-full pl-10 pr-8 py-2 bg-muted/60 rounded-full text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all border border-gray-200 dark:border-zinc-600"
            />
            {query && (
              <button type="button" onClick={clearQuery} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Suggestions dropdown */}
      {open && (
        <div className={`absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-2xl z-[100] overflow-hidden ${isHero ? 'mt-2' : ''}`}>
          {suggestions.map((item, i) => (
            <button
              key={item.id}
              onClick={() => handleSuggestionClick(item)}
              className={`flex items-center gap-3 w-full px-4 py-3 text-left text-sm hover:bg-muted transition-colors ${
                i === activeIndex ? 'bg-muted' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                {item.image ? (
                  <img src={mediaUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-zinc-700 dark:to-zinc-600">🍽️</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {item.seller_name} {item.category_name ? `· ${item.category_name}` : ''}
                </p>
              </div>
              {item.effective_price && (
                <span className="text-xs font-medium text-primary shrink-0">₹{Math.round(item.effective_price)}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
