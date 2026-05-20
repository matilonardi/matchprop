import Navbar from '@/components/Navbar'
import PublicarWizard from './PublicarWizard'

export default function PublicarPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Publicá tu búsqueda
            </h1>
            <p className="text-gray-500">
              Completamente gratis. Las inmobiliarias te van a contactar si tienen algo para vos.
            </p>
          </div>
          <PublicarWizard />
        </div>
      </div>
    </div>
  )
}
