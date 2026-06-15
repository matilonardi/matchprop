import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import PedidosFeed from './PedidosFeed'

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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pedidos activos en Córdoba</h1>
              <p className="text-gray-500 mt-1 text-sm">
                Compradores buscando propiedades ahora mismo · Desbloqueá su contacto con 1 crédito
              </p>
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
      <Footer />
      <WhatsAppButton />
    </div>
  )
}
