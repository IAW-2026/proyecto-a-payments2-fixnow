import { cn } from "@/lib/utils"

type PaymentStatus = "pending" | "processing" | "paid" | "failed"

interface PaymentStatusBadgeProps {
  status: PaymentStatus
}

const statusConfig = {
  pending: {
    label: "Pendiente",
    className: "bg-yellow-100 text-yellow-800",
  },
  processing: {
    label: "Procesando",
    className: "bg-blue-100 text-blue-800",
  },
  paid: {
    label: "Pagado",
    className: "bg-green-100 text-green-800",
  },
  failed: {
    label: "Fallido",
    className: "bg-red-100 text-red-800",
  },
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  )
}