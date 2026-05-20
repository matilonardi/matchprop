import Link from 'next/link'
import { CheckCircle2, ArrowRight, Bell, Lock, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/Navbar'
import BrokerRegisterForm from './BrokerRegisterForm'

export default function BrokerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 pb-16">
        {/* Hero */}
        <div className="bg-gradient-to-b from-blue-600 to-blue-700 text-white py-16 px-4 mb-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">
              Leads inmobiliarios que ya saben lo que quieren
            </h1>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
              Accedé a compradores activos que publicaron exactamente qué propiedad buscan.
              Solo pagás cuando encontrás un match real.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              {[
                'Ves el pedido completo antes de pagar',
                'Sin suscripción forzada',
                'Alertas por zona automáticas',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Benefits */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">¿Cómo funciona para vos?</h2>
              <div className="space-y-6">
                {[
                  {
                    icon: <Bell className="h-5 w-5 text-blue-600" />,
                    title: 'Alertas por tus zonas',
                    desc: 'Registrás tus zonas de trabajo y recibís notificaciones cada vez que un comprador publica una búsqueda compatible.',
                  },
                  {
                    icon: <Lock className="h-5 w-5 text-blue-600" />,
                    title: 'Ves todo, pagás el contacto',
                    desc: 'Podés leer la búsqueda completa — zona, presupuesto, requisitos — antes de decidir si vale la pena desbloquear el contacto.',
                  },
                  {
                    icon: <BarChart3 className="h-5 w-5 text-blue-600" />,
                    title: 'Inteligencia de mercado',
                    desc: 'Sabés qué está demandando el mercado en tiempo real: zonas calientes, tickets promedio, requisitos más pedidos.',
                  },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      {icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                      <p className="text-sm text-gray-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing quick reference */}
              <div className="mt-8 bg-blue-50 rounded-xl p-5">
                <p className="font-semibold text-blue-900 mb-3">Precios transparentes</p>
                <div className="space-y-2 text-sm">
                  {[
                    { label: '5 créditos', price: 'USD 25', per: 'USD 5 por contacto' },
                    { label: '20 créditos', price: 'USD 80', per: 'USD 4 por contacto', popular: true },
                    { label: '50 créditos', price: 'USD 150', per: 'USD 3 por contacto' },
                  ].map(({ label, price, per, popular }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-blue-800">
                        {label}
                        {popular && (
                          <span className="ml-2 text-xs bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded-full">
                            Popular
                          </span>
                        )}
                      </span>
                      <div className="text-right">
                        <span className="font-semibold text-blue-900">{price}</span>
                        <span className="text-blue-500 text-xs ml-1">({per})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Register form */}
            <div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Crear cuenta de inmobiliaria</h2>
                <p className="text-sm text-gray-500 mb-6">Gratis para empezar. Comprás créditos cuando los necesitás.</p>
                <BrokerRegisterForm />
              </div>

              <p className="text-center text-sm text-gray-500 mt-4">
                ¿Ya tenés cuenta?{' '}
                <Link href="/broker/dashboard" className="text-blue-600 hover:underline font-medium">
                  Ir al dashboard
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
