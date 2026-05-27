import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="py-10 px-4 border-t border-gray-100 bg-white">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <div className="font-semibold text-gray-900">
          <span className="text-orange-500">Match</span>Prop
        </div>
        <div className="flex flex-wrap gap-6 justify-center">
          <Link href="/pedidos" className="hover:text-gray-700 transition-colors">Ver búsquedas</Link>
          <Link href="/publicar" className="hover:text-gray-700 transition-colors">Publicar búsqueda</Link>
          <Link href="/broker" className="hover:text-gray-700 transition-colors">Para vendedores</Link>
          <Link href="/terminos" className="hover:text-gray-700 transition-colors">Términos</Link>
          <Link href="/privacidad" className="hover:text-gray-700 transition-colors">Privacidad</Link>
        </div>
        <p>© 2026 MatchProp · Córdoba, Argentina</p>
      </div>
    </footer>
  )
}
