'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function adminLogin(formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  const validUser = process.env.ADMIN_USERNAME
  const validPass = process.env.ADMIN_PASSWORD
  const secret    = process.env.ADMIN_SECRET

  if (!validUser || !validPass || !secret) {
    redirect('/admin/login?error=1')
  }

  if (username !== validUser || password !== validPass) {
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
