import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { addToCart, clearCart } from '@/store/slices/cartSlice'
import orderApi from '@/api/orderApi'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import {
  Loader2, MapPin, Clock, Phone, ArrowLeft, X,
  CheckCircle2, Circle, ChefHat, Truck, Package, RefreshCw, Star
} from 'lucide-react'
import { toast } from 'sonner'
import { mediaUrl } from '@/utils/constants'
import ConfirmDialog from '@/components/common/ConfirmDialog'

const STATUS_STEPS = ['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered']

const STATUS_ICONS = {
  pending: Clock,
  accepted: CheckCircle2,
  preparing: ChefHat,
  out_for_delivery: Truck,
  delivered: Package,
}

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewHover, setReviewHover] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  useEffect(() => {
    fetchOrder()
  }, [id])

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const res = await orderApi.getOrderDetail(id)
      setOrder(res.data)
    } catch (err) {
      console.error('Failed to fetch order:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleReorder = () => {
    if (!order) return
    dispatch(clearCart())
    const seller = { id: order.seller_id, kitchen_name: order.seller_name }
    for (const item of order.items) {
      for (let i = 0; i < item.quantity; i++) {
        dispatch(addToCart({
          item: {
            id: item.menu_item,
            name: item.item_name,
            price: parseFloat(item.item_price),
          },
          seller,
        }))
      }
    }
    toast.success('Items added to cart!')
    navigate('/customer/cart')
  }

  const handleSubmitReview = async () => {
    if (reviewRating < 1) {
      toast.error('Please select a rating')
      return
    }
    setSubmittingReview(true)
    try {
      await orderApi.submitReview(id, { rating: reviewRating, comment: reviewComment })
      toast.success('Review submitted!')
      fetchOrder()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await orderApi.cancelOrder(id, 'Cancelled by customer')
      fetchOrder()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to cancel order.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!order) {
    return <div className="text-center py-16 text-muted-foreground">Order not found.</div>
  }

  const isCancellable = ['pending', 'accepted'].includes(order.status)
  const isFinal = ['delivered', 'cancelled', 'rejected'].includes(order.status)
  const currentStepIndex = STATUS_STEPS.indexOf(order.status)

  const STATUS_MSG = {
    pending: { emoji: '🕐', title: 'Order Submitted!', desc: 'Your order has been placed. Waiting for the kitchen to accept it.', color: 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 border-orange-200 dark:border-orange-800/40' },
    accepted: { emoji: '✅', title: 'Order Accepted!', desc: 'Great news! The kitchen has accepted your order and will start preparing it soon.', color: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800/40' },
    preparing: { emoji: '👨‍🍳', title: 'Being Prepared', desc: 'Your food is being freshly prepared by the kitchen. Hang tight!', color: 'from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800/40' },
    out_for_delivery: { emoji: '🚀', title: 'On the Way!', desc: 'Your order is out for delivery. It will reach you shortly!', color: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border-green-200 dark:border-green-800/40' },
    delivered: { emoji: '🎉', title: 'Delivered!', desc: 'Your order has been delivered. Enjoy your meal!', color: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border-green-200 dark:border-green-800/40' },
    cancelled: { emoji: '❌', title: 'Order Cancelled', desc: order.cancellation_reason ? `Reason: ${order.cancellation_reason}` : 'This order has been cancelled.', color: 'from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/20 border-gray-200 dark:border-gray-700' },
    rejected: { emoji: '🚫', title: 'Order Rejected', desc: order.rejection_reason ? `Reason: ${order.rejection_reason}` : 'This order was rejected by the kitchen.', color: 'from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/20 border-red-200 dark:border-red-800/40' },
  }

  const statusInfo = STATUS_MSG[order.status] || STATUS_MSG.pending

  return (
    <div>
      <Link to="/customer/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.order_id}</h1>
          <p className="text-muted-foreground text-sm">{formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex gap-2">
          {order.status === 'delivered' && (
            <button
              onClick={handleReorder}
              className="flex items-center gap-1 px-4 py-2 text-sm text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
            >
              <RefreshCw className="h-4 w-4" /> Reorder
            </button>
          )}
          {isCancellable && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              disabled={cancelling}
              className="flex items-center gap-1 px-4 py-2 text-sm text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 disabled:opacity-50 transition-colors"
            >
              <X className="h-4 w-4" /> Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Status Message Banner */}
      <div className={`bg-gradient-to-r ${statusInfo.color} border rounded-xl p-4 mb-6 flex items-center gap-4`}>
        <span className="text-3xl shrink-0">{statusInfo.emoji}</span>
        <div>
          <h3 className="font-semibold text-foreground">{statusInfo.title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{statusInfo.desc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Status Timeline */}
          {!isFinal && order.status !== 'rejected' && order.status !== 'cancelled' && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold mb-4">Order Status</h3>
              <div className="flex items-center justify-between">
                {STATUS_STEPS.map((step, i) => {
                  const Icon = STATUS_ICONS[step]
                  const isActive = i <= currentStepIndex
                  return (
                    <div key={step} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className={`text-xs mt-1.5 capitalize ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                          {step.replace('_', ' ')}
                        </span>
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 ${i < currentStepIndex ? 'bg-primary' : 'bg-muted'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold mb-4">Items Ordered</h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{item.item_name}</span>
                    <span className="text-sm text-muted-foreground ml-2">x{item.quantity}</span>
                  </div>
                  <span>{formatCurrency(item.total_price)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border mt-4 pt-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.delivery_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span>{formatCurrency(order.delivery_fee)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base pt-1.5 border-t border-border">
                <span>Total</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Status History */}
          {order.status_history && order.status_history.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold mb-4">Status History</h3>
              <div className="space-y-3">
                {order.status_history.map((h) => (
                  <div key={h.id} className="flex items-start gap-3">
                    <Circle className="h-2 w-2 mt-2 shrink-0 text-primary fill-primary" />
                    <div>
                      <p className="text-sm">
                        <span className="capitalize">{h.from_status.replace('_', ' ')}</span>
                        {' → '}
                        <span className="font-medium capitalize">{h.to_status.replace('_', ' ')}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(h.created_at)}</p>
                      {h.note && <p className="text-xs text-muted-foreground">{h.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Section */}
          {order.status === 'delivered' && (
            <div className="bg-card rounded-xl border border-border p-6">
              {order.has_review && order.review ? (
                <>
                  <h3 className="font-semibold mb-3">Your Review</h3>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${star <= order.review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">{order.review.rating}/5</span>
                  </div>
                  {order.review.comment && (
                    <p className="text-sm text-muted-foreground">{order.review.comment}</p>
                  )}
                </>
              ) : (
                <>
                  <h3 className="font-semibold mb-3">Rate Your Order</h3>
                  <p className="text-sm text-muted-foreground mb-3">How was your meal? Your feedback helps the kitchen improve.</p>
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setReviewHover(star)}
                        onMouseLeave={() => setReviewHover(0)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-7 w-7 transition-colors ${
                            star <= (reviewHover || reviewRating)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      </button>
                    ))}
                    {reviewRating > 0 && (
                      <span className="ml-2 text-sm font-medium">{reviewRating}/5</span>
                    )}
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Write a comment (optional)..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none text-sm mb-3"
                  />
                  <button
                    onClick={handleSubmitReview}
                    disabled={submittingReview || reviewRating < 1}
                    className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
                  >
                    {submittingReview && <Loader2 className="h-4 w-4 animate-spin" />}
                    Submit Review
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Seller Info */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-3">Kitchen</h3>
            <Link to={`/vendors/${order.seller_slug}`} className="flex items-center gap-3 hover:text-primary transition-colors">
              {order.seller_logo ? (
                <img src={mediaUrl(order.seller_logo)} alt="" className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ChefHat className="h-5 w-5 text-primary" />
                </div>
              )}
              <span className="font-medium">{order.seller_name}</span>
            </Link>
            {order.seller_phone && (
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> {order.seller_phone}
              </p>
            )}
          </div>

          {/* Delivery Address */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Delivery Address
            </h3>
            <p className="text-sm">{order.delivery_address_snapshot?.full_address}</p>
            {order.delivery_address_snapshot?.landmark && (
              <p className="text-xs text-muted-foreground mt-1">{order.delivery_address_snapshot.landmark}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {order.delivery_address_snapshot?.city}, {order.delivery_address_snapshot?.state} - {order.delivery_address_snapshot?.pincode}
            </p>
          </div>

          {/* Payment Info */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-3">Payment</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="capitalize">{order.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={order.is_paid ? 'text-green-600 font-medium' : 'text-yellow-600'}>
                  {order.is_paid ? 'Paid' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {order.special_instructions && (
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold mb-2">Special Instructions</h3>
              <p className="text-sm text-muted-foreground">{order.special_instructions}</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancel}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? If paid via wallet, the amount will be refunded."
        confirmText="Yes, Cancel"
        variant="danger"
      />
    </div>
  )
}
