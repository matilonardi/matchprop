import Link from 'next/link'
import { ArrowRight, Search, Bell, Users, TrendingUp, CheckCircle2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/Navbar'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-20 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Star className="h-3.5 w-3.5 fill-current" />
            El marketplace inmobiliario al revés
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Publicá lo que{' '}
            <span className="text-blue-600">buscás comprar</span>
            <br />y que te encuentren a vos
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            Dejá de buscar entre miles de publicaciones. Contanos qué propiedad
            querés y las inmobiliarias de Córdoba vienen a ofrecerte lo que tienen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/publicar">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-base px-8 py-6 h-auto">
                Publicar mi búsqueda gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pedidos">
              <Button size="lg" variant="outline" className="text-base px-8 py-6 h-auto border-gray-200">
                Ver pedidos activos
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">Gratis para compradores · Sin registro requerido</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { n: '100%', label: 'Gratis para compradores' },
              { n: 'Leads', label: 'de altísima calidad para brokers' },
              { n: 'Córdoba', label: 'foco inicial · expansión planificada' },
            ].map(({ n, label }) => (
              <div key={label}>
                <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">{n}</div>
                <div className="text-sm text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              ¿Cómo funciona?
            </h2>
            <p className="text-gray-500 text-lg">Tres pasos y la oferta viene a buscarte</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Search className="h-6 w-6 text-blue-600" />,
                step: '01',
                title: 'Publicás tu búsqueda',
                desc: 'Contás qué tipo de propiedad querés, en qué zona, con qué presupuesto y cuáles son tus requisitos. Tarda menos de 3 minutos.',
              },
              {
                icon: <Bell className="h-6 w-6 text-blue-600" />,
                step: '02',
                title: 'Las inmobiliarias te ven',
                desc: 'Brokers y agencias de Córdoba reciben alertas automáticas. Solo ven tu búsqueda, no tu contacto.',
              },
              {
                icon: <Users className="h-6 w-6 text-blue-600" />,
                step: '03',
                title: 'Te contactan con opciones reales',
                desc: 'Cuando una inmobiliaria tiene algo que te puede interesar, desbloquea tu contacto y te llama. Sin spam.',
              },
            ].map(({ icon, step, title, desc }) => (
              <div key={step}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    {icon}
                  </div>
                  <span className="text-4xl font-bold text-gray-100">{step}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For buyers */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
                Para compradores
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-5">
                Tu búsqueda trabaja sola mientras vos hacés otra cosa
              </h2>
              <ul className="space-y-4">
                {[
                  'Completamente gratis, siempre',
                  'Sin registro obligatorio',
                  'Tu contacto solo lo ve quien paga — cero spam',
                  'Sabés cuántas inmobiliarias vieron tu pedido',
                  'Podés cerrar tu búsqueda cuando quieras',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/publicar" className="mt-8 inline-block">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Publicar mi búsqueda gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            {/* Mock request card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                  Activa
                </span>
                <span className="text-xs text-gray-400">hace 2 horas</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Casa en Mendiolaza</h3>
              <p className="text-sm text-gray-500 mb-4">
                3 dormitorios · 2 baños · Barrio cerrado · Hasta USD 230.000
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Cochera cubierta', 'Gas natural', 'Calles asfaltadas'].map((tag) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <span className="font-medium text-gray-900">12</span> inmobiliarias lo vieron
                </div>
                <div className="text-sm text-blue-600 font-medium">Efectivo o crédito</div>
              </div>
              <div className="mt-4 bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">🔒 Contacto visible solo para brokers que pagan</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For brokers */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 space-y-4">
              {[
                { label: 'Casa · Mendiolaza · USD 230k', badge: 'Nuevo', time: 'hace 1h', zones: 'Mendiolaza, Valle Escondido' },
                { label: 'Casa · Villa Belgrano · USD 620k', badge: 'Nuevo', time: 'hace 3h', zones: 'Valle Escondido, Los Cielos' },
                { label: 'Depto · Nueva Córdoba · USD 70k', badge: '', time: 'hace 6h', zones: 'Nueva Córdoba, Centro' },
              ].map(({ label, badge, time, zones }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{label}</span>
                      {badge && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          {badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{zones}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">{time}</p>
                    <Button size="sm" variant="outline" className="mt-2 text-xs h-7">
                      1 crédito
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="order-1 md:order-2">
              <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
                Para inmobiliarias
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-5">
                Leads que ya saben lo que quieren comprar
              </h2>
              <ul className="space-y-4">
                {[
                  'Ves el pedido completo antes de pagar',
                  'Solo pagás cuando hay match real con lo que tenés',
                  'Alertas automáticas por zona y tipo de propiedad',
                  'Sin suscripción forzada — comprás créditos cuando los necesitás',
                  'Dashboard con todos tus leads desbloqueados',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/broker" className="mt-8 inline-block">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Registrarme como inmobiliaria
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <TrendingUp className="h-10 w-10 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">Un crédito = un contacto real</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
            Comprás créditos solo cuando los necesitás. Ves el pedido completo
            antes de decidir si vale la pena desbloquearlo.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
            {[
              { credits: '5 créditos', price: 'USD 25', per: 'USD 5 c/u', popular: false },
              { credits: '20 créditos', price: 'USD 80', per: 'USD 4 c/u', popular: true },
              { credits: '50 créditos', price: 'USD 150', per: 'USD 3 c/u', popular: false },
            ].map(({ credits, price, per, popular }) => (
              <div
                key={credits}
                className={`rounded-xl p-4 ${popular ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'}`}
              >
                {popular && (
                  <div className="text-xs font-semibold uppercase tracking-wide mb-2 text-blue-400">
                    Más popular
                  </div>
                )}
                <div className="font-bold text-lg">{credits}</div>
                <div className="text-2xl font-bold mt-1">{price}</div>
                <div className={`text-xs mt-1 ${popular ? 'text-blue-400' : 'text-blue-200'}`}>{per}</div>
              </div>
            ))}
          </div>
          <Link href="/broker">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8">
              Empezar ahora
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="font-semibold text-gray-900">
            <span className="text-blue-600">Match</span>Prop
          </div>
          <div className="flex gap-6">
            <Link href="/pedidos" className="hover:text-gray-700 transition-colors">Ver pedidos</Link>
            <Link href="/publicar" className="hover:text-gray-700 transition-colors">Publicar búsqueda</Link>
            <Link href="/broker" className="hover:text-gray-700 transition-colors">Para inmobiliarias</Link>
          </div>
          <p>© 2025 MatchProp · Córdoba, Argentina</p>
        </div>
      </footer>
    </div>
  )
}
