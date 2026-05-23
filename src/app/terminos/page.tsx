import Link from 'next/link'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'Términos y Condiciones – MatchProp',
  description: 'Términos y condiciones de uso de la plataforma MatchProp.',
}

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 md:p-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Términos y Condiciones</h1>
            <p className="text-sm text-gray-400 mb-8">Última actualización: mayo de 2026</p>

            <div className="prose prose-gray max-w-none space-y-8 text-sm text-gray-700 leading-relaxed">

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Descripción del servicio</h2>
                <p>
                  MatchProp es una plataforma digital que conecta a personas que buscan comprar o alquilar propiedades
                  o adquirir vehículos (<strong>compradores</strong>) con vendedores, inmobiliarias, concesionarias y
                  particulares que puedan satisfacer esas búsquedas (<strong>vendedores</strong>).
                </p>
                <p className="mt-2">
                  El servicio opera bajo un modelo de demanda inversa: los compradores publican sus búsquedas de forma
                  gratuita, y los vendedores acceden a los datos de contacto mediante la compra de créditos.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Aceptación de los términos</h2>
                <p>
                  Al acceder o utilizar MatchProp, el usuario declara haber leído, comprendido y aceptado estos
                  Términos y Condiciones en su totalidad. Si no está de acuerdo con alguna de las disposiciones
                  aquí establecidas, deberá abstenerse de utilizar la plataforma.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Tipos de usuarios</h2>
                <h3 className="font-medium text-gray-800 mt-3 mb-1">3.1 Compradores</h3>
                <p>
                  Son aquellas personas que publican búsquedas indicando qué propiedad o vehículo desean adquirir.
                  El registro no es obligatorio para publicar una búsqueda. El comprador es responsable de que la
                  información proporcionada sea veraz, actualizada y que los datos de contacto sean reales y de su
                  propiedad.
                </p>
                <h3 className="font-medium text-gray-800 mt-3 mb-1">3.2 Vendedores</h3>
                <p>
                  Son personas físicas o jurídicas (inmobiliarias, concesionarias, particulares) que se registran
                  en la plataforma para acceder a las búsquedas publicadas. El vendedor debe brindar información
                  veraz al momento del registro y utilizarla con fines legítimos y profesionales.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Créditos y pagos</h2>
                <p>
                  Los vendedores pueden adquirir créditos para desbloquear los datos de contacto de los compradores.
                  Cada crédito equivale al desbloqueo de un (1) contacto.
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Los créditos no tienen fecha de vencimiento.</li>
                  <li>Los créditos no son transferibles ni canjeables por dinero.</li>
                  <li>
                    <strong>Los créditos consumidos no son reembolsables</strong>, excepto en caso de error técnico
                    comprobable imputable a MatchProp.
                  </li>
                  <li>Los precios están expresados en dólares estadounidenses (USD) y el cobro se procesa en pesos
                    argentinos (ARS) al tipo de cambio vigente al momento del pago, a través de MercadoPago.</li>
                  <li>MatchProp se reserva el derecho de modificar los precios con previo aviso de 15 días.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Publicación de búsquedas</h2>
                <p>
                  Al publicar una búsqueda, el comprador garantiza que:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>La información proporcionada es verdadera y actualizada.</li>
                  <li>Los datos de contacto (nombre, teléfono) le pertenecen y son accesibles.</li>
                  <li>La búsqueda refleja una intención real de compra o alquiler.</li>
                  <li>No utiliza la plataforma para fines distintos a la búsqueda genuina de un bien.</li>
                </ul>
                <p className="mt-2">
                  MatchProp se reserva el derecho de eliminar búsquedas que incumplan estas condiciones, sin
                  necesidad de notificación previa.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Conducta de los vendedores</h2>
                <p>Al acceder a datos de contacto de compradores, el vendedor se compromete a:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Contactar al comprador únicamente con fines relacionados a la búsqueda publicada.</li>
                  <li>No ceder, vender ni compartir los datos obtenidos a terceros.</li>
                  <li>No utilizar los datos para envío de comunicaciones no solicitadas (spam).</li>
                  <li>Tratar los datos personales conforme a la Ley N.° 25.326 de Protección de Datos Personales de Argentina.</li>
                </ul>
                <p className="mt-2">
                  El incumplimiento de estas obligaciones podrá dar lugar a la suspensión o baja de la cuenta,
                  sin reembolso de créditos.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Limitación de responsabilidad</h2>
                <p>
                  MatchProp actúa exclusivamente como intermediario tecnológico. La plataforma no interviene en las
                  negociaciones, acuerdos ni transacciones que se realicen entre compradores y vendedores.
                </p>
                <p className="mt-2">MatchProp <strong>no garantiza</strong>:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Que el comprador efectivamente realice la compra.</li>
                  <li>La veracidad de la información publicada por los usuarios.</li>
                  <li>La disponibilidad ininterrumpida del servicio.</li>
                  <li>Resultados comerciales a partir del uso de los créditos.</li>
                </ul>
                <p className="mt-2">
                  En ningún caso MatchProp será responsable por daños directos, indirectos, incidentales o
                  consecuentes derivados del uso o la imposibilidad de uso de la plataforma.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Propiedad intelectual</h2>
                <p>
                  Todos los derechos sobre el diseño, código, marca, logotipo y contenidos propios de MatchProp son
                  propiedad exclusiva de sus titulares. Queda prohibida su reproducción, distribución o uso sin
                  autorización expresa.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Modificaciones</h2>
                <p>
                  MatchProp podrá modificar estos Términos y Condiciones en cualquier momento. Los cambios serán
                  notificados mediante la actualización de la fecha al inicio de este documento y, cuando sea
                  relevante, por correo electrónico a los usuarios registrados. El uso continuado de la plataforma
                  implica la aceptación de los términos vigentes.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Jurisdicción y ley aplicable</h2>
                <p>
                  Estos Términos se rigen por las leyes de la República Argentina. Ante cualquier controversia, las
                  partes se someten a la jurisdicción de los tribunales ordinarios de la ciudad de Córdoba, Argentina,
                  con renuncia expresa a cualquier otro fuero que pudiera corresponder.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Contacto</h2>
                <p>
                  Para consultas, reclamos o solicitudes relacionadas con estos Términos, podés escribirnos a{' '}
                  <a href="mailto:hola@matchprop.com.ar" className="text-blue-600 hover:underline">
                    hola@matchprop.com.ar
                  </a>
                  .
                </p>
              </section>

            </div>

            <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3 text-sm">
              <Link href="/privacidad" className="text-blue-600 hover:underline">
                → Política de Privacidad
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
