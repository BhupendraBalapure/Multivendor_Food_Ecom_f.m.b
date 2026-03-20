import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import subscriptionApi from '@/api/subscriptionApi'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { mediaUrl } from '@/utils/constants'
import { CalendarCheck, Loader2, ChevronRight } from 'lucide-react'

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  expired: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetchSubscriptions()
  }, [filter])

  const fetchSubscriptions = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter) params.status = filter
      const res = await subscriptionApi.getSubscriptions(params)
      setSubscriptions(res.data.results || res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">My Subscriptions</h1>
      <p className="text-muted-foreground mb-6">Manage your meal subscriptions</p>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {['', 'active', 'paused', 'expired', 'cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {f ? f.charAt(0).toUpperCase() + f.slice(1) : 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-card rounded-xl border border-border text-center py-16">
          <CalendarCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No subscriptions found.</p>
          <Link to="/vendors" className="mt-3 inline-block text-primary text-sm font-medium hover:underline">Browse Plans</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((sub) => (
            <Link
              key={sub.id}
              to={`/customer/subscriptions/${sub.id}`}
              className="block bg-card rounded-xl border border-border p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {sub.seller_logo ? (
                    <img src={mediaUrl(sub.seller_logo)} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {sub.seller_name?.[0]}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{sub.plan_name || sub.seller_name}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[sub.status]}`}>
                        {sub.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sub.subscription_id} &bull; {formatDate(sub.start_date)} - {formatDate(sub.end_date)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sub.remaining_days} days left &bull; {sub.skips_used}/{sub.max_skips} skips used
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{formatCurrency(sub.total_amount)}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
