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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-hairline">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center">
            <PropiLogoFull size="md" />
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-7">
            <Link href="/pedidos" className="link-underline text-sm text-ink-2 hover:text-ink">
              Ver búsquedas
            </Link>
            <Link href="/broker" className="link-underline text-sm text-ink-2 hover:text-ink">
              Para vendedores
            </Link>

            {user ? (
              // Logged in: route determined by DB profile lookup, not user_metadata
              <Link
                href={dashboardHref}
                className="flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                Mi dashboard
              </Link>
            ) : (
              <Link href="/broker?login=1" className="text-sm text-ink-2 hover:text-ink transition-colors">
                Iniciar sesión
              </Link>
            )}

            <Link href="/publicar">
              <Button size="lg" className="rounded-lg px-5">
                Publicar búsqueda
              </Button>
            </Link>
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2 text-ink" onClick={() => setOpen(!open)} aria-label="Menú">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-hairline bg-white px-5 py-4 flex flex-col gap-4">
          <Link href="/pedidos" className="text-sm text-ink-2" onClick={() => setOpen(false)}>
            Ver búsquedas
          </Link>
          <Link href="/broker" className="text-sm text-ink-2" onClick={() => setOpen(false)}>
            Para vendedores
          </Link>
          {user ? (
            <Link
              href={dashboardHref}
              className="text-sm font-semibold text-brand"
              onClick={() => setOpen(false)}
            >
              Mi dashboard →
            </Link>
          ) : (
            <Link href="/broker?login=1" className="text-sm text-ink-2" onClick={() => setOpen(false)}>
              Iniciar sesión
            </Link>
          )}
          <Link href="/publicar" onClick={() => setOpen(false)}>
            <Button className="w-full" size="lg">
              Publicar búsqueda
            </Button>
          </Link>
        </div>
      )}
    </nav>
  )
}
