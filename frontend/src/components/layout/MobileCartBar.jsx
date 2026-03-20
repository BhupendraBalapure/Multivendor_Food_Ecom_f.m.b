import { Link, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { selectCartItemCount, selectCartTotal, updateQuantity, removeFromCart } from '@/store/slices/cartSlice'
import { formatCurrency } from '@/utils/formatters'
import { mediaUrl } from '@/utils/constants'
import { ShoppingBag, ArrowRight, Plus, Minus, Trash2, ChevronUp, X } from 'lucide-react'
import { useState } from 'react'

const HIDDEN_PATHS = ['/customer/cart', '/customer/checkout']

export default function MobileCartBar() {
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const cartItems = useSelector((state) => state.cart.items)
  const cartCount = useSelector(selectCartItemCount)
  const cartTotal = useSelector(selectCartTotal)
  const sellerName = useSelector((state) => state.cart.sellerName)
  const { pathname } = useLocation()
  const dispatch = useDispatch()
  const [expanded, setExpanded] = useState(false)

  if (!isAuthenticated || user?.role !== 'customer' || cartCount === 0) return null
  if (HIDDEN_PATHS.includes(pathname)) return null

  return (
    <>
      {/* Backdrop */}
      {expanded && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setExpanded(false)} />
      )}

      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden px-3 pb-1.5">
        {/* Expanded items list */}
        {expanded && (
          <div className="bg-white dark:bg-zinc-800 border border-orange-200 dark:border-zinc-700 rounded-t-xl mb-[-2px] shadow-xl max-h-60 overflow-y-auto">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground">{sellerName}</p>
              <button onClick={() => setExpanded(false)} className="p-0.5 text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="divide-y divide-border">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2.5 px-3 py-2">
                  <div className="h-9 w-9 rounded-md bg-muted overflow-hidden shrink-0">
                    {item.image ? (
                      <img src={mediaUrl(item.image)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-sm">🍽</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground">{formatCurrency(item.discounted_price || item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.quantity === 1 ? (
                      <button
                        onClick={() => dispatch(removeFromCart(item.id))}
                        className="h-6 w-6 rounded-md bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    ) : (
                      <button
                        onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))}
                        className="h-6 w-6 rounded-md bg-muted flex items-center justify-center text-foreground"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                    )}
                    <span className="text-xs font-semibold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                      className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center text-primary"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div className={`flex items-center justify-between bg-white dark:bg-zinc-800 border border-orange-200 dark:border-zinc-700 ${expanded ? 'rounded-b-lg' : 'rounded-lg'} px-3 py-2 shadow-lg`}>
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative h-7 w-7 bg-primary/10 rounded-md flex items-center justify-center shrink-0">
              <ShoppingBag className="h-3.5 w-3.5 text-primary" />
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                {cartCount}
              </span>
            </div>
            <p className="text-xs font-semibold text-foreground truncate">
              {cartCount} {cartCount === 1 ? 'item' : 'items'} | {formatCurrency(cartTotal)}
            </p>
            <ChevronUp className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
          <Link
            to="/customer/cart"
            className="flex items-center gap-1 text-[11px] font-semibold text-white bg-primary px-2.5 py-1 rounded-md shrink-0 ml-2"
          >
            View Cart <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </>
  )
}
