import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Infinity, Zap, Check } from 'lucide-react'
import Navbar from '@/components/Navbar'
import CheckoutButton from './CheckoutButton'

export default function CreditosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 pb-16 px-4">
        <div className="max-w-lg mx-auto">
          <Link
            href="/broker/dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al dashboard
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Acceso ilimitado</h1>
          <p className="text-gray-500 mb-8">
            Desbloqueá todos los contactos que quieras durante 30 días. Sin límites, sin surpresas.
          </p>

          {/* Single plan card */}
          <div className="mb-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 p-8 text-white shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-emerald-500/20 rounded-full p-1.5">
                <Infinity className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="text-sm font-bold uppercase tracking-wide text-emerald-400">Plan mensual</span>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-black">$25.000</span>
                <span className="text-slate-400 text-lg">/mes</span>
              </div>
              <p className="text-slate-400 text-sm">Pesos argentinos · Pagás con MercadoPago</p>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                'Contactos ilimitados durante 30 días',
                'Teléfono y email de cada comprador',
                'Válido desde el momento del pago',
                'Ideal para brokers activos',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-slate-200">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <CheckoutButton packId="plan_mensual" label="Activar plan mensual" />
          </div>

          {/* No per-credit option note */}
          <p className="text-center text-xs text-gray-400 mb-6">
            Plan único · Sin packs individuales · Renovación manual cada 30 días
          </p>

          {/* Security note */}
          <div className="bg-white rounded-xl p-5 flex items-start gap-3 border border-gray-100">
            <ShieldCheck className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-800">Pago seguro con MercadoPago</p>
              <p className="text-sm text-gray-500 mt-1">
                Aceptamos tarjetas de crédito, débito y transferencia bancaria.
                El plan se activa inmediatamente después del pago.
              </p>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-6 space-y-3">
            {[
              { q: '¿Qué pasa cuando vencen los 30 días?', a: 'Tu acceso se cierra automáticamente. Podés renovar el plan en cualquier momento.' },
              { q: '¿Hay algún límite de contactos por día?', a: 'No. Podés desbloquear todos los contactos que quieras durante los 30 días.' },
            ].map(({ q, a }) => (
              <div key={q} className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-sm font-semibold text-gray-800 mb-1">{q}</p>
                <p className="text-sm text-gray-500">{a}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link href="/broker/dashboard" className="text-sm text-gray-400 hover:text-gray-600">
              ← Volver al dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
