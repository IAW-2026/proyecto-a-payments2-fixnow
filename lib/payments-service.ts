import { prisma } from "./prisma"

export type PaymentStatus = "pending" | "processing" | "paid" | "failed"

export type CleanPayment = {
  id: string
  jobId: string
  clientId: string
  professionalId: string
  amount: number
  commission: number
  netAmount: number
  status: PaymentStatus
  paidAt: string | null
  createdAt: Date
  updatedAt: Date
}

/*
 * Mapeador defensivo para normalizar las estructuras de datos provenientes del ORM.
 * Asegura la conversion explicita de los tipos numericos de Prisma a tipos nativos de JavaScript
 * y mitiga inconsistencias de casing en el string de estado para el renderizado del Badge.
 */
export function mapPrismaPayment(payment: any): CleanPayment {
  const amount = Number(payment.amount)
  const commission = Number(payment.commission)

  return {
    id: payment.id,
    jobId: payment.jobId,
    clientId: payment.clientId,
    professionalId: payment.professionalId,
    amount,
    commission,
    netAmount: amount - commission,
    status: String(payment.status).toLowerCase() as PaymentStatus,
    paidAt: payment.paidAt ? new Date(payment.paidAt).toISOString() : null,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  }
}

/*
 * Remocion de la estrategia de almacenamiento in-memory (unstable_cache).
 * Al tratarse de un dominio transaccional y financiero critico dentro del sistema FixNow,
 * la persistencia de datos cacheados comprometia la consistencia inmediata exigida.
 * Se implementa un flujo puramente dinamico con consultas directas a Supabase mediante Prisma.
 */
export async function getProfessionalPayments(userId: string): Promise<CleanPayment[]> {
  const paymentsFromDb = await prisma.payment.findMany({
    where: {
      professionalId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return paymentsFromDb.map(mapPrismaPayment)
}

/*
 * Consulta balanceada en espejo para el rol del cliente.
 * Garantiza el acoplamiento estricto de identificadores en base a la sesion activa,
 * evitando discrepancias de cache entre la visualizacion del resumen financiero y las tablas de historial.
 */
export async function getClientPayments(userId: string): Promise<CleanPayment[]> {
  const paymentsFromDb = await prisma.payment.findMany({
    where: {
      clientId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return paymentsFromDb.map(mapPrismaPayment)
}