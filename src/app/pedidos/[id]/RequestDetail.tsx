'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePostHog } from '@/components/PostHogProvider'
import {
  MapPin, Bed, Bath, DollarSign, Clock, Eye, Lock, Unlock,
  CheckCircle2, ArrowLeft, Share2, Loader2, XCircle, Calendar,
  MessageCircle, Send, Pencil
} from 'lucide-react'
import { CAR_BODY_STYLE_LABELS, SEGURIDAD_TIPOS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PROPERTY_TYPE_LABELS, FINANCING_LABELS } from '@/lib/constants'
import { supabase } from '@/lib/supabase'
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
  closeToken,
}: {
  request: PublicBuyerRequest
  isNew: boolean
  closeToken?: string
  // buyer_user_id is embedded in the request object itself
}) {
  const posthog = usePostHog()
  const [contact, setContact] = useState<Contact | null>(null)
  const [unlocking, setUnlocking] = useState(false)
  const [unlockError, setUnlockError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [copied, setCopied] = useState(false)
  const [closing, setClosing] = useState(false)
  const [closeError, setCloseError] = useState('')
  const [closed, setClosed] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [closeReason, setCloseReason] = useState<'found' | 'not_found' | null>(null)

  // Messaging state
  type Msg = { id: string; sender_type: string; content: string; created_at: string; read_at: string | null; broker_id?: string | null; broker_name?: string | null }
  const [messages, setMessages] = useState<Msg[]>([])
  const chatBottomRef = useRef<HTMLDivElement>(null)
  const [msgText, setMsgText] = useState('') // broker compose
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({}) // buyer compose per broker
  const [replyingToBrokerId, setReplyingToBrokerId] = useState<string | null>(null)
  const [sendingMsg, setSendingMsg] = useState(false)
  const [msgError, setMsgError] = useState('')
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null
      setIsLoggedIn(!!data.user)
      setUserId(uid)

      // Detect if the logged-in user owns this request
      if (uid && request.buyer_user_id && uid === request.buyer_user_id) {
        setIsOwner(true)
        return
      }

      // If broker is logged in, check if they already unlocked this contact
      if (uid) {
        const res = await fetch(`/api/pedidos/${request.id}/unlock?broker_user_id=${uid}`)
        if (res.ok) {
          const data = await res.json()
          if (data.unlocked && data.contact) {
            setContact(data.contact)
            // Auto-open chat and load messages
            const openChat = typeof window !== 'undefined' && window.location.hash === '#mensajes'
            setShowChat(openChat)
            // Always load messages in background so unread badge is ready
            fetch(`/api/pedidos/${request.id}/messages?broker_user_id=${uid}`)
              .then(r => r.ok ? r.json() : null)
              .then(d => { if (d?.messages) setMessages(d.messages) })
              .catch(() => {})
          }
        }
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ url })
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleClose(reason: 'found' | 'not_found') {
    setClosing(true)
    setCloseError('')
    try {
      const res = await fetch(`/api/pedidos/${request.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ close_token: closeToken, close_reason: reason }),
      })
      if (!res.ok) {
        const data = await res.json()
        setCloseError(data.error || 'Error al cerrar la búsqueda')
        return
      }
      setShowCloseModal(false)
      setClosed(true)
    } catch {
      setCloseError('Error de conexión')
    } finally {
      setClosing(false)
    }
  }

  async function loadMessages() {
    try {
      let url: string
      if (closeToken) {
        url = `/api/pedidos/${request.id}/messages?close_token=${closeToken}`
      } else if (userId) {
        url = `/api/pedidos/${request.id}/messages?broker_user_id=${userId}`
      } else {
        return
      }
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch {
      // silently fail
    }
  }

  // Broker: send a message
  async function sendMessage() {
    if (!msgText.trim()) return
    setSendingMsg(true)
    setMsgError('')
    const textToSend = msgText
    setMsgText('') // clear input immediately

    // Optimistic update — show the message right away so user gets instant feedback
    const optimisticId = `optimistic-${Date.now()}`
    const optimisticMsg: Msg = {
      id: optimisticId,
      sender_type: 'broker',
      content: textToSend,
      created_at: new Date().toISOString(),
      read_at: null,
    }
    setMessages(prev => [...prev, optimisticMsg])

    try {
      const res = await fetch(`/api/pedidos/${request.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: textToSend, broker_user_id: userId }),
      })
      if (!res.ok) {
        const data = await res.json()
        setMsgError(data.error || 'Error al enviar')
        // Roll back optimistic message and restore text
        setMessages(prev => prev.filter(m => m.id !== optimisticId))
        setMsgText(textToSend)
        return
      }
      // Replace optimistic message with server-confirmed data
      await loadMessages()
    } catch {
      setMsgError('Error de conexión')
      setMessages(prev => prev.filter(m => m.id !== optimisticId))
      setMsgText(textToSend)
    } finally {
      setSendingMsg(false)
    }
  }

  // Buyer: reply to a specific broker thread
  async function sendMessageToBroker(brokerId: string) {
    const text = replyTexts[brokerId]?.trim()
    if (!text) return
    setSendingMsg(true)
    setMsgError('')
    setReplyingToBrokerId(brokerId)
    try {
      const res = await fetch(`/api/pedidos/${request.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, close_token: closeToken, reply_to_broker_id: brokerId }),
      })
      if (!res.ok) {
        const data = await res.json()
        setMsgError(data.error || 'Error al enviar')
        return
      }
      setReplyTexts(prev => ({ ...prev, [brokerId]: '' }))
      await loadMessages()
    } catch {
      setMsgError('Error de conexión')
    } finally {
      setSendingMsg(false)
      setReplyingToBrokerId(null)
    }
  }

  // Scroll to bottom whenever messages change
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load messages for buyer (close_token in URL) on mount
  useEffect(() => {
    if (closeToken) {
      loadMessages()
      setShowChat(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isCar = request.request_type === 'car'
  const typeLabels = isCar
    ? (request.car_body_styles?.map((s) => CAR_BODY_STYLE_LABELS[s] || s) ?? ['Auto'])
    : request.property_types.map((t) => PROPERTY_TYPE_LABELS[t] || t)

  async function handleUnlock() {
    setUnlocking(true)
    setUnlockError('')
    try {
      // Get the logged-in broker's user ID from Supabase session
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUnlockError('Tenés que iniciar sesión para desbloquear contactos.')
        return
      }

      const res = await fetch(`/api/pedidos/${request.id}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ broker_user_id: user.id }),
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
      loadMessages()
      setShowChat(true)
      // Track conversion event
      posthog?.capture('contact_unlocked', {
        request_id: request.id,
        property_types: request.property_types,
        zones: request.zones,
        budget_usd: request.budget_usd,
        publisher_type: request.publisher_type,
      })
    } catch {
      setUnlockError('Error de conexión')
    } finally {
      setUnlocking(false)
    }
  }

  return (
    <div>
      {isNew && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">¡Búsqueda publicada con éxito!</p>
              <p className="text-sm text-green-600">
                Los interesados ya pueden ver tu pedido y contactarte.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              href="/publicar"
              className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              + Publicar otra búsqueda
            </Link>
            <Link
              href="/pedidos"
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-green-100 text-green-700 border border-green-300 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Ver todos los pedidos →
            </Link>
          </div>
        </div>
      )}

      <Link href="/pedidos" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver a pedidos
      </Link>

      <div className="lg:grid lg:grid-cols-3 lg:gap-8 lg:items-start">

      {/* ── LEFT: request details (2/3) ────────────────────────────────────── */}
      <div className="lg:col-span-2">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">
                  {typeLabels.join(' / ')}
                </h1>
                <Badge className="bg-green-100 text-green-700 border-0">Activa</Badge>
                {request.publisher_type === 'inmobiliaria' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                    🏢 Inmobiliaria{request.agency_name ? ` · ${request.agency_name}` : ''}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full">
                    🙋 Particular
                  </span>
                )}
              </div>
              <div className="mt-2">
                <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Busca en {request.zones.length > 1 ? `estas ${request.zones.length} zonas` : 'esta zona'}:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {request.zones.map((zone) => (
                    <span key={zone} className="text-xs bg-orange-50 text-orange-700 border border-orange-100 px-2 py-0.5 rounded-full">
                      {zone}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors text-xs font-medium"
              title="Compartir pedido"
            >
              {copied ? (
                <><CheckCircle2 className="h-4 w-4 text-green-500" /><span className="text-green-600">¡Copiado!</span></>
              ) : (
                <><Share2 className="h-4 w-4" /><span>Compartir</span></>
              )}
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

          {isCar ? (
            /* ── Car-specific details ── */
            <>
              {/* Year + condition + km */}
              <div className="flex flex-wrap gap-4">
                {(request.car_year_min || request.car_year_max) && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <span>
                      {request.car_year_min && request.car_year_max
                        ? `${request.car_year_min} – ${request.car_year_max}`
                        : request.car_year_min
                        ? `Desde ${request.car_year_min}`
                        : `Hasta ${request.car_year_max}`}
                    </span>
                  </div>
                )}
                {request.car_condition && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="text-sm">
                      {request.car_condition === 'nuevo' ? '✨ 0km / Nuevo'
                        : request.car_condition === 'usado' ? '🔑 Usado'
                        : '🔄 Nuevo o usado'}
                    </span>
                  </div>
                )}
                {request.car_km_max && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="text-sm">Hasta {request.car_km_max.toLocaleString()} km</span>
                  </div>
                )}
              </div>

              {/* Brands */}
              {(request.car_brands?.length ?? 0) > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Marcas preferidas:</p>
                  <div className="flex flex-wrap gap-2">
                    {request.car_brands!.map((b) => (
                      <span key={b} className="text-sm bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-full">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Fuel + transmission */}
              {((request.car_fuel_types?.length ?? 0) > 0 || request.car_transmission) && (
                <div className="flex flex-wrap gap-2">
                  {request.car_fuel_types?.map((f) => (
                    <span key={f} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                      ⛽ {f}
                    </span>
                  ))}
                  {request.car_transmission && request.car_transmission !== 'cualquiera' && (
                    <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                      ⚙️ {request.car_transmission === 'manual' ? 'Caja manual' : 'Caja automática'}
                    </span>
                  )}
                </div>
              )}
            </>
          ) : (
            /* ── Property-specific details ── */
            <>
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

              {/* Property dimensions */}
              {(request.area_cubierta_min || request.area_cubierta_max ||
                request.area_terreno_min || request.area_terreno_max ||
                request.terreno_frente_min || request.terreno_frente_max ||
                request.terreno_fondo_min || request.terreno_fondo_max ||
                request.cocheras_min) && (
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-700">
                  {(request.area_cubierta_min || request.area_cubierta_max) && (
                    <span className="flex items-center gap-1.5">
                      <span className="text-blue-500 font-medium">📐</span>
                      {request.area_cubierta_min && request.area_cubierta_max
                        ? `${request.area_cubierta_min}–${request.area_cubierta_max} m² cub.`
                        : request.area_cubierta_min
                        ? `≥ ${request.area_cubierta_min} m² cub.`
                        : `≤ ${request.area_cubierta_max} m² cub.`}
                    </span>
                  )}
                  {(request.area_terreno_min || request.area_terreno_max) && (
                    <span className="flex items-center gap-1.5">
                      <span className="text-green-500 font-medium">🌿</span>
                      {request.area_terreno_min && request.area_terreno_max
                        ? `${request.area_terreno_min}–${request.area_terreno_max} m² terreno`
                        : request.area_terreno_min
                        ? `≥ ${request.area_terreno_min} m² terreno`
                        : `≤ ${request.area_terreno_max} m² terreno`}
                    </span>
                  )}
                  {(request.terreno_frente_min || request.terreno_frente_max) && (
                    <span className="flex items-center gap-1.5">
                      <span className="font-medium text-gray-500">↔</span>
                      Frente:{' '}
                      {request.terreno_frente_min && request.terreno_frente_max
                        ? `${request.terreno_frente_min}–${request.terreno_frente_max} m`
                        : request.terreno_frente_min
                        ? `≥ ${request.terreno_frente_min} m`
                        : `≤ ${request.terreno_frente_max} m`}
                    </span>
                  )}
                  {(request.terreno_fondo_min || request.terreno_fondo_max) && (
                    <span className="flex items-center gap-1.5">
                      <span className="font-medium text-gray-500">↕</span>
                      Fondo:{' '}
                      {request.terreno_fondo_min && request.terreno_fondo_max
                        ? `${request.terreno_fondo_min}–${request.terreno_fondo_max} m`
                        : request.terreno_fondo_min
                        ? `≥ ${request.terreno_fondo_min} m`
                        : `≤ ${request.terreno_fondo_max} m`}
                    </span>
                  )}
                  {(request.cocheras_min ?? 0) > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span>🚗</span>
                      {request.cocheras_min}+ cochera{(request.cocheras_min ?? 0) > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}

              {/* Seguridad específica */}
              {(request.seguridad_tipos?.length ?? 0) > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Seguridad:</p>
                  <div className="flex flex-wrap gap-2">
                    {(request.seguridad_tipos ?? []).map((s) => {
                      const label = SEGURIDAD_TIPOS.find(x => x.id === s)?.label || s
                      return (
                        <span key={s} className="text-sm bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1 rounded-full">
                          🛡 {label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Requirements */}
              {(request.requirements.length > 0 || (request.requirements_excluyentes && request.requirements_excluyentes.length > 0)) && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Requisitos:</p>
                  <div className="flex flex-wrap gap-2">
                    {(request.requirements_excluyentes || []).map((r) => (
                      <span key={`ex-${r}`} className="text-sm bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full font-medium">
                        ⛔ {r.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {request.requirements.map((r) => (
                      <span key={r} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                        ✓ {r.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                  {(request.requirements_excluyentes?.length ?? 0) > 0 && (
                    <p className="text-xs text-red-600 mt-1.5">⛔ = Excluyente (no negocia sin esto)</p>
                  )}
                </div>
              )}

              {/* Priorities */}
              {request.priorities && request.priorities.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Lo más importante para este comprador:</p>
                  <div className="space-y-1.5">
                    {request.priorities.map((p) => (
                      <div key={p} className="flex items-center gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg">
                        <span>⚑</span>
                        <span>{{
                          zona_exacta: 'La zona es clave, no se mueve de ahí',
                          precio_fijo: 'El presupuesto es fijo, no se excede',
                          tamano: 'El tamaño (m² / dormitorios) no es negociable',
                          sin_reformas: 'Sin reformas, listo para entrar',
                          nuevo: 'Quiere algo nuevo o casi nuevo (< 10 años)',
                          disponibilidad: 'Necesita disponibilidad inmediata',
                        }[p] || p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Urgency — shown for both types */}
          {request.urgency && (
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm">{urgencyLabel(request.urgency)}</span>
            </div>
          )}

          {/* Description */}
          {request.description && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-sm font-medium text-blue-900 mb-1">Qué busca exactamente:</p>
              <p className="text-sm text-blue-800 leading-relaxed">{request.description}</p>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-400 pt-2 border-t border-gray-50">
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {request.views_count} {request.views_count === 1 ? 'persona lo vio' : 'personas lo vieron'}
            </span>
            <span title={new Date(request.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}>
              {new Date(request.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })} · {timeAgo(request.created_at)}
            </span>
          </div>

          {/* ZonaProp search link is shown in the broker dashboard after unlock, not here */}
        </div>
      </div>{/* end left col card */}
      </div>{/* end lg:col-span-2 */}

      {/* ── RIGHT: sticky action panel (1/3) ───────────────────────────────── */}
      <div className="mt-6 lg:mt-0 lg:col-span-1">
      <div className="lg:sticky lg:top-24 space-y-3">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

        {/* Close request — only shown to the original buyer via close_token */}
        {closeToken && !closed && (
          <div className="px-6 pb-4 pt-0">
            <div className="border border-dashed border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-3">
                ¿Ya encontraste lo que buscabas? Podés cerrar tu búsqueda para que deje de aparecer.
              </p>
              {closeError && (
                <p className="text-xs text-red-600 mb-2">{closeError}</p>
              )}
              {!showCloseModal ? (
                <button
                  onClick={() => setShowCloseModal(true)}
                  className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  <XCircle className="h-4 w-4" />Cerrar mi búsqueda
                </button>
              ) : (
                <div className="mt-2 space-y-3">
                  <p className="text-sm font-semibold text-gray-800">¿Por qué cerrás la búsqueda?</p>
                  <button
                    onClick={() => { setCloseReason('found'); handleClose('found') }}
                    disabled={closing}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all disabled:opacity-50 ${
                      closeReason === 'found'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-400 hover:bg-green-50'
                    }`}
                  >
                    <span className="text-2xl">🎉</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">¡Sí, lo conseguí!</p>
                      <p className="text-xs text-gray-500">Encontré lo que buscaba y lo estoy comprando</p>
                    </div>
                    {closing && closeReason === 'found' && <Loader2 className="h-4 w-4 animate-spin ml-auto text-green-600" />}
                  </button>
                  <button
                    onClick={() => { setCloseReason('not_found'); handleClose('not_found') }}
                    disabled={closing}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all disabled:opacity-50 ${
                      closeReason === 'not_found'
                        ? 'border-gray-400 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl">🔕</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">No, solo quiero cerrarla</p>
                      <p className="text-xs text-gray-500">Cambié de planes o ya no estoy buscando</p>
                    </div>
                    {closing && closeReason === 'not_found' && <Loader2 className="h-4 w-4 animate-spin ml-auto text-gray-500" />}
                  </button>
                  <button
                    onClick={() => setShowCloseModal(false)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {closed && (
          <div className="px-6 pb-4 pt-0">
            <div className={`rounded-xl p-4 text-center text-sm ${closeReason === 'found' ? 'bg-green-50 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              {closeReason === 'found'
                ? '🎉 ¡Felicitaciones! Búsqueda cerrada. Esperamos que hayas encontrado tu lugar ideal.'
                : '✅ Búsqueda cerrada. Ya no aparece en el feed.'}
            </div>
          </div>
        )}

        {/* Buyer: in-app messages — grouped by broker */}
        {closeToken && (() => {
          // Group messages by broker
          const convMap = new Map<string, { brokerName: string; msgs: typeof messages }>()
          for (const msg of messages) {
            const bid = msg.broker_id || 'unknown'
            if (!convMap.has(bid)) {
              convMap.set(bid, { brokerName: msg.broker_name || 'Broker', msgs: [] })
            }
            convMap.get(bid)!.msgs.push(msg)
          }
          const conversations = Array.from(convMap.entries()).map(([brokerId, d]) => ({ brokerId, ...d }))

          return (
            <div className="px-6 pb-6" id="mensajes">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-gray-700">
                  Mensajes de brokers
                  {conversations.length > 0 && (
                    <span className="ml-1.5 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {conversations.length}
                    </span>
                  )}
                </span>
              </div>

              {conversations.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center">
                  <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 font-medium">Todavía no recibiste mensajes</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Cuando un broker compre tu contacto, podrá escribirte acá.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversations.map(({ brokerId, brokerName, msgs: convMsgs }) => (
                    <div key={brokerId} className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* Broker header */}
                      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-600 flex-shrink-0">
                          {brokerName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-800">{brokerName}</span>
                        <span className="text-xs text-gray-400 ml-auto">{convMsgs.length} {convMsgs.length === 1 ? 'mensaje' : 'mensajes'}</span>
                      </div>
                      {/* Message thread */}
                      <div className="p-3 space-y-2 max-h-60 overflow-y-auto bg-white">
                        {convMsgs.map((msg) => {
                          const isMine = msg.sender_type === 'buyer'
                          return (
                            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                                isMine
                                  ? 'bg-orange-500 text-white rounded-br-sm'
                                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                              }`}>
                                <p>{msg.content}</p>
                                <p className={`text-xs mt-1 flex items-center gap-1 ${isMine ? 'text-orange-200 justify-end' : 'text-gray-400'}`}>
                                  {timeAgo(msg.created_at)}
                                  {isMine && <span title="Enviado">✓</span>}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                        <div ref={chatBottomRef} />
                      </div>
                      {/* Reply box */}
                      <div className="p-3 bg-gray-50 border-t border-gray-100">
                        {msgError && replyingToBrokerId === brokerId && (
                          <p className="text-xs text-red-600 mb-2">{msgError}</p>
                        )}
                        <div className="flex gap-2">
                          <textarea
                            value={replyTexts[brokerId] || ''}
                            onChange={(e) => setReplyTexts(prev => ({ ...prev, [brokerId]: e.target.value }))}
                            placeholder={`Respondé a ${brokerName}...`}
                            rows={2}
                            className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 resize-none bg-white"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                void sendMessageToBroker(brokerId)
                              }
                            }}
                          />
                          <button
                            onClick={() => void sendMessageToBroker(brokerId)}
                            disabled={sendingMsg || !replyTexts[brokerId]?.trim()}
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-3 disabled:opacity-50 transition-colors flex items-center"
                          >
                            {sendingMsg && replyingToBrokerId === brokerId
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Send className="h-4 w-4" />
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })()}

        {/* Owner actions (Edit button) — shown when the buyer is logged in as the owner */}
        {(isOwner || closeToken) && !closed && (
          <div className="px-6 pb-4 pt-0">
            <div className="border border-dashed border-blue-200 rounded-xl p-4 bg-blue-50/40">
              <p className="text-xs text-blue-600 mb-3 font-medium">Esta es tu búsqueda</p>
              <Link
                href={`/pedidos/${request.id}/editar${closeToken ? `?close_token=${closeToken}` : ''}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 bg-white border border-blue-200 hover:border-blue-300 px-4 py-2 rounded-lg transition-colors"
              >
                <Pencil className="h-4 w-4" />
                Editar mi búsqueda
              </Link>
            </div>
          </div>
        )}

        {/* Unlock contact — hidden to the buyer (has close_token or is owner) and once closed */}
        {!closed && !closeToken && !isOwner && <div className="p-6 bg-gray-50 border-t border-gray-100">
          {contact ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-700 font-medium mb-3">
                <Unlock className="h-5 w-5" />
                Contacto desbloqueado
              </div>
              <div className="bg-white rounded-xl p-4 border border-green-200 space-y-2">
                {contact.contact_name && !/^\d{10,}$/.test(contact.contact_name) && (
                  <p className="font-semibold text-gray-900">{contact.contact_name}</p>
                )}
                <a
                  href={`tel:${contact.contact_phone}`}
                  className="text-orange-500 font-medium hover:underline block"
                >
                  {contact.contact_phone}
                </a>
                {contact.contact_email && (
                  <a
                    href={`mailto:${contact.contact_email}`}
                    className="text-orange-500 text-sm hover:underline block"
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

              {/* In-app chat */}
              <div className="mt-2">
                <button
                  onClick={() => {
                    const next = !showChat
                    setShowChat(next)
                    if (next) {
                      loadMessages()
                      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
                    }
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <MessageCircle className="h-4 w-4 text-orange-500" />
                    Mensajes por Demandi
                    {messages.length > 0 && (
                      <span className="text-gray-400 text-xs">({messages.length})</span>
                    )}
                  </div>
                  <span className="text-gray-400 text-xs">{showChat ? '▲' : '▼'}</span>
                </button>

                {showChat && (
                  <div className="mt-1 border border-gray-200 rounded-xl overflow-hidden">
                    <div className="p-4 space-y-3 max-h-72 overflow-y-auto bg-gray-50">
                      {messages.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">
                          No hay mensajes aún. Enviá el primero.
                        </p>
                      ) : (
                        messages.map((msg) => {
                          const isMine = msg.sender_type === 'broker'
                          const isOptimistic = msg.id.startsWith('optimistic-')
                          return (
                            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed transition-opacity ${
                                isMine
                                  ? 'bg-orange-500 text-white rounded-br-sm'
                                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                              } ${isOptimistic ? 'opacity-70' : 'opacity-100'}`}>
                                <p>{msg.content}</p>
                                <p className={`text-xs mt-1 flex items-center gap-1 ${isMine ? 'text-orange-200 justify-end' : 'text-gray-400'}`}>
                                  {isOptimistic ? 'Enviando…' : timeAgo(msg.created_at)}
                                  {isMine && !isOptimistic && <span title="Enviado">✓</span>}
                                </p>
                              </div>
                            </div>
                          )
                        })
                      )}
                      <div ref={chatBottomRef} />
                    </div>
                    <div className="p-3 bg-white border-t border-gray-100">
                      {msgError && (
                        <p className="text-xs text-red-600 mb-2">{msgError}</p>
                      )}
                      <div className="flex gap-2">
                        <textarea
                          value={msgText}
                          onChange={(e) => setMsgText(e.target.value)}
                          placeholder="Escribí tu mensaje..."
                          rows={2}
                          className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 resize-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              void sendMessage()
                            }
                          }}
                        />
                        <button
                          onClick={() => void sendMessage()}
                          disabled={sendingMsg || !msgText.trim()}
                          className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-3 disabled:opacity-50 transition-colors flex items-center"
                        >
                          {sendingMsg
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Send className="h-4 w-4" />
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : isLoggedIn ? (
            /* Logged-in broker: show unlock flow */
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
              <Button
                onClick={handleUnlock}
                disabled={unlocking}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {unlocking ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Desbloqueando...</>
                ) : (
                  <><Unlock className="h-4 w-4 mr-2" />Desbloquear por 1 crédito</>
                )}
              </Button>
            </div>
          ) : (
            /* Not logged in: invite to register */
            <div className="text-center py-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-3">
                <Lock className="h-6 w-6 text-blue-500" />
              </div>
              <p className="font-semibold text-gray-900 mb-1">
                ¿Querés contactar a este comprador?
              </p>
              <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
                Creá tu cuenta gratis, comprá créditos y desbloqueá el teléfono y email al instante.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/broker">
                  <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 px-6">
                    Crear cuenta gratis
                  </Button>
                </Link>
                <Link href="/broker?login=1">
                  <Button variant="outline" className="w-full sm:w-auto px-6">
                    Ya tengo cuenta →
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>}
      </div>{/* end action panel card */}
      </div>{/* end lg:sticky */}
      </div>{/* end lg:col-span-1 */}

      </div>{/* end lg:grid */}
    </div>
  )
}
