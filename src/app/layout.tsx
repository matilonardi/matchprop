import type { Metadata } from "next"
import { Hanken_Grotesk, Space_Grotesk } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { PostHogProvider } from "@/components/PostHogProvider"
import "./globals.css"

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Demandi – Publicá lo que buscás",
  description:
    "El marketplace donde los compradores publican qué propiedad buscan, y los vendedores los encuentran a ellos. Córdoba, Argentina.",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`h-full ${hanken.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-full antialiased bg-white font-sans">
        <PostHogProvider>
          {children}
        </PostHogProvider>
        <Analytics />
      </body>
    </html>
  )
}
