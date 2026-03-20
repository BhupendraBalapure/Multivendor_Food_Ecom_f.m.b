import { useState, useEffect } from 'react'
import sellerApi from '@/api/sellerApi'
import { Search, Loader2, ChefHat } from 'lucide-react'
import SellerCard from '@/components/cards/SellerCard'

export default function VendorsList() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')

  useEffect(() => {
    fetchVendors()
  }, [city])

  const fetchVendors = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (city) params.city = city
      const res = await sellerApi.getVendors(params)
      setVendors(res.data.results || res.data)
    } catch (err) {
      console.error('Failed to fetch vendors:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchVendors()
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#fff7ed] via-[#fed7aa] to-[#fdba74] dark:from-[#27272a] dark:via-[#3f3f46] dark:to-[#fb923c]/15 py-10 px-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-300/15 dark:bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-orange-300/15 dark:bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />

        {/* Decorative right side */}
        <div className="hidden md:flex absolute right-8 lg:right-16 top-1/2 -translate-y-1/2 items-center gap-4">
          <div className="flex flex-col gap-3 items-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-400/10 dark:bg-white/5 flex items-center justify-center border border-orange-300/20 dark:border-zinc-600/30 rotate-6">
              <span className="text-3xl">🏠</span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-orange-400/10 dark:bg-white/5 flex items-center justify-center border border-orange-300/20 dark:border-zinc-600/30 -rotate-6">
              <span className="text-2xl">🍛</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 items-center -mt-6">
            <div className="w-14 h-14 rounded-2xl bg-orange-400/10 dark:bg-white/5 flex items-center justify-center border border-orange-300/20 dark:border-zinc-600/30 -rotate-3">
              <span className="text-2xl">👨‍🍳</span>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-orange-400/10 dark:bg-white/5 flex items-center justify-center border border-orange-300/20 dark:border-zinc-600/30 rotate-3">
              <span className="text-3xl">🍱</span>
            </div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-orange-950 dark:text-white mb-2">Explore Kitchens</h1>
          <p className="text-orange-800/70 dark:text-zinc-400 mb-6">
            Discover verified home kitchens and tiffin services near you
          </p>

          {/* Search & filter */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <form onSubmit={handleSearch} className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl text-sm bg-white dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-lg"
              />
            </form>
            <input
              type="text"
              placeholder="Filter by city..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onBlur={fetchVendors}
              className="px-4 py-3 rounded-xl text-sm bg-white dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-lg max-w-[200px]"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-16">
            <ChefHat className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">No kitchens found.</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different search or check back later.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">{vendors.length} kitchen{vendors.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map((vendor) => (
                <SellerCard key={vendor.id || vendor.slug} seller={vendor} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
