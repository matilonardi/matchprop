'use client'

import { useState } from 'react'
import { Loader2, LogIn, UserPlus, ArrowLeft, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { ZONES_CORDOBA } from '@/lib/constants'

export default function BrokerLoginForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // "Complete profile" state — shown when auth succeeds but no broker_profile exists
  type Specialty = 'propiedades' | 'vehiculos' | 'ambos'
  const SPECIALTIES: { value: Specialty; label: string; sublabel: string; icon: string }[] = [
    { value: 'propiedades', label: 'Propiedades',  sublabel: 'Casas, deptos, terrenos', icon: '🏠' },
    { value: 'vehiculos',   label: 'Vehículos',    sublabel: 'Autos, motos, camiones', icon: '🚗' },
    { value: 'ambos',       label: 'Ambos',         sublabel: 'Todo tipo de activos',   icon: '✨' },
  ]

  const [forgotPassword, setForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)

  const [needsProfile, setNeedsProfile] = useState(false)
  const [pendingUserId, setPendingUserId] = useState('')
  const [profileName, setProfileName] = useState('')
  const [profileAgency, setProfileAgency] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [profileZones, setProfileZones] = useState<string[]>([])
  const [profileSpecialty, setProfileSpecialty] = useState<Specialty>('propiedades')
  const [zonesOpen, setZonesOpen] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError('Email o contraseña incorrectos. Verificá tus datos.')
        return
      }
      const res = await fetch(`/api/broker/me?userId=${data.user.id}`)
      if (!res.ok) {
        // Authenticated but no broker_profile — ask them to complete it
        setPendingUserId(data.user.id)
        setNeedsProfile(true)
        return
      }
      window.location.href = '/broker/dashboard'
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCompleteProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!profileName.trim() || profileZones.length === 0) {
      setError('Completá tu nombre y seleccioná al menos una zona.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/broker/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: pendingUserId,
          email,
          name: profileName.trim(),
          agency_name: profileAgency.trim() || null,
          phone: profilePhone.trim(),
          zones: profileZones,
          specialty: profileSpecialty,
          skipAuthCreate: true, // signal to API to skip creating auth user
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'No se pudo crear el perfil. Intentá de nuevo.')
        return
      }
      window.location.href = '/broker/dashboard'
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!resetEmail.trim()) return
    setLoading(true)
    setError('')
    try {
      const redirectTo = `${window.location.origin}/broker/reset-password`
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), { redirectTo })
      if (resetError) throw resetError
      setResetSent(true)
    } catch {
      setError('No pudimos enviar el email. Verificá la dirección e intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  function toggleZone(zone: string) {
    setProfileZones((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
    )
  }

  // ── Complete-profile form ──
  if (needsProfile) {
    return (
      <form onSubmit={handleCompleteProfile} className="space-y-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">Completá tu perfil de broker</p>
          <p className="text-blue-600">Tu cuenta existe pero le faltan algunos datos. Completá los campos para continuar.</p>
        </div>

        <div>
          <Label className="text-sm mb-1 block">Nombre completo *</Label>
          <Input
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Juan García"
            required
          />
        </div>

        <div>
          <Label className="text-sm mb-1 block">Inmobiliaria / Agencia</Label>
          <Input
            value={profileAgency}
            onChange={(e) => setProfileAgency(e.target.value)}
            placeholder="Opcional"
          />
        </div>

        <div>
          <Label className="text-sm mb-1 block">Teléfono / WhatsApp</Label>
          <Input
            value={profilePhone}
            onChange={(e) => setProfilePhone(e.target.value)}
            placeholder="+54 9 351 xxx xxxx"
          />
        </div>

        <div>
          <Label className="text-sm mb-2 block">¿En qué te especializás? *</Label>
          <div className="grid grid-cols-3 gap-2">
            {SPECIALTIES.map(({ value, label, sublabel, icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setProfileSpecialty(value)}
                className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl border-2 text-center transition-all duration-150 ${
                  profileSpecialty === value
                    ? 'border-orange-400 bg-orange-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-2xl leading-none">{icon}</span>
                <span className={`text-sm font-semibold leading-tight ${profileSpecialty === value ? 'text-orange-700' : 'text-gray-800'}`}>
                  {label}
                </span>
                <span className="text-[10px] leading-tight text-gray-400">{sublabel}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm mb-1 block">Zonas de trabajo *</Label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setZonesOpen((o) => !o)}
              className="w-full flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white hover:bg-gray-50 transition-colors"
            >
              <span className={profileZones.length ? 'text-gray-900' : 'text-gray-400'}>
                {profileZones.length ? `${profileZones.length} zona${profileZones.length > 1 ? 's' : ''} seleccionada${profileZones.length > 1 ? 's' : ''}` : 'Seleccioná tus zonas'}
              </span>
              <span className="text-gray-400">▾</span>
            </button>
            {zonesOpen && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                {ZONES_CORDOBA.map((zone) => (
                  <label key={zone} className="flex items-center gap-2 px-3 py-2 hover:bg-orange-50 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={profileZones.includes(zone)}
                      onChange={() => toggleZone(zone)}
                      className="accent-orange-500"
                    />
                    {zone}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>
        )}

        <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600">
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</>
          ) : (
            <><UserPlus className="h-4 w-4 mr-2" />Completar y entrar al dashboard</>
          )}
        </Button>
      </form>
    )
  }

  // ── Forgot password screen ──
  if (forgotPassword) {
    if (resetSent) {
      return (
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="bg-green-100 rounded-full p-4">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-lg">¡Email enviado!</p>
            <p className="text-sm text-gray-500 mt-1">
              Revisá <span className="font-medium text-gray-700">{resetEmail}</span>.
              Te mandamos un link para crear una nueva contraseña.
            </p>
            <p className="text-xs text-gray-400 mt-2">Si no lo ves, revisá la carpeta de spam.</p>
          </div>
          <button
            type="button"
            onClick={() => { setForgotPassword(false); setResetSent(false); setResetEmail('') }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mx-auto transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al inicio de sesión
          </button>
        </div>
      )
    }

    return (
      <form onSubmit={handleForgotPassword} className="space-y-4">
        <button
          type="button"
          onClick={() => { setForgotPassword(false); setError('') }}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver
        </button>

        <div>
          <p className="font-semibold text-gray-900">Recuperar contraseña</p>
          <p className="text-sm text-gray-500 mt-0.5">
            Ingresá tu email y te mandamos un link para crear una nueva.
          </p>
        </div>

        <div>
          <Label className="text-sm mb-1 block">Email</Label>
          <Input
            type="email"
            placeholder="juan@email.com"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            required
            autoFocus
            autoComplete="email"
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>
        )}

        <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600">
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</>
          ) : (
            <><Mail className="h-4 w-4 mr-2" />Enviar instrucciones</>
          )}
        </Button>
      </form>
    )
  }

  // ── Login form ──
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-sm mb-1 block">Email</Label>
        <Input
          type="email"
          placeholder="juan@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-sm">Contraseña</Label>
          <button
            type="button"
            onClick={() => { setForgotPassword(true); setError(''); setResetEmail(email) }}
            className="text-xs text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        <Input
          type="password"
          placeholder="Tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>
      )}

      <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600">
        {loading ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Iniciando sesión...</>
        ) : (
          <><LogIn className="h-4 w-4 mr-2" />Entrar al dashboard</>
        )}
      </Button>
    </form>
  )
}
