import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Infinity, Zap } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { CREDIT_PACKS } from '@/lib/constants'
import CheckoutButton from './CheckoutButton'

function formatARS(n: number) {
  return `$${n.toLocaleString('es-AR')}`
}

export default function CreditosPage() {
  const regularPacks = CREDIT_PACKS.filter((p) => !p.unlimited)
  const unlimitedPack = CREDIT_PACKS.find((p) => p.unlimited)

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
          <p className="text-gray-500 mb-1">
            1 crédito = 1 contacto desbloqueado. Los créditos vencen a los 30 días de la compra.
          </p>
          <p className="text-xs text-gray-400 mb-8">Precios en pesos argentinos. Pagás con MercadoPago.</p>

          {/* Regular packs */}
          <div className="space-y-3 mb-4">
            {regularPacks.map((pack) => (
              <div
                key={pack.id}
                className={`bg-white rounded-xl border p-5 flex items-center justify-between transition-shadow hover:shadow-sm ${
                  pack.popular ? 'border-orange-400 shadow-sm ring-1 ring-orange-200' : 'border-gray-100'
                }`}
              >
                <div>
                  {pack.popular && (
                    <div className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-1">
                      ★ Más popular
                    </div>
                  )}
                  <p className="text-lg font-bold text-gray-900">{pack.label}</p>
                  <p className="text-sm text-gray-400">
                    {formatARS(pack.price_per_ars)} por contacto · válidos 30 días
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-2xl font-bold text-gray-900">{formatARS(pack.price_ars)}</p>
                  <CheckoutButton packId={pack.id} label={`Comprar`} />
                </div>
              </div>
            ))}
          </div>

          {/* Unlimited plan */}
          {unlimitedPack && (
            <div className="mb-8 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 border border-blue-800/50 p-6 text-white shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-orange-500/20 rounded-full p-1">
                      <Infinity className="h-4 w-4 text-orange-400" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide text-orange-400">Plan Pro</span>
                  </div>
                  <p className="text-xl font-bold mb-1">Ilimitado mensual</p>
                  <p className="text-sm text-blue-200/70 mb-3">
                    Desbloqueá todos los contactos que quieras durante 30 días. Sin límite.
                  </p>
                  <ul className="space-y-1 text-sm text-blue-100/80">
                    <li className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-orange-400 shrink-0" /> Acceso ilimitado a contactos en tus zonas</li>
                    <li className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-orange-400 shrink-0" /> Ideal para brokers muy activos</li>
                    <li className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-orange-400 shrink-0" /> Válido por 30 días desde la activación</li>
                  </ul>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-3xl font-bold">{formatARS(unlimitedPack.price_ars)}</p>
                  <p className="text-xs text-blue-300/60 mb-2">por mes</p>
                  <CheckoutButton packId={unlimitedPack.id} label="Activar plan" />
                </div>
              </div>
            </div>
          )}

          {/* Security note */}
          <div className="bg-white rounded-xl p-5 flex items-start gap-3 border border-gray-100">
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
