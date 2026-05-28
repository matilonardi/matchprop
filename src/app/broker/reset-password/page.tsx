'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)

  // Supabase lands here with the recovery token in the URL hash.
  // The SDK picks it up automatically via onAuthStateChange.
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setDone(true)
      setTimeout(() => router.push('/broker/dashboard'), 2500)
    } catch {
      setError('No se pudo actualizar la contraseña. El link puede haber expirado — pedí uno nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {/* Logo */}
        <p className="text-xl font-bold mb-6">
          <span className="text-orange-500">Match</span>
          <span className="text-gray-900">Prop</span>
        </p>

        {done ? (
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <p className="font-semibold text-gray-900 text-lg">¡Contraseña actualizada!</p>
            <p className="text-sm text-gray-500">Redirigiendo a tu dashboard…</p>
          </div>
        ) : !ready ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-yellow-50 rounded-full p-4">
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Verificando el link…</p>
              <p className="text-sm text-gray-500 mt-1">
                Si llegaste acá desde el email de recuperación, esperá un momento.
              </p>
            </div>
            <p className="text-xs text-gray-400">
              Si el link expiró,{' '}
              <a href="/broker" className="text-blue-600 hover:underline">
                pedí uno nuevo
              </a>
              .
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="font-semibold text-gray-900 text-lg">Nueva contraseña</p>
              <p className="text-sm text-gray-500 mt-0.5">Elegí una contraseña segura para tu cuenta.</p>
            </div>

            <div>
              <Label className="text-sm mb-1 block">Nueva contraseña *</Label>
              <Input
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                autoFocus
              />
            </div>

            <div>
              <Label className="text-sm mb-1 block">Confirmá la contraseña *</Label>
              <Input
                type="password"
                placeholder="Repetí la contraseña"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>
            )}

            <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600">
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando…</>
              ) : (
                <><KeyRound className="h-4 w-4 mr-2" />Guardar nueva contraseña</>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
