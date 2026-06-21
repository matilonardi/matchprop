'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle2, MapPin, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ZONAS_CORDOBA,
  PROPERTY_TYPE_LABELS,
  FINANCING_LABELS,
  URGENCY_OPTIONS,
  REQUIREMENTS,
} from '@/lib/constants'
import { supabase } from '@/lib/supabase'
import type { PublicBuyerRequest, FinancingType } from '@/lib/supabase'

export default function EditRequestForm({
  request,
  closeToken,
}: {
  request: PublicBuyerRequest
  closeToken?: string
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [authorized, setAuthorized] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Form state (initialized from existing request)
  const [zones, setZones] = useState<string[]>(request.zones || [])
  const [propertyTypes, setPropertyTypes] = useState<string[]>(request.property_types || [])
  const [budgetUsd, setBudgetUsd] = useState(String(request.budget_usd || ''))
  const [financing, setFinancing] = useState<FinancingType>((request.financing || 'efectivo') as FinancingType)
  const [bedroomsMin, setBedroomsMin] = useState(String(request.bedrooms_min || ''))
  const [bedroomsMax, setBedroomsMax] = useState(String(request.bedrooms_max || ''))
  const [bathroomsMin, setBathroomsMin] = useState(String(request.bathrooms_min || ''))
  const [description, setDescription] = useState(request.description || '')
  const [urgency, setUrgency] = useState(request.urgency || '')
  const [requirements, setRequirements] = useState<string[]>(request.requirements || [])
  const [zoneSearch, setZoneSearch] = useState('')

  const isCar = request.request_type === 'car'

  // Verify authorization on mount
  useEffect(() => {
    async function checkAuth() {
      if (closeToken) {
        setAuthorized(true)
        setCheckingAuth(false)
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (user && request.buyer_user_id && user.id === request.buyer_user_id) {
        setAuthorized(true)
      }
      setCheckingAuth(false)
    }
    checkAuth()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleZone(zone: string) {
    setZones(prev =>
      prev.includes(zone) ? prev.filter(z => z !== zone) : [...prev, zone]
    )
  }

  function togglePropertyType(type: string) {
    setPropertyTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  function toggleRequirement(req: string) {
    setRequirements(prev =>
      prev.includes(req) ? prev.filter(r => r !== req) : [...prev, req]
    )
  }

  async function handleSave() {
    if (!zones.length) { setError('Seleccioná al menos una zona'); return }
    if (!budgetUsd || isNaN(Number(budgetUsd))) { setError('Ingresá un presupuesto válido'); return }
    if (!isCar && !propertyTypes.length) { setError('Seleccioná al menos un tipo de propiedad'); return }

    setSaving(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

      const res = await fetch(`/api/pedidos/${request.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          close_token: closeToken || undefined,
          zones,
          property_types: propertyTypes,
          budget_usd: Number(budgetUsd),
          financing,
          bedrooms_min: bedroomsMin ? Number(bedroomsMin) : null,
          bedrooms_max: bedroomsMax ? Number(bedroomsMax) : null,
          bathrooms_min: bathroomsMin ? Number(bathroomsMin) : null,
          description: description || null,
          urgency: urgency || null,
          requirements,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Error al guardar')
        return
      }

      setSaved(true)
      // Redirect back after short delay
      setTimeout(() => {
        const backUrl = `/pedidos/${request.id}${closeToken ? `?close_token=${closeToken}` : ''}`
        router.push(backUrl)
      }, 1200)
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <p className="text-gray-700 font-medium mb-2">Acceso no autorizado</p>
        <p className="text-sm text-gray-500 mb-4">Solo el dueño de esta búsqueda puede editarla.</p>
        <Link href={`/pedidos/${request.id}`}>
          <Button variant="outline">Volver al pedido</Button>
        </Link>
      </div>
    )
  }

  if (saved) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
        <p className="text-gray-900 font-semibold text-lg">¡Cambios guardados!</p>
        <p className="text-sm text-gray-500 mt-1">Redirigiendo...</p>
      </div>
    )
  }

  const filteredZones = ZONAS_CORDOBA.filter(z =>
    z.toLowerCase().includes(zoneSearch.toLowerCase())
  )

  return (
    <div>
      <Link
        href={`/pedidos/${request.id}${closeToken ? `?close_token=${closeToken}` : ''}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a mi búsqueda
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900">Editar búsqueda</h1>
          <p className="text-sm text-gray-500 mt-1">Modificá los datos de tu búsqueda publicada.</p>
        </div>

        <div className="p-6 space-y-7">

          {/* Zones */}
          <div>
            <Label className="text-sm font-semibold text-gray-800 mb-3 block flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-orange-500" />
              Zonas donde buscás
            </Label>

            {/* Selected zones chips */}
            {zones.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {zones.map(z => (
                  <button
                    key={z}
                    onClick={() => toggleZone(z)}
                    className="flex items-center gap-1 bg-orange-100 text-orange-800 text-xs px-2.5 py-1 rounded-full hover:bg-orange-200 transition-colors"
                  >
                    {z}
                    <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}

            <Input
              placeholder="Buscar zona..."
              value={zoneSearch}
              onChange={e => setZoneSearch(e.target.value)}
              className="mb-2 text-sm"
            />
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-2 grid grid-cols-2 gap-1">
              {filteredZones.map(zone => (
                <button
                  key={zone}
                  onClick={() => toggleZone(zone)}
                  className={`text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                    zones.includes(zone)
                      ? 'bg-orange-500 text-white font-medium'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>

          {/* Property types (only for property requests) */}
          {!isCar && (
            <div>
              <Label className="text-sm font-semibold text-gray-800 mb-3 block">Tipo de propiedad</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PROPERTY_TYPE_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => togglePropertyType(key)}
                    className={`text-sm px-3.5 py-1.5 rounded-full border transition-colors ${
                      propertyTypes.includes(key)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Budget */}
          <div>
            <Label className="text-sm font-semibold text-gray-800 mb-2 block">Presupuesto máximo (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">USD</span>
              <Input
                type="number"
                value={budgetUsd}
                onChange={e => setBudgetUsd(e.target.value)}
                className="pl-12 text-sm"
                placeholder="200000"
                min={1000}
              />
            </div>
          </div>

          {/* Financing */}
          <div>
            <Label className="text-sm font-semibold text-gray-800 mb-2 block">Forma de pago</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(FINANCING_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFinancing(key as FinancingType)}
                  className={`text-sm px-3.5 py-1.5 rounded-full border transition-colors ${
                    financing === key
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Bedrooms / Bathrooms (property only) */}
          {!isCar && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Dorm. mín.</Label>
                <Input
                  type="number"
                  value={bedroomsMin}
                  onChange={e => setBedroomsMin(e.target.value)}
                  className="text-sm"
                  placeholder="1"
                  min={0}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Dorm. máx.</Label>
                <Input
                  type="number"
                  value={bedroomsMax}
                  onChange={e => setBedroomsMax(e.target.value)}
                  className="text-sm"
                  placeholder="4"
                  min={0}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Baños mín.</Label>
                <Input
                  type="number"
                  value={bathroomsMin}
                  onChange={e => setBathroomsMin(e.target.value)}
                  className="text-sm"
                  placeholder="1"
                  min={0}
                />
              </div>
            </div>
          )}

          {/* Requirements (property only) */}
          {!isCar && (
            <div>
              <Label className="text-sm font-semibold text-gray-800 mb-3 block">Características deseadas</Label>
              <div className="flex flex-wrap gap-2">
                {REQUIREMENTS.map(req => (
                  <button
                    key={req.id}
                    onClick={() => toggleRequirement(req.id)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      requirements.includes(req.id)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {req.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Urgency */}
          <div>
            <Label className="text-sm font-semibold text-gray-800 mb-2 block">¿Cuándo necesitás mudarte?</Label>
            <div className="flex flex-wrap gap-2">
              {URGENCY_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setUrgency(opt.id)}
                  className={`text-sm px-3.5 py-1.5 rounded-full border transition-colors ${
                    urgency === opt.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label className="text-sm font-semibold text-gray-800 mb-2 block">
              Descripción adicional <span className="text-gray-400 font-normal">(opcional)</span>
            </Label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Contá más sobre lo que buscás..."
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 resize-none"
              maxLength={600}
            />
            <p className="text-xs text-gray-400 text-right mt-1">{description.length}/600</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Save button */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</>
              ) : (
                'Guardar cambios'
              )}
            </Button>
            <Link href={`/pedidos/${request.id}${closeToken ? `?close_token=${closeToken}` : ''}`}>
              <Button variant="outline">Cancelar</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
