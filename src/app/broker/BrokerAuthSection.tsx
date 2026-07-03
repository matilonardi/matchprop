'use client'

import { useState } from 'react'
import BrokerRegisterForm from './BrokerRegisterForm'
import BrokerLoginForm from './BrokerLoginForm'

export default function BrokerAuthSection({
  defaultMode = 'register',
}: {
  defaultMode?: 'register' | 'login'
}) {
  const [mode, setMode] = useState<'register' | 'login'>(defaultMode)

  return (
    <div className="bg-white rounded-2xl border border-hairline p-6">
      {/* Tabs segmented */}
      <div className="flex gap-1 bg-chip rounded-xl p-1 mb-6">
        <button
          onClick={() => setMode('register')}
          className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${
            mode === 'register'
              ? 'bg-white text-ink shadow-[0_1px_3px_rgba(16,23,18,0.08)]'
              : 'text-ink-2 hover:text-ink'
          }`}
        >
          Crear cuenta
        </button>
        <button
          onClick={() => setMode('login')}
          className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${
            mode === 'login'
              ? 'bg-white text-ink shadow-[0_1px_3px_rgba(16,23,18,0.08)]'
              : 'text-ink-2 hover:text-ink'
          }`}
        >
          Iniciar sesión
        </button>
      </div>

      {mode === 'register' ? (
        <>
          <h2 className="text-xl font-bold text-ink mb-1">Crear tu cuenta</h2>
          <p className="text-sm text-ink-2 mb-6">Gratis para empezar. Ver contactos es sin costo durante la beta.</p>
          <BrokerRegisterForm />
        </>
      ) : (
        <>
          <h2 className="text-xl font-bold text-ink mb-1">Bienvenido de vuelta</h2>
          <p className="text-sm text-ink-2 mb-6">Ingresá con tu email y contraseña.</p>
          <BrokerLoginForm />
        </>
      )}
    </div>
  )
}
