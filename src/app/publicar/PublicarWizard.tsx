'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ArrowRight, ArrowLeft, Home, Building2, Layers, MapPin, DollarSign, User, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { ZONES_CORDOBA, REQUIREMENTS, URGENCY_OPTIONS, PROPERTY_TYPE_LABELS, FINANCING_LABELS } from '@/lib/constants'

type PropertyType = 'casa' | 'departamento' | 'duplex' | 'ph'
type FinancingType = 'efectivo' | 'credito' | 'ambos'

interface FormData {
  property_types: PropertyType[]
  zones: string[]
  bedrooms_min: string
  bedrooms_max: string
  bathrooms_min: string
  budget_usd: string
  financing: FinancingType | ''
  requirements: string[]
  description: string
  urgency: string
  contact_name: string
  contact_phone: string
  contact_email: string
}

const STEPS = [
  { id: 1, title: 'Tipo de propiedad', icon: Home },
  { id: 2, title: 'Zona', icon: MapPin },
  { id: 3, title: 'Dormitorios y baños', icon: Layers },
  { id: 4, title: 'Presupuesto', icon: DollarSign },
  { id: 5, title: 'Requisitos', icon: Building2 },
  { id: 6, title: 'Tu contacto', icon: User },
]

const PROPERTY_TYPES: { id: PropertyType; label: string; icon: string }[] = [
  { id: 'casa', label: 'Casa', icon: '🏡' },
  { id: 'departamento', label: 'Departamento', icon: '🏢' },
  { id: 'duplex', label: 'Dúplex', icon: '🏘' },
  { id: 'ph', label: 'PH', icon: '🏠' },
]

export default function PublicarWizard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<FormData>({
    property_types: [],
    zones: [],
    bedrooms_min: '',
    bedrooms_max: '',
    bathrooms_min: '',
    budget_usd: '',
    financing: '',
    requirements: [],
    description: '',
    urgency: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
  })

  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  function toggleArrayItem<T extends string>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]
  }

  function canProceed(): boolean {
    switch (step) {
      case 1: return form.property_types.length > 0
      case 2: return form.zones.length > 0
      case 3: return !!form.bedrooms_min
      case 4: return !!form.budget_usd && !!form.financing
      case 5: return true
      case 6: return !!form.contact_name && !!form.contact_phone
      default: return false
    }
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          bedrooms_min: form.bedrooms_min ? parseInt(form.bedrooms_min) : null,
          bedrooms_max: form.bedrooms_max ? parseInt(form.bedrooms_max) : null,
          bathrooms_min: form.bathrooms_min ? parseInt(form.bathrooms_min) : null,
          budget_usd: parseInt(form.budget_usd),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al publicar')
      }
      const { id } = await res.json()
      router.push(`/pedidos/${id}?nuevo=1`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Progress */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-900">
            Paso {step} de {STEPS.length}: {STEPS[step - 1].title}
          </span>
          <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      <div className="p-6">
        {/* Step 1: Property type */}
        {step === 1 && (
          <div>
            <p className="text-gray-600 mb-5">¿Qué tipo de propiedad buscás? Podés elegir más de una.</p>
            <div className="grid grid-cols-2 gap-3">
              {PROPERTY_TYPES.map(({ id, label, icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      property_types: toggleArrayItem(f.property_types, id),
                    }))
                  }
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    form.property_types.includes(id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{icon}</div>
                  <div className="font-medium text-gray-900">{label}</div>
                  {form.property_types.includes(id) && (
                    <CheckCircle2 className="h-4 w-4 text-blue-500 mt-1" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Zones */}
        {step === 2 && (
          <div>
            <p className="text-gray-600 mb-5">¿En qué zonas o barrios? Podés elegir varios.</p>
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-2">
              {ZONES_CORDOBA.map((zone) => (
                <label
                  key={zone}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    form.zones.includes(zone) ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <Checkbox
                    checked={form.zones.includes(zone)}
                    onCheckedChange={() =>
                      setForm((f) => ({ ...f, zones: toggleArrayItem(f.zones, zone) }))
                    }
                  />
                  <span className="text-sm text-gray-800">{zone}</span>
                </label>
              ))}
            </div>
            {form.zones.length > 0 && (
              <p className="mt-3 text-xs text-blue-600 font-medium">
                {form.zones.length} zona{form.zones.length > 1 ? 's' : ''} seleccionada{form.zones.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* Step 3: Rooms */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Dormitorios mínimos <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                {['1', '2', '3', '4', '5+'].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, bedrooms_min: n === '5+' ? '5' : n }))}
                    className={`w-12 h-12 rounded-xl border-2 font-medium text-sm transition-all ${
                      form.bedrooms_min === (n === '5+' ? '5' : n)
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Dormitorios máximos (opcional)
              </Label>
              <div className="flex gap-2">
                {['1', '2', '3', '4', '5+'].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      const val = n === '5+' ? '5' : n
                      setForm((f) => ({
                        ...f,
                        bedrooms_max: f.bedrooms_max === val ? '' : val,
                      }))
                    }}
                    className={`w-12 h-12 rounded-xl border-2 font-medium text-sm transition-all ${
                      form.bedrooms_max === (n === '5+' ? '5' : n)
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Baños mínimos
              </Label>
              <div className="flex gap-2">
                {['1', '1.5', '2', '3+'].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, bathrooms_min: n === '3+' ? '3' : n }))}
                    className={`px-4 h-12 rounded-xl border-2 font-medium text-sm transition-all ${
                      form.bathrooms_min === (n === '3+' ? '3' : n)
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Budget */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Presupuesto máximo en USD <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">USD</span>
                <Input
                  type="number"
                  placeholder="230000"
                  value={form.budget_usd}
                  onChange={(e) => setForm((f) => ({ ...f, budget_usd: e.target.value }))}
                  className="pl-12"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {['70000', '150000', '230000', '400000', '620000'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, budget_usd: v }))}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      form.budget_usd === v
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    USD {parseInt(v).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Tipo de financiación <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-2">
                {(Object.entries(FINANCING_LABELS) as [FinancingType, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, financing: key }))}
                    className={`w-full p-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                      form.financing === key
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Urgencia
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {URGENCY_OPTIONS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, urgency: f.urgency === id ? '' : id }))}
                    className={`p-3 rounded-xl border-2 text-left text-xs font-medium transition-all ${
                      form.urgency === id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Requirements */}
        {step === 5 && (
          <div className="space-y-5">
            <div>
              <p className="text-gray-600 mb-4">¿Algún requisito importante? (opcional)</p>
              <div className="grid grid-cols-2 gap-2">
                {REQUIREMENTS.map(({ id, label }) => (
                  <label
                    key={id}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                      form.requirements.includes(id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Checkbox
                      checked={form.requirements.includes(id)}
                      onCheckedChange={() =>
                        setForm((f) => ({ ...f, requirements: toggleArrayItem(f.requirements, id) }))
                      }
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Algo más que quieras aclarar (opcional)
              </Label>
              <Textarea
                placeholder="Ej: busco algo moderno, no más de 10 años, living amplio, cocina integrada..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 6: Contact */}
        {step === 6 && (
          <div className="space-y-5">
            <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
              🔒 Tu contacto solo es visible para inmobiliarias que pagan para verlo. Cero spam.
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Tu nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Juan García"
                value={form.contact_name}
                onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Teléfono / WhatsApp <span className="text-red-500">*</span>
              </Label>
              <Input
                type="tel"
                placeholder="+54 9 351 xxx xxxx"
                value={form.contact_phone}
                onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Email (opcional)
              </Label>
              <Input
                type="email"
                placeholder="juan@email.com"
                value={form.contact_email}
                onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <p className="font-medium text-gray-900 mb-3">Resumen de tu búsqueda:</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-600">
                <span>📦 {form.property_types.map((t) => PROPERTY_TYPE_LABELS[t]).join(', ')}</span>
                <span>📍 {form.zones.slice(0, 3).join(', ')}{form.zones.length > 3 ? ` +${form.zones.length - 3}` : ''}</span>
                <span>🛏 {form.bedrooms_min}{form.bedrooms_max ? `–${form.bedrooms_max}` : '+'} dorm.</span>
                <span>💰 USD {parseInt(form.budget_usd).toLocaleString()}</span>
                <span>💳 {FINANCING_LABELS[form.financing as FinancingType]}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm">{error}</div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Atrás
            </Button>
          ) : (
            <div />
          )}

          {step < STEPS.length ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Siguiente
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  Publicar búsqueda
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
