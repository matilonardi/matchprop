import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { CREDIT_PACKS } from '@/lib/constants'
import CheckoutButton from './CheckoutButton'

export default function CreditosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/broker/dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al dashboard
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Comprar créditos</h1>
          <p className="text-gray-500 mb-8">
            1 crédito = 1 contacto desbloqueado. Sin suscripción forzada.
          </p>

          <div className="space-y-4 mb-8">
            {CREDIT_PACKS.map((pack) => (
              <div
                key={pack.id}
                className={`bg-white rounded-xl border p-5 flex items-center justify-between ${
                  pack.popular
                    ? 'border-blue-500 shadow-sm'
                    : 'border-gray-100'
                }`}
              >
                <div>
                  {pack.popular && (
                    <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                      Más popular
                    </div>
                  )}
                  <p className="text-lg font-bold text-gray-900">{pack.label}</p>
                  <p className="text-sm text-gray-500">
                    USD {pack.price_per} por contacto
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">USD {pack.price_usd}</p>
                  <CheckoutButton packId={pack.id} label={`Comprar ${pack.label}`} />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-xl p-5 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-800">Pago seguro con MercadoPago</p>
              <p className="text-sm text-gray-500 mt-1">
                Aceptamos tarjetas de crédito, débito y transferencia bancaria.
                Los créditos se acreditan inmediatamente después del pago.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

