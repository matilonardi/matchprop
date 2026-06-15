import Link from 'next/link'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'Política de Privacidad – Propi',
  description: 'Política de privacidad y tratamiento de datos personales de Propi.',
}

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 md:p-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
            <p className="text-sm text-gray-400 mb-8">Última actualización: mayo de 2026</p>

            <div className="prose prose-gray max-w-none space-y-8 text-sm text-gray-700 leading-relaxed">

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Responsable del tratamiento</h2>
                <p>
                  Propi (en adelante, "la plataforma") es responsable del tratamiento de los datos personales
                  recopilados a través de este sitio web, en cumplimiento de la Ley N.° 25.326 de Protección de
                  Datos Personales de la República Argentina y sus normas complementarias.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Datos que recopilamos</h2>
                <h3 className="font-medium text-gray-800 mt-3 mb-1">2.1 Datos proporcionados por compradores</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Nombre y apellido</li>
                  <li>Número de teléfono / WhatsApp</li>
                  <li>Preferencias de búsqueda (zona, presupuesto, tipo de propiedad o vehículo)</li>
                </ul>
                <h3 className="font-medium text-gray-800 mt-3 mb-1">2.2 Datos proporcionados por vendedores</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Nombre y apellido</li>
                  <li>Dirección de correo electrónico</li>
                  <li>Número de teléfono / WhatsApp</li>
                  <li>Nombre de la empresa o agencia (opcional)</li>
                  <li>Zonas de trabajo seleccionadas</li>
                </ul>
                <h3 className="font-medium text-gray-800 mt-3 mb-1">2.3 Datos recopilados automáticamente</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Dirección IP</li>
                  <li>Tipo de dispositivo y navegador</li>
                  <li>Páginas visitadas y tiempo de sesión</li>
                  <li>Datos de transacciones (procesados por MercadoPago)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Finalidad del tratamiento</h2>
                <p>Los datos recopilados son utilizados exclusivamente para:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Mostrar las búsquedas publicadas a los vendedores registrados.</li>
                  <li>Permitir a los vendedores contactar a compradores que coincidan con su oferta.</li>
                  <li>Gestionar cuentas de usuario, créditos y transacciones.</li>
                  <li>Enviar notificaciones sobre nuevas búsquedas relevantes (solo a vendedores que lo aceptaron).</li>
                  <li>Mejorar el funcionamiento y la seguridad de la plataforma.</li>
                  <li>Cumplir con obligaciones legales.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Compartición de datos</h2>
                <p>
                  Los datos de contacto de los compradores son visibles únicamente para los vendedores que hayan
                  desbloqueado ese contacto mediante el uso de créditos.
                </p>
                <p className="mt-2">
                  Propi <strong>no vende, cede ni alquila</strong> datos personales a terceros, salvo en los
                  siguientes casos:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Proveedores de servicios tecnológicos necesarios para operar la plataforma (Supabase, Vercel, MercadoPago), bajo acuerdos de confidencialidad.</li>
                  <li>Cuando sea requerido por autoridad judicial o administrativa competente.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Almacenamiento y seguridad</h2>
                <p>
                  Los datos son almacenados en servidores seguros provistos por Supabase (infraestructura en la
                  nube). Implementamos medidas técnicas y organizativas razonables para proteger la información
                  contra accesos no autorizados, pérdida o alteración.
                </p>
                <p className="mt-2">
                  No obstante, ningún sistema de transmisión por Internet es 100% seguro. Propi no puede
                  garantizar la seguridad absoluta de los datos transmitidos.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Derechos del titular de los datos</h2>
                <p>
                  De conformidad con la Ley N.° 25.326, todo titular de datos personales tiene derecho a:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><strong>Acceso:</strong> conocer qué datos tenemos sobre usted.</li>
                  <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
                  <li><strong>Supresión:</strong> solicitar la eliminación de sus datos.</li>
                  <li><strong>Confidencialidad:</strong> oponerse al tratamiento de sus datos para fines comerciales.</li>
                </ul>
                <p className="mt-2">
                  Para ejercer estos derechos, escribinos a{' '}
                  <a href="mailto:hola@matchprop.com.ar" className="text-blue-600 hover:underline">
                    hola@matchprop.com.ar
                  </a>
                  . Responderemos en un plazo máximo de 5 días hábiles.
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  La Dirección Nacional de Protección de Datos Personales (DNPDP) es el organismo competente para
                  recibir denuncias y reclamos en caso de incumplimiento de la normativa.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Cookies</h2>
                <p>
                  Propi utiliza cookies de sesión necesarias para el funcionamiento de la plataforma
                  (autenticación, preferencias). No utilizamos cookies de seguimiento publicitario de terceros.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Retención de datos</h2>
                <p>
                  Los datos de los compradores se conservan mientras la búsqueda esté activa. Una vez cerrada,
                  los datos de contacto dejan de ser accesibles para nuevos vendedores, aunque pueden conservarse
                  en forma anonimizada para estadísticas internas.
                </p>
                <p className="mt-2">
                  Los datos de los vendedores se conservan mientras la cuenta esté activa. Al solicitar la baja,
                  se eliminarán los datos personales en un plazo de 30 días, salvo obligación legal de conservación.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Cambios en esta política</h2>
                <p>
                  Podemos actualizar esta Política de Privacidad periódicamente. Notificaremos los cambios
                  significativos por correo electrónico o mediante un aviso destacado en la plataforma.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Contacto</h2>
                <p>
                  Para cualquier consulta sobre el tratamiento de tus datos personales, contactanos en{' '}
                  <a href="mailto:hola@matchprop.com.ar" className="text-blue-600 hover:underline">
                    hola@matchprop.com.ar
                  </a>
                  .
                </p>
              </section>

            </div>

            <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3 text-sm">
              <Link href="/terminos" className="text-blue-600 hover:underline">
                → Términos y Condiciones
              </Link>
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                ← Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
