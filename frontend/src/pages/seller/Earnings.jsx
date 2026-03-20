import { useState, useEffect } from 'react'
import sellerApi from '@/api/sellerApi'
import { formatCurrency, formatDate } from '@/utils/formatters'
import {
  Wallet, TrendingUp, ShoppingBag, Calendar,
  Loader2, ChevronRight
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const PERIODS = [
  { label: '7 Days', value: 7 },
  { label: '14 Days', value: 14 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
]

export default function SellerEarnings() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    fetchEarnings()
  }, [days])

  const fetchEarnings = async () => {
    setLoading(true)
    try {
      const res = await sellerApi.getEarnings({ days })
      setData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !data) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  }

  const chartData = (data?.daily_earnings || []).map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    earnings: d.earnings,
    orders: d.orders,
  }))

  const stats = [
    { label: 'Total Earnings', value: formatCurrency(data?.total_earnings || 0), icon: Wallet, color: 'text-green-600', bg: 'bg-green-50' },
    { label: `Last ${days} Days`, value: formatCurrency(data?.period_earnings || 0), icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/5' },
    { label: `Orders (${days}d)`, value: data?.period_orders || 0, icon: ShoppingBag, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Avg/Day', value: formatCurrency(days > 0 ? (data?.period_earnings || 0) / days : 0), icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
  ]

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium">{payload[0]?.payload?.date}</p>
        <p className="text-sm text-green-600">{formatCurrency(payload[0]?.value)}</p>
        <p className="text-xs text-muted-foreground">{payload[0]?.payload?.orders} orders</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Earnings</h1>
          <p className="text-muted-foreground">Track your revenue and payouts</p>
        </div>
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setDays(p.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                days === p.value ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <div className={`h-9 w-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Earnings Chart */}
      {chartData.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Earnings Trend</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="earnings" stroke="#22c55e" strokeWidth={2} fill="url(#earningsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Paid Orders */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Paid Orders</h2>
        {(data?.recent_paid_orders || []).length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">No paid orders yet.</p>
        ) : (
          <div className="space-y-3">
            {data.recent_paid_orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-sm font-medium">{order.order_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.customer__full_name} &bull; {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    order.order_type === 'subscription' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {order.order_type}
                  </span>
                  <p className="text-sm font-semibold text-green-600 mt-0.5">{formatCurrency(order.total_amount)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
