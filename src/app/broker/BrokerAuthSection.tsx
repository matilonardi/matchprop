'use client'

import { useState } from 'react'
import BrokerRegisterForm from './BrokerRegisterForm'
import BrokerLoginForm from './BrokerLoginForm'

export default function BrokerAuthSection() {
  const [mode, setMode] = useState<'register' | 'login'>('register')

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => setMode('register')}
          className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${
            mode === 'register'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Crear cuenta
        </button>
        <button
          onClick={() => setMode('login')}
          className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${
            mode === 'login'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Iniciar sesión
        </button>
      </div>

      {mode === 'register' ? (
        <>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Crear cuenta de inmobiliaria</h2>
          <p className="text-sm text-gray-500 mb-6">Gratis para empezar. Comprás créditos cuando los necesitás.</p>
          <BrokerRegisterForm />
        </>
      ) : (
        <>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Bienvenido de vuelta</h2>
          <p className="text-sm text-gray-500 mb-6">Ingresá con tu email y contraseña.</p>
          <BrokerLoginForm />
        </>
      )}
    </div>
  )
}
