'use client'

import { useState } from 'react'
import { CreditCard, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CheckoutButton({ packId, label }: { packId: string; label: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCheckout() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack_id: packId }),
      })
      const data = await res.json()
      if (data.init_point) {
        window.location.href = data.init_point
      } else {
        setError(data.error || 'Error al iniciar el pago')
        setLoading(false)
      }
    } catch {
      setError('No se pudo conectar. Intentá de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="mt-2 text-right">
      <Button
        size="sm"
        disabled={loading}
        onClick={handleCheckout}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
        ) : (
          <CreditCard className="h-3.5 w-3.5 mr-1.5" />
        )}
        {label}
      </Button>
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600 mt-1 justify-end">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
}
