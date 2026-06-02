import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { type CleanPayment } from "@/lib/payments-service"
import { DashboardView } from "@/components/views/dashboard-view"
import { prisma } from "@/lib/prisma"
import DevPaymentsPage from "./dev/payments/page" 

// Flag de consistencia para alternar entre simulaciones locales y el entorno real de Clerk
const MOCK_MODE = true

const DEV_PROFESSIONAL_ID = "anonymous_professional"
const DEV_CLIENT_ID = "anonymous_client"


// De esta forma, el build no intenta compilarla de forma estática en frío y pasa en verde de una.
export const dynamic = "force-dynamic"

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ professional_id?: string; client_id?: string; role?: string }>
}) {
  const params = await searchParams
  const { userId } = await auth()

  // -------------------------------------------------------------------------
  // ESCENARIO ETAPA ACTUAL: MOCK_MODE ACTIVO
  // -------------------------------------------------------------------------
  if (MOCK_MODE && !params.role) {
    return (
      <Suspense fallback={<div>Cargando entorno de desarrollo...</div>}>
        <DevPaymentsPage />
      </Suspense>
    )
  }

  // -------------------------------------------------------------------------
  // ESCENARIO ETAPA 3 / VISTAS DE ROLES: FLUJO REAL CON PRISMA Y CLERK
  // -------------------------------------------------------------------------
  
  // Modo de desarrollo: Resolucion del rol basada de forma prioritario en los parametros de la URL
  const currentRole = params.role === "driver" || params.role === "conductor" ? "driver" : "rider"
  
  /* // (Etapa 3 - Descomentar cuando MOCK_MODE = false):
  // 1. Validacion estricta de sesion para mitigar fallas de control de acceso (OWASP Top 10)
  if (!userId) {
    return redirect("/sign-in") 
  }
  
  // 2. Consulta de metadatos seguros directamente en la sesion de Clerk
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const realUserRole = user.publicMetadata.role 
  
  // 3. Cruce defensivo de parametros de URL con el token firmado para prevenir escalada de privilegios
  const currentRole = params.role === "driver" && realUserRole === "driver" ? "driver" : "rider"
  */

  const isRider = currentRole === "rider"
  let payments: CleanPayment[] = []

  // Resolucion de identificadores segun el rol activo y el estado del flag de pruebas
  const targetUserId = isRider
    ? (MOCK_MODE ? DEV_CLIENT_ID : (params.client_id || userId))
    : (MOCK_MODE ? DEV_PROFESSIONAL_ID : (params.professional_id || userId))

  if (targetUserId) {
    // Consulta directa a la base de datos mapeando las claves foraneas correspondientes
    const rawPayments = await prisma.payment.findMany({
      where: isRider ? { clientId: targetUserId } : { professionalId: targetUserId },
      orderBy: { createdAt: "desc" },
    })
    
    // Mapeo seguro y normalizacion de tipos numericos provenientes del ORM
    payments = rawPayments.map(p => ({
      id: p.id,
      jobId: p.jobId,
      clientId: p.clientId,
      professionalId: p.professionalId,
      amount: Number(p.amount),
      commission: Number(p.commission || 0),
      netAmount: Number(p.amount) - Number(p.commission || 0),
      paidAt: p.paidAt ? p.paidAt.toISOString() : null,
      status: p.status, 
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }))
  }

  // Metricas financieras agregadas para el renderizado del tablero
  let totalGenerated = 0
  let totalCommission = 0
  let pendingCount = 0

  for (const p of payments) {
    totalGenerated += p.amount
    totalCommission += p.commission

    if (p.status === "pending" || p.status === "processing") {
      pendingCount++
    }
  }

  const netAmount = totalGenerated - totalCommission

  // Fragmentacion de los registros mas recientes para la vista compacta del historial
  const recentPayments = payments.slice(0, 3).map((payment) => ({
    id: payment.id,
    jobId: payment.jobId,
    amount: payment.amount,
    commission: payment.commission,
    netAmount: payment.netAmount,
    status: payment.status,
  }))

  return (
    <DashboardView
      totalGenerated={totalGenerated}
      totalCommission={totalCommission}
      netAmount={netAmount}
      pendingCount={pendingCount}
      recentPayments={recentPayments}
      userRole={currentRole}
    />
  )
}