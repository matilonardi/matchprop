import Navbar from '@/components/Navbar'
import PedidosFeed from './PedidosFeed'

export default function PedidosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pedidos activos</h1>
            <p className="text-gray-500">
              Compradores buscando propiedades en Córdoba ahora mismo.
              Desbloqueá su contacto con 1 crédito.
            </p>
          </div>
          <PedidosFeed />
        </div>
      </div>
    </div>
  )
}
