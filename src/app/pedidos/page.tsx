import Navbar from '@/components/Navbar'
import PedidosFeed from './PedidosFeed'
import Link from 'next/link'

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ zone?: string; type?: string; financing?: string; maxBudget?: string; since?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">

        {/* Page header */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Pedidos activos en Córdoba</h1>
                <p className="text-gray-500 mt-1 text-sm">
                  Compradores buscando propiedades ahora mismo · Desbloqueá su contacto con 1 crédito
                </p>
              </div>
              <Link
                href="/publicar"
                className="hidden md:inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shrink-0"
              >
                + Publicar búsqueda
              </Link>
            </div>
          </div>
        </div>

        {/* Feed — initial filters come from URL params */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PedidosFeed
            initialZone={params.zone || ''}
            initialType={params.type || ''}
            initialFinancing={params.financing || ''}
            initialMaxBudget={params.maxBudget || ''}
            initialSince={params.since || ''}
          />
        </div>

      </div>
    </div>
  )
}
