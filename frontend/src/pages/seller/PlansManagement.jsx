import { useState, useEffect } from 'react'
import menuApi from '@/api/menuApi'
import { formatCurrency } from '@/utils/formatters'
import { Plus, Pencil, Trash2, Loader2, X, CalendarCheck } from 'lucide-react'
import { toast } from 'sonner'
import ConfirmDialog from '@/components/common/ConfirmDialog'

const PLAN_TYPES = [
  { value: 'breakfast', label: 'Breakfast Only' },
  { value: 'lunch', label: 'Lunch Only' },
  { value: 'dinner', label: 'Dinner Only' },
  { value: 'lunch_dinner', label: 'Lunch + Dinner' },
  { value: 'all_meals', label: 'All Meals' },
]

const initialForm = {
  name: '', description: '', plan_type: 'lunch', duration_days: '30',
  price: '', daily_price: '', items_per_meal: '1',
  includes_weekends: true, max_skips_allowed: '5', max_pauses_allowed: '2',
  is_active: true,
}

export default function PlansManagement() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, editing: null })
  const [form, setForm] = useState(initialForm)
  const [imageFile, setImageFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deletePlan, setDeletePlan] = useState(null)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const res = await menuApi.sellerGetPlans()
      setPlans(res.data.results || res.data)
    } catch (err) {
      console.error('Failed to fetch plans:', err)
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setForm(initialForm)
    setImageFile(null)
    setError('')
    setModal({ open: true, editing: null })
  }

  const openEditModal = (plan) => {
    setForm({
      name: plan.name,
      description: plan.description || '',
      plan_type: plan.plan_type,
      duration_days: plan.duration_days,
      price: plan.price,
      daily_price: plan.daily_price,
      items_per_meal: plan.items_per_meal,
      includes_weekends: plan.includes_weekends,
      max_skips_allowed: plan.max_skips_allowed,
      max_pauses_allowed: plan.max_pauses_allowed,
      is_active: plan.is_active,
    })
    setImageFile(null)
    setError('')
    setModal({ open: true, editing: plan })
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const updated = { ...form, [name]: type === 'checkbox' ? checked : value }
    // Auto-calc daily_price when price or duration changes
    if ((name === 'price' || name === 'duration_days') && updated.price && updated.duration_days > 0) {
      updated.daily_price = (parseFloat(updated.price) / parseInt(updated.duration_days)).toFixed(2)
    }
    setForm(updated)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const data = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        if (value !== '' && value !== null) data.append(key, value)
      })
      if (imageFile) data.append('image', imageFile)

      if (modal.editing) {
        await menuApi.sellerUpdatePlan(modal.editing.id, data)
      } else {
        await menuApi.sellerCreatePlan(data)
      }
      setModal({ open: false, editing: null })
      fetchPlans()
    } catch (err) {
      const errData = err.response?.data
      if (typeof errData === 'object') {
        const messages = []
        for (const [key, value] of Object.entries(errData)) {
          if (Array.isArray(value)) messages.push(`${key}: ${value.join(', ')}`)
          else if (typeof value === 'string') messages.push(value)
        }
        setError(messages.join('. ') || 'Save failed.')
      } else {
        setError('Save failed. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (plan) => {
    try {
      await menuApi.sellerDeletePlan(plan.id)
      setPlans(plans.filter((p) => p.id !== plan.id))
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Subscription Plans</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Plan
        </button>
      </div>
      <p className="text-muted-foreground mb-6">Create plans for customers to subscribe to regular meals</p>

      {/* Plans Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-card rounded-xl border border-border text-center py-16">
          <CalendarCheck className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">No subscription plans yet.</p>
          <button onClick={openAddModal} className="mt-3 text-primary text-sm font-medium hover:underline">
            Create your first plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className={`bg-card rounded-xl border border-border p-5 ${!plan.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-base">{plan.name}</h3>
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mt-1">
                    {PLAN_TYPES.find(t => t.value === plan.plan_type)?.label}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(plan)}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletePlan(plan)}
                    className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {plan.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{plan.description}</p>
              )}

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-bold">{formatCurrency(plan.price)}</span>
                <span className="text-sm text-muted-foreground">/ {plan.duration_days} days</span>
              </div>

              <div className="space-y-1.5 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Daily price</span>
                  <span className="font-medium text-foreground">{formatCurrency(plan.daily_price)}/day</span>
                </div>
                <div className="flex justify-between">
                  <span>Items per meal</span>
                  <span>{plan.items_per_meal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Weekends</span>
                  <span>{plan.includes_weekends ? 'Included' : 'Excluded'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max skips</span>
                  <span>{plan.max_skips_allowed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max pauses</span>
                  <span>{plan.max_pauses_allowed}</span>
                </div>
              </div>

              {!plan.is_active && (
                <div className="mt-3 text-xs text-destructive font-medium">Inactive</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-xl shadow-lg w-full max-w-lg my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold">
                {modal.editing ? 'Edit Plan' : 'Create New Plan'}
              </h3>
              <button onClick={() => setModal({ open: false, editing: null })} className="p-1 hover:bg-muted rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5">Plan Name *</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} className={inputClass} placeholder="e.g. Monthly Lunch Plan" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={2} className={inputClass + " resize-none"} placeholder="What's included in this plan..." />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Plan Type</label>
                <select name="plan_type" value={form.plan_type} onChange={handleChange} className={inputClass}>
                  {PLAN_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Total Price *</label>
                  <input type="number" name="price" value={form.price} onChange={handleChange} className={inputClass} placeholder="2999" step="0.01" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Daily Price *</label>
                  <input type="number" name="daily_price" value={form.daily_price} onChange={handleChange} className={inputClass} placeholder="100" step="0.01" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Duration (days)</label>
                  <input type="number" name="duration_days" value={form.duration_days} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Items per Meal</label>
                  <input type="number" name="items_per_meal" value={form.items_per_meal} onChange={handleChange} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Max Skips</label>
                  <input type="number" name="max_skips_allowed" value={form.max_skips_allowed} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Max Pauses</label>
                  <input type="number" name="max_pauses_allowed" value={form.max_pauses_allowed} onChange={handleChange} className={inputClass} />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" name="includes_weekends" checked={form.includes_weekends} onChange={handleChange} className="rounded border-input" />
                  Include Weekends
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} className="rounded border-input" />
                  Active
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Plan Image</label>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className={inputClass} />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={() => setModal({ open: false, editing: null })}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.price || !form.daily_price}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving...</span>
                ) : modal.editing ? 'Update Plan' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deletePlan !== null}
        onClose={() => setDeletePlan(null)}
        onConfirm={() => handleDelete(deletePlan)}
        title="Delete Plan"
        message={`Delete plan "${deletePlan?.name}"? Existing subscribers won't be affected.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
