"use client"

import React from "react"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { ArrowLeft } from "lucide-react"

type RecentPayment = {
  id: string
  jobId: string
  amount: number
  commission: number
  netAmount: number
  status: string
}

interface DashboardViewProps {
  totalGenerated: number
  totalCommission: number
  netAmount: number
  pendingCount: number 
  recentPayments: RecentPayment[]
  userRole?: string
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString("es-AR")}`
}

function translateStatus(status: string) {
  const labels: Record<string, string> = {
    pending: "Pendiente",
    processing: "Procesando",
    paid: "Pagado",
    failed: "Fallido",
  }
  return labels[status] ?? status
}

export function DashboardView({
  totalGenerated,
  totalCommission,
  netAmount,
  recentPayments,
  userRole,
}: DashboardViewProps) {
  
  const isClient = userRole === "rider"

  const summaryCards = isClient
    ? [
        {
          label: "Total gastado",
          value: formatCurrency(totalGenerated),
          description: "Dinero total abonado en la plataforma",
        },
        {
          label: "Cantidad de servicios pedidos",
          value: `${recentPayments.length} servicios`,
          description: "Historial de solicitudes realizadas",
        },
      ]
    : [
        {
          label: "Total facturado",
          value: formatCurrency(totalGenerated),
          description: "Monto bruto total generado por tus servicios",
        },
        {
          label: "Ganancia neta",
          value: formatCurrency(netAmount),
          description: "Dinero acreditado en tu cuenta",
        },
        {
          label: "Costo de plataforma",
          value: formatCurrency(totalCommission),
          description: "Retención por uso del servicio de FixNow",
        },
      ]

  return (
    <div className="space-y-10">
      <PageHeader
        title={isClient ? "Panel de Cliente" : "Resumen de pagos"}
        subtitle={
          isClient 
            ? "Información general de tus gastos en la cuenta." 
            : "Vista general de tus movimientos movimientos monetarios inmediatos."
        }
      >
        {/* Optimizacion de navegacion interna mediante el uso de Link para evitar destruccion del estado */}
        <Link
  href={
    isClient
      ? "https://proyecto-a-rider-fixnow.vercel.app/dashboard"
      : "https://driver-fixnow.vercel.app/"
  }
  className="group flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold shadow-sm hover:bg-muted hover:text-foreground transition-all"
>
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Volver a App {isClient ? "Cliente" : "Profesional"}</span>
        </Link>
      </PageHeader>

      <section className={`grid gap-4 ${isClient ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/5"
          >
            <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-primary">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {card.description}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/5">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
          Últimos movimientos rápidos
        </h2>
        <div className="mt-5 space-y-3">
          {recentPayments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between rounded-xl border border-border bg-background/30 px-4 py-3"
            >
              <div>
                <p className="font-medium">ID Servicio: #{payment.jobId.slice(-6)}</p>
                <p className="text-sm text-muted-foreground">{translateStatus(payment.status)}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary">
                  {formatCurrency(isClient ? payment.amount : payment.netAmount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isClient ? "Total debitado" : "Neto recibido"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}