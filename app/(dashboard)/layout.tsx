"use client" // Asegurate de tenerlo arriba si usás usePathname

import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/layout/app-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // SI LA RUTA ES EL CHECKOUT, NO RENDERIZAMOS LA BARRA LATERAL
  const isCheckoutPage = pathname.includes("/payments/summary") || pathname.includes("/checkout")

  if (isCheckoutPage) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center w-full">
        <main className="w-full flex justify-center items-center p-4">
          {children}
        </main>
      </div>
    )
  }

  // Flujo normal para el resto de las pantallas (Resumen, Historial, etc.)
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  )
}