'use client'

import { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CheckoutButton({ packId, label }: { packId: string; label: string }) {
  const [loading, setLoading] = useState(false)

  async function handleCheckout() {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack_id: packId }),
      })
      const { init_point } = await res.json()
      if (init_point) window.location.href = init_point
    } catch {
      setLoading(false)
    }
  }

  return (
    <Button
      size="sm"
      disabled={loading}
      onClick={handleCheckout}
      className="mt-2 bg-blue-600 hover:bg-blue-700"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
      ) : (
        <CreditCard className="h-3.5 w-3.5 mr-1.5" />
      )}
      {label}
    </Button>
  )
}
