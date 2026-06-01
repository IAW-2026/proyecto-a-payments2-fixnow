import { auth } from "@clerk/nextjs/server"
import {
  getClientPayments,
  getProfessionalPayments,
} from "@/lib/payments-service"
import { PaymentsView } from "@/components/views/payments-view"

const DEV_PROFESSIONAL_ID = "anonymous_professional"
const DEV_CLIENT_ID = "anonymous_client"

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    role?: string
    client_id?: string
    clientId?: string
    professional_id?: string
    professionalId?: string
  }>
}) {
  const params = await searchParams
  const { userId } = await auth()

  const currentRole = (params.role || "driver").toLowerCase()

  const currentUserId =
    currentRole === "rider"
      ? params.client_id ||
        params.clientId ||
        userId ||
        (process.env.NODE_ENV === "development" ? DEV_CLIENT_ID : null)
      : params.professional_id ||
        params.professionalId ||
        userId ||
        (process.env.NODE_ENV === "development" ? DEV_PROFESSIONAL_ID : null)

  if (!currentUserId) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <h1 className="text-2xl font-bold">No se pudieron cargar los pagos</h1>

        <p className="mt-2 text-sm text-muted-foreground">
          No se encontró un usuario autenticado.
        </p>
      </div>
    )
  }

  const payments =
    currentRole === "rider"
      ? await getClientPayments(currentUserId)
      : await getProfessionalPayments(currentUserId)

  return <PaymentsView payments={payments} userRole={currentRole} />
}