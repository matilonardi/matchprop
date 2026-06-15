'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Eye, EyeOff, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

export default function BuyerLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError('Email o contraseña incorrectos')
        return
      }
      router.push('/comprador/dashboard')
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black">
            <span className="text-gray-900">prop</span><span className="text-orange-500">i</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-4">Ingresá a tu cuenta</h1>
          <p className="text-gray-500 text-sm mt-1">Compradores · Gestioná tus búsquedas</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Email</Label>
              <Input
                type="email"
                placeholder="juan@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Contraseña</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm">{error}</div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Ingresando...</>
              ) : (
                <><LogIn className="h-4 w-4 mr-2" />Ingresar</>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            ¿No tenés cuenta?{' '}
            <Link href="/publicar" className="text-orange-500 font-medium hover:underline">
              Publicá tu búsqueda gratis
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          ¿Sos broker?{' '}
          <Link href="/broker?login=1" className="underline hover:text-gray-600">
            Ingresá acá
          </Link>
        </p>
      </div>
    </main>
  )
}
