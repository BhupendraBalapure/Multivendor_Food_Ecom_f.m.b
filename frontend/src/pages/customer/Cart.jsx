import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { updateQuantity, removeFromCart, clearCart, selectCartTotal, selectCartItemCount } from '@/store/slices/cartSlice'
import { formatCurrency } from '@/utils/formatters'
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight, ImageIcon } from 'lucide-react'
import { mediaUrl } from '@/utils/constants'

export default function Cart() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { items, sellerName } = useSelector((state) => state.cart)
  const subtotal = useSelector(selectCartTotal)
  const itemCount = useSelector(selectCartItemCount)
  const FREE_DELIVERY_THRESHOLD = 200
  const DELIVERY_FEE = 40
  const deliveryFee = subtotal < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0
  const total = subtotal + deliveryFee

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Browse kitchens and add items to get started</p>
        <Link
          to="/vendors"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Browse Kitchens
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Your Cart</h1>
      <p className="text-muted-foreground mb-6">
        {itemCount} item{itemCount > 1 ? 's' : ''} from <span className="font-medium text-foreground">{sellerName}</span>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
              {item.image ? (
                <img src={mediaUrl(item.image)} alt="" className="h-16 w-16 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(item.discounted_price || item.price)} each
                </p>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))}
                  className="p-1 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                  className="p-1 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="text-right shrink-0">
                <p className="font-semibold">{formatCurrency((item.discounted_price || item.price) * item.quantity)}</p>
                <button
                  onClick={() => dispatch(removeFromCart(item.id))}
                  className="text-destructive text-xs hover:underline mt-1 inline-flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => dispatch(clearCart())}
            className="text-sm text-destructive hover:underline"
          >
            Clear Cart
          </button>
        </div>

        {/* Order Summary */}
        <div className="bg-card rounded-xl border border-border p-6 h-fit sticky top-24">
          <h3 className="font-semibold mb-4">Order Summary</h3>

          <div className="space-y-2 text-sm">
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

          <div className="border-t border-border mt-4 pt-4 flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-lg">{formatCurrency(total)}</span>
          </div>

          <button
            onClick={() => navigate('/customer/checkout')}
            className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Proceed to Checkout <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
