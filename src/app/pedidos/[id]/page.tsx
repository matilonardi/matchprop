import { createServerClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import RequestDetail from './RequestDetail'
import type { PublicBuyerRequest } from '@/lib/supabase'

export default async function PedidoPage(props: PageProps<'/pedidos/[id]'>) {
  const { id } = await props.params
  const searchParams = await props.searchParams

  const supabase = createServerClient()

  const { data: request, error } = await supabase
    .from('buyer_requests')
    .select(
      'id, request_type, property_types, zones, bedrooms_min, bedrooms_max, bathrooms_min, budget_usd, financing, financing_types, financing_cash_pct, financing_bank, financing_precalified, search_reason, requirements, requirements_excluyentes, priorities, description, urgency, status, views_count, leads_count, created_at, expires_at, buyer_user_id, car_brands, car_body_styles, car_year_min, car_year_max, car_condition, car_km_max, car_fuel_types, car_transmission, publisher_type, agency_name'
    )
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (error || !request) {
    notFound()
  }

  // Increment view count (fire and forget)
  supabase.rpc('increment_request_views', { req_id: id }).then(() => {})

  const isNew = searchParams?.nuevo === '1'
  const closeToken = typeof searchParams?.close_token === 'string' ? searchParams.close_token : ''

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <RequestDetail request={request as PublicBuyerRequest} isNew={isNew} closeToken={closeToken} />
        </div>
      </div>
    </div>
  )
}
