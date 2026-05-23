'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ArrowRight, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { supabase } from '@/lib/supabase'
import {
  ZONES_CORDOBA,
  URGENCY_OPTIONS,
  CAR_BRANDS,
  CAR_BODY_STYLES,
  CAR_FUEL_TYPES,
  CAR_TRANSMISSION_OPTIONS,
  CAR_CONDITION_OPTIONS,
} from '@/lib/constants'

interface Props {
  onBack: () => void
}

const STEPS = [
  { id: 1, title: 'Tipo de auto' },
  { id: 2, title: 'Zona' },
  { id: 3, title: 'Año y condición' },
  { id: 4, title: 'Presupuesto' },
  { id: 5, title: 'Descripción' },
  { id: 6, title: 'Crear cuenta' },
]

const KM_MAX_OPTIONS = ['30000', '60000', '100000', '150000', '200000']
const BUDGET_OPTIONS = ['8000', '15000', '25000', '40000', '60000', '100000']

const CAR_FINANCING_OPTIONS = [
  { id: 'efectivo', label: '💵 Efectivo' },
  { id: 'credito', label: '🏦 Financiación / Prendario' },
  { id: 'permuta_auto', label: '🚗 Doy auto como parte de pago' },
  { id: 'permuta_propiedad', label: '🏠 Doy propiedad como parte de pago' },
]

export default function PublicarWizardAuto({ onBack }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const captchaRef = useRef<HCaptcha>(null)

  // Step 1
  const [car_body_styles, setCarBodyStyles] = useState<string[]>([])
  const [car_brands, setCarBrands] = useState<string[]>([])

  // Step 2
  const [zones, setZones] = useState<string[]>([])
  const [zoneSearch, setZoneSearch] = useState('')

  // Step 3
  const [car_condition, setCarCondition] = useState('')
  const [car_year_min, setCarYearMin] = useState('')
  const [car_year_max, setCarYearMax] = useState('')
  const [car_km_max, setCarKmMax] = useState('')
  const [car_fuel_types, setCarFuelTypes] = useState<string[]>([])
  const [car_transmission, setCarTransmission] = useState('')

  // Step 4
  const [budget_usd, setBudgetUsd] = useState('')
  const [financing_types, setFinancingTypes] = useState<string[]>([])
  const [urgency, setUrgency] = useState('')

  // Step 5
  const [description, setDescription] = useState('')

  // Step 6
  const [contact_name, setContactName] = useState('')
  const [contact_phone, setContactPhone] = useState('')
  const [contact_email, setContactEmail] = useState('')
  const [contact_password, setContactPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  function toggleItem(arr: string[], item: string): string[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]
  }

  function canProceed(): boolean {
    switch (step) {
      case 1: return car_body_styles.length > 0
      case 2: return zones.length > 0
      case 3: return !!car_condition
      case 4: return !!budget_usd && financing_types.length > 0
      case 5: return description.trim().length >= 10
      case 6: return !!contact_name && !!contact_phone && !!contact_email && contact_email.includes('@') && contact_password.length >= 8 && acceptedTerms
      default: return false
    }
  }

  function handleSubmitClick() {
    if (!canProceed() || loading) return
    setLoading(true)
    setError('')
    captchaRef.current?.execute()
  }

  async function onCaptchaVerify(captchaToken: string) {
    try {
      const ft = financing_types
      const derivedFinancing =
        ft.includes('credito') && !ft.includes('efectivo') ? 'credito'
        : ft.includes('efectivo') && !ft.includes('credito') ? 'efectivo'
        : 'ambos'

      const res = await fetch('/api/buyer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Auth
          email: contact_email,
          password: contact_password,
          name: contact_name,
          phone: contact_phone,
          captcha_token: captchaToken,
          // Request
          request_type: 'car',
          property_types: [],
          zones,
          budget_usd: parseInt(budget_usd),
          financing: derivedFinancing,
          financing_types,
          car_body_styles,
          car_brands,
          car_year_min: car_year_min ? parseInt(car_year_min) : null,
          car_year_max: car_year_max ? parseInt(car_year_max) : null,
          car_condition,
          car_km_max: car_km_max ? parseInt(car_km_max) : null,
          car_fuel_types,
          car_transmission: car_transmission || null,
          description,
          urgency: urgency || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        captchaRef.current?.resetCaptcha()
        setError(data.error || 'Error al publicar')
        setLoading(false)
        return
      }

      const { id, close_token } = await res.json()

      // Auto sign-in
      await supabase.auth.signInWithPassword({ email: contact_email, password: contact_password })

      router.push(`/pedidos/${id}?nuevo=1&close_token=${close_token}`)
    } catch (err) {
      captchaRef.current?.resetCaptcha()
      setError(err instanceof Error ? err.message : 'Error inesperado')
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

        {/* Step 1: Body style + brands */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <p className="text-gray-600 mb-4">¿Qué tipo de auto buscás? Podés elegir más de uno.</p>
              <div className="grid grid-cols-2 gap-3">
                {CAR_BODY_STYLES.map(({ id, label, icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCarBodyStyles(toggleItem(car_body_styles, id))}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      car_body_styles.includes(id)
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{icon}</div>
                    <div className="font-medium text-gray-900">{label}</div>
                    {car_body_styles.includes(id) && (
                      <CheckCircle2 className="h-4 w-4 text-orange-500 mt-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Marcas preferidas (opcional)
              </Label>
              <div className="flex flex-wrap gap-2">
                {CAR_BRANDS.map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => setCarBrands(toggleItem(car_brands, brand))}
                    className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                      car_brands.includes(brand)
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Zones */}
        {step === 2 && (
          <div>
            <p className="text-gray-600 mb-3">¿En qué zonas? Podés elegir varias.</p>
            <input
              type="text"
              placeholder="🔍 Buscar barrio o ciudad..."
              value={zoneSearch}
              onChange={e => setZoneSearch(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
            />
            <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
              {ZONES_CORDOBA.filter(z => z.toLowerCase().includes(zoneSearch.toLowerCase())).length === 0 && (
                <p className="text-sm text-gray-400 py-4 text-center">Sin resultados para &quot;{zoneSearch}&quot;</p>
              )}
              {ZONES_CORDOBA.filter(z => z.toLowerCase().includes(zoneSearch.toLowerCase())).map((zone) => (
                <label
                  key={zone}
                  className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                    zones.includes(zone) ? 'bg-orange-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <Checkbox
                    checked={zones.includes(zone)}
                    onCheckedChange={() => setZones(toggleItem(zones, zone))}
                  />
                  <span className="text-sm text-gray-800">{zone}</span>
                </label>
              ))}
            </div>
            {zones.length > 0 && (
              <p className="mt-3 text-xs text-orange-500 font-medium">
                ✓ {zones.length} zona{zones.length > 1 ? 's' : ''}: {zones.slice(0, 3).join(', ')}{zones.length > 3 ? ` +${zones.length - 3}` : ''}
              </p>
            )}
          </div>
        )}

        {/* Step 3: Year, condition, km, fuel, transmission */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Condition */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Condición <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {CAR_CONDITION_OPTIONS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCarCondition(id)}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      car_condition === id
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Year range */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Año (opcional)
              </Label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Desde (ej: 2018)"
                    value={car_year_min}
                    onChange={(e) => setCarYearMin(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Hasta (ej: 2024)"
                    value={car_year_max}
                    onChange={(e) => setCarYearMax(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* km_max — only for used */}
            {car_condition === 'usado' && (
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Kilometraje máximo (opcional)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {KM_MAX_OPTIONS.map((km) => (
                    <button
                      key={km}
                      type="button"
                      onClick={() => setCarKmMax(car_km_max === km ? '' : km)}
                      className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                        car_km_max === km
                          ? 'border-orange-500 bg-orange-50 text-orange-600'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {(parseInt(km) / 1000).toFixed(0)}k km
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fuel types */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Combustible (opcional)
              </Label>
              <div className="flex flex-wrap gap-2">
                {CAR_FUEL_TYPES.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCarFuelTypes(toggleItem(car_fuel_types, id))}
                    className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                      car_fuel_types.includes(id)
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Transmission */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Caja (opcional)
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {CAR_TRANSMISSION_OPTIONS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCarTransmission(car_transmission === id ? '' : id)}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      car_transmission === id
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
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

        {/* Step 4: Budget + financing + urgency */}
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
                  placeholder="25000"
                  value={budget_usd}
                  onChange={(e) => setBudgetUsd(e.target.value)}
                  className="pl-12"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {BUDGET_OPTIONS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setBudgetUsd(v)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      budget_usd === v
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    USD {parseInt(v).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Financing types */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1 block">
                ¿Cómo vas a pagar? <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-gray-400 mb-3">Podés combinar varias opciones.</p>
              <div className="space-y-2">
                {CAR_FINANCING_OPTIONS.map(({ id, label }) => {
                  const selected = financing_types.includes(id)
                  return (
                    <label
                      key={id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        selected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => setFinancingTypes(toggleItem(financing_types, id))}
                      />
                      <span className="text-sm font-medium text-gray-800">{label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Urgency */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Urgencia (opcional)</Label>
              <div className="grid grid-cols-2 gap-2">
                {URGENCY_OPTIONS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setUrgency(urgency === id ? '' : id)}
                    className={`p-3 rounded-xl border-2 text-left text-xs font-medium transition-all ${
                      urgency === id
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
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

        {/* Step 5: Description */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1 block">
                Contanos más sobre lo que buscás <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-gray-400 mb-2">
                Los vendedores leen esto antes de contactarte. Cuanto más claro, mejor.
              </p>
              <Textarea
                placeholder="Ej: busco una Toyota RAV4 o similar, modelo 2020 en adelante. Prefiero GNC..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <p className={`text-xs mt-1 ${description.trim().length < 10 ? 'text-gray-400' : 'text-green-600'}`}>
                {description.trim().length < 10
                  ? `Mínimo 10 caracteres (${description.trim().length}/10)`
                  : '✓ Listo'}
              </p>
            </div>
          </div>
        )}

        {/* Step 6: Create account */}
        {step === 6 && (
          <div className="space-y-5">
            <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
              🔒 Creá tu cuenta para gestionar tu búsqueda y recibir mensajes de vendedores.
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Tu nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Juan García"
                value={contact_name}
                onChange={(e) => setContactName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Teléfono / WhatsApp <span className="text-red-500">*</span>
              </Label>
              <Input
                type="tel"
                placeholder="+54 9 351 xxx xxxx"
                value={contact_phone}
                onChange={(e) => setContactPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                placeholder="juan@email.com"
                value={contact_email}
                onChange={(e) => setContactEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Contraseña <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={contact_password}
                  onChange={(e) => setContactPassword(e.target.value)}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {contact_password.length > 0 && contact_password.length < 8 && (
                <p className="text-xs text-red-500 mt-1">Mínimo 8 caracteres ({contact_password.length}/8)</p>
              )}
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <p className="font-medium text-gray-900 mb-3">Resumen de tu búsqueda:</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-600">
                <span>🚗 {car_body_styles.join(', ') || 'Auto'}</span>
                {car_brands.length > 0 && <span>🏷 {car_brands.slice(0, 3).join(', ')}</span>}
                <span>📍 {zones.slice(0, 3).join(', ')}{zones.length > 3 ? ` +${zones.length - 3}` : ''}</span>
                <span>💰 USD {parseInt(budget_usd || '0').toLocaleString()}</span>
                {car_condition && (
                  <span>🔑 {car_condition === 'nuevo' ? '0km' : car_condition === 'usado' ? 'Usado' : 'Cualquiera'}</span>
                )}
              </div>
            </div>

            {/* T&C */}
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={acceptedTerms}
                onCheckedChange={(v) => setAcceptedTerms(!!v)}
                className="mt-0.5"
              />
              <span className="text-sm text-gray-600">
                Leí y acepto los{' '}
                <a href="/terminos" target="_blank" className="text-blue-600 underline hover:text-blue-700">
                  términos y condiciones
                </a>{' '}
                y la{' '}
                <a href="/privacidad" target="_blank" className="text-blue-600 underline hover:text-blue-700">
                  política de privacidad
                </a>
                . Entiendo que mis datos de contacto serán visibles para vendedores que paguen.
              </span>
            </label>

            <HCaptcha
              sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY || '10000000-ffff-ffff-ffff-000000000001'}
              size="invisible"
              onVerify={onCaptchaVerify}
              onError={() => { setLoading(false); setError('Error de verificación. Intentá de nuevo.') }}
              onExpire={() => { setLoading(false); setError('Verificación expirada. Intentá de nuevo.'); captchaRef.current?.resetCaptcha() }}
              ref={captchaRef}
            />

            {error && (
              <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm">{error}</div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          {step === 1 ? (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cambiar tipo
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={loading}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Atrás
            </Button>
          )}

          {step < STEPS.length ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Siguiente
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmitClick}
              disabled={!canProceed() || loading}
              className="bg-orange-500 hover:bg-orange-600"
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
