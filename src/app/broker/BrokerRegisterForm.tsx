'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ZONES_CORDOBA } from '@/lib/constants'
import { supabase } from '@/lib/supabase'

export default function BrokerRegisterForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedZones, setSelectedZones] = useState<string[]>([])
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [zoneSearch, setZoneSearch] = useState('')
  const [showZones, setShowZones] = useState(false)

  const [form, setForm] = useState({
    name: '',
    agency_name: '',
    phone: '',
    email: '',
    password: '',
  })

  function toggleZone(zone: string) {
    setSelectedZones((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedZones.length === 0) {
      setError('Seleccioná al menos una zona de trabajo')
      return
    }
    if (!acceptedTerms) {
      setError('Tenés que aceptar los términos y condiciones para continuar')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/broker/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, zones: selectedZones }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al registrarse')
      }
      // Auto sign-in after successful registration
      await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
      router.push('/broker/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm mb-1 block">Nombre *</Label>
          <Input
            placeholder="Juan García"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label className="text-sm mb-1 block">Inmobiliaria / Agencia</Label>
          <Input
            placeholder="Must Brokers"
            value={form.agency_name}
            onChange={(e) => setForm((f) => ({ ...f, agency_name: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label className="text-sm mb-1 block">Email *</Label>
        <Input
          type="email"
          placeholder="juan@email.com"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label className="text-sm mb-1 block">Teléfono / WhatsApp *</Label>
        <Input
          type="tel"
          placeholder="+54 9 351 xxx xxxx"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label className="text-sm mb-1 block">Contraseña *</Label>
        <Input
          type="password"
          placeholder="Mínimo 8 caracteres"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          minLength={8}
          required
        />
      </div>

      {/* Zone selector */}
      <div>
        <button
          type="button"
          onClick={() => setShowZones(!showZones)}
          className="w-full p-3 rounded-xl border border-gray-200 text-left text-sm flex items-center justify-between hover:border-gray-300 transition-colors"
        >
          <span className={selectedZones.length === 0 ? 'text-gray-400' : 'text-gray-900 font-medium'}>
            {selectedZones.length === 0
              ? 'Seleccioná tus zonas de trabajo *'
              : `${selectedZones.length} zona${selectedZones.length > 1 ? 's' : ''} seleccionada${selectedZones.length > 1 ? 's' : ''}`}
          </span>
          <span className="text-gray-400">{showZones ? '▲' : '▼'}</span>
        </button>

        {showZones && (
          <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden">
            {/* Search */}
            <div className="px-3 pt-2.5 pb-1.5 border-b border-gray-100">
              <input
                type="text"
                placeholder="🔍 Buscar barrio o ciudad..."
                value={zoneSearch}
                onChange={e => setZoneSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
              />
            </div>
            {/* Select all row — only when no search active */}
            {zoneSearch === '' && (
              <label className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                <Checkbox
                  checked={selectedZones.length === ZONES_CORDOBA.length}
                  onCheckedChange={(v) =>
                    setSelectedZones(v ? [...ZONES_CORDOBA] : [])
                  }
                />
                Seleccionar todas las zonas
              </label>
            )}
            <div className="max-h-48 overflow-y-auto p-3 space-y-1">
              {ZONES_CORDOBA.filter(z => z.toLowerCase().includes(zoneSearch.toLowerCase())).length === 0 && (
                <p className="text-sm text-gray-400 py-2 text-center">Sin resultados</p>
              )}
              {ZONES_CORDOBA.filter(z => z.toLowerCase().includes(zoneSearch.toLowerCase())).map((zone) => (
                <label
                  key={zone}
                  className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer text-sm transition-colors ${
                    selectedZones.includes(zone) ? 'bg-orange-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <Checkbox
                    checked={selectedZones.includes(zone)}
                    onCheckedChange={() => toggleZone(zone)}
                  />
                  {zone}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-500 hover:bg-orange-600"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creando cuenta...</>
        ) : (
          <><CheckCircle2 className="h-4 w-4 mr-2" />Crear cuenta gratis</>
        )}
      </Button>

      <label className="flex items-start gap-3 cursor-pointer">
        <Checkbox
          checked={acceptedTerms}
          onCheckedChange={(v) => setAcceptedTerms(!!v)}
          className="mt-0.5"
        />
        <span className="text-xs text-gray-500 leading-relaxed">
          Leí y acepto los{' '}
          <a href="/terminos" target="_blank" className="text-blue-600 underline hover:text-blue-700">
            términos y condiciones
          </a>{' '}
          y la{' '}
          <a href="/privacidad" target="_blank" className="text-blue-600 underline hover:text-blue-700">
            política de privacidad
          </a>
          . Recibirás alertas de nuevos pedidos en tus zonas.
        </span>
      </label>
    </form>
  )
}
