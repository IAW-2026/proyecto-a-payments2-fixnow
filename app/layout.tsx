import type { Metadata, Viewport } from "next"
import { Space_Grotesk, Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

// Configuracion de fuentes optimizadas integradas en el pipeline de Next.js para mitigar el CLS
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "FixNow Payments",
  description:
    "Aplicación de gestión de cobros y liquidaciones para profesionales de FixNow.",
}

export const viewport: Viewport = {
  themeColor: "#031d44",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="es">
        {/* Se trasladan las variables de las fuentes al body para asegurar una correcta hidratacion del DOM */}
        <body className={`${spaceGrotesk.variable} ${inter.variable} bg-background font-sans antialiased`}>
          {children}
          {/* El componente maneja de forma interna la exclusion del entorno de desarrollo local */}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}