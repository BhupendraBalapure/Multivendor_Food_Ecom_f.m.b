import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import sellerApi from '@/api/sellerApi'
import { formatCurrency, formatTimeAgo } from '@/utils/formatters'
import {
  ClipboardList, CalendarCheck, Wallet, TrendingUp,
  Loader2, ChevronRight, AlertCircle, Wifi, WifiOff
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

export default function SellerDashboard() {
  const { user } = useSelector((state) => state.auth)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const res = await sellerApi.getDashboard()
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
    { label: "Today's Orders", value: data?.today_orders_count || 0, sub: `${data?.today_pending || 0} pending`, icon: ClipboardList, color: 'text-primary', bg: 'bg-primary/5', link: '/seller/orders' },
    { label: 'Active Subscribers', value: data?.active_subscribers || 0, icon: CalendarCheck, color: 'text-green-600', bg: 'bg-green-50', link: '/seller/subscriptions' },
    { label: "Today's Earnings", value: formatCurrency(data?.today_earnings || 0), icon: Wallet, color: 'text-orange-600', bg: 'bg-orange-50', link: '/seller/earnings' },
    { label: 'Total Earnings', value: formatCurrency(data?.total_earnings || 0), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', link: '/seller/earnings' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Welcome, {user?.full_name}!</h1>
        {data && (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
            data.is_online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {data.is_online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {data.is_online ? 'Online' : 'Offline'}
          </div>
        )}
      </div>
      <p className="text-muted-foreground mb-6">Here's your kitchen overview</p>

      {/* Approval Warning */}
      {data?.approval_status && data.approval_status !== 'approved' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              {data.approval_status === 'pending' && 'Your profile is pending approval'}
              {data.approval_status === 'rejected' && 'Your profile was rejected'}
              {data.approval_status === 'suspended' && 'Your account is suspended'}
            </p>
            <p className="text-xs text-yellow-600 mt-0.5">
              {data.approval_status === 'pending' && 'An admin will review your profile soon. You can start setting up your menu in the meantime.'}
              {data.approval_status === 'rejected' && 'Please update your profile and resubmit for approval.'}
              {data.approval_status === 'suspended' && 'Contact support for more information.'}
            </p>
          </div>
        </div>
      )}

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
            {stat.sub && <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>}
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <Link to="/seller/orders" className="text-sm text-primary hover:underline flex items-center gap-1">
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        {(data?.recent_orders || []).length === 0 ? (
          <div className="text-center py-8">
            <ClipboardList className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No orders yet.</p>
            <Link to="/seller/menu" className="text-primary text-sm font-medium hover:underline mt-1 inline-block">Add Menu Items</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {data.recent_orders.map((order) => (
              <Link key={order.id} to={`/seller/orders`} className="flex items-center justify-between hover:bg-muted/30 rounded-lg p-2 -mx-2 transition-colors">
                <div>
                  <p className="text-sm font-medium">{order.order_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.customer__full_name} &bull; {formatTimeAgo(order.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                    {order.status?.replace('_', ' ')}
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
