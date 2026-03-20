import { useState, useEffect } from 'react'
import adminApi from '@/api/adminApi'
import { formatCurrency } from '@/utils/formatters'
import { Loader2, TrendingUp, ShoppingBag, Users, CalendarCheck } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const PERIOD_OPTIONS = [
  { value: 7, label: '7 Days' },
  { value: 14, label: '14 Days' },
  { value: 30, label: '30 Days' },
  { value: 90, label: '90 Days' },
]

const PIE_COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#6b7280', '#f59e0b']

export default function Reports() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    fetchReports()
  }, [days])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getReports({ days })
      setData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  }

  if (!data) {
    return <div className="text-center py-16 text-muted-foreground">Failed to load reports.</div>
  }

  const revenueData = (data.revenue_by_day || []).map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    revenue: d.revenue,
    orders: d.orders,
  }))

  const orderStatusData = (data.orders_by_status || []).map((d) => ({
    name: d.status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value: d.count,
  }))

  const paymentMethodData = (data.orders_by_payment || []).map((d) => ({
    name: d.payment_method.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value: d.count,
  }))

  const subStatusData = (data.subs_by_status || []).map((d) => ({
    name: d.status.charAt(0).toUpperCase() + d.status.slice(1),
    value: d.count,
  }))

  const usersData = (data.users_by_day || []).map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    users: d.count,
  }))

  const summary = data.summary || {}

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground text-sm">Analytics and insights</p>
        </div>
        <div className="flex gap-1.5">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p.value}
              onClick={() => setDays(p.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                days === p.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Revenue', value: formatCurrency(summary.revenue || 0), icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/5' },
          { label: 'Orders', value: summary.orders || 0, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'New Users', value: summary.new_users || 0, icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'New Subs', value: summary.new_subscriptions || 0, icon: CalendarCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <div className={`h-8 w-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">Last {days} days</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      {revenueData.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip formatter={(value, name) => [name === 'revenue' ? `₹${value}` : value, name === 'revenue' ? 'Revenue' : 'Orders']} />
              <Legend />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#f97316" fill="#f97316" fillOpacity={0.1} strokeWidth={2} />
              <Area type="monotone" dataKey="orders" name="Orders" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Orders by Status */}
        {orderStatusData.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Orders by Status</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={orderStatusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {orderStatusData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Payment Methods */}
        {paymentMethodData.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Payment Methods</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={paymentMethodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                <Tooltip />
                <Bar dataKey="value" name="Orders" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Subscription Status */}
        {subStatusData.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Subscriptions by Status</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={subStatusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {subStatusData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* New Users */}
        {usersData.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">New User Registrations</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={usersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="users" name="New Users" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Sellers */}
      {(data.top_sellers || []).length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Top Sellers by Revenue</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2 font-medium">#</th>
                  <th className="text-left px-4 py-2 font-medium">Kitchen</th>
                  <th className="text-left px-4 py-2 font-medium">Orders</th>
                  <th className="text-left px-4 py-2 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.top_sellers.map((seller, i) => (
                  <tr key={seller.seller__id} className="hover:bg-muted/20">
                    <td className="px-4 py-2 font-medium text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-2 font-medium">{seller.seller__kitchen_name}</td>
                    <td className="px-4 py-2">{seller.orders}</td>
                    <td className="px-4 py-2 font-medium text-primary">{formatCurrency(seller.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
