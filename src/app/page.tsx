import Link from 'next/link'
import { ArrowRight, Search, Bell, Users, TrendingUp, CheckCircle2, Star, MapPin, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import AnimateIn from '@/components/AnimateIn'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative min-h-[620px] flex items-center pt-16 overflow-hidden">
        <div className="absolute inset-0 hero-bg-animated" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-float-slow delay-1000" />

        <div className="relative w-full max-w-5xl mx-auto px-4 py-20 text-center">
          <div className="animate-hero-fade-up inline-flex items-center gap-2 bg-yellow-400/20 border border-yellow-400/30 text-yellow-200 text-sm font-medium px-4 py-1.5 rounded-full mb-7">
            <Star className="h-3.5 w-3.5 fill-current" />
            El marketplace al revés
          </div>

          <h1 className="animate-hero-fade-up delay-200 text-5xl md:text-7xl font-bold text-white leading-[1.08] mb-6 tracking-tight">
            Publicá lo que buscás comprar
            <br />
            <span className="text-orange-400">y que te encuentren a vos</span>
          </h1>

          <p className="animate-hero-fade-up delay-400 text-xl text-orange-100/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Dejá de buscar entre miles de publicaciones. Contanos qué propiedad o auto querés
            y los vendedores de Córdoba vienen a ofrecerte lo que tienen.
          </p>

          <div className="animate-hero-fade-up delay-500 flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <Link
              href="/publicar"
              className="flex-1 bg-white hover:bg-gray-50 text-gray-900 font-semibold px-6 py-4 rounded-2xl text-base flex items-center justify-center gap-2 shadow-2xl transition-all hover:-translate-y-0.5 hover:shadow-orange-500/20 animate-pulse-glow"
            >
              📋 Publicar mi búsqueda — gratis
              <ArrowRight className="h-4 w-4 text-orange-500" />
            </Link>
            <Link
              href="/pedidos"
              className="sm:w-auto bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium px-6 py-4 rounded-2xl text-base flex items-center justify-center gap-2 transition-all"
            >
              Ver búsquedas →
            </Link>
          </div>

          <p className="animate-hero-fade-up delay-600 mt-5 text-sm text-white/40">Gratis para compradores · Sin registro requerido</p>

          <div className="mt-14 grid grid-cols-3 gap-3 max-w-2xl mx-auto opacity-60">
            {[
              { type: 'Casa', zone: 'Mendiolaza', price: 'USD 230k', gradient: 'from-emerald-400 to-teal-500', emoji: '🏡', delay: '' },
              { type: 'Departamento', zone: 'Nueva Córdoba', price: 'USD 70k', gradient: 'from-blue-400 to-indigo-500', emoji: '🏢', delay: 'delay-500' },
              { type: 'Casa / Duplex', zone: 'Villa Belgrano', price: 'USD 620k', gradient: 'from-violet-400 to-purple-500', emoji: '🏘️', delay: 'delay-1000' },
            ].map(({ type, zone, price, gradient, emoji, delay }) => (
              <div key={type} className={`animate-float ${delay} bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10`}>
                <div className={`h-16 bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl`}>
                  {emoji}
                </div>
                <div className="p-2.5">
                  <p className="text-white text-xs font-bold">{price}</p>
                  <p className="text-orange-200/70 text-xs">{type} · {zone}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="py-10 border-b border-gray-100 bg-white overflow-hidden">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { n: '100%', label: 'Gratis para compradores', delay: 0 },
              { n: 'Leads', label: 'de altísima calidad para brokers', delay: 120 },
              { n: 'Córdoba', label: 'foco inicial · expansión planificada', delay: 240 },
            ].map(({ n, label, delay }) => (
              <AnimateIn key={label} variant="scale-up" delay={delay}>
                <div className="text-2xl md:text-3xl font-bold text-orange-500 mb-1">{n}</div>
                <div className="text-sm text-gray-500">{label}</div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-4 bg-white overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <AnimateIn variant="fade-up" className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">¿Cómo funciona?</h2>
            <p className="text-gray-500 text-lg">Tres pasos y la oferta viene a buscarte</p>
          </AnimateIn>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Search className="h-6 w-6 text-orange-500" />,
                step: '01',
                title: 'Publicás tu búsqueda',
                desc: 'Contás qué propiedad o auto querés, en qué zona y con qué presupuesto. Tarda menos de 3 minutos.',
                delay: 0,
              },
              {
                icon: <Bell className="h-6 w-6 text-blue-500" />,
                step: '02',
                title: 'Los vendedores te ven',
                desc: 'Inmobiliarias, concesionarias y particulares reciben alertas automáticas. Solo ven tu búsqueda, no tu contacto.',
                delay: 150,
              },
              {
                icon: <Users className="h-6 w-6 text-yellow-500" />,
                step: '03',
                title: 'Te contactan con opciones reales',
                desc: 'Cuando alguien tiene algo que te puede interesar, desbloquea tu contacto y te llama. Sin spam.',
                delay: 300,
              },
            ].map(({ icon, step, title, desc, delay }) => (
              <AnimateIn key={step} variant="fade-up" delay={delay}
                className="group p-6 rounded-2xl border border-transparent hover:border-orange-100 hover:bg-orange-50/40 transition-all duration-300 cursor-default"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-orange-50 group-hover:bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300">
                    {icon}
                  </div>
                  <span className="text-4xl font-bold text-gray-100 group-hover:text-orange-100 transition-colors duration-300">{step}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── For buyers ── */}
      <section className="py-20 px-4 bg-gray-50 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            <AnimateIn variant="fade-left">
              <div className="text-sm font-semibold text-orange-500 uppercase tracking-wide mb-3">Para compradores</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-5">Tu búsqueda trabaja sola mientras vos hacés otra cosa</h2>
              <ul className="space-y-4">
                {[
                  { text: 'Completamente gratis, siempre', delay: 80 },
                  { text: 'Sin registro obligatorio', delay: 160 },
                  { text: 'Tu contacto solo lo ve quien paga — cero spam', delay: 240 },
                  { text: 'Sabés cuántas personas vieron tu pedido', delay: 320 },
                  { text: 'Podés cerrar tu búsqueda cuando quieras', delay: 400 },
                ].map(({ text, delay }) => (
                  <AnimateIn key={text} variant="fade-left" delay={delay} as="li" className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{text}</span>
                  </AnimateIn>
                ))}
              </ul>
              <AnimateIn variant="fade-up" delay={500} className="mt-8 inline-block">
                <Link href="/publicar">
                  <Button className="bg-orange-500 hover:bg-orange-600 hover:scale-105 transition-transform duration-200">
                    Publicar mi búsqueda gratis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </AnimateIn>
            </AnimateIn>

            {/* Two mock cards */}
            <AnimateIn variant="fade-right" delay={200} className="flex flex-col gap-4 max-w-sm mx-auto w-full">

              <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
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
                  <div className="flex gap-1.5 flex-wrap">
                    {['cochera', 'gas natural', 'seguridad'].map((r) => (
                      <span key={r} className="text-xs bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded-full">{r}</span>
                    ))}
                  </div>
                  <div className="pt-1">
                    <div className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-400">
                      <Lock className="h-3 w-3" /> Contacto oculto · ejemplo
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
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
                  <div className="flex gap-1.5 flex-wrap">
                    {['Toyota / Ford', '2020+', '🔑 Usado'].map((r) => (
                      <span key={r} className="text-xs bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded-full">{r}</span>
                    ))}
                  </div>
                  <div className="pt-1">
                    <div className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-400">
                      <Lock className="h-3 w-3" /> Contacto oculto · ejemplo
                    </div>
                  </div>
                </div>
              </div>

            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ── For brokers ── */}
      <section className="py-20 px-4 bg-white overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            <div className="order-2 md:order-1 space-y-3">
              {[
                { label: 'Casa · Mendiolaza · USD 230k', badge: 'Nuevo', time: 'hace 1h', gradient: 'from-emerald-400 to-teal-500', emoji: '🏡', delay: 0 },
                { label: 'Casa · Villa Belgrano · USD 620k', badge: 'Nuevo', time: 'hace 3h', gradient: 'from-violet-400 to-purple-500', emoji: '🏘️', delay: 150 },
                { label: 'Depto · Nueva Córdoba · USD 70k', badge: '', time: 'hace 6h', gradient: 'from-blue-400 to-indigo-500', emoji: '🏢', delay: 300 },
              ].map(({ label, badge, time, gradient, emoji, delay }) => (
                <AnimateIn key={label} variant="fade-left" delay={delay}
                  className="flex items-center gap-4 bg-gray-50 hover:bg-orange-50 rounded-2xl p-3 border border-gray-100 hover:border-orange-100 hover:shadow-sm transition-all duration-300 cursor-default group"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    {emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{label}</span>
                      {badge && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium shrink-0">{badge}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{time}</p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs h-7 shrink-0 group-hover:border-orange-300 group-hover:text-orange-600 transition-colors duration-300">1 crédito</Button>
                </AnimateIn>
              ))}
            </div>

            <AnimateIn variant="fade-right" className="order-1 md:order-2">
              <div className="text-sm font-semibold text-orange-500 uppercase tracking-wide mb-3">Para vendedores</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-5">Compradores que ya saben lo que quieren</h2>
              <ul className="space-y-4">
                {[
                  { text: 'Ves el pedido completo antes de pagar', delay: 80 },
                  { text: 'Solo pagás cuando hay match real con lo que tenés', delay: 160 },
                  { text: 'Alertas automáticas por zona — propiedades y autos', delay: 240 },
                  { text: 'Sin suscripción forzada — comprás créditos cuando los necesitás', delay: 320 },
                  { text: 'Dashboard con todos tus contactos desbloqueados', delay: 400 },
                ].map(({ text, delay }) => (
                  <AnimateIn key={text} variant="fade-right" delay={delay} as="li" className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{text}</span>
                  </AnimateIn>
                ))}
              </ul>
              <AnimateIn variant="fade-up" delay={500} className="mt-8 inline-block">
                <Link href="/broker">
                  <Button className="bg-orange-500 hover:bg-orange-600 hover:scale-105 transition-transform duration-200">
                    Crear mi cuenta gratis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </AnimateIn>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-950 via-blue-950 to-orange-950 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center text-white">
          <AnimateIn variant="scale-up">
            <TrendingUp className="h-10 w-10 mx-auto mb-4 opacity-70 animate-float" />
            <h2 className="text-3xl font-bold mb-4">Un crédito = un contacto real</h2>
            <p className="text-orange-100/70 text-lg mb-10 max-w-xl mx-auto">
              Comprás créditos solo cuando los necesitás. Ves el pedido completo antes de decidir si vale la pena desbloquearlo.
            </p>
          </AnimateIn>

          <div className="grid sm:grid-cols-4 gap-3 max-w-3xl mx-auto mb-10">
            {[
              { credits: '3 créditos', price: '$80.000', per: '$26.667 c/u', popular: false, unlimited: false, delay: 0 },
              { credits: '5 créditos', price: '$100.000', per: '$20.000 c/u', popular: true, unlimited: false, delay: 100 },
              { credits: '10 créditos', price: '$180.000', per: '$18.000 c/u', popular: false, unlimited: false, delay: 200 },
              { credits: 'Ilimitado', price: '$350.000', per: 'por mes', popular: false, unlimited: true, delay: 300 },
            ].map(({ credits, price, per, popular, unlimited, delay }) => (
              <AnimateIn key={credits} variant="scale-up" delay={delay}
                className={`rounded-2xl p-5 border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                  unlimited
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white border-orange-400 shadow-xl'
                    : popular
                    ? 'bg-white text-gray-900 border-white shadow-xl scale-105'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/15'
                }`}
              >
                {popular && (
                  <div className="text-xs font-bold uppercase tracking-wide text-orange-500 mb-2">★ Más popular</div>
                )}
                {unlimited && (
                  <div className="text-xs font-bold uppercase tracking-wide text-white/80 mb-2">∞ Plan Pro</div>
                )}
                <div className="font-semibold text-sm mb-1">{credits}</div>
                <div className="text-2xl font-bold">{price}</div>
                <div className={`text-xs mt-1 ${popular ? 'text-orange-400' : 'text-orange-200/70'}`}>{per}</div>
              </AnimateIn>
            ))}
          </div>

          <AnimateIn variant="fade-up" delay={400}>
            <p className="text-xs text-white/40 mb-8">Precios en pesos argentinos · créditos válidos 30 días</p>
            <Link href="/broker">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 hover:scale-105 transition-transform duration-200 text-white font-bold px-10 rounded-2xl">
                Empezar ahora
              </Button>
            </Link>
          </AnimateIn>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  )
}
