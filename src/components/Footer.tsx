import Link from 'next/link'
import { PropiLogoFull } from '@/components/PropiLogo'

export default function Footer() {
  return (
    <footer className="py-10 px-5 sm:px-8 border-t border-hairline bg-white">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5 text-sm text-ink-2">
        <div>
          <PropiLogoFull size="sm" />
        </div>
        <div className="flex flex-wrap gap-6 justify-center">
          <Link href="/pedidos" className="hover:text-ink transition-colors">Ver búsquedas</Link>
          <Link href="/publicar" className="hover:text-ink transition-colors">Publicar búsqueda</Link>
          <Link href="/broker" className="hover:text-ink transition-colors">Para vendedores</Link>
          <Link href="/terminos" className="hover:text-ink transition-colors">Términos</Link>
          <Link href="/privacidad" className="hover:text-ink transition-colors">Privacidad</Link>
        </div>
        <p className="text-ink-3">© 2026 Demandi · Córdoba, Argentina</p>
      </div>
    </footer>
  )
}
