import { auth } from "@clerk/nextjs/server"
//  IMPORTACIÓN PARA EL FLUJO REAL (Comentada para desarrollo):
// import { clerkClient, redirect } from "@clerk/nextjs/server" 

import { type CleanPayment } from "@/lib/payments-service"
import { DashboardView } from "@/components/views/dashboard-view"
import { prisma } from "@/lib/prisma"
import DevPaymentsPage from "./dev/payments/page" 

// CONFIGURACIÓN DE ETAPAS:
// TRUE  = Etapa actual 
// FALSE = Etapa 3 Activa Clerk 
const MOCK_MODE = true

const DEV_PROFESSIONAL_ID = "anonymous_professional"
const DEV_CLIENT_ID = "anonymous_client"

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

    return <DevPaymentsPage />
  }

  // -------------------------------------------------------------------------
  // ESCENARIO ETAPA 3 / VISTAS DE ROLES: FLUJO REAL CON PRISMA Y CLERK
  // -------------------------------------------------------------------------
  
  //  MODO DESARROLLO (Actual): Determina el rol puramente por la URL
  const currentRole = params.role === "driver" || params.role === "conductor" ? "driver" : "rider"
  
  /* 
  // (Etapa 3 - Descomentar cuando MOCK_MODE = false):
  // 1. Si no hay sesión válida de Clerk, rebotar al login seguro de forma estricta
  if (!userId) {
    return redirect("/sign-in") 
  }
  
  // 2. Consultar el rol guardado en los metadatos de Clerk
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const realUserRole = user.publicMetadata.role // Debería devolver "driver" o "rider"
  
  // 3. Cruzar el parámetro visual de la URL con la seguridad del Token de Clerk
  // Evita que un cliente manipule la URL (?role=driver) para ver datos ajenos
  const currentRole = params.role === "driver" && realUserRole === "driver" ? "driver" : "rider"
  */

  const isRider = currentRole === "rider"
  let payments: CleanPayment[] = []

  // 2. Buscar datos en la base de datos mediante el puente de Prisma
  if (isRider) {
    //  Si está en modo mock, usa SÍ O SÍ el id de pruebas para que matchee
    const clientId = MOCK_MODE ? DEV_CLIENT_ID : (params.client_id || userId)

    if (clientId) {
      const rawPayments = await prisma.payment.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
      })
      
      payments = rawPayments.map(p => ({
        id: p.id,
        jobId: p.jobId,
        clientId: p.clientId,
        professionalId: p.professionalId,
        amount: Number(p.amount),
        commission: Number(p.commission || 0),
        netAmount: Number(p.amount) - Number(p.commission || 0),
        paidAt: p.paidAt ? p.paidAt.toISOString() : null,
        status: p.status as any,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      })) as CleanPayment[]
    }
  } else {
    //  Si está en modo mock, usa SÍ O SÍ el id del profesional mockeado
    const professionalId = MOCK_MODE ? DEV_PROFESSIONAL_ID : (params.professional_id || userId)

    if (professionalId) {
      const rawPayments = await prisma.payment.findMany({
        where: { professionalId },
        orderBy: { createdAt: "desc" },
      })

      payments = rawPayments.map(p => ({
        id: p.id,
        jobId: p.jobId,
        clientId: p.clientId,
        professionalId: p.professionalId,
        amount: Number(p.amount),
        commission: Number(p.commission || 0),
        netAmount: Number(p.amount) - Number(p.commission || 0),
        paidAt: p.paidAt ? p.paidAt.toISOString() : null,
        status: p.status as any,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      })) as CleanPayment[]
    }
  }

  // 3. Cálculo de métricas para los tableros limpios de finanzas
  let totalGenerated = 0
  let totalCommission = 0
  let pendingCount = 0

  for (const p of payments) {
    totalGenerated += Number(p.amount)
    totalCommission += Number(p.commission || 0)

    if (p.status === "pending" || p.status === "processing") {
      pendingCount++
    }
  }

  const netAmount = totalGenerated - totalCommission

  const recentPayments = payments.slice(0, 3).map((payment) => ({
    id: payment.id,
    jobId: payment.jobId,
    amount: Number(payment.amount),
    commission: Number(payment.commission || 0),
    netAmount: Number(
      payment.netAmount ||
        Number(payment.amount) - Number(payment.commission || 0)
    ),
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