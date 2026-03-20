import { useState, useEffect } from 'react'
import subscriptionApi from '@/api/subscriptionApi'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { CalendarCheck, Loader2, ChevronDown, ChevronUp, User, Phone, Mail } from 'lucide-react'

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  expired: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function Subscribers() {
  const [subscriptions, setSubscriptions] = useState([])
  const [todayOrders, setTodayOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    fetchData()
  }, [filter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter) params.status = filter
      const [subRes, todayRes] = await Promise.all([
        subscriptionApi.sellerGetSubscriptions(params),
        subscriptionApi.sellerGetTodayOrders().catch(() => ({ data: [] })),
      ])
      setSubscriptions(subRes.data.results || subRes.data)
      setTodayOrders(todayRes.data.results || todayRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const activeCount = subscriptions.filter((s) => s.status === 'active').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Subscribers</h1>
          <p className="text-muted-foreground text-sm">Manage your subscription customers</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{activeCount}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </div>
      </div>

      {/* Today's Orders */}
      {todayOrders.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-sm mb-2">Today's Subscription Orders ({todayOrders.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {todayOrders.map((order) => (
              <div key={order.id} className="bg-card rounded-lg p-3 text-sm border border-border">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{order.meal_type}</p>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
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
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-card rounded-xl border border-border text-center py-16">
          <CalendarCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No subscribers found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {sub.customer_name?.[0] || 'C'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{sub.customer_name}</span>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[sub.status]}`}>
                          {sub.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {sub.subscription_id} &bull; {sub.plan_name || 'Plan'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium">{sub.remaining_days} days left</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(sub.total_amount)}</p>
                    </div>
                    {expandedId === sub.id ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </button>

              {expandedId === sub.id && (
                <div className="border-t border-border p-4 bg-muted/30">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Period</p>
                      <p className="text-sm font-medium">{formatDate(sub.start_date)} - {formatDate(sub.end_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Plan Type</p>
                      <p className="text-sm font-medium capitalize">{sub.plan_type?.replace('_', ' ') || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Skips</p>
                      <p className="text-sm font-medium">{sub.skips_used}/{sub.max_skips}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pauses</p>
                      <p className="text-sm font-medium">{sub.pauses_used}/{sub.max_pauses}</p>
                    </div>
                  </div>

                  {(sub.customer_email || sub.customer_phone) && (
                    <div className="flex flex-wrap gap-4 text-sm">
                      {sub.customer_email && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" /> {sub.customer_email}
                        </span>
                      )}
                      {sub.customer_phone && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" /> {sub.customer_phone}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
