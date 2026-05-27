'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

export default function BrokerLoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

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
      // Verify this user has a broker profile before navigating
      const res = await fetch(`/api/broker/me?userId=${data.user.id}`)
      if (!res.ok) {
        await supabase.auth.signOut()
        setError('No encontramos una cuenta de broker con ese email. ¿Querés crear una cuenta?')
        return
      }
      // Hard navigation to ensure session cookie is set before dashboard loads
      window.location.href = '/broker/dashboard'
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

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
        <Label className="text-sm mb-1 block">Contraseña</Label>
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
