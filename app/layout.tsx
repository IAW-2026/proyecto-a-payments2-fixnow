import type { Metadata, Viewport } from "next"
import { Space_Grotesk, Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

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
    <html lang="es">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} bg-background font-sans antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  )
}