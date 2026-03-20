import { useState, useEffect } from 'react'
import addressApi from '@/api/addressApi'
import { MapPin, Plus, Pencil, Trash2, Star, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import ConfirmDialog from '@/components/common/ConfirmDialog'

const initialForm = {
  full_address: '', landmark: '', city: '', state: '', pincode: '', address_type: 'home',
}

export default function Addresses() {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, editing: null })
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    setLoading(true)
    try {
      const res = await addressApi.getAll()
      setAddresses(res.data.results || res.data)
    } catch (err) {
      console.error('Failed to fetch addresses:', err)
    } finally {
      setLoading(false)
    }
  }

  const openAdd = () => {
    setForm(initialForm)
    setModal({ open: true, editing: null })
  }

  const openEdit = (addr) => {
    setForm({
      full_address: addr.full_address,
      landmark: addr.landmark || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      address_type: addr.address_type,
    })
    setModal({ open: true, editing: addr })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (modal.editing) {
        await addressApi.update(modal.editing.id, form)
      } else {
        await addressApi.create(form)
      }
      setModal({ open: false, editing: null })
      fetchAddresses()
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await addressApi.delete(id)
      setAddresses(addresses.filter((a) => a.id !== id))
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const handleSetDefault = async (id) => {
    try {
      await addressApi.setDefault(id)
      fetchAddresses()
    } catch (err) {
      console.error('Set default failed:', err)
    }
  }

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">My Addresses</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Address
        </button>
      </div>
      <p className="text-muted-foreground mb-6">Manage your delivery addresses</p>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-card rounded-xl border border-border text-center py-16">
          <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No addresses saved.</p>
          <button onClick={openAdd} className="mt-3 text-primary text-sm font-medium hover:underline">
            Add your first address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className={`bg-card rounded-xl border p-5 ${addr.is_default ? 'border-primary' : 'border-border'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">{addr.address_type}</span>
                  {addr.is_default && (
                    <span className="text-xs font-medium text-green-600 flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-green-600" /> Default
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(addr)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteId(addr.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm">{addr.full_address}</p>
              {addr.landmark && <p className="text-xs text-muted-foreground mt-1">{addr.landmark}</p>}
              <p className="text-xs text-muted-foreground">{addr.city}, {addr.state} - {addr.pincode}</p>
              {!addr.is_default && (
                <button
                  onClick={() => handleSetDefault(addr.id)}
                  className="mt-3 text-xs text-primary font-medium hover:underline"
                >
                  Set as Default
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => handleDelete(deleteId)}
        title="Delete Address"
        message="Are you sure you want to delete this address?"
        confirmText="Delete"
        variant="danger"
      />

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{modal.editing ? 'Edit Address' : 'Add Address'}</h3>
              <button onClick={() => setModal({ open: false, editing: null })} className="p-1 hover:bg-muted rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Full Address *</label>
                <textarea
                  value={form.full_address}
                  onChange={(e) => setForm({ ...form, full_address: e.target.value })}
                  rows={2} className={inputClass + " resize-none"}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">City *</label>
                  <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pincode *</label>
                  <input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Landmark</label>
                  <input value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="flex gap-2">
                {['home', 'work', 'other'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, address_type: t })}
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                      form.address_type === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModal({ open: false, editing: null })} className="px-4 py-2 text-sm text-muted-foreground">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.full_address || !form.city || !form.pincode}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : modal.editing ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
