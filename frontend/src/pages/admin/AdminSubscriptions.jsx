import { useState, useEffect } from 'react'
import adminApi from '@/api/adminApi'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Loader2, Search, CalendarCheck } from 'lucide-react'

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  expired: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)

  useEffect(() => {
    setPage(1)
    fetchSubs(1)
  }, [statusFilter])

  const fetchSubs = async (p = 1) => {
    setLoading(true)
    try {
      const params = { page: p }
      if (statusFilter) params.status = statusFilter
      if (search) params.search = search
      const res = await adminApi.getSubscriptions(params)
      const data = res.data.results || res.data
      setSubs(p === 1 ? data : (prev) => [...prev, ...data])
      setHasNext(!!res.data.next)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchSubs(1)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">All Subscriptions</h1>
      <p className="text-muted-foreground mb-6">Platform-wide subscription management</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by subscription ID, customer, or seller..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </form>
        <div className="flex gap-2">
          {['', 'active', 'paused', 'expired', 'cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading && subs.length === 0 ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : subs.length === 0 ? (
        <div className="bg-card rounded-xl border border-border text-center py-16">
          <CalendarCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No subscriptions found.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium">Sub ID</th>
                  <th className="text-left px-4 py-3 font-medium">Customer</th>
                  <th className="text-left px-4 py-3 font-medium">Seller</th>
                  <th className="text-left px-4 py-3 font-medium">Plan</th>
                  <th className="text-left px-4 py-3 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Period</th>
                  <th className="text-left px-4 py-3 font-medium">Days Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-primary">{sub.subscription_id}</td>
                    <td className="px-4 py-3">{sub.customer_name || '-'}</td>
                    <td className="px-4 py-3">{sub.seller_name || '-'}</td>
                    <td className="px-4 py-3">{sub.plan_name || '-'}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(sub.total_amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[sub.status]}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(sub.start_date)} - {formatDate(sub.end_date)}
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{sub.remaining_days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasNext && !loading && (
            <div className="p-4 text-center border-t border-border">
              <button
                onClick={() => { const next = page + 1; setPage(next); fetchSubs(next) }}
                className="text-sm text-primary font-medium hover:underline"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
