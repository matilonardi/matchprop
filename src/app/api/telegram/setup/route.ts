import { NextRequest } from 'next/server'

// GET /api/telegram/setup?key=ADMIN_SECRET
// Registers the webhook with Telegram
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')

  const ADMIN_SECRET = process.env.ADMIN_SECRET || 'matchprop-admin-2025'
  if (key !== ADMIN_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
  if (!BOT_TOKEN) {
    return Response.json(
      { error: 'TELEGRAM_BOT_TOKEN not configured in environment variables' },
      { status: 500 }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://matchprop.vercel.app'
  const webhookUrl = `${appUrl}/api/telegram/webhook`

  // Optional: use a secret token to verify Telegram requests
  const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET

  const payload: Record<string, unknown> = { url: webhookUrl }
  if (WEBHOOK_SECRET) payload.secret_token = WEBHOOK_SECRET

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await res.json()

  return Response.json({
    webhookUrl,
    telegramResponse: data,
    instructions: [
      '1. Webhook registrado en Telegram.',
      `2. Enviá cualquier mensaje al bot y lo parseará automáticamente.`,
      `3. Podés probar con: "Busco casa 3 dormitorios en Villa Belgrano, hasta USD 200.000, apta crédito"`,
    ],
  })
}

// DELETE /api/telegram/setup?key=ADMIN_SECRET
// Removes the webhook
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')

  const ADMIN_SECRET = process.env.ADMIN_SECRET || 'matchprop-admin-2025'
  if (key !== ADMIN_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
  if (!BOT_TOKEN) {
    return Response.json({ error: 'TELEGRAM_BOT_TOKEN not set' }, { status: 500 })
  }

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`, {
    method: 'POST',
  })
  const data = await res.json()
  return Response.json({ removed: true, telegramResponse: data })
}
