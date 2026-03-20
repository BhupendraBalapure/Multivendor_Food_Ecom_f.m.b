import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import adminApi from '@/api/adminApi'
import { formatCurrency } from '@/utils/formatters'
import {
  Users, Store, ClipboardList, TrendingUp, CalendarCheck,
  Loader2, ChevronRight, AlertCircle, ArrowUpRight, ArrowDownRight,
  ShoppingBag, IndianRupee, Activity, MessageSquare
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  out_for_delivery: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
}

// Animated counter hook
function useAnimatedCount(target, duration = 1200) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    if (target == null) return
    const num = typeof target === 'string' ? parseFloat(target.replace(/[^\d.]/g, '')) : target
    if (isNaN(num) || num === 0) { setCount(0); return }
    let start = 0
    const startTime = performance.now()
    const animate = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setCount(Math.floor(eased * num))
      if (progress < 1) ref.current = requestAnimationFrame(animate)
    }
    ref.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(ref.current)
  }, [target, duration])
  return count
}

function AnimatedStat({ value, prefix = '', suffix = '' }) {
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.]/g, ''))
  const animated = useAnimatedCount(num)
  if (typeof value === 'string' && value.includes('/')) return <span>{value}</span>
  return <span>{prefix}{animated.toLocaleString('en-IN')}{suffix}</span>
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {p.name === 'Revenue' ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    fetchDashboard()
  }, [])

  useEffect(() => {
    if (data) {
      setTimeout(() => setVisible(true), 100)
    }
  }, [data])

  const fetchDashboard = async () => {
    try {
      const res = await adminApi.getDashboard()
      setData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    )
  }

  if (!data) {
    return <div className="text-center py-16 text-muted-foreground">Failed to load dashboard.</div>
  }

  const stats = [
    { label: 'Total Revenue', value: data.total_revenue, prefix: '₹', icon: IndianRupee, color: 'text-primary', bg: 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-500/10 dark:to-orange-500/5', borderColor: 'border-orange-200 dark:border-orange-500/20', sub: `Today: ${formatCurrency(data.today_revenue)}` },
    { label: "Today's Orders", value: data.today_orders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-500/10 dark:to-blue-500/5', borderColor: 'border-blue-200 dark:border-blue-500/20', sub: `${data.total_orders} total` },
    { label: 'Total Users', value: data.total_users, icon: Users, color: 'text-emerald-600', bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-500/10 dark:to-emerald-500/5', borderColor: 'border-emerald-200 dark:border-emerald-500/20' },
    { label: 'Active Sellers', value: `${data.approved_sellers}/${data.total_sellers}`, icon: Store, color: 'text-violet-600', bg: 'bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-500/10 dark:to-violet-500/5', borderColor: 'border-violet-200 dark:border-violet-500/20', sub: `${data.pending_sellers} pending` },
    { label: 'Active Subs', value: data.active_subscriptions, icon: CalendarCheck, color: 'text-pink-600', bg: 'bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-500/10 dark:to-pink-500/5', borderColor: 'border-pink-200 dark:border-pink-500/20', sub: `${data.total_subscriptions} total` },
  ]

  const chartData = (data.revenue_trend || []).map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    Revenue: d.revenue,
    Orders: d.count,
  }))

  const BAR_COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#6b7280']

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" /> Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">Platform overview & analytics</p>
        </div>
        <Link
          to="/admin/reports"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          View Reports <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`${stat.bg} rounded-2xl border ${stat.borderColor} p-5 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</span>
              <div className={`h-9 w-9 rounded-xl bg-white/80 dark:bg-white/10 flex items-center justify-center shadow-sm`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold">
              {typeof stat.value === 'number' ? (
                <AnimatedStat value={stat.value} prefix={stat.prefix || ''} />
              ) : (
                stat.value
              )}
            </div>
            {stat.sub && <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Revenue Area Chart */}
          <div className={`lg:col-span-2 bg-card rounded-2xl border border-border p-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '400ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Revenue Trend</h2>
                <p className="text-xs text-muted-foreground">Last 7 days performance</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-orange-400" /> Revenue</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blue-400" /> Orders</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Revenue" stroke="#f97316" strokeWidth={2.5} fill="url(#revGrad)" animationDuration={1500} />
                <Area type="monotone" dataKey="Orders" stroke="#3b82f6" strokeWidth={2} fill="url(#ordGrad)" animationDuration={1500} animationBegin={300} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Orders Bar Chart */}
          <div className={`bg-card rounded-2xl border border-border p-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '500ms' }}>
            <h2 className="text-lg font-semibold mb-1">Daily Orders</h2>
            <p className="text-xs text-muted-foreground mb-4">Last 7 days</p>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Orders" radius={[6, 6, 0, 0]} animationDuration={1200}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Bottom Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Sellers */}
        <div className={`bg-card rounded-2xl border border-border p-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '600ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Store className="h-5 w-5 text-amber-500" /> Pending Approvals
            </h2>
            {data.pending_sellers > 0 && (
              <Link to="/admin/sellers" className="text-sm text-primary hover:underline flex items-center gap-1">
                View All <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>
          {(data.pending_seller_list || []).length === 0 ? (
            <div className="text-center py-8">
              <Store className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.pending_seller_list.map((seller, i) => (
                <div
                  key={seller.id}
                  className={`flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-500 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                  style={{ transitionDelay: `${700 + i * 100}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold text-sm">
                      {seller.kitchen_name?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{seller.kitchen_name}</p>
                      <p className="text-xs text-muted-foreground">{seller.user__full_name} &bull; {seller.city}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                    <AlertCircle className="h-3 w-3" /> Pending
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className={`bg-card rounded-2xl border border-border p-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '700ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-blue-500" /> Recent Orders
            </h2>
            <Link to="/admin/orders" className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {(data.recent_orders || []).length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No recent orders</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recent_orders.map((order, i) => (
                <div
                  key={order.id}
                  className={`flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-500 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
                  style={{ transitionDelay: `${700 + i * 100}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-600 dark:bg-green-500/10' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/10' :
                      'bg-blue-100 text-blue-600 dark:bg-blue-500/10'
                    }`}>
                      {order.order_id?.slice(-4)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{order.order_id}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.customer__full_name} &rarr; {order.seller__kitchen_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                      {order.status?.replace('_', ' ')}
                    </span>
                    <p className="text-sm font-semibold mt-0.5">{formatCurrency(order.total_amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '900ms' }}>
        {[
          { label: 'Manage Sellers', to: '/admin/sellers', icon: Store, color: 'text-green-600' },
          { label: 'Manage Users', to: '/admin/users', icon: Users, color: 'text-blue-600' },
          { label: 'View Reports', to: '/admin/reports', icon: TrendingUp, color: 'text-purple-600' },
          { label: 'Messages', to: '/admin/contacts', icon: MessageSquare, color: 'text-orange-600' },
        ].map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <action.icon className={`h-5 w-5 ${action.color}`} />
            <span className="text-sm font-medium">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
