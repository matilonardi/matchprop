import Link from 'next/link'
import { ArrowLeft, Gift } from 'lucide-react'
import Navbar from '@/components/Navbar'

export default function CreditosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 pb-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <Link
            href="/broker/dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-10"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al dashboard
          </Link>

          <div className="bg-white rounded-2xl border border-gray-100 p-10 shadow-sm">
            <div className="flex justify-center mb-5">
              <div className="bg-orange-50 rounded-full p-4">
                <Gift className="h-10 w-10 text-orange-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Créditos gratis por ahora</h1>
            <p className="text-gray-500 mb-6">
              Durante esta etapa inicial, los créditos son gratuitos. Contactanos por WhatsApp si necesitás más.
            </p>
            <Link
              href="/broker/dashboard"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors"
            >
              Volver al dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
