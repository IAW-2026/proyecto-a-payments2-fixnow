"use client"

import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/layout/app-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Se centraliza de manera declarativa que pantallas no deben renderizar el menu lateral del sistema
  const isCheckoutPage = 
    pathname.includes("/payments/summary") || 
    pathname.includes("/checkout") ||
    pathname.includes("/payments/success") ||
    pathname.includes("/dev/payments")

  if (isCheckoutPage) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center w-full">
        <main className="w-full flex justify-center items-center p-4">
          {children}
        </main>
      </div>
    )
  }

  // Flujo normal de renderizado modular para las pantallas internas del panel de control financiero
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  )
}