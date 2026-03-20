import { useState, useEffect } from 'react'
import sellerApi from '@/api/sellerApi'
import { Search, Check, X, Ban, Eye, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { formatDate } from '@/utils/formatters'
import { mediaUrl } from '@/utils/constants'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  suspended: 'bg-gray-100 text-gray-800',
}

export default function SellersManagement() {
  const [sellers, setSellers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [rejectModal, setRejectModal] = useState({ open: false, sellerId: null, reason: '' })
  const [suspendId, setSuspendId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const fetchSellers = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter) params.approval_status = filter
      if (search) params.search = search
      const res = await sellerApi.adminGetSellers(params)
      setSellers(res.data.results || res.data)
    } catch (err) {
      console.error('Failed to fetch sellers:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSellers()
  }, [filter])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchSellers()
  }

  const handleApprove = async (id) => {
    setActionLoading(id)
    try {
      await sellerApi.adminApproveSeller(id)
      fetchSellers()
    } catch (err) {
      console.error('Approve failed:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    const { sellerId, reason } = rejectModal
    setActionLoading(sellerId)
    try {
      await sellerApi.adminRejectSeller(sellerId, reason)
      setRejectModal({ open: false, sellerId: null, reason: '' })
      fetchSellers()
    } catch (err) {
      console.error('Reject failed:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleSuspend = async (id) => {
    setActionLoading(id)
    try {
      await sellerApi.adminSuspendSeller(id, 'Suspended by admin')
      fetchSellers()
    } catch (err) {
      console.error('Suspend failed:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    setActionLoading(deleteId)
    try {
      await sellerApi.adminDeleteSeller(deleteId)
      toast.success('Seller deleted')
      fetchSellers()
    } catch (err) {
      toast.error('Failed to delete seller')
    } finally {
      setActionLoading(null)
      setDeleteId(null)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Sellers Management</h1>
      <p className="text-muted-foreground mb-6">Approve, reject, or suspend seller accounts</p>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </form>
        <div className="flex gap-2">
          {['', 'pending', 'approved', 'rejected', 'suspended'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {f || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : sellers.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            No sellers found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Kitchen</th>
                  <th className="text-left px-4 py-3 font-medium">Owner</th>
                  <th className="text-left px-4 py-3 font-medium">City</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Registered</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sellers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {seller.logo ? (
                          <img src={mediaUrl(seller.logo)} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {seller.kitchen_name?.[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{seller.kitchen_name}</div>
                          <div className="text-xs text-muted-foreground">{seller.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{seller.user?.full_name}</div>
                      <div className="text-xs text-muted-foreground">{seller.user?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{seller.city}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[seller.approval_status]}`}>
                        {seller.approval_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(seller.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {seller.approval_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(seller.id)}
                              disabled={actionLoading === seller.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
                            >
                              <Check className="h-3.5 w-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => setRejectModal({ open: true, sellerId: seller.id, reason: '' })}
                              disabled={actionLoading === seller.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              <X className="h-3.5 w-3.5" /> Reject
                            </button>
                          </>
                        )}
                        {seller.approval_status === 'approved' && (
                          <button
                            onClick={() => setSuspendId(seller.id)}
                            disabled={actionLoading === seller.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
                          >
                            <Ban className="h-3.5 w-3.5" /> Suspend
                          </button>
                        )}
                        {(seller.approval_status === 'rejected' || seller.approval_status === 'suspended') && (
                          <button
                            onClick={() => handleApprove(seller.id)}
                            disabled={actionLoading === seller.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" /> Re-approve
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteId(seller.id)}
                          disabled={actionLoading === seller.id}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={suspendId !== null}
        onClose={() => setSuspendId(null)}
        onConfirm={() => handleSuspend(suspendId)}
        title="Suspend Seller"
        message="This seller will be taken offline and cannot accept orders. Are you sure?"
        confirmText="Suspend"
        variant="warning"
      />

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Seller"
        message="This will permanently delete the seller profile and deactivate their account. This cannot be undone."
        confirmText="Delete"
        variant="danger"
      />

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Reject Seller</h3>
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none mb-4"
              placeholder="Reason for rejection (optional)"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRejectModal({ open: false, sellerId: null, reason: '' })}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
