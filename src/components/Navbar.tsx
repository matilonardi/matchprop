'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600">Match</span>
            <span className="text-xl font-bold text-gray-900">Prop</span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/pedidos" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Ver pedidos
            </Link>
            <Link href="/broker" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Soy inmobiliaria
            </Link>
            <Link href="/publicar">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Publicar búsqueda
              </Button>
            </Link>
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
            Ver pedidos activos
          </Link>
          <Link href="/broker" className="text-sm text-gray-700" onClick={() => setOpen(false)}>
            Soy inmobiliaria
          </Link>
          <Link href="/publicar" onClick={() => setOpen(false)}>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Publicar mi búsqueda
            </Button>
          </Link>
        </div>
      )}
    </nav>
  )
}
