"use client"

import { useRouter } from "next/navigation"
import { PaymentStatusBadge } from "@/components/payments/payments-status-badge"
import { CleanPayment } from "@/lib/payments-service"

interface PaymentTableProps {
  payments: CleanPayment[]
  userRole?: string
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString("es-AR")}`
}

function formatDate(value?: string | null) {
  if (!value) return "-"
  return new Date(value).toLocaleDateString("es-AR")
}

export function PaymentTable({ payments, userRole }: PaymentTableProps) {
  const router = useRouter()
  const isRider = userRole === "rider"
  const userHeader = isRider ? "Profesional" : "Cliente"

  if (payments.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-lg shadow-black/10">
        <h2 className="text-xl font-semibold">
          {isRider ? "No tenes pagos registrados" : "No tenes cobros registrados"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isRider
            ? "Cuando tengas un servicio finalizado, el pago aparecera aca."
            : "Cuando tengas trabajos finalizados, los cobros apareceran aca."}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-black/10">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-background/30 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Trabajo</th>
            <th className="px-4 py-3 font-medium">{userHeader}</th>
            <th className="px-4 py-3 font-medium">Monto del servicio</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Fecha de pago</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => {
            return (
              <tr
                key={payment.id}
                onClick={() =>
                  router.push(`/payments/success?job_id=${payment.jobId}&client_id=${payment.clientId}`)
                }
                className="border-b border-border last:border-0 transition-colors hover:bg-muted/40 cursor-pointer select-none"
              >
                <td className="px-4 py-3 font-medium">
                  #{payment.jobId.slice(-6)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {isRider ? payment.professionalId : payment.clientId}
                </td>
                <td className="px-4 py-3 font-semibold">
                  {formatCurrency(payment.amount)}
                </td>
                <td className="px-4 py-3">
                  <PaymentStatusBadge status={payment.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(payment.paidAt)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}