import { useState, useEffect } from 'react'
import orderApi from '@/api/orderApi'
import menuApi from '@/api/menuApi'
import { formatCurrency, formatTimeAgo } from '@/utils/formatters'
import {
  Loader2, Check, X, ChefHat, Truck, Package, Pencil,
  ClipboardList, Phone, Plus, Minus, Trash2, Search
} from 'lucide-react'
import { toast } from 'sonner'
import ConfirmDialog from '@/components/common/ConfirmDialog'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  preparing: 'bg-indigo-100 text-indigo-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  rejected: 'bg-red-100 text-red-800',
}

const NEXT_STATUS = {
  accepted: { status: 'preparing', label: 'Start Preparing', icon: ChefHat },
  preparing: { status: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  out_for_delivery: { status: 'delivered', label: 'Mark Delivered', icon: Package },
}

export default function SellerOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [rejectModal, setRejectModal] = useState({ open: false, orderId: null, reason: '' })

  // Edit modal
  const [editOrder, setEditOrder] = useState(null)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteItemId, setDeleteItemId] = useState(null)

  // Add item
  const [showAddItem, setShowAddItem] = useState(false)
  const [itemSearch, setItemSearch] = useState('')
  const [menuItems, setMenuItems] = useState([])
  const [searchingItems, setSearchingItems] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [filter])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter) params.status = filter
      const res = await orderApi.sellerGetOrders(params)
      setOrders(res.data.results || res.data)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (id) => {
    setActionLoading(id)
    try {
      await orderApi.sellerAcceptOrder(id)
      fetchOrders()
      if (editOrder?.id === id) {
        const res = await orderApi.sellerGetOrderDetail(id)
        setEditOrder(res.data)
      }
      toast.success('Order accepted')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to accept order.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    const { orderId, reason } = rejectModal
    setActionLoading(orderId)
    try {
      await orderApi.sellerRejectOrder(orderId, reason)
      setRejectModal({ open: false, orderId: null, reason: '' })
      fetchOrders()
      if (editOrder?.id === orderId) closeEdit()
      toast.success('Order rejected')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reject order.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateStatus = async (id, newStatus) => {
    setActionLoading(id)
    try {
      await orderApi.sellerUpdateStatus(id, newStatus)
      fetchOrders()
      if (editOrder?.id === id) {
        const res = await orderApi.sellerGetOrderDetail(id)
        setEditOrder(res.data)
      }
      toast.success(`Status updated`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update status.')
    } finally {
      setActionLoading(null)
    }
  }

  // Edit modal handlers
  const openEdit = async (id) => {
    setEditLoading(true)
    setEditOrder(null)
    try {
      const res = await orderApi.sellerGetOrderDetail(id)
      setEditOrder(res.data)
    } catch (err) {
      toast.error('Failed to load order')
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

  const handleUpdateItem = async (itemId, quantity) => {
    try {
      const res = await orderApi.sellerUpdateOrderItem(editOrder.id, itemId, { quantity })
      setEditOrder(res.data)
      setOrders((prev) => prev.map((o) => o.id === editOrder.id ? { ...o, total_amount: res.data.total_amount } : o))
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update item')
    }
  }

  const handleDeleteItem = async () => {
    try {
      const res = await orderApi.sellerDeleteOrderItem(editOrder.id, deleteItemId)
      setEditOrder(res.data)
      setOrders((prev) => prev.map((o) => o.id === editOrder.id ? { ...o, total_amount: res.data.total_amount } : o))
      toast.success('Item removed')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to remove item')
    } finally {
      setDeleteItemId(null)
    }
  }

  const searchMenuItems = async (searchTerm = itemSearch) => {
    setSearchingItems(true)
    try {
      const params = {}
      if (searchTerm.trim()) params.search = searchTerm
      const res = await menuApi.sellerGetItems(params)
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
    if (showAddItem) searchMenuItems('')
  }, [showAddItem])

  const handleAddItem = async (menuItemId) => {
    try {
      const res = await orderApi.sellerAddOrderItem(editOrder.id, { menu_item_id: menuItemId, quantity: 1 })
      setEditOrder(res.data)
      setOrders((prev) => prev.map((o) => o.id === editOrder.id ? { ...o, total_amount: res.data.total_amount } : o))
      toast.success('Item added')
      setShowAddItem(false)
      setItemSearch('')
      setMenuItems([])
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add item')
    }
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Orders</h1>
      <p className="text-muted-foreground mb-6">Manage incoming and active orders</p>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {['', 'pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {f ? f.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-card rounded-xl border border-border text-center py-16">
          <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const nextAction = NEXT_STATUS[order.status]
            return (
              <div key={order.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{order.order_id}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                      {!order.is_paid && <span className="text-xs text-yellow-600 font-medium">Unpaid</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {order.customer_name} &bull; {formatTimeAgo(order.created_at)} &bull; {order.items_count} item{order.items_count > 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{formatCurrency(order.total_amount)}</span>

                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAccept(order.id)}
                          disabled={actionLoading === order.id}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg border border-green-200 text-green-600 hover:bg-green-50 disabled:opacity-50 transition-colors"
                        >
                          <Check className="h-3.5 w-3.5" /> Accept
                        </button>
                        <button
                          onClick={() => setRejectModal({ open: true, orderId: order.id, reason: '' })}
                          disabled={actionLoading === order.id}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </>
                    )}

                    {nextAction && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, nextAction.status)}
                        disabled={actionLoading === order.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        <nextAction.icon className="h-3.5 w-3.5" />
                        {nextAction.label}
                      </button>
                    )}

                    <button
                      onClick={() => openEdit(order.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Order Modal */}
      {(editOrder || editLoading) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeEdit}>
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
                    <p className="text-sm text-muted-foreground">{editOrder.customer_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[editOrder.status]}`}>
                      {editOrder.status?.replace(/_/g, ' ')}
                    </span>
                    <button onClick={closeEdit} className="p-1.5 hover:bg-muted rounded-lg">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Status Actions */}
                <div className="p-6 border-b border-border">
                  <div className="flex flex-wrap gap-2">
                    {editOrder.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAccept(editOrder.id)}
                          disabled={actionLoading === editOrder.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-green-200 text-green-600 hover:bg-green-50 disabled:opacity-50 transition-colors"
                        >
                          <Check className="h-4 w-4" /> Accept Order
                        </button>
                        <button
                          onClick={() => setRejectModal({ open: true, orderId: editOrder.id, reason: '' })}
                          disabled={actionLoading === editOrder.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          <X className="h-4 w-4" /> Reject Order
                        </button>
                      </>
                    )}
                    {NEXT_STATUS[editOrder.status] && (() => {
                      const next = NEXT_STATUS[editOrder.status]
                      return (
                        <button
                          onClick={() => handleUpdateStatus(editOrder.id, next.status)}
                          disabled={actionLoading === editOrder.id}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                          <next.icon className="h-4 w-4" /> {next.label}
                        </button>
                      )
                    })()}
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
                          placeholder="Search your menu items..."
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
                                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-green-50 text-green-600 border border-green-200 hover:bg-green-100"
                              >
                                + Add
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-2">No items found</p>
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

                {/* Summary */}
                <div className="p-6 border-b border-border">
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(editOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span>{Number(editOrder.delivery_fee) > 0 ? formatCurrency(editOrder.delivery_fee) : <span className="text-green-600">Free</span>}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-base pt-1.5 border-t border-border">
                      <span>Total</span>
                      <span>{formatCurrency(editOrder.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Order Info */}
                <div className="p-6 text-sm space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-muted-foreground">Customer</span>
                      <p className="font-medium">{editOrder.customer_name}</p>
                      {editOrder.customer_phone && (
                        <p className="text-muted-foreground flex items-center gap-1 text-xs mt-0.5">
                          <Phone className="h-3 w-3" /> {editOrder.customer_phone}
                        </p>
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Payment</span>
                      <p className="font-medium">
                        {editOrder.payment_method?.toUpperCase()}
                        <span className={`ml-2 text-xs ${editOrder.is_paid ? 'text-green-600' : 'text-red-600'}`}>
                          ({editOrder.is_paid ? 'Paid' : 'Unpaid'})
                        </span>
                      </p>
                    </div>
                    {editOrder.delivery_address_snapshot?.full_address && (
                      <div>
                        <span className="text-muted-foreground">Delivery Address</span>
                        <p className="font-medium">{editOrder.delivery_address_snapshot.full_address}</p>
                        <p className="text-xs text-muted-foreground">{editOrder.delivery_address_snapshot.city} - {editOrder.delivery_address_snapshot.pincode}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Placed</span>
                      <p className="font-medium">{formatDate(editOrder.created_at)}</p>
                    </div>
                  </div>
                  {editOrder.special_instructions && (
                    <div>
                      <span className="text-muted-foreground">Special Instructions</span>
                      <p className="font-medium">{editOrder.special_instructions}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Reject Order</h3>
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none mb-4"
              placeholder="Reason for rejection (optional)"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setRejectModal({ open: false, orderId: null, reason: '' })} className="px-4 py-2 text-sm text-muted-foreground">
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 disabled:opacity-50"
              >
                Reject Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Confirm */}
      <ConfirmDialog
        open={deleteItemId !== null}
        onClose={() => setDeleteItemId(null)}
        onConfirm={handleDeleteItem}
        title="Remove Item"
        message="Remove this item from the order? Total will be recalculated."
        confirmText="Remove"
        variant="danger"
      />
    </div>
  )
}
