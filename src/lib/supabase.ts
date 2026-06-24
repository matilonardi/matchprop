import { createClient } from '@supabase/supabase-js'

export type PropertyType = 'casa' | 'departamento' | 'duplex' | 'terreno' | 'local' | 'renta' | 'revaluo'
export type FinancingType = 'efectivo' | 'credito' | 'ambos'
export type RequestStatus = 'active' | 'matched' | 'closed' | 'expired'

export interface BuyerRequest {
  id: string
  request_type?: 'property' | 'car'
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
  // Property extra dimensions (optional)
  area_cubierta_min?: number | null
  area_cubierta_max?: number | null
  area_terreno_min?: number | null
  area_terreno_max?: number | null
  terreno_frente_min?: number | null
  terreno_frente_max?: number | null
  terreno_fondo_min?: number | null
  terreno_fondo_max?: number | null
  cocheras_min?: number | null
  seguridad_tipos?: string[]
  // Car-specific fields
  car_brands?: string[]
  car_body_styles?: string[]
  car_year_min?: number
  car_year_max?: number
  car_condition?: string
  car_km_max?: number
  car_fuel_types?: string[]
  car_transmission?: string
  publisher_type?: 'particular' | 'inmobiliaria'
  agency_name?: string | null
  contact_name: string
  contact_phone: string
  contact_email?: string
  buyer_user_id?: string | null
  status: RequestStatus
  views_count: number
  leads_count: number
  operation_type?: 'compra' | 'alquiler'
  created_at: string
  expires_at: string
  featured_until?: string | null
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
