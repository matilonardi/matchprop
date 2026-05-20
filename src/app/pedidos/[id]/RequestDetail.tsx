'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  MapPin, Bed, Bath, DollarSign, Clock, Eye, Lock, Unlock,
  CheckCircle2, ArrowLeft, Share2, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PROPERTY_TYPE_LABELS, FINANCING_LABELS } from '@/lib/constants'
import type { PublicBuyerRequest } from '@/lib/supabase'

interface Contact {
  contact_name: string
  contact_phone: string
  contact_email?: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(hours / 24)
  if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`
  if (hours > 0) return `hace ${hours}h`
  return 'hace unos minutos'
}

function urgencyLabel(urgency?: string): string {
  const map: Record<string, string> = {
    esta_semana: '🔥 Esta semana',
    este_mes: '📅 Este mes',
    en_3_meses: '📆 En 3 meses',
    flexible: '⏳ Flexible',
  }
  return urgency ? (map[urgency] || urgency) : ''
}

export default function RequestDetail({
  request,
  isNew,
}: {
  request: PublicBuyerRequest
  isNew: boolean
}) {
  const [contact, setContact] = useState<Contact | null>(null)
  const [unlocking, setUnlocking] = useState(false)
  const [unlockError, setUnlockError] = useState('')

  const typeLabels = request.property_types.map((t) => PROPERTY_TYPE_LABELS[t] || t)

  async function handleUnlock() {
    setUnlocking(true)
    setUnlockError('')
    try {
      // In production this sends broker_user_id from session
      const res = await fetch(`/api/pedidos/${request.id}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ broker_user_id: 'demo' }),
      })
      if (res.status === 402) {
        setUnlockError('Sin créditos. Comprá más créditos para continuar.')
        return
      }
      if (!res.ok) {
        const data = await res.json()
        setUnlockError(data.error || 'Error al desbloquear')
        return
      }
      const { contact: c } = await res.json()
      setContact(c)
    } catch {
      setUnlockError('Error de conexión')
    } finally {
      setUnlocking(false)
    }
  }

  return (
    <div>
      {isNew && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-green-800">¡Búsqueda publicada con éxito!</p>
            <p className="text-sm text-green-600">
              Las inmobiliarias de Córdoba ya pueden ver tu pedido y contactarte.
            </p>
          </div>
        </div>
      )}

      <Link href="/pedidos" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver a pedidos
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {typeLabels.join(' / ')}
                </h1>
                <Badge className="bg-green-100 text-green-700 border-0">Activa</Badge>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <MapPin className="h-4 w-4" />
                <span>{request.zones.join(', ')}</span>
              </div>
            </div>
            <button
              onClick={() => navigator.share?.({ url: window.location.href })}
              className="p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-5">
          {/* Budget & Financing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <DollarSign className="h-3.5 w-3.5" />
                Presupuesto máximo
              </div>
              <p className="text-xl font-bold text-gray-900">
                USD {request.budget_usd.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-gray-500 text-xs mb-1">Financiación</div>
              <p className="font-semibold text-gray-900 text-sm">
                {FINANCING_LABELS[request.financing]}
              </p>
            </div>
          </div>

          {/* Rooms */}
          <div className="flex gap-4">
            {request.bedrooms_min && (
              <div className="flex items-center gap-2 text-gray-700">
                <Bed className="h-5 w-5 text-blue-500" />
                <span>
                  {request.bedrooms_min}
                  {request.bedrooms_max ? `–${request.bedrooms_max}` : '+'} dormitorios
                </span>
              </div>
            )}
            {request.bathrooms_min && (
              <div className="flex items-center gap-2 text-gray-700">
                <Bath className="h-5 w-5 text-blue-500" />
                <span>{request.bathrooms_min}+ baños</span>
              </div>
            )}
          </div>

          {/* Urgency */}
          {request.urgency && (
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm">{urgencyLabel(request.urgency)}</span>
            </div>
          )}

          {/* Requirements */}
          {request.requirements.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Requisitos importantes:</p>
              <div className="flex flex-wrap gap-2">
                {request.requirements.map((r) => (
                  <span
                    key={r}
                    className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full"
                  >
                    {r.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {request.description && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Descripción adicional:</p>
              <p className="text-sm text-gray-600">{request.description}</p>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-400 pt-2 border-t border-gray-50">
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {request.views_count} inmobiliarias lo vieron
            </span>
            <span>{timeAgo(request.created_at)}</span>
          </div>
        </div>

        {/* Unlock contact */}
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          {contact ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-700 font-medium mb-3">
                <Unlock className="h-5 w-5" />
                Contacto desbloqueado
              </div>
              <div className="bg-white rounded-xl p-4 border border-green-200 space-y-2">
                <p className="font-semibold text-gray-900">{contact.contact_name}</p>
                <a
                  href={`tel:${contact.contact_phone}`}
                  className="text-blue-600 font-medium hover:underline block"
                >
                  {contact.contact_phone}
                </a>
                {contact.contact_email && (
                  <a
                    href={`mailto:${contact.contact_email}`}
                    className="text-blue-600 text-sm hover:underline block"
                  >
                    {contact.contact_email}
                  </a>
                )}
                <a
                  href={`https://wa.me/${contact.contact_phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Contactar por WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start gap-3 mb-4">
                <Lock className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Contacto bloqueado</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Usá 1 crédito para ver el teléfono y email de este comprador.
                  </p>
                </div>
              </div>
              {unlockError && (
                <div className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                  {unlockError}
                  {unlockError.includes('créditos') && (
                    <Link href="/broker/creditos" className="ml-2 font-medium underline">
                      Comprar créditos
                    </Link>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  onClick={handleUnlock}
                  disabled={unlocking}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {unlocking ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Desbloqueando...</>
                  ) : (
                    <><Unlock className="h-4 w-4 mr-2" />Desbloquear por 1 crédito</>
                  )}
                </Button>
                <Link href="/broker">
                  <Button variant="outline">Registrarme</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
