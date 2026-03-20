import { useState, useEffect } from 'react'
import menuApi from '@/api/menuApi'
import { formatCurrency } from '@/utils/formatters'
import {
  Plus, Search, Pencil, Trash2, Loader2, X, ImageIcon,
  ToggleLeft, ToggleRight
} from 'lucide-react'
import { toast } from 'sonner'
import { mediaUrl } from '@/utils/constants'
import ConfirmDialog from '@/components/common/ConfirmDialog'

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
]

const FOOD_TYPES = [
  { value: 'veg', label: 'Veg', color: 'bg-green-500' },
  { value: 'non_veg', label: 'Non-Veg', color: 'bg-red-500' },
  { value: 'egg', label: 'Egg', color: 'bg-yellow-500' },
]

const initialForm = {
  name: '', description: '', price: '', discounted_price: '',
  meal_type: 'lunch', food_type: 'veg', category: '',
  preparation_time_mins: '30', calories: '', serves: '1',
  is_available: true, is_active: true,
}

export default function MenuManagement() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterMeal, setFilterMeal] = useState('')
  const [filterFood, setFilterFood] = useState('')

  // Modal state
  const [modal, setModal] = useState({ open: false, editing: null })
  const [form, setForm] = useState(initialForm)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteItem, setDeleteItem] = useState(null)

  useEffect(() => {
    fetchItems()
    fetchCategories()
  }, [filterMeal, filterFood])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterMeal) params.meal_type = filterMeal
      if (filterFood) params.food_type = filterFood
      if (search) params.search = search
      const res = await menuApi.sellerGetItems(params)
      setItems(res.data.results || res.data)
    } catch (err) {
      console.error('Failed to fetch items:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await menuApi.getCategories()
      setCategories(res.data)
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchItems()
  }

  const openAddModal = () => {
    setForm(initialForm)
    setImageFile(null)
    setImagePreview(null)
    setError('')
    setModal({ open: true, editing: null })
  }

  const openEditModal = (item) => {
    setForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      discounted_price: item.discounted_price || '',
      meal_type: item.meal_type,
      food_type: item.food_type,
      category: item.category || '',
      preparation_time_mins: item.preparation_time_mins || '30',
      calories: item.calories || '',
      serves: item.serves || '1',
      is_available: item.is_available,
      is_active: item.is_active,
    })
    setImageFile(null)
    setImagePreview(item.image || null)
    setError('')
    setModal({ open: true, editing: item })
  }

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const data = new FormData()
      // Only append non-empty values; skip empty optional fields
      const skipIfEmpty = ['description', 'discounted_price', 'category', 'calories']
      Object.entries(form).forEach(([key, value]) => {
        if (skipIfEmpty.includes(key) && (value === '' || value === null || value === undefined)) return
        if (value !== null && value !== undefined) data.append(key, value)
      })
      if (imageFile) data.append('image', imageFile)

      if (modal.editing) {
        await menuApi.sellerUpdateItem(modal.editing.id, data)
        toast.success('Item updated')
      } else {
        await menuApi.sellerCreateItem(data)
        toast.success('Item added')
      }
      setModal({ open: false, editing: null })
      fetchItems()
    } catch (err) {
      const errData = err.response?.data
      if (errData && typeof errData === 'object' && !Array.isArray(errData)) {
        const messages = []
        for (const [key, value] of Object.entries(errData)) {
          if (Array.isArray(value)) messages.push(`${key}: ${value.join(', ')}`)
          else if (typeof value === 'string') messages.push(value)
        }
        setError(messages.join('. ') || 'Save failed.')
      } else if (typeof errData === 'string' && !errData.startsWith('<!')) {
        setError(errData)
      } else {
        const status = err.response?.status
        setError(status === 403 ? 'You do not have permission.' : status === 500 ? 'Server error. Please check seller profile.' : 'Save failed. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (item) => {
    try {
      const res = await menuApi.sellerToggleItem(item.id)
      setItems(items.map((i) => i.id === item.id ? { ...i, is_available: res.data.is_available } : i))
    } catch (err) {
      console.error('Toggle failed:', err)
    }
  }

  const handleDelete = async (item) => {
    try {
      await menuApi.sellerDeleteItem(item.id)
      setItems(items.filter((i) => i.id !== item.id))
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Item
        </button>
      </div>
      <p className="text-muted-foreground mb-6">Manage your food items and availability</p>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </form>
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterMeal}
            onChange={(e) => setFilterMeal(e.target.value)}
            className="px-3 py-2 rounded-lg border border-input text-sm bg-background"
          >
            <option value="">All Meals</option>
            {MEAL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            value={filterFood}
            onChange={(e) => setFilterFood(e.target.value)}
            className="px-3 py-2 rounded-lg border border-input text-sm bg-background"
          >
            <option value="">All Types</option>
            {FOOD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <ImageIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No menu items yet.</p>
            <button onClick={openAddModal} className="mt-3 text-primary text-sm font-medium hover:underline">
              Add your first item
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Item</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Meal</th>
                  <th className="text-right px-4 py-3 font-medium">Price</th>
                  <th className="text-center px-4 py-3 font-medium">Available</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img src={mediaUrl(item.image)} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.preparation_time_mins && (
                            <div className="text-xs text-muted-foreground">{item.preparation_time_mins} min</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.category_name || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${FOOD_TYPES.find(f => f.value === item.food_type)?.color}`} />
                        {FOOD_TYPES.find(f => f.value === item.food_type)?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                        {item.meal_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.discounted_price ? (
                        <div>
                          <span className="font-medium">{formatCurrency(item.discounted_price)}</span>
                          <span className="text-xs text-muted-foreground line-through ml-1">{formatCurrency(item.price)}</span>
                        </div>
                      ) : (
                        <span className="font-medium">{formatCurrency(item.price)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleToggle(item)} className="inline-flex">
                        {item.is_available ? (
                          <ToggleRight className="h-6 w-6 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteItem(item)}
                          className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Add/Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-xl shadow-lg w-full max-w-lg my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold">
                {modal.editing ? 'Edit Item' : 'Add New Item'}
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
                <label className="block text-sm font-medium mb-1.5">Name *</label>
                <input type="text" name="name" value={form.name} onChange={handleFormChange} className={inputClass} placeholder="e.g. Paneer Tikka" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} rows={2} className={inputClass + " resize-none"} placeholder="Describe this dish..." />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Image</label>
                <input type="file" accept="image/*" onChange={handleImageChange} className={inputClass} />
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded-lg" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Price *</label>
                  <input type="number" name="price" value={form.price} onChange={handleFormChange} className={inputClass} placeholder="199" step="0.01" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Discounted Price</label>
                  <input type="number" name="discounted_price" value={form.discounted_price} onChange={handleFormChange} className={inputClass} placeholder="149" step="0.01" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Meal Type</label>
                  <select name="meal_type" value={form.meal_type} onChange={handleFormChange} className={inputClass}>
                    {MEAL_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Food Type</label>
                  <select name="food_type" value={form.food_type} onChange={handleFormChange} className={inputClass}>
                    {FOOD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Category</label>
                <select name="category" value={form.category} onChange={handleFormChange} className={inputClass}>
                  <option value="">No Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Prep Time (min)</label>
                  <input type="number" name="preparation_time_mins" value={form.preparation_time_mins} onChange={handleFormChange} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Calories</label>
                  <input type="number" name="calories" value={form.calories} onChange={handleFormChange} className={inputClass} placeholder="250" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Serves</label>
                  <input type="number" name="serves" value={form.serves} onChange={handleFormChange} className={inputClass} />
                </div>
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
                disabled={saving || !form.name || !form.price}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving...</span>
                ) : modal.editing ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteItem !== null}
        onClose={() => setDeleteItem(null)}
        onConfirm={() => handleDelete(deleteItem)}
        title="Delete Menu Item"
        message={`Delete "${deleteItem?.name}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
