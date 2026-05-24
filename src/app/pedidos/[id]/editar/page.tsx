import { createServerClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import EditRequestForm from './EditRequestForm'
import type { PublicBuyerRequest } from '@/lib/supabase'

export default async function EditRequestPage(props: {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string>>
}) {
  const { id } = await props.params
  const searchParams = await props.searchParams

  const supabase = createServerClient()

  const { data: request, error } = await supabase
    .from('buyer_requests')
    .select(
      'id, request_type, property_types, zones, bedrooms_min, bedrooms_max, bathrooms_min, budget_usd, financing, financing_types, financing_cash_pct, financing_bank, financing_precalified, search_reason, requirements, requirements_excluyentes, priorities, description, urgency, status, views_count, leads_count, created_at, expires_at, buyer_user_id, car_brands, car_body_styles, car_year_min, car_year_max, car_condition, car_km_max, car_fuel_types, car_transmission, area_cubierta_min, area_cubierta_max, area_terreno_min, area_terreno_max, cocheras_min, seguridad_tipos'
    )
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (error || !request) {
    notFound()
  }

  const closeToken = typeof searchParams?.close_token === 'string' ? searchParams.close_token : ''

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <EditRequestForm
            request={request as PublicBuyerRequest}
            closeToken={closeToken}
          />
        </div>
      </div>
    </div>
  )
}
