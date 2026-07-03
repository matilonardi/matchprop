import Link from 'next/link'
import { ArrowRight, Home, Building2, Trees, Pencil, Bell, Phone, Check, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import HeroTicker from '@/components/HeroTicker'
import { createServerClient } from '@/lib/supabase-server'

export const revalidate = 60

// ── Tarjeta de búsqueda de ejemplo (visual, no interactiva) ──
function SampleCard({
  icon,
  price,
  currency = 'USD',
  meta,
  tags,
  views,
  ago,
  floatClass = '',
}: {
  icon: React.ReactNode
  price: string
  currency?: string
  meta: string
  tags: string[]
  views: number
  ago: string
  floatClass?: string
}) {
  return (
    <div className={`bg-white border border-hairline rounded-[14px] p-5 ${floatClass}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center gap-2 text-[13px] font-medium text-ink-2">
          <span className="relative flex h-[7px] w-[7px]" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full rounded-full bg-brand animate-radar" />
            <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-brand" />
          </span>
          Búsqueda activa
        </span>
        <span className="text-[13px] text-ink-3">{views} vistas</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-tint text-brand">
          {icon}
        </span>
        <div>
          <p className="text-xl font-bold text-ink tabular leading-tight">
            {currency && <span className="text-ink-3 text-sm font-semibold mr-1">{currency}</span>}
            {price}
          </p>
          <p className="text-sm text-ink-2">{meta}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span key={t} className="rounded-md bg-chip px-2 py-1 text-xs text-ink-2">{t}</span>
        ))}
      </div>
    </div>
  )
}

export default async function HomePage() {
  const supabase = createServerClient()
  // Solo propiedades — mismo criterio que el feed de /pedidos, para que los números coincidan
  const [{ count }, { data: zoneRows }] = await Promise.all([
    supabase
      .from('buyer_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('request_type', 'property'),
    supabase
      .from('buyer_requests')
      .select('zones, budget_usd')
      .eq('status', 'active')
      .eq('request_type', 'property')
      .limit(2000),
  ])
  const totalBusquedas = count ?? 0

  // Ranking de zonas por demanda (se refresca con revalidate — dinámico por publicación)
  const zoneStats = new Map<string, { count: number; sum: number; n: number }>()
  for (const r of zoneRows || []) {
    for (const z of r.zones || []) {
      const s = zoneStats.get(z) || { count: 0, sum: 0, n: 0 }
      s.count++
      if (r.budget_usd && r.budget_usd !== 999999) { s.sum += r.budget_usd; s.n++ }
      zoneStats.set(z, s)
    }
  }
  const topZones = [...zoneStats.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6)
    .map(([zone, s]) => ({ zone, count: s.count, avgK: s.n ? Math.round(s.sum / s.n / 1000) : 0 }))
  const maxZoneCount = topZones[0]?.count || 1

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ── */}
      <section className="pt-16 border-b border-hairline">
        <div className="max-w-6xl mx-auto px-5 sm:px-11 py-16 md:py-[72px] grid lg:grid-cols-[1.05fr_.95fr] gap-14 items-center">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-6 bg-brand" />
              <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-brand">
                El marketplace al revés
              </span>
            </div>
            <h1 className="text-4xl md:text-[58px] font-extrabold text-ink leading-[1.03] tracking-[-0.02em]">
              Publicá lo que buscás. Que te encuentren a vos.
            </h1>
            <p className="mt-6 text-lg md:text-[19px] text-ink-2 max-w-[460px] leading-relaxed">
              Dejá de scrollear miles de avisos. Contanos qué propiedad buscás y los
              vendedores de Córdoba vienen con la oferta.
            </p>
            <div className="mt-6">
              <HeroTicker />
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <Link href="/publicar">
                <Button size="lg" className="rounded-lg px-5 text-[15px]">
                  Publicar mi búsqueda
                </Button>
              </Link>
              <Link href="/pedidos" className="link-underline text-[15px] font-medium text-ink hover:text-brand">
                Ver búsquedas →
              </Link>
            </div>
            <p className="mt-6 text-sm text-ink-3">
              Gratis para compradores · Sin registro · Sin spam
            </p>
          </div>

          {/* Visual: tarjetas float */}
          <div className="relative hidden lg:block">
            <div className="space-y-4">
              <SampleCard
                icon={<Home className="h-5 w-5" strokeWidth={1.5} />}
                price="230.000"
                meta="Casa · Mendiolaza"
                tags={['Cochera', 'Gas natural', 'Seguridad']}
                views={14}
                ago="hace 2h"
                floatClass="animate-float-a"
              />
              <SampleCard
                icon={<Building2 className="h-5 w-5" strokeWidth={1.5} />}
                price="70.000"
                meta="Depto · Nueva Córdoba"
                tags={['1 dormitorio', 'Apto crédito']}
                views={22}
                ago="hace 1h"
                floatClass="animate-float-b ml-8"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="border-b border-hairline">
        <div className="max-w-6xl mx-auto px-5 sm:px-11">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-hairline">
            {[
              { n: totalBusquedas > 0 ? totalBusquedas.toLocaleString('es-AR') : '100%', label: totalBusquedas > 0 ? 'Búsquedas activas ahora' : 'Gratis para compradores' },
              { n: 'Alta intención', label: 'Leads que ya saben qué quieren' },
              { n: 'Córdoba', label: 'Foco inicial · expansión planificada' },
            ].map(({ n, label }, idx) => (
              <div key={label} className={`py-8 ${idx === 0 ? 'sm:pr-8' : 'sm:px-8'}`}>
                <div className="text-[34px] font-extrabold text-ink tabular leading-none">{n}</div>
                <div className="mt-2 text-sm text-ink-2">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section className="border-b border-hairline">
        <div className="max-w-6xl mx-auto px-5 sm:px-11 py-16 md:py-20">
          <h2 className="text-3xl md:text-[38px] font-extrabold text-ink tracking-[-0.02em]">Cómo funciona</h2>
          <p className="mt-3 text-ink-2 text-lg">Tres pasos y la oferta viene a buscarte.</p>

          <div className="mt-12 grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-hairline">
            {[
              { step: '01', icon: <Pencil className="h-6 w-6" strokeWidth={1.5} />, title: 'Publicás qué buscás', desc: 'Zona, presupuesto y tipo de propiedad. Menos de 3 minutos, sin crear cuenta.' },
              { step: '02', icon: <Bell className="h-6 w-6" strokeWidth={1.5} />, title: 'Los vendedores te ven', desc: 'Inmobiliarias y particulares reciben alertas por zona. Ven tu búsqueda —nunca tu contacto sin permiso.' },
              { step: '03', icon: <Phone className="h-6 w-6" strokeWidth={1.5} />, title: 'Te contactan con opciones reales', desc: 'Cuando alguien tiene algo para vos, ve tu contacto y te escribe. Cero spam.' },
            ].map(({ step, icon, title, desc }, idx) => (
              <div key={step} className={`py-8 ${idx === 0 ? 'md:pr-10' : 'md:px-10'}`}>
                <div className="font-grotesk text-sm font-bold text-brand">{step}</div>
                <div className="mt-4 text-ink">{icon}</div>
                <h3 className="mt-4 text-xl font-bold text-ink">{title}</h3>
                <p className="mt-2 text-[15px] text-ink-2 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Para compradores ── */}
      <section className="border-b border-hairline">
        <div className="max-w-6xl mx-auto px-5 sm:px-11 py-16 md:py-20 grid md:grid-cols-[.9fr_1.1fr] gap-14 items-center">
          <div>
            <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-brand">Para compradores</div>
            <h2 className="mt-4 text-3xl md:text-[34px] font-extrabold text-ink tracking-[-0.02em]">
              Tu búsqueda trabaja sola mientras hacés otra cosa
            </h2>
            <ul className="mt-8 space-y-4">
              {[
                'Completamente gratis, siempre',
                'Sin registro obligatorio',
                'Tu contacto solo lo ve quien tiene algo real para ofrecerte',
                'Sabés cuántas personas vieron tu pedido',
                'Cerrás tu búsqueda cuando quieras',
              ].map((text) => (
                <li key={text} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-brand shrink-0 mt-0.5" strokeWidth={2} />
                  <span className="text-ink-2">{text}</span>
                </li>
              ))}
            </ul>
            <Link href="/publicar" className="mt-8 inline-block">
              <Button size="lg" className="rounded-lg px-5">
                Publicar mi búsqueda
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SampleCard
              icon={<Home className="h-5 w-5" strokeWidth={1.5} />}
              price="230.000" meta="Casa · Mendiolaza"
              tags={['Cochera', 'Gas natural']} views={14} ago="hace 2h"
            />
            <SampleCard
              icon={<Building2 className="h-5 w-5" strokeWidth={1.5} />}
              price="70.000" meta="Depto · Nueva Córdoba"
              tags={['1 dormitorio', 'Balcón']} views={22} ago="hace 4h"
            />
            <SampleCard
              icon={<Trees className="h-5 w-5" strokeWidth={1.5} />}
              price="90.000" meta="Lote · La Calera"
              tags={['600 m²+', 'Escritura inmediata']} views={6} ago="hace 8h"
            />
            <SampleCard
              icon={<Home className="h-5 w-5" strokeWidth={1.5} />}
              price="620.000" meta="Casa · Villa Belgrano"
              tags={['3+ dorm.', 'Pileta']} views={31} ago="hace 3h"
            />
          </div>
        </div>
      </section>

      {/* ── Zonas con más demanda (dinámico) ── */}
      {topZones.length > 0 && (
        <section className="border-b border-hairline">
          <div className="max-w-6xl mx-auto px-5 sm:px-11 py-16 md:py-20 grid md:grid-cols-[.8fr_1.2fr] gap-14 items-center">
            <div>
              <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-brand">
                Demanda en tiempo real
              </div>
              <h2 className="mt-4 text-3xl md:text-[34px] font-extrabold text-ink tracking-[-0.02em]">
                Zonas con más demanda
              </h2>
              <p className="mt-4 text-ink-2">
                Basado en <span className="font-bold text-ink tabular">{totalBusquedas.toLocaleString('es-AR')}</span> búsquedas
                activas. Se actualiza con cada publicación nueva.
              </p>
              <Link href="/broker" className="mt-7 inline-block">
                <Button size="lg" className="rounded-lg px-5">
                  Quiero estos contactos
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {topZones.map(({ zone, count: zc, avgK }, i) => (
                <div key={zone}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 mb-1.5">
                    <div className="flex items-baseline gap-3">
                      <span className="font-grotesk text-xs font-bold text-brand w-5 shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[15px] font-semibold text-ink">{zone}</span>
                    </div>
                    <span className="pl-8 sm:pl-0 text-sm text-ink-2 tabular">
                      <span className="font-bold text-ink">{zc}</span> búsquedas
                      {avgK > 0 && <span className="text-ink-3"> · ~USD {avgK}k</span>}
                    </span>
                  </div>
                  <div className="ml-8 h-1.5 rounded-full bg-chip overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${Math.max(8, Math.round((zc / maxZoneCount) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Para vendedores ── */}
      <section className="bg-surface border-b border-hairline">
        <div className="max-w-6xl mx-auto px-5 sm:px-11 py-16 md:py-20 grid md:grid-cols-[1.1fr_.9fr] gap-14 items-center">
          <div className="space-y-3 order-2 md:order-1">
            {[
              { icon: <Home className="h-5 w-5" strokeWidth={1.5} />, label: 'Casa · Mendiolaza · USD 230k', badge: 'Nuevo', time: 'hace 1h' },
              { icon: <Home className="h-5 w-5" strokeWidth={1.5} />, label: 'Casa · Villa Belgrano · USD 620k', badge: '', time: 'hace 3h' },
              { icon: <Building2 className="h-5 w-5" strokeWidth={1.5} />, label: 'Depto · Nueva Córdoba · USD 70k', badge: '', time: 'hace 6h' },
            ].map(({ icon, label, badge, time }) => (
              <div key={label} className="flex items-center gap-4 bg-white border border-hairline rounded-[14px] p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-tint text-brand">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink truncate">{label}</span>
                    {badge && <span className="text-[11px] font-semibold text-brand bg-tint px-2 py-0.5 rounded-full shrink-0">{badge}</span>}
                  </div>
                  <p className="text-xs text-ink-3 mt-0.5">{time}</p>
                </div>
                <Button size="sm" variant="outline" className="shrink-0 text-xs">Ver contacto</Button>
              </div>
            ))}
          </div>

          <div className="order-1 md:order-2">
            <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-brand">Para vendedores</div>
            <h2 className="mt-4 text-3xl md:text-[34px] font-extrabold text-ink tracking-[-0.02em]">
              Compradores que ya saben lo que quieren
            </h2>
            <ul className="mt-8 space-y-4">
              {[
                'Ves el pedido completo antes de contactar',
                'Alertas automáticas por zona — propiedades y autos',
                'Contactás directo a la punta compradora',
              ].map((text) => (
                <li key={text} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-brand shrink-0 mt-0.5" strokeWidth={2} />
                  <span className="text-ink-2">{text}</span>
                </li>
              ))}
            </ul>
            <Link href="/broker" className="mt-8 inline-block">
              <Button size="lg" className="rounded-lg px-5">
                Crear mi cuenta gratis
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="border-b border-hairline">
        <div className="max-w-6xl mx-auto px-5 sm:px-11 py-20 md:py-24 text-center">
          <h2 className="text-4xl md:text-[44px] font-extrabold text-ink tracking-[-0.02em]">Empezá gratis hoy</h2>
          <p className="mt-4 text-lg text-ink-2 max-w-xl mx-auto">
            Publicá lo que buscás o explorá las búsquedas activas de compradores reales en Córdoba.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/publicar">
              <Button size="lg" className="rounded-lg px-6">Publicar mi búsqueda</Button>
            </Link>
            <Link href="/broker">
              <Button size="lg" variant="outline" className="rounded-lg px-6 border-ink text-ink hover:bg-ink hover:text-white">
                Soy vendedor
              </Button>
            </Link>
          </div>
          <p className="mt-6 inline-flex items-center gap-2 text-sm text-ink-3">
            <Lock className="h-3.5 w-3.5" strokeWidth={1.5} />
            Tu contacto nunca se muestra públicamente
          </p>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  )
}
