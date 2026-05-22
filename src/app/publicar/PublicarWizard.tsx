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
import { ZONES_CORDOBA, REQUIREMENTS, URGENCY_OPTIONS, PRIORITY_OPTIONS, PROPERTY_TYPE_LABELS, FINANCING_LABELS } from '@/lib/constants'

type PropertyType = 'casa' | 'departamento' | 'duplex' | 'ph' | 'terreno' | 'local' | 'renta' | 'revaluo'
type FinancingType = 'efectivo' | 'credito' | 'ambos'

interface FormData {
  property_types: PropertyType[]
  zones: string[]
  bedrooms_min: string
  bedrooms_max: string
  bathrooms_min: string
  budget_usd: string
  financing: FinancingType | ''
  financing_types: string[]
  financing_cash_pct: string
  financing_bank: string
  financing_precalified: string
  search_reason: string
  requirements: string[]
  requirements_excluyentes: string[]
  priorities: string[]
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
  { id: 'terreno', label: 'Terreno', icon: '🌿' },
  { id: 'local', label: 'Local Comercial', icon: '🏪' },
  { id: 'renta', label: 'Para renta (cualquier tipo/zona)', icon: '💵' },
  { id: 'revaluo', label: 'Para revalúo (cualquier tipo/zona)', icon: '📈' },
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
    financing_types: [],
    financing_cash_pct: '',
    financing_bank: '',
    financing_precalified: '',
    search_reason: '',
    requirements: [],
    requirements_excluyentes: [],
    priorities: [],
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
      case 4: return !!form.budget_usd && form.financing_types.length > 0 && !!form.search_reason
      case 5: return (form.requirements.length + form.requirements_excluyentes.length) >= 1 && form.description.trim().length >= 15
      case 6: return !!form.contact_name && !!form.contact_phone
      default: return false
    }
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      // Derive legacy financing field from financing_types
      const ft = form.financing_types
      const derivedFinancing: FinancingType =
        ft.includes('credito') && !ft.includes('efectivo') ? 'credito'
        : ft.includes('efectivo') && !ft.includes('credito') ? 'efectivo'
        : 'ambos'

      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          financing: derivedFinancing,
          bedrooms_min: form.bedrooms_min ? parseInt(form.bedrooms_min) : null,
          bedrooms_max: form.bedrooms_max ? parseInt(form.bedrooms_max) : null,
          bathrooms_min: form.bathrooms_min ? parseInt(form.bathrooms_min) : null,
          budget_usd: parseInt(form.budget_usd),
          financing_cash_pct: form.financing_cash_pct ? parseInt(form.financing_cash_pct) : null,
          financing_precalified: form.financing_precalified === 'si' ? true : form.financing_precalified === 'no' ? false : null,
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

        {/* Step 4: Budget + Financing + Search reason */}
        {step === 4 && (
          <div className="space-y-6">
            {/* Budget */}
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
                  <button key={v} type="button"
                    onClick={() => setForm((f) => ({ ...f, budget_usd: v }))}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${form.budget_usd === v ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    USD {parseInt(v).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Financing types — multi-select with conditional sub-fields */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1 block">
                ¿Cómo vas a pagar? <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-gray-400 mb-3">Podés combinar varias opciones.</p>
              <div className="space-y-2">
                {[
                  { id: 'efectivo', label: '💵 Efectivo' },
                  { id: 'credito', label: '🏦 Crédito hipotecario' },
                  { id: 'permuta_propiedad', label: '🏠 Doy propiedad como parte de pago' },
                  { id: 'permuta_auto', label: '🚗 Doy auto como parte de pago' },
                ].map(({ id, label }) => {
                  const selected = form.financing_types.includes(id)
                  return (
                    <div key={id}>
                      <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <Checkbox checked={selected}
                          onCheckedChange={() => setForm((f) => ({ ...f, financing_types: toggleArrayItem(f.financing_types, id) }))} />
                        <span className="text-sm font-medium text-gray-800">{label}</span>
                      </label>
                      {/* Sub-fields */}
                      {selected && id === 'efectivo' && (
                        <div className="ml-4 mt-2 mb-1">
                          <Label className="text-xs text-gray-500 mb-1.5 block">¿Qué % del total pagás en efectivo?</Label>
                          <div className="flex flex-wrap gap-2">
                            {['25', '50', '75', '100'].map((pct) => (
                              <button key={pct} type="button"
                                onClick={() => setForm((f) => ({ ...f, financing_cash_pct: f.financing_cash_pct === pct ? '' : pct }))}
                                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${form.financing_cash_pct === pct ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-600'}`}>
                                {pct}%
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {selected && id === 'credito' && (
                        <div className="ml-4 mt-2 mb-1 space-y-2">
                          <Input placeholder="Banco (ej: Galicia, Nación, Santander...)"
                            value={form.financing_bank}
                            onChange={(e) => setForm((f) => ({ ...f, financing_bank: e.target.value }))}
                            className="text-sm" />
                          <div className="flex gap-2">
                            <span className="text-xs text-gray-500 self-center">¿Estás precalificado?</span>
                            {['si', 'no'].map((opt) => (
                              <button key={opt} type="button"
                                onClick={() => setForm((f) => ({ ...f, financing_precalified: f.financing_precalified === opt ? '' : opt }))}
                                className={`text-xs px-4 py-1.5 rounded-full border transition-colors font-medium ${form.financing_precalified === opt ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-600'}`}>
                                {opt === 'si' ? 'Sí' : 'No'}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Search reason */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                ¿Por qué estás buscando? <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'primera_vivienda', label: '🏡 Primera vivienda' },
                  { id: 'cambio_vivienda', label: '🔄 Cambio de vivienda' },
                  { id: 'inversion_renta', label: '💵 Inversión para renta' },
                  { id: 'inversion_revaluo', label: '📈 Inversión para revalúo' },
                  { id: 'mudanza', label: '📦 Mudanza de zona' },
                  { id: 'otro', label: '💬 Otro motivo' },
                ].map(({ id, label }) => (
                  <button key={id} type="button"
                    onClick={() => setForm((f) => ({ ...f, search_reason: f.search_reason === id ? '' : id }))}
                    className={`p-3 rounded-xl border-2 text-left text-xs font-medium transition-all ${form.search_reason === id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Urgency */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Urgencia</Label>
              <div className="grid grid-cols-2 gap-2">
                {URGENCY_OPTIONS.map(({ id, label }) => (
                  <button key={id} type="button"
                    onClick={() => setForm((f) => ({ ...f, urgency: f.urgency === id ? '' : id }))}
                    className={`p-3 rounded-xl border-2 text-left text-xs font-medium transition-all ${form.urgency === id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Requirements (3-state) + Description */}
        {step === 5 && (() => {
          const getReqState = (id: string): 'none' | 'importante' | 'excluyente' => {
            if (form.requirements_excluyentes.includes(id)) return 'excluyente'
            if (form.requirements.includes(id)) return 'importante'
            return 'none'
          }
          const cycleReq = (id: string) => {
            const s = getReqState(id)
            setForm((f) => {
              if (s === 'none') return { ...f, requirements: [...f.requirements, id] }
              if (s === 'importante') return {
                ...f,
                requirements: f.requirements.filter(r => r !== id),
                requirements_excluyentes: [...f.requirements_excluyentes, id],
              }
              return { ...f, requirements_excluyentes: f.requirements_excluyentes.filter(r => r !== id) }
            })
          }
          const total = form.requirements.length + form.requirements_excluyentes.length
          return (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Requisitos de la propiedad <span className="text-red-500">*</span>
                </p>
                <p className="text-xs text-gray-400 mb-3">
                  Tocá una vez = <span className="text-blue-600 font-medium">Importante</span> · Tocá de nuevo = <span className="text-red-600 font-medium">Excluyente</span> · Tocá otra vez = Quitar
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {REQUIREMENTS.map(({ id, label }) => {
                    const state = getReqState(id)
                    return (
                      <button key={id} type="button" onClick={() => cycleReq(id)}
                        className={`p-3 rounded-xl border-2 text-left text-sm transition-all relative ${
                          state === 'excluyente' ? 'border-red-400 bg-red-50'
                          : state === 'importante' ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}>
                        <span className={state === 'none' ? 'text-gray-700' : state === 'importante' ? 'text-blue-800' : 'text-red-800'}>
                          {label}
                        </span>
                        {state !== 'none' && (
                          <span className={`block text-xs font-semibold mt-0.5 ${state === 'importante' ? 'text-blue-600' : 'text-red-600'}`}>
                            {state === 'importante' ? '✓ Importante' : '⛔ Excluyente'}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                <p className={`text-xs mt-2 ${total === 0 ? 'text-gray-400' : 'text-green-600'}`}>
                  {total === 0 ? 'Seleccioná al menos un requisito' : `✓ ${total} requisito${total > 1 ? 's' : ''} marcado${total > 1 ? 's' : ''}`}
                </p>
              </div>

              {/* Description — mandatory */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">
                  Contanos más sobre tu búsqueda <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-gray-400 mb-2">
                  Las inmobiliarias leen esto antes de contactarte. Cuanto más claro, mejor.
                </p>
                <Textarea
                  placeholder="Ej: busco algo moderno, no más de 10 años. Cocina integrada al living imprescindible. Prefiero planta baja o primer piso..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4} className="resize-none"
                />
                <p className={`text-xs mt-1 ${form.description.trim().length < 15 ? 'text-gray-400' : 'text-green-600'}`}>
                  {form.description.trim().length < 15
                    ? `Mínimo 15 caracteres (${form.description.trim().length}/15)`
                    : '✓ Listo'}
                </p>
              </div>
            </div>
          )
        })()}

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
