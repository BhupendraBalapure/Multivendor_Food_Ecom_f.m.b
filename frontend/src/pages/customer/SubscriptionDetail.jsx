import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import subscriptionApi from '@/api/subscriptionApi'
import { formatCurrency, formatDate } from '@/utils/formatters'
import {
  Loader2, ArrowLeft, Pause, Play, X, SkipForward,
  CalendarCheck, ChefHat, MapPin
} from 'lucide-react'
import ConfirmDialog from '@/components/common/ConfirmDialog'

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  expired: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}

const DAY_STATUS_COLORS = {
  generated: 'bg-blue-100 text-blue-700 border-blue-200',
  confirmed: 'bg-blue-200 text-blue-800 border-blue-300',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  skipped: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

export default function SubscriptionDetail() {
  const { id } = useParams()
  const [sub, setSub] = useState(null)
  const [calendar, setCalendar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [skipModal, setSkipModal] = useState({ open: false, date: '' })
  const [confirmAction, setConfirmAction] = useState(null) // 'pause' | 'cancel'

  useEffect(() => {
    fetchDetail()
    fetchCalendar()
  }, [id])

  const fetchDetail = async () => {
    setLoading(true)
    try {
      const res = await subscriptionApi.getSubscriptionDetail(id)
      setSub(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCalendar = async () => {
    try {
      const res = await subscriptionApi.getCalendar(id)
      setCalendar(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handlePause = async () => {
    setActionLoading(true)
    try {
      await subscriptionApi.pause(id)
      toast.success('Subscription paused.')
      fetchDetail()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to pause.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleResume = async () => {
    setActionLoading(true)
    try {
      await subscriptionApi.resume(id)
      toast.success('Subscription resumed.')
      fetchDetail()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to resume.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    setActionLoading(true)
    try {
      const res = await subscriptionApi.cancel(id)
      toast.success(res.data.detail)
      fetchDetail()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to cancel.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSkip = async () => {
    if (!skipModal.date) return
    setActionLoading(true)
    try {
      const res = await subscriptionApi.skipDate(id, { date: skipModal.date })
      toast.success(res.data.detail)
      setSkipModal({ open: false, date: '' })
      fetchDetail()
      fetchCalendar()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to skip.')
    } finally {
      setActionLoading(false)
    }
  }

  // Build calendar grid
  const buildCalendarDays = () => {
    if (!calendar || !sub) return []

    const start = new Date(sub.start_date)
    const end = new Date(sub.end_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const days = []
    const skipDates = new Set((calendar.skips || []).map((s) => s.skip_date))
    const orderMap = {}
    for (const o of (calendar.daily_orders || [])) {
      orderMap[o.date] = o.status
    }

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const isPast = d < today
      const isToday = d.getTime() === today.getTime()
      const isSkipped = skipDates.has(dateStr)
      const orderStatus = orderMap[dateStr]

      let status = 'upcoming'
      if (isSkipped) status = 'skipped'
      else if (orderStatus) status = orderStatus
      else if (isPast) status = 'no_order'

      days.push({
        date: dateStr,
        day: d.getDate(),
        dayName: d.toLocaleDateString('en', { weekday: 'short' }),
        status,
        isPast,
        isToday,
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      })
    }
    return days
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  }

  if (!sub) {
    return <div className="text-center py-16 text-muted-foreground">Subscription not found.</div>
  }

  const isActive = sub.status === 'active'
  const isPaused = sub.status === 'paused'
  const calendarDays = buildCalendarDays()

  return (
    <div>
      <Link to="/customer/subscriptions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Subscriptions
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{sub.plan_snapshot?.name || 'Subscription'}</h1>
          <p className="text-muted-foreground text-sm">{sub.subscription_id}</p>
        </div>
        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[sub.status]}`}>
          {sub.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Days Left', value: sub.remaining_days },
              { label: 'Skips Used', value: `${sub.skips_used}/${sub.max_skips}` },
              { label: 'Pauses Used', value: `${sub.pauses_used}/${sub.max_pauses}` },
              { label: 'Daily Price', value: formatCurrency(sub.plan_snapshot?.daily_price || 0) },
            ].map((stat) => (
              <div key={stat.label} className="bg-card rounded-xl border border-border p-4 text-center">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Calendar */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Delivery Calendar</h3>
              {isActive && sub.skips_used < sub.max_skips && (
                <button
                  onClick={() => setSkipModal({ open: true, date: '' })}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary border border-primary/30 rounded-lg hover:bg-primary/5"
                >
                  <SkipForward className="h-4 w-4" /> Skip a Day
                </button>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-4 text-xs">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-blue-200" /> Ordered</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-green-200" /> Delivered</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-yellow-200" /> Skipped</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-muted" /> Upcoming</span>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
              ))}

              {/* Pad first row */}
              {calendarDays.length > 0 && (() => {
                const firstDay = new Date(calendarDays[0].date).getDay()
                const offset = firstDay === 0 ? 6 : firstDay - 1 // Mon=0
                return Array(offset).fill(null).map((_, i) => <div key={`pad-${i}`} />)
              })()}

              {calendarDays.map((day) => {
                const colorClass = DAY_STATUS_COLORS[day.status] || 'bg-muted/50 text-muted-foreground border-border'
                return (
                  <div
                    key={day.date}
                    className={`text-center py-2 rounded-lg text-xs border ${colorClass} ${day.isToday ? 'ring-2 ring-primary' : ''} ${day.isWeekend ? 'opacity-70' : ''}`}
                    title={`${day.date}: ${day.status}`}
                  >
                    <span className="font-medium">{day.day}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          {(isActive || isPaused) && (
            <div className="flex flex-wrap gap-3">
              {isActive && (
                <button
                  onClick={() => setConfirmAction('pause')}
                  disabled={actionLoading || sub.pauses_used >= sub.max_pauses}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 disabled:opacity-50"
                >
                  <Pause className="h-4 w-4" /> Pause Subscription
                </button>
              )}
              {isPaused && (
                <button
                  onClick={handleResume}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-green-300 text-green-700 rounded-lg hover:bg-green-50 disabled:opacity-50"
                >
                  <Play className="h-4 w-4" /> Resume
                </button>
              )}
              <button
                onClick={() => setConfirmAction('cancel')}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-destructive/30 text-destructive rounded-lg hover:bg-destructive/5 disabled:opacity-50"
              >
                <X className="h-4 w-4" /> Cancel Subscription
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-3">Plan Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span>{sub.plan_snapshot?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="capitalize">{sub.plan_snapshot?.plan_type?.replace('_', ' ')}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span>{sub.total_days} days</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Period</span><span>{formatDate(sub.start_date)} - {formatDate(sub.end_date)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Paid</span><span className="font-medium">{formatCurrency(sub.total_amount)}</span></div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><ChefHat className="h-4 w-4 text-primary" /> Kitchen</h3>
            <Link to={`/vendors/${sub.seller_slug}`} className="font-medium text-sm hover:text-primary">{sub.seller_name}</Link>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmAction === 'pause'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handlePause}
        title="Pause Subscription"
        message="No meals will be delivered until you resume. Are you sure?"
        confirmText="Pause"
        variant="warning"
      />

      <ConfirmDialog
        open={confirmAction === 'cancel'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleCancel}
        title="Cancel Subscription"
        message="Remaining days will be refunded to your wallet. This cannot be undone."
        confirmText="Yes, Cancel"
        variant="danger"
      />

      {/* Skip Modal */}
      {skipModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-lg w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Skip a Day</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Select a future date to skip. ₹{sub.plan_snapshot?.daily_price} will be refunded to your wallet.
            </p>
            <input
              type="date"
              value={skipModal.date}
              onChange={(e) => setSkipModal({ ...skipModal, date: e.target.value })}
              min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
              max={sub.end_date}
              className="w-full px-3 py-2.5 rounded-lg border border-input text-sm mb-4"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setSkipModal({ open: false, date: '' })} className="px-4 py-2 text-sm text-muted-foreground">Cancel</button>
              <button onClick={handleSkip} disabled={!skipModal.date || actionLoading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
                Skip Day
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
