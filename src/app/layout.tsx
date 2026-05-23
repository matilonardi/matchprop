import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MatchProp – Publicá lo que buscás",
  description:
    "El marketplace donde los compradores publican qué propiedad o auto buscan, y los vendedores los encuentran a ellos. Córdoba, Argentina.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} min-h-full antialiased bg-white`}>
        {children}
      </body>
    </html>
  )
}
