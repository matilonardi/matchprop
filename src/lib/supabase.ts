import { createClient } from '@supabase/supabase-js'

export type PropertyType = 'casa' | 'departamento' | 'duplex' | 'ph' | 'terreno' | 'local' | 'renta' | 'revaluo'
export type FinancingType = 'efectivo' | 'credito' | 'ambos'
export type RequestStatus = 'active' | 'matched' | 'closed' | 'expired'

export interface BuyerRequest {
  id: string
  property_types: PropertyType[]
  zones: string[]
  bedrooms_min?: number
  bedrooms_max?: number
  bathrooms_min?: number
  budget_usd: number
  financing: FinancingType
  requirements: string[]
  requirements_excluyentes?: string[]
  priorities?: string[]
  financing_types?: string[]
  financing_cash_pct?: number
  financing_bank?: string
  financing_precalified?: boolean
  search_reason?: string
  description?: string
  urgency?: string
  contact_name: string
  contact_phone: string
  contact_email?: string
  status: RequestStatus
  views_count: number
  leads_count: number
  created_at: string
  expires_at: string
}

// Public view — no contact fields (returned by the public feed API)
export type PublicBuyerRequest = Omit<BuyerRequest, 'contact_name' | 'contact_phone' | 'contact_email'>

export interface BrokerProfile {
  id: string
  user_id: string
  name: string
  agency_name?: string
  phone?: string
  email: string
  zones: string[]
  credits: number
  subscription: 'free' | 'starter' | 'pro'
  verified: boolean
  created_at: string
}

export interface LeadPurchase {
  id: string
  broker_id: string
  request_id: string
  credits_spent: number
  purchased_at: string
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
)
