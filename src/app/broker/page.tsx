import { Check, Bell, Lock, BarChart3 } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import BrokerAuthSection from './BrokerAuthSection'

export default async function BrokerPage({
  searchParams,
}: {
  searchParams: Promise<{ login?: string }>
}) {
  const params = await searchParams
  const defaultMode = params.login === '1' ? 'login' : 'register'

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 grid md:grid-cols-[1.15fr_.85fr] gap-14">

          {/* Left — value prop */}
          <div>
            <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-brand">
              Para inmobiliarias, concesionarias y particulares
            </div>
            <h1 className="mt-4 text-3xl md:text-[44px] font-extrabold text-ink tracking-[-0.02em] leading-[1.05]">
              Compradores activos que ya saben lo que quieren
            </h1>
            <p className="mt-5 text-lg text-ink-2 max-w-lg">
              Accedé a compradores que publicaron exactamente qué propiedad o auto buscan.
              Contactalos directo cuando tengas algo para ofrecerles.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                'Ves el pedido completo antes de contactar',
                'Alertas por zona automáticas',
                'Compradores con alta intención — ya saben qué quieren',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-brand shrink-0 mt-0.5" strokeWidth={2} />
                  <span className="text-ink-2">{item}</span>
                </li>
              ))}
            </ul>

            {/* How it works */}
            <div className="mt-12 space-y-6">
              {[
                { icon: <Bell className="h-5 w-5" strokeWidth={1.5} />, title: 'Alertas por tus zonas', desc: 'Registrás tus zonas de interés y recibís avisos cada vez que alguien publica una búsqueda compatible.' },
                { icon: <Lock className="h-5 w-5" strokeWidth={1.5} />, title: 'Ves la búsqueda completa', desc: 'Leés zona, presupuesto y requisitos antes de decidir si contactar al comprador.' },
                { icon: <BarChart3 className="h-5 w-5" strokeWidth={1.5} />, title: 'Inteligencia de mercado', desc: 'Sabés qué demanda el mercado en tiempo real: zonas calientes, tickets promedio, requisitos más pedidos.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-tint text-brand">{icon}</span>
                  <div>
                    <h3 className="font-bold text-ink mb-1">{title}</h3>
                    <p className="text-sm text-ink-2">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Free beta note (reemplaza los packs de precio) */}
            <div className="mt-8 rounded-2xl border border-brand/20 bg-tint p-5">
              <p className="font-semibold text-brand-dark mb-1">Gratis durante la beta</p>
              <p className="text-sm text-ink-2">
                Mientras dure la etapa inicial, ver el contacto de los compradores es sin costo.
                Creá tu cuenta y empezá a contactar hoy.
              </p>
            </div>
          </div>

          {/* Right — auth card */}
          <div className="md:sticky md:top-24 self-start">
            <BrokerAuthSection defaultMode={defaultMode as 'register' | 'login'} />
          </div>
        </div>
      </div>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}
