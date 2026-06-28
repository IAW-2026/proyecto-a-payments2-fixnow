import {
  getClientPayments,
  getProfessionalPayments,
} from "@/lib/payments-service"
import { DashboardView } from "@/components/views/dashboard-view"

export const dynamic = "force-dynamic"

const DEV_PROFESSIONAL_ID = "anonymous_professional"
const DEV_CLIENT_ID = "anonymous_client"

type SearchParamValue = string | string[] | undefined

function getParamValue(value: SearchParamValue) {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, SearchParamValue>>
}) {
  const params = await searchParams

  const role = (getParamValue(params.role) || "rider").toLowerCase()

  const clientId =
    getParamValue(params.client_id) ||
    getParamValue(params.clientId) ||
    DEV_CLIENT_ID

  const professionalId =
    getParamValue(params.professional_id) ||
    getParamValue(params.professionalId) ||
    DEV_PROFESSIONAL_ID

  const currentUserId = role === "rider" ? clientId : professionalId

  const payments =
    role === "rider"
      ? await getClientPayments(currentUserId)
      : await getProfessionalPayments(currentUserId)

  const totalGenerated = payments.reduce(
    (total, payment) => total + payment.amount,
    0
  )

  const totalCommission = payments.reduce(
    (total, payment) => total + payment.commission,
    0
  )

  const netAmount = totalGenerated - totalCommission

  const pendingCount = payments.filter(
    (payment) => payment.status === "pending" || payment.status === "processing"
  ).length

  const recentPayments = payments.slice(0, 5).map((payment) => ({
    id: payment.id,
    jobId: payment.jobId,
    amount: payment.amount,
    commission: payment.commission,
    netAmount: payment.amount - payment.commission,
    status: payment.status,
  }))

  return (
    <DashboardView
      totalGenerated={totalGenerated}
      totalCommission={totalCommission}
      netAmount={netAmount}
      pendingCount={pendingCount}
      recentPayments={recentPayments}
      userRole={role}
    />
  )
}