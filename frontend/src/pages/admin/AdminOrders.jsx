import { useState, useEffect } from 'react'
import adminApi from '@/api/adminApi'
import menuApi from '@/api/menuApi'
import { formatCurrency } from '@/utils/formatters'
import {
  Loader2, Search, ClipboardList, X, Pencil, Plus, Minus, Trash2, Check,
  ChevronDown, Package, Truck, CheckCircle2, XCircle, Clock, ChefHat
} from 'lucide-react'
import { toast } from 'sonner'
import ConfirmDialog from '@/components/common/ConfirmDialog'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  out_for_delivery: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
}

const STATUS_ICONS = {
  pending: Clock,
  accepted: CheckCircle2,
  preparing: ChefHat,
  out_for_delivery: Truck,
  delivered: Package,
  cancelled: XCircle,
  rejected: XCircle,
}

const ALL_STATUSES = ['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'rejected']

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)

  // Edit modal state
  const [editOrder, setEditOrder] = useState(null)
  const [editLoading, setEditLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [deleteItemId, setDeleteItemId] = useState(null)

  // Add item state
  const [showAddItem, setShowAddItem] = useState(false)
  const [itemSearch, setItemSearch] = useState('')
  const [menuItems, setMenuItems] = useState([])
  const [searchingItems, setSearchingItems] = useState(false)

  useEffect(() => {
    setPage(1)
    fetchOrders(1)
  }, [statusFilter])

  const fetchOrders = async (p = 1) => {
    setLoading(true)
    try {
      const params = { page: p }
      if (statusFilter) params.status = statusFilter
      if (search) params.search = search
      const res = await adminApi.getOrders(params)
      const data = res.data.results || res.data
      setOrders(p === 1 ? data : (prev) => [...prev, ...data])
      setHasNext(!!res.data.next)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchOrders(1)
  }

  const openEdit = async (orderId) => {
    setEditLoading(true)
    setEditOrder(null)
    try {
      const res = await adminApi.getOrderDetail(orderId)
      setEditOrder(res.data)
    } catch (err) {
      toast.error('Failed to load order details')
    } finally {
      setEditLoading(false)
    }
  }

  const closeEdit = () => {
    setEditOrder(null)
    setShowAddItem(false)
    setItemSearch('')
    setMenuItems([])
  }

  // Status update
  const handleStatusChange = async (newStatus) => {
    setActionLoading(true)
    try {
      const res = await adminApi.updateOrderStatus(editOrder.id, newStatus)
      setEditOrder(res.data)
      setOrders((prev) => prev.map((o) => o.id === editOrder.id ? { ...o, status: newStatus, total_amount: res.data.total_amount } : o))
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update status')
    } finally {
      setActionLoading(false)
    }
  }

  // Update item quantity
  const handleUpdateItem = async (itemId, quantity) => {
    try {
      const res = await adminApi.updateOrderItem(editOrder.id, itemId, { quantity })
      setEditOrder(res.data)
      setOrders((prev) => prev.map((o) => o.id === editOrder.id ? { ...o, total_amount: res.data.total_amount } : o))
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update item')
    }
  }

  // Delete item
  const handleDeleteItem = async () => {
    setActionLoading(true)
    try {
      const res = await adminApi.deleteOrderItem(editOrder.id, deleteItemId)
      setEditOrder(res.data)
      setOrders((prev) => prev.map((o) => o.id === editOrder.id ? { ...o, total_amount: res.data.total_amount } : o))
      toast.success('Item removed')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to remove item')
    } finally {
      setActionLoading(false)
      setDeleteItemId(null)
    }
  }

  // Search menu items for adding
  const searchMenuItems = async (searchTerm = itemSearch) => {
    setSearchingItems(true)
    try {
      const params = { seller: editOrder?.seller_id }
      if (searchTerm.trim()) params.search = searchTerm
      const res = await menuApi.getItems(params)
      setMenuItems(res.data.results || res.data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load menu items')
    } finally {
      setSearchingItems(false)
    }
  }

  // Auto-load menu items when add panel opens
  useEffect(() => {
    if (showAddItem && editOrder?.seller_id) searchMenuItems('')
  }, [showAddItem])

  // Add item to order
  const handleAddItem = async (menuItemId) => {
    setActionLoading(true)
    try {
      const res = await adminApi.addOrderItem(editOrder.id, { menu_item_id: menuItemId, quantity: 1 })
      setEditOrder(res.data)
      setOrders((prev) => prev.map((o) => o.id === editOrder.id ? { ...o, total_amount: res.data.total_amount } : o))
      toast.success('Item added')
      setShowAddItem(false)
      setItemSearch('')
      setMenuItems([])
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add item')
    } finally {
      setActionLoading(false)
    }
  }

  // Quick accept/reject from table row
  const [rowLoading, setRowLoading] = useState(null)
  const handleQuickStatus = async (orderId, newStatus) => {
    setRowLoading(orderId)
    try {
      await adminApi.updateOrderStatus(orderId, newStatus)
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o))
      toast.success(`Order ${newStatus}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update status')
    } finally {
      setRowLoading(null)
    }
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const shortDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">All Orders</h1>
      <p className="text-muted-foreground mb-6">Platform-wide order management</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by order ID, customer, or seller..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </form>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {['', ...ALL_STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading && orders.length === 0 ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : orders.length === 0 ? (
        <div className="bg-card rounded-xl border border-border text-center py-16">
          <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No orders found.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium">Order ID</th>
                  <th className="text-left px-4 py-3 font-medium">Customer</th>
                  <th className="text-left px-4 py-3 font-medium">Seller</th>
                  <th className="text-left px-4 py-3 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Payment</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-primary">{order.order_id}</td>
                    <td className="px-4 py-3">{order.customer_name || '-'}</td>
                    <td className="px-4 py-3">{order.seller_name || '-'}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(order.total_amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                        {order.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${order.is_paid ? 'text-green-600' : 'text-red-600'}`}>
                        {order.is_paid ? 'Paid' : 'Unpaid'}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">({order.payment_method})</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{shortDate(order.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleQuickStatus(order.id, 'accepted')}
                              disabled={rowLoading === order.id}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
                            >
                              <Check className="h-3.5 w-3.5" /> Accept
                            </button>
                            <button
                              onClick={() => handleQuickStatus(order.id, 'rejected')}
                              disabled={rowLoading === order.id}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => openEdit(order.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasNext && !loading && (
            <div className="p-4 text-center border-t border-border">
              <button
                onClick={() => { const next = page + 1; setPage(next); fetchOrders(next) }}
                className="text-sm text-primary font-medium hover:underline"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit Order Modal */}
      {(editOrder || editLoading) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeEdit}>
          <div
            className="bg-card rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {editLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : editOrder && (
              <div>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <div>
                    <h2 className="text-lg font-semibold">{editOrder.order_id}</h2>
                    <p className="text-sm text-muted-foreground">
                      {editOrder.customer_name} → {editOrder.seller_name}
                    </p>
                  </div>
                  <button onClick={closeEdit} className="p-1.5 hover:bg-muted rounded-lg">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Status Update */}
                <div className="p-6 border-b border-border">
                  <h3 className="text-sm font-medium mb-3">Update Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {ALL_STATUSES.map((s) => {
                      const Icon = STATUS_ICONS[s] || Clock
                      const isActive = editOrder.status === s
                      return (
                        <button
                          key={s}
                          onClick={() => !isActive && handleStatusChange(s)}
                          disabled={isActive || actionLoading}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            isActive
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 disabled:opacity-50'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium">Order Items</h3>
                    <button
                      onClick={() => setShowAddItem(!showAddItem)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Item
                    </button>
                  </div>

                  {/* Add Item Search */}
                  {showAddItem && (
                    <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search menu items..."
                          value={itemSearch}
                          onChange={(e) => { setItemSearch(e.target.value); searchMenuItems(e.target.value) }}
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          autoFocus
                        />
                      </div>
                      {searchingItems ? (
                        <div className="flex justify-center py-3">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : menuItems.length > 0 ? (
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {menuItems.map((mi) => (
                            <div key={mi.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                              <div>
                                <p className="text-sm font-medium">{mi.name}</p>
                                <p className="text-xs text-muted-foreground">{formatCurrency(mi.discounted_price || mi.price)}</p>
                              </div>
                              <button
                                onClick={() => handleAddItem(mi.id)}
                                disabled={actionLoading}
                                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 disabled:opacity-50"
                              >
                                + Add
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-2">No items found for this seller</p>
                      )}
                    </div>
                  )}

                  {/* Items List */}
                  <div className="space-y-2">
                    {editOrder.items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{item.item_name}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(item.item_price)} each</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => item.quantity > 1 && handleUpdateItem(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="p-1 rounded-md border border-border hover:bg-muted disabled:opacity-30 transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateItem(item.id, item.quantity + 1)}
                              className="p-1 rounded-md border border-border hover:bg-muted transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="text-sm font-medium w-16 text-right">{formatCurrency(item.total_price)}</span>
                          <button
                            onClick={() => setDeleteItemId(item.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="p-6 border-b border-border">
                  <h3 className="text-sm font-medium mb-3">Summary</h3>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(editOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span>{Number(editOrder.delivery_fee) > 0 ? formatCurrency(editOrder.delivery_fee) : <span className="text-green-600">Free</span>}</span>
                    </div>
                    {Number(editOrder.discount) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="text-green-600">-{formatCurrency(editOrder.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-base pt-1.5 border-t border-border">
                      <span>Total</span>
                      <span>{formatCurrency(editOrder.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Order Info */}
                <div className="p-6 space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-muted-foreground">Payment</span>
                      <p className="font-medium">
                        {editOrder.payment_method?.toUpperCase()}
                        <span className={`ml-2 text-xs ${editOrder.is_paid ? 'text-green-600' : 'text-red-600'}`}>
                          ({editOrder.is_paid ? 'Paid' : 'Unpaid'})
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Order Type</span>
                      <p className="font-medium capitalize">{editOrder.order_type}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Placed</span>
                      <p className="font-medium">{formatDate(editOrder.created_at)}</p>
                    </div>
                    {editOrder.delivery_address_snapshot?.full_address && (
                      <div>
                        <span className="text-muted-foreground">Delivery Address</span>
                        <p className="font-medium">{editOrder.delivery_address_snapshot.full_address}, {editOrder.delivery_address_snapshot.city}</p>
                      </div>
                    )}
                  </div>
                  {editOrder.special_instructions && (
                    <div>
                      <span className="text-muted-foreground">Special Instructions</span>
                      <p className="font-medium">{editOrder.special_instructions}</p>
                    </div>
                  )}

                  {/* Status History */}
                  {editOrder.status_history?.length > 0 && (
                    <div>
                      <span className="text-muted-foreground block mb-2">Status History</span>
                      <div className="space-y-1">
                        {editOrder.status_history.map((h) => (
                          <div key={h.id} className="flex items-center gap-2 text-xs">
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_COLORS[h.to_status]}`}>
                              {h.to_status?.replace(/_/g, ' ')}
                            </span>
                            <span className="text-muted-foreground">
                              {h.changed_by_name && `by ${h.changed_by_name}`} &bull; {formatDate(h.created_at)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Item Confirm */}
      <ConfirmDialog
        open={deleteItemId !== null}
        onClose={() => setDeleteItemId(null)}
        onConfirm={handleDeleteItem}
        title="Remove Item"
        message="Are you sure you want to remove this item from the order? The order total will be recalculated."
        confirmText="Remove"
        variant="danger"
      />
    </div>
  )
}
