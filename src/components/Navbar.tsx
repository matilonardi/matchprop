'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    // Listen for auth changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-orange-500">Match</span>
            <span className="text-xl font-bold text-gray-900">Prop</span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/pedidos" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Ver búsquedas
            </Link>

            {user ? (
              // Logged in: route to buyer or broker dashboard based on role
              <Link
                href={user.user_metadata?.role === 'buyer' ? '/comprador/dashboard' : '/broker/dashboard'}
                className="flex items-center gap-1.5 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                Mi dashboard
              </Link>
            ) : (
              // Not logged in: show broker + publish links
              <>
                <Link href="/broker" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Para vendedores
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
              href={user.user_metadata?.role === 'buyer' ? '/comprador/dashboard' : '/broker/dashboard'}
              className="text-sm font-semibold text-orange-500"
              onClick={() => setOpen(false)}
            >
              Mi dashboard →
            </Link>
          ) : (
            <Link href="/broker" className="text-sm text-gray-700" onClick={() => setOpen(false)}>
              Para vendedores
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
