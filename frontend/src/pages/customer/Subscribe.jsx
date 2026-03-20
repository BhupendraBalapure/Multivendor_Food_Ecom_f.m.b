import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import menuApi from '@/api/menuApi'
import addressApi from '@/api/addressApi'
import subscriptionApi from '@/api/subscriptionApi'
import paymentApi from '@/api/paymentApi'
import { formatCurrency } from '@/utils/formatters'
import { Loader2, MapPin, CreditCard, Wallet, CalendarCheck, Plus, Check, ArrowLeft } from 'lucide-react'

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID

export default function Subscribe() {
  const { planId } = useParams()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  const [plan, setPlan] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('online')
  const [startDate, setStartDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPlan()
    fetchAddresses()
    // Default start date = tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setStartDate(tomorrow.toISOString().split('T')[0])
  }, [planId])

  const fetchPlan = async () => {
    try {
      const res = await menuApi.getPlanDetail(planId)
      setPlan(res.data)
    } catch (err) {
      setError('Plan not found.')
    } finally {
      setLoading(false)
    }
  }

  const fetchAddresses = async () => {
    try {
      const res = await addressApi.getAll()
      const list = res.data.results || res.data
      setAddresses(list)
      const def = list.find((a) => a.is_default) || list[0]
      if (def) setSelectedAddress(def.id)
    } catch (err) {
      console.error(err)
    }
  }

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true)
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleSubscribe = async () => {
    if (!selectedAddress) {
      setError('Please select a delivery address.')
      return
    }
    setSubmitting(true)
    setError('')

    try {
      if (paymentMethod === 'online') {
        // Pay first, then subscribe
        const payRes = await paymentApi.createRazorpayOrder({
          amount: plan.price,
          payment_for: 'subscription',
        })

        const loaded = await loadRazorpay()
        if (!loaded) { setError('Failed to load payment.'); setSubmitting(false); return }

        const options = {
          key: RAZORPAY_KEY_ID,
          amount: payRes.data.amount,
          currency: 'INR',
          name: 'MealsOnTime',
          description: `Subscription: ${plan.name}`,
          order_id: payRes.data.razorpay_order_id,
          handler: async (response) => {
            try {
              await paymentApi.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
              // Now create subscription with wallet (money added to wallet after verification)
              const subRes = await subscriptionApi.subscribe({
                plan_id: Number(planId),
                address_id: selectedAddress,
                payment_method: 'online',
                start_date: startDate,
              })
              navigate(`/customer/subscriptions/${subRes.data.id}`)
            } catch (err) {
              setError('Payment/subscription failed. Contact support.')
              setSubmitting(false)
            }
          },
          prefill: { name: user?.full_name, email: user?.email, contact: user?.phone },
          modal: { ondismiss: () => setSubmitting(false) },
          theme: { color: '#f97316' },
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
        return
      }

      // Wallet payment
      const res = await subscriptionApi.subscribe({
        plan_id: Number(planId),
        address_id: selectedAddress,
        payment_method: paymentMethod,
        start_date: startDate,
      })
      navigate(`/customer/subscriptions/${res.data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to subscribe.')
    } finally {
      if (paymentMethod !== 'online') setSubmitting(false)
    }
  }

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  }

  if (!plan) {
    return <div className="text-center py-16 text-muted-foreground">Plan not found.</div>
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="text-2xl font-bold mb-1">Subscribe to Plan</h1>
      <p className="text-muted-foreground mb-6">Complete your subscription setup</p>

      {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-6">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Start Date */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" /> Start Date
            </h3>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
              className={inputClass + " max-w-xs"}
            />
            <p className="text-xs text-muted-foreground mt-2">Subscription starts from this date. Must be at least tomorrow.</p>
          </div>

          {/* Address */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Delivery Address
            </h3>
            {addresses.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No addresses saved.{' '}
                <button onClick={() => navigate('/customer/addresses')} className="text-primary hover:underline">Add one</button>
              </p>
            ) : (
              <div className="space-y-2">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${
                      selectedAddress === addr.id ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <input type="radio" checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} className="mt-1" />
                    <div>
                      <span className="text-xs font-medium uppercase text-primary">{addr.address_type}</span>
                      <p className="text-sm">{addr.full_address}</p>
                      <p className="text-xs text-muted-foreground">{addr.city} - {addr.pincode}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" /> Payment Method
            </h3>
            <div className="space-y-2">
              {[
                { value: 'online', label: 'Pay Online (Razorpay)', icon: CreditCard },
                { value: 'wallet', label: 'Pay from Wallet', icon: Wallet },
              ].map((m) => (
                <label key={m.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                  paymentMethod === m.value ? 'border-primary bg-primary/5' : 'border-border'
                }`}>
                  <input type="radio" checked={paymentMethod === m.value} onChange={() => setPaymentMethod(m.value)} />
                  <m.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{m.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Plan Summary */}
        <div className="bg-card rounded-xl border border-border p-6 h-fit sticky top-24">
          <h3 className="font-semibold mb-4">Plan Summary</h3>
          <div className="mb-4">
            <p className="font-medium text-lg">{plan.name}</p>
            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize mt-1">
              {plan.plan_type.replace('_', ' ')}
            </span>
            <p className="text-sm text-muted-foreground mt-2">{plan.seller_name}</p>
          </div>

          <div className="space-y-2 text-sm border-t border-border pt-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span>{plan.duration_days} days</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Daily price</span><span>{formatCurrency(plan.daily_price)}/day</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Weekends</span><span>{plan.includes_weekends ? 'Included' : 'Excluded'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Max skips</span><span>{plan.max_skips_allowed}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Max pauses</span><span>{plan.max_pauses_allowed}</span></div>
          </div>

          <div className="border-t border-border mt-3 pt-3 flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>{formatCurrency(plan.price)}</span>
          </div>

          <button
            onClick={handleSubscribe}
            disabled={submitting || !selectedAddress}
            className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : <><Check className="h-4 w-4" /> Subscribe Now</>}
          </button>
        </div>
      </div>
    </div>
  )
}
