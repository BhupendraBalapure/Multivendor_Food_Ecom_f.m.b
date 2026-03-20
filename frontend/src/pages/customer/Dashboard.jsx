import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import orderApi from '@/api/orderApi'
import { formatCurrency } from '@/utils/formatters'
import {
  ShoppingBag, CalendarCheck, Wallet, UtensilsCrossed,
  Loader2, ChevronRight
} from 'lucide-react'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  out_for_delivery: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
}

export default function CustomerDashboard() {
  const { user } = useSelector((state) => state.auth)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const res = await orderApi.getDashboard()
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

  const stats = [
    { label: 'Active Orders', value: data?.active_orders || 0, icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/5', link: '/customer/orders' },
    { label: 'Subscriptions', value: data?.active_subscriptions || 0, icon: CalendarCheck, color: 'text-green-600', bg: 'bg-green-50', link: '/customer/subscriptions' },
    { label: 'Wallet Balance', value: formatCurrency(data?.wallet_balance || 0), icon: Wallet, color: 'text-orange-600', bg: 'bg-orange-50', link: '/customer/wallet' },
    { label: 'Total Orders', value: data?.total_orders || 0, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50', link: '/customer/orders' },
  ]

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Welcome, {user?.full_name}!</h1>
      <p className="text-muted-foreground mb-6">Here's your meal overview</p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.link} className="bg-card rounded-xl border border-border p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <div className={`h-9 w-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
          </Link>
        ))}
      </div>

      {/* Today's Meals */}
      {(data?.todays_meals || []).length > 0 && (
        <div className="bg-gradient-to-r from-primary/5 to-orange-50 rounded-xl border border-primary/20 p-5 mb-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-primary" /> Today's Meals
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.todays_meals.map((meal, i) => (
              <div key={i} className="bg-card rounded-lg p-3 border border-border">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium capitalize">{meal.meal_type}</p>
                    <p className="text-xs text-muted-foreground">{meal.subscription__seller__kitchen_name}</p>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    meal.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    meal.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {meal.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <Link to="/customer/orders" className="text-sm text-primary hover:underline flex items-center gap-1">
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        {(data?.recent_orders || []).length === 0 ? (
          <div className="text-center py-8">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No orders yet.</p>
            <Link to="/vendors" className="text-primary text-sm font-medium hover:underline mt-1 inline-block">Browse Vendors</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {data.recent_orders.map((order) => (
              <Link key={order.id} to={`/customer/orders/${order.id}`} className="flex items-center justify-between hover:bg-muted/30 rounded-lg p-2 -mx-2 transition-colors">
                <div>
                  <p className="text-sm font-medium">{order.order_id}</p>
                  <p className="text-xs text-muted-foreground">{order.seller__kitchen_name} &bull; {formatDate(order.created_at)}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                    {order.status}
                  </span>
                  <p className="text-xs font-medium mt-0.5">{formatCurrency(order.total_amount)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
