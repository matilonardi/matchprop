import Link from 'next/link'
import { ArrowRight, Search, Bell, Users, TrendingUp, CheckCircle2, Star, MapPin, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/Navbar'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative min-h-[620px] flex items-center pt-16 overflow-hidden">
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900" />
        {/* Subtle dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative w-full max-w-5xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-medium px-4 py-1.5 rounded-full mb-7">
            <Star className="h-3.5 w-3.5 fill-current" />
            El marketplace inmobiliario al revés
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.08] mb-6 tracking-tight">
            Publicá lo que buscás comprar
            <br />
            <span className="text-blue-400">y que te encuentren a vos</span>
          </h1>

          <p className="text-xl text-blue-100/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Dejá de buscar entre miles de publicaciones. Contanos qué propiedad o auto querés
            y los vendedores de Córdoba vienen a ofrecerte lo que tienen.
          </p>

          {/* CTA bar — search-bar inspired */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <Link
              href="/publicar"
              className="flex-1 bg-white hover:bg-gray-50 text-gray-900 font-semibold px-6 py-4 rounded-2xl text-base flex items-center justify-center gap-2 shadow-2xl transition-all hover:-translate-y-0.5 hover:shadow-blue-500/20"
            >
              📋 Publicar mi búsqueda — gratis
              <ArrowRight className="h-4 w-4 text-blue-600" />
            </Link>
            <Link
              href="/pedidos"
              className="sm:w-auto bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium px-6 py-4 rounded-2xl text-base flex items-center justify-center gap-2 transition-all"
            >
              Ver pedidos →
            </Link>
          </div>

          <p className="mt-5 text-sm text-blue-200/50">Gratis para compradores · Sin registro requerido</p>

          {/* Floating preview cards */}
          <div className="mt-14 grid grid-cols-3 gap-3 max-w-2xl mx-auto opacity-60">
            {[
              { type: 'Casa', zone: 'Mendiolaza', price: 'USD 230k', gradient: 'from-emerald-400 to-teal-500', emoji: '🏡' },
              { type: 'Departamento', zone: 'Nueva Córdoba', price: 'USD 70k', gradient: 'from-blue-400 to-indigo-500', emoji: '🏢' },
              { type: 'Casa / Duplex', zone: 'Villa Belgrano', price: 'USD 620k', gradient: 'from-violet-400 to-purple-500', emoji: '🏘️' },
            ].map(({ type, zone, price, gradient, emoji }) => (
              <div key={type} className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10">
                <div className={`h-16 bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl`}>
                  {emoji}
                </div>
                <div className="p-2.5">
                  <p className="text-white text-xs font-bold">{price}</p>
                  <p className="text-blue-200/70 text-xs">{type} · {zone}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="py-10 border-b border-gray-100 bg-white">
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

      {/* ── How it works ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">¿Cómo funciona?</h2>
            <p className="text-gray-500 text-lg">Tres pasos y la oferta viene a buscarte</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Search className="h-6 w-6 text-blue-600" />,
                step: '01',
                title: 'Publicás tu búsqueda',
                desc: 'Contás qué propiedad o auto querés, en qué zona y con qué presupuesto. Tarda menos de 3 minutos.',
              },
              {
                icon: <Bell className="h-6 w-6 text-blue-600" />,
                step: '02',
                title: 'Los vendedores te ven',
                desc: 'Inmobiliarias, concesionarias y particulares reciben alertas automáticas. Solo ven tu búsqueda, no tu contacto.',
              },
              {
                icon: <Users className="h-6 w-6 text-blue-600" />,
                step: '03',
                title: 'Te contactan con opciones reales',
                desc: 'Cuando alguien tiene algo que te puede interesar, desbloquea tu contacto y te llama. Sin spam.',
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

      {/* ── For buyers ── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">Para compradores</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-5">Tu búsqueda trabaja sola mientras vos hacés otra cosa</h2>
              <ul className="space-y-4">
                {[
                  'Completamente gratis, siempre',
                  'Sin registro obligatorio',
                  'Tu contacto solo lo ve quien paga — cero spam',
                  'Sabés cuántas personas vieron tu pedido',
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

            {/* Two mock cards — property + car */}
            <div className="flex flex-col gap-4 max-w-sm mx-auto w-full">

              {/* Property card */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100">
                <div className="relative h-36 bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                  <span className="text-5xl opacity-75">🏡</span>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute top-2.5 right-2.5">
                    <span className="bg-white/95 text-green-600 text-xs font-semibold px-2 py-0.5 rounded-full">✓ Activa</span>
                  </div>
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
                    <span className="text-white/90 text-xs">14 vistas</span>
                    <span className="text-white/70 text-xs">hace 2h</span>
                  </div>
                </div>
                <div className="p-4 space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold text-gray-900">USD 230.000</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Efectivo</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">Casa · Mendiolaza</p>
                  <div className="flex gap-1.5">
                    {['cochera', 'gas natural', 'seguridad'].map((r) => (
                      <span key={r} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">{r}</span>
                    ))}
                  </div>
                  <div className="pt-1">
                    <div className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-400">
                      <Lock className="h-3 w-3" /> Contacto oculto · ejemplo
                    </div>
                  </div>
                </div>
              </div>

              {/* Car card */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100">
                <div className="relative h-36 bg-gradient-to-br from-slate-500 to-zinc-600 flex items-center justify-center">
                  <span className="text-5xl opacity-75">🚙</span>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute top-2.5 right-2.5">
                    <span className="bg-white/95 text-green-600 text-xs font-semibold px-2 py-0.5 rounded-full">✓ Activa</span>
                  </div>
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
                    <span className="text-white/90 text-xs">8 vistas</span>
                    <span className="text-white/70 text-xs">hace 1h</span>
                  </div>
                </div>
                <div className="p-4 space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold text-gray-900">USD 25.000</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Efectivo</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">SUV · Nueva Córdoba</p>
                  <div className="flex gap-1.5">
                    {['Toyota / Ford', '2020+', '🔑 Usado'].map((r) => (
                      <span key={r} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">{r}</span>
                    ))}
                  </div>
                  <div className="pt-1">
                    <div className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-400">
                      <Lock className="h-3 w-3" /> Contacto oculto · ejemplo
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── For brokers ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 space-y-3">
              {[
                { label: 'Casa · Mendiolaza · USD 230k', badge: 'Nuevo', time: 'hace 1h', gradient: 'from-emerald-400 to-teal-500', emoji: '🏡' },
                { label: 'Casa · Villa Belgrano · USD 620k', badge: 'Nuevo', time: 'hace 3h', gradient: 'from-violet-400 to-purple-500', emoji: '🏘️' },
                { label: 'Depto · Nueva Córdoba · USD 70k', badge: '', time: 'hace 6h', gradient: 'from-blue-400 to-indigo-500', emoji: '🏢' },
              ].map(({ label, badge, time, gradient, emoji }) => (
                <div key={label} className="flex items-center gap-4 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl shrink-0`}>
                    {emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{label}</span>
                      {badge && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium shrink-0">{badge}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{time}</p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs h-7 shrink-0">1 crédito</Button>
                </div>
              ))}
            </div>
            <div className="order-1 md:order-2">
              <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">Para vendedores</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-5">Compradores que ya saben lo que quieren</h2>
              <ul className="space-y-4">
                {[
                  'Ves el pedido completo antes de pagar',
                  'Solo pagás cuando hay match real con lo que tenés',
                  'Alertas automáticas por zona — propiedades y autos',
                  'Sin suscripción forzada — comprás créditos cuando los necesitás',
                  'Dashboard con todos tus contactos desbloqueados',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/broker" className="mt-8 inline-block">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Crear mi cuenta gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-900 to-blue-950">
        <div className="max-w-4xl mx-auto text-center text-white">
          <TrendingUp className="h-10 w-10 mx-auto mb-4 opacity-70" />
          <h2 className="text-3xl font-bold mb-4">Un crédito = un contacto real</h2>
          <p className="text-blue-200/70 text-lg mb-10 max-w-xl mx-auto">
            Comprás créditos solo cuando los necesitás. Ves el pedido completo antes de decidir si vale la pena desbloquearlo.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-10">
            {[
              { credits: '5 créditos', price: 'USD 25', per: 'USD 5 c/u', popular: false },
              { credits: '20 créditos', price: 'USD 80', per: 'USD 4 c/u', popular: true },
              { credits: '50 créditos', price: 'USD 150', per: 'USD 3 c/u', popular: false },
            ].map(({ credits, price, per, popular }) => (
              <div
                key={credits}
                className={`rounded-2xl p-5 border transition-all ${
                  popular
                    ? 'bg-white text-blue-900 border-white shadow-xl scale-105'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/15'
                }`}
              >
                {popular && (
                  <div className="text-xs font-bold uppercase tracking-wide text-blue-500 mb-2">★ Más popular</div>
                )}
                <div className="font-semibold text-sm mb-1">{credits}</div>
                <div className="text-3xl font-bold">{price}</div>
                <div className={`text-xs mt-1 ${popular ? 'text-blue-400' : 'text-blue-200/60'}`}>{per}</div>
              </div>
            ))}
          </div>
          <Link href="/broker">
            <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100 font-bold px-10 rounded-2xl">
              Empezar ahora
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-4 border-t border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="font-semibold text-gray-900">
            <span className="text-blue-600">Match</span>Prop
          </div>
          <div className="flex gap-6">
            <Link href="/pedidos" className="hover:text-gray-700 transition-colors">Ver pedidos</Link>
            <Link href="/publicar" className="hover:text-gray-700 transition-colors">Publicar búsqueda</Link>
            <Link href="/broker" className="hover:text-gray-700 transition-colors">Para vendedores</Link>
          </div>
          <p>© 2025 MatchProp · Córdoba, Argentina</p>
        </div>
      </footer>
    </div>
  )
}
