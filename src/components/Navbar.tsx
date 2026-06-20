'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { PropiLogoFull } from '@/components/PropiLogo'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  // 'broker' | 'buyer' | null — resolved from DB, not user_metadata
  const [userRole, setUserRole] = useState<'broker' | 'buyer' | null>(null)

  async function resolveRole(uid: string) {
    // Broker profile takes priority — if it exists, the user is a broker
    const { data: brokerProfile } = await supabase
      .from('broker_profiles')
      .select('id')
      .eq('user_id', uid)
      .maybeSingle()
    setUserRole(brokerProfile ? 'broker' : 'buyer')
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) resolveRole(data.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        resolveRole(session.user.id)
      } else {
        setUserRole(null)
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const dashboardHref = userRole === 'broker' ? '/broker/dashboard' : '/comprador/dashboard'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <PropiLogoFull size="md" />
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/pedidos" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Ver búsquedas
            </Link>

            {user ? (
              // Logged in: route determined by DB profile lookup, not user_metadata
              <Link
                href={dashboardHref}
                className="flex items-center gap-1.5 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                Mi dashboard
              </Link>
            ) : (
              // Not logged in: show login + publish links
              <>
                <Link href="/broker?login=1" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Iniciar sesión
                </Link>
                <Link href="/publicar">
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                    Publicar búsqueda
                  </Button>
                </Link>
              </>
            )}

            {user && (
              <Link href="/publicar">
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                  Publicar búsqueda
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-4">
          <Link href="/pedidos" className="text-sm text-gray-700" onClick={() => setOpen(false)}>
            Ver búsquedas activas
          </Link>
          {user ? (
            <Link
              href={dashboardHref}
              className="text-sm font-semibold text-orange-500"
              onClick={() => setOpen(false)}
            >
              Mi dashboard →
            </Link>
          ) : (
            <Link href="/broker?login=1" className="text-sm text-gray-700" onClick={() => setOpen(false)}>
              Iniciar sesión
            </Link>
          )}
          <Link href="/publicar" onClick={() => setOpen(false)}>
            <Button className="w-full bg-orange-500 hover:bg-orange-600">
              Publicar mi búsqueda
            </Button>
          </Link>
        </div>
      )}
    </nav>
  )
}
