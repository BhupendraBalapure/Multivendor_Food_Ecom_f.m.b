import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { clearCart, selectCartTotal } from '@/store/slices/cartSlice'
import addressApi from '@/api/addressApi'
import orderApi from '@/api/orderApi'
import paymentApi from '@/api/paymentApi'
import { formatCurrency } from '@/utils/formatters'
import { MapPin, CreditCard, Wallet, Banknote, Loader2, Plus, Check } from 'lucide-react'

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID

export default function Checkout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { items, sellerId, sellerName } = useSelector((state) => state.cart)
  const { user } = useSelector((state) => state.auth)
  const subtotal = useSelector(selectCartTotal)
  const FREE_DELIVERY_THRESHOLD = 200
  const DELIVERY_FEE = 40
  const deliveryFee = subtotal < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0
  const total = subtotal + deliveryFee

  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('online')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // New address form
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [newAddress, setNewAddress] = useState({
    full_address: '', landmark: '', city: '', state: '', pincode: '', address_type: 'home',
  })

  useEffect(() => {
    if (items.length === 0) {
      navigate('/customer/cart')
      return
    }
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    try {
      const res = await addressApi.getAll()
      const list = res.data.results || res.data
      setAddresses(list)
      const def = list.find((a) => a.is_default) || list[0]
      if (def) setSelectedAddress(def.id)
    } catch (err) {
      console.error('Failed to fetch addresses:', err)
    }
  }

  const handleAddAddress = async () => {
    try {
      const res = await addressApi.create(newAddress)
      const addr = res.data
      setAddresses([...addresses, addr])
      setSelectedAddress(addr.id)
      setShowAddressForm(false)
      setNewAddress({ full_address: '', landmark: '', city: '', state: '', pincode: '', address_type: 'home' })
    } catch (err) {
      console.error('Failed to add address:', err)
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

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setError('Please select a delivery address.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 1. Create order
      const orderRes = await orderApi.createOrder({
        seller_id: sellerId,
        address_id: selectedAddress,
        payment_method: paymentMethod,
        special_instructions: specialInstructions,
        items: items.map((item) => ({
          menu_item_id: item.id,
          quantity: item.quantity,
        })),
      })

      const order = orderRes.data

      // 2. Handle payment
      if (paymentMethod === 'online') {
        // Create Razorpay order
        const payRes = await paymentApi.createRazorpayOrder({
          amount: order.total_amount,
          payment_for: 'order',
          order_id: order.id,
        })

        const loaded = await loadRazorpay()
        if (!loaded) {
          setError('Failed to load payment gateway.')
          setLoading(false)
          return
        }

        const options = {
          key: RAZORPAY_KEY_ID,
          amount: payRes.data.amount,
          currency: payRes.data.currency,
          name: 'MealsOnTime',
          description: `Order #${order.order_id}`,
          order_id: payRes.data.razorpay_order_id,
          handler: async (response) => {
            try {
              await paymentApi.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
              dispatch(clearCart())
              navigate(`/customer/orders/${order.id}`)
            } catch (err) {
              setError('Payment verification failed. Contact support.')
              setLoading(false)
            }
          },
          prefill: {
            name: user?.full_name,
            email: user?.email,
            contact: user?.phone,
          },
          modal: {
            ondismiss: () => setLoading(false),
          },
          theme: { color: '#f97316' },
        }

        const rzp = new window.Razorpay(options)
        rzp.open()
        return // Don't clear loading yet - Razorpay modal is open
      }

      // Wallet / COD - order already placed
      dispatch(clearCart())
      navigate(`/customer/orders/${order.id}`)
    } catch (err) {
      const errData = err.response?.data
      setError(errData?.detail || 'Failed to place order. Please try again.')
    } finally {
      if (paymentMethod !== 'online') setLoading(false)
    }
  }

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Checkout</h1>
      <p className="text-muted-foreground mb-6">
        Ordering from <span className="font-medium text-foreground">{sellerName}</span>
      </p>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-6">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Address */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Delivery Address
            </h3>

            {addresses.length === 0 && !showAddressForm ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-3">No addresses saved.</p>
                <button onClick={() => setShowAddressForm(true)} className="text-primary text-sm font-medium hover:underline">
                  Add Address
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedAddress === addr.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddress === addr.id}
                      onChange={() => setSelectedAddress(addr.id)}
                      className="mt-1"
                    />
                    <div>
                      <span className="text-xs font-medium uppercase text-primary">{addr.address_type}</span>
                      <p className="text-sm mt-0.5">{addr.full_address}</p>
                      {addr.landmark && <p className="text-xs text-muted-foreground">{addr.landmark}</p>}
                      <p className="text-xs text-muted-foreground">{addr.city}, {addr.state} - {addr.pincode}</p>
                    </div>
                  </label>
                ))}

                {!showAddressForm && (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="flex items-center gap-1 text-sm text-primary font-medium hover:underline"
                  >
                    <Plus className="h-4 w-4" /> Add New Address
                  </button>
                )}
              </div>
            )}

            {/* New Address Form */}
            {showAddressForm && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Address *</label>
                  <textarea
                    value={newAddress.full_address}
                    onChange={(e) => setNewAddress({ ...newAddress, full_address: e.target.value })}
                    rows={2} className={inputClass + " resize-none"} placeholder="Street, area, locality"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">City *</label>
                    <input value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Pincode *</label>
                    <input value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">State</label>
                    <input value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Landmark</label>
                    <input value={newAddress.landmark} onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div className="flex gap-2">
                  {['home', 'work', 'other'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setNewAddress({ ...newAddress, address_type: t })}
                      className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        newAddress.address_type === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={handleAddAddress} disabled={!newAddress.full_address || !newAddress.city || !newAddress.pincode}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                  >
                    Save Address
                  </button>
                  <button onClick={() => setShowAddressForm(false)} className="px-4 py-2 text-sm text-muted-foreground">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" /> Payment Method
            </h3>
            <div className="space-y-3">
              {[
                { value: 'online', label: 'Pay Online', desc: 'UPI, Cards, Net Banking via Razorpay', icon: CreditCard },
                { value: 'wallet', label: 'Wallet', desc: `Balance: ${formatCurrency(user?.wallet_balance || 0)}`, icon: Wallet },
                { value: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive', icon: Banknote },
              ].map((method) => (
                <label
                  key={method.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    paymentMethod === method.value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <method.icon className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{method.label}</p>
                    <p className="text-xs text-muted-foreground">{method.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Special Instructions */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold mb-3">Special Instructions</h3>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={2}
              className={inputClass + " resize-none"}
              placeholder="Any special requests? (e.g. less spicy, no onion)"
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-card rounded-xl border border-border p-6 h-fit sticky top-24">
          <h3 className="font-semibold mb-4">Order Summary</h3>

          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                <span>{formatCurrency((item.discounted_price || item.price) * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery Fee</span>
              {deliveryFee > 0 ? (
                <span>{formatCurrency(deliveryFee)}</span>
              ) : (
                <span className="text-green-600">Free</span>
              )}
            </div>
            {deliveryFee > 0 && (
              <p className="text-xs text-muted-foreground">Add {formatCurrency(FREE_DELIVERY_THRESHOLD - subtotal)} more for free delivery</p>
            )}
          </div>

          <div className="border-t border-border mt-3 pt-3 flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={loading || !selectedAddress}
            className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
            ) : (
              <><Check className="h-4 w-4" /> Place Order - {formatCurrency(total)}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
