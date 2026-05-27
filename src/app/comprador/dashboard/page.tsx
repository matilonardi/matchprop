'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MapPin, DollarSign, MessageCircle, Eye, PlusCircle, LogOut, Clock, Pencil } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PROPERTY_TYPE_LABELS, CAR_BODY_STYLE_LABELS } from '@/lib/constants'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'

interface MyRequest {
  id: string
  request_type: string
  property_types: string[]
  car_body_styles?: string[]
  zones: string[]
  budget_usd: number
  status: string
  views_count: number
  created_at: string
  unread_count?: number
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor(diff / 3600000)
  if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`
  if (hours > 0) return `hace ${hours}h`
  return 'hace unos minutos'
}

export default function BuyerDashboard() {
  const router = useRouter()
  const [requests, setRequests] = useState<MyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/comprador/login')
        return
      }

      // Get buyer profile for name
      const { data: profile } = await supabase
        .from('buyer_profiles')
        .select('name')
        .eq('user_id', user.id)
        .single()

      setUserName(profile?.name || user.email || 'Comprador')

      // Get their requests
      const { data: reqs } = await supabase
        .from('buyer_requests')
        .select('id, request_type, property_types, car_body_styles, zones, budget_usd, status, views_count, created_at')
        .eq('buyer_user_id', user.id)
        .order('created_at', { ascending: false })

      if (reqs) {
        // For each request, count unread messages from brokers
        const withUnread = await Promise.all(
          reqs.map(async (req) => {
            const { count } = await supabase
              .from('messages')
              .select('id', { count: 'exact', head: true })
              .eq('request_id', req.id)
              .eq('sender_type', 'broker')
              .is('read_at', null)
            return { ...req, unread_count: count ?? 0 }
          })
        )
        setRequests(withUnread)
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <Link href="/" className="text-lg font-black">
              <span className="text-orange-500">Match</span>
              <span className="text-gray-900">Prop</span>
            </Link>
            <p className="text-xs text-gray-500 mt-0.5">Hola, {userName} 👋</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Mis búsquedas</h1>
          <Link href="/publicar">
            <Button className="bg-orange-500 hover:bg-orange-600 text-sm" size="sm">
              <PlusCircle className="h-4 w-4 mr-1.5" />
              Nueva búsqueda
            </Button>
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Todavía no publicaste nada</h2>
            <p className="text-gray-500 text-sm mb-6">
              Publicá tu búsqueda y los brokers de Córdoba te van a contactar.
            </p>
            <Link href="/publicar">
              <Button className="bg-orange-500 hover:bg-orange-600">
                Publicar mi primera búsqueda
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const isCar = req.request_type === 'car'
              const labels = isCar
                ? (req.car_body_styles?.map((s) => CAR_BODY_STYLE_LABELS[s] || s) ?? ['Auto'])
                : req.property_types.map((t) => PROPERTY_TYPE_LABELS[t] || t)

              return (
                <div key={req.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{labels.join(' / ')}</span>
                        <Badge className={req.status === 'active' ? 'bg-green-100 text-green-700 border-0' : 'bg-gray-100 text-gray-500 border-0'}>
                          {req.status === 'active' ? 'Activa' : 'Cerrada'}
                        </Badge>
                        {(req.unread_count ?? 0) > 0 && (
                          <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {req.unread_count} nuevo{(req.unread_count ?? 0) > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-orange-400" />
                          {req.zones.slice(0, 2).join(', ')}{req.zones.length > 2 ? ` +${req.zones.length - 2}` : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          USD {req.budget_usd.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1 whitespace-nowrap">
                      <Clock className="h-3 w-3" />
                      {timeAgo(req.created_at)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {req.views_count} vista{req.views_count !== 1 ? 's' : ''}
                    </span>
                    {(req.unread_count ?? 0) > 0 ? (
                      <span className="flex items-center gap-1.5 text-orange-600 font-semibold">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {req.unread_count} mensaje{(req.unread_count ?? 0) > 1 ? 's' : ''} sin leer
                        <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-400">
                        <MessageCircle className="h-3.5 w-3.5" />
                        Sin mensajes nuevos
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/pedidos/${req.id}`}
                      className={`inline-flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                        (req.unread_count ?? 0) > 0
                          ? 'bg-orange-500 hover:bg-orange-600 ring-2 ring-orange-300'
                          : 'bg-orange-500 hover:bg-orange-600'
                      }`}
                    >
                      <MessageCircle className="h-4 w-4" />
                      {(req.unread_count ?? 0) > 0 ? `Chatear (${req.unread_count} nuevo${(req.unread_count ?? 0) > 1 ? 's' : ''})` : 'Chatear'}
                    </Link>
                    <Link
                      href={`/pedidos/${req.id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 bg-white border border-gray-200 hover:border-gray-300 px-3 py-2 rounded-lg transition-colors"
                    >
                      Ver búsqueda
                    </Link>
                    <Link
                      href={`/pedidos/${req.id}/editar`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 bg-white border border-gray-200 hover:border-gray-300 px-3 py-2 rounded-lg transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <Footer />
      <WhatsAppButton />
    </main>
  )
}
