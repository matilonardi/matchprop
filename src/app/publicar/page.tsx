import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import PublicarWizard from './PublicarWizard'

export default function PublicarPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-24 pb-16 px-5">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-[40px] font-extrabold text-ink tracking-[-0.02em] mb-3">
              Publicá tu búsqueda
            </h1>
            <p className="text-ink-2">
              Completamente gratis. Los vendedores te contactan si tienen algo para vos.
            </p>
          </div>
          <PublicarWizard />
        </div>
      </div>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}
