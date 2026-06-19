'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// ADMIN_USERS = "matias:Gelly3625$,nicolas:Marvick$"
function isValidAdmin(username: string, password: string): boolean {
  const raw = process.env.ADMIN_USERS || ''
  return raw.split(',').some(entry => {
    const [u, p] = entry.trim().split(':')
    return u === username && p === password
  })
}

export async function adminLogin(formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string
  const secret   = process.env.ADMIN_SECRET

  if (!secret || !isValidAdmin(username, password)) {
    redirect('/admin/login?error=1')
  }

  const cookieStore = await cookies()
  cookieStore.set('matchprop_admin', secret, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   60 * 60 * 12, // 12 horas
    path:     '/',
  })

  redirect('/admin?tab=pulso')
}

export async function adminLogout() {
  const cookieStore = await cookies()
  cookieStore.delete('matchprop_admin')
  redirect('/admin/login')
}
