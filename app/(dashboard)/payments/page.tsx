import {
  getClientPayments,
  getProfessionalPayments,
} from "@/lib/payments-service"
import { PaymentsView } from "@/components/views/payments-view"

const DEV_PROFESSIONAL_ID = "anonymous_professional"
const DEV_CLIENT_ID = "anonymous_client"

interface SearchParamsProps {
  role?: string
  client_id?: string
  clientId?: string
  professional_id?: string
  professionalId?: string
}

export const dynamic = "force-dynamic"

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsProps>
}) {
  const params = await searchParams

  const currentRole = (
    params.role ||
    (params.client_id || params.clientId ? "rider" : "driver")
  ).toLowerCase()

  const currentUserId =
    currentRole === "rider"
      ? params.client_id || params.clientId || DEV_CLIENT_ID
      : params.professional_id || params.professionalId || DEV_PROFESSIONAL_ID

  const payments =
    currentRole === "rider"
      ? await getClientPayments(currentUserId)
      : await getProfessionalPayments(currentUserId)

  return <PaymentsView payments={payments} userRole={currentRole} />
}