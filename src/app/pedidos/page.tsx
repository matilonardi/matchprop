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
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
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
