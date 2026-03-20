import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { fetchCurrentUser } from '@/store/slices/authSlice'
import sellerApi from '@/api/sellerApi'
import { ChefHat, Store, FileText, Landmark, ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react'

const STEPS = [
  { title: 'Kitchen Details', icon: Store },
  { title: 'Documents', icon: FileText },
  { title: 'Bank Details', icon: Landmark },
]

export default function SellerOnboarding() {
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [formData, setFormData] = useState({
    // Step 1: Kitchen Details
    kitchen_name: '',
    description: '',
    address_line: '',
    city: '',
    state: '',
    pincode: '',
    opening_time: '08:00',
    closing_time: '21:00',
    delivery_radius_km: '5',
    minimum_order_amount: '0',
    // Step 2: Documents
    fssai_license: '',
    pan_number: '',
    gst_number: '',
    // Step 3: Bank
    bank_account_number: '',
    bank_ifsc: '',
    bank_name: '',
  })

  const [files, setFiles] = useState({
    logo: null,
    banner_image: null,
    fssai_document: null,
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError('')

    try {
      const data = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value) data.append(key, value)
      })
      Object.entries(files).forEach(([key, file]) => {
        if (file) data.append(key, file)
      })

      await sellerApi.register(data)
      await dispatch(fetchCurrentUser())
      navigate('/seller/dashboard')
    } catch (err) {
      const errData = err.response?.data
      if (typeof errData === 'object') {
        const messages = []
        for (const [key, value] of Object.entries(errData)) {
          if (Array.isArray(value)) messages.push(`${key}: ${value.join(', ')}`)
          else if (typeof value === 'string') messages.push(value)
        }
        setError(messages.join('. ') || 'Registration failed.')
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => {
    if (step < STEPS.length - 1) setStep(step + 1)
    else handleSubmit()
  }

  const prevStep = () => {
    if (step > 0) setStep(step - 1)
  }

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <ChefHat className="h-12 w-12 text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Register Your Kitchen</h1>
          <p className="text-muted-foreground mt-1">Complete your profile to start selling on MealsOnTime</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                i === step ? 'bg-primary text-primary-foreground' :
                i < step ? 'bg-primary/20 text-primary' :
                'bg-muted text-muted-foreground'
              }`}>
                {i < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                <span className="hidden sm:inline">{s.title}</span>
              </div>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-border mx-1" />}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-4">
              {error}
            </div>
          )}

          {/* Step 1: Kitchen Details */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Kitchen Details</h2>

              <div>
                <label className="block text-sm font-medium mb-1.5">Kitchen Name *</label>
                <input type="text" name="kitchen_name" value={formData.kitchen_name} onChange={handleChange} className={inputClass} placeholder="e.g. Maa Ki Rasoi" required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className={inputClass + " resize-none"} placeholder="Tell customers about your kitchen..." />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Logo</label>
                  <input type="file" name="logo" accept="image/*" onChange={handleFileChange} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Banner Image</label>
                  <input type="file" name="banner_image" accept="image/*" onChange={handleFileChange} className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Full Address *</label>
                <textarea name="address_line" value={formData.address_line} onChange={handleChange} rows={2} className={inputClass + " resize-none"} placeholder="Complete kitchen address" required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">City *</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} className={inputClass} placeholder="Pune" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">State *</label>
                  <input type="text" name="state" value={formData.state} onChange={handleChange} className={inputClass} placeholder="Maharashtra" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Pincode *</label>
                  <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} className={inputClass} placeholder="411001" required />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Opening Time</label>
                  <input type="time" name="opening_time" value={formData.opening_time} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Closing Time</label>
                  <input type="time" name="closing_time" value={formData.closing_time} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Delivery Radius (km)</label>
                  <input type="number" name="delivery_radius_km" value={formData.delivery_radius_km} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Min Order (₹)</label>
                  <input type="number" name="minimum_order_amount" value={formData.minimum_order_amount} onChange={handleChange} className={inputClass} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Documents */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Documents & Licenses</h2>
              <p className="text-sm text-muted-foreground mb-4">These are optional but recommended for faster approval.</p>

              <div>
                <label className="block text-sm font-medium mb-1.5">FSSAI License Number</label>
                <input type="text" name="fssai_license" value={formData.fssai_license} onChange={handleChange} className={inputClass} placeholder="14-digit FSSAI number" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">FSSAI Document (PDF/Image)</label>
                <input type="file" name="fssai_document" accept="image/*,.pdf" onChange={handleFileChange} className={inputClass} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">PAN Number</label>
                <input type="text" name="pan_number" value={formData.pan_number} onChange={handleChange} className={inputClass} placeholder="ABCDE1234F" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">GST Number</label>
                <input type="text" name="gst_number" value={formData.gst_number} onChange={handleChange} className={inputClass} placeholder="22AAAAA0000A1Z5" />
              </div>
            </div>
          )}

          {/* Step 3: Bank Details */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Bank Account Details</h2>
              <p className="text-sm text-muted-foreground mb-4">For receiving your earnings. You can add this later too.</p>

              <div>
                <label className="block text-sm font-medium mb-1.5">Bank Name</label>
                <input type="text" name="bank_name" value={formData.bank_name} onChange={handleChange} className={inputClass} placeholder="State Bank of India" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Account Number</label>
                <input type="text" name="bank_account_number" value={formData.bank_account_number} onChange={handleChange} className={inputClass} placeholder="Your bank account number" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">IFSC Code</label>
                <input type="text" name="bank_ifsc" value={formData.bank_ifsc} onChange={handleChange} className={inputClass} placeholder="SBIN0001234" />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 0}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              type="button"
              onClick={nextStep}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
              ) : step === STEPS.length - 1 ? (
                <><Check className="h-4 w-4" /> Submit for Approval</>
              ) : (
                <>Next <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
