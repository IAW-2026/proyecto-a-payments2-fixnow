"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Suspense } from "react"

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Detectamos si hay parámetros clave en la URL (?role=... o ?client_id=...)
  const hasRoleOrId = 
    searchParams.has("role") || 
    searchParams.has("client_id") || 
    searchParams.has("clientId") || 
    searchParams.has("professional_id") || 
    searchParams.has("professionalId")

  // Se oculta la barra si es checkout/success, si es la raíz sin parámetros, o si es la ruta explícita de pruebas
  const isCheckoutPage =
  pathname.includes("/dev/payments") ||
  pathname.includes("/checkout") ||
  pathname.includes("/payments/success")

  if (isCheckoutPage) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center w-full">
        <main className="w-full flex justify-center items-center p-4">
          {children}
        </main>
      </div>
    )
  }

  // Flujo normal: Muestra el panel con la barra lateral intacta (Cliente y Profesional)
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  )
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    }>
      <DashboardContent>{children}</DashboardContent>
    </Suspense>
  )
}