import { prisma } from "./prisma"
import { unstable_cache } from "next/cache"

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

// Corregimos el mapeador para que no busque columnas borradas en Supabase
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
    status: payment.status as PaymentStatus,
    paidAt: payment.paidAt ? new Date(payment.paidAt).toISOString() : null,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  }
}

export const getProfessionalPayments = unstable_cache(
  async (userId: string): Promise<CleanPayment[]> => {
    const paymentsFromDb = await prisma.payment.findMany({
      where: {
        professionalId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return paymentsFromDb.map(mapPrismaPayment)
  },
  ["professional-payments-cache"],
  { tags: ["pagos"] }
)

export const getClientPayments = unstable_cache(
  async (userId: string): Promise<CleanPayment[]> => {
    const paymentsFromDb = await prisma.payment.findMany({
      where: {
        clientId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return paymentsFromDb.map(mapPrismaPayment)
  },
  ["client-payments-cache"],
  { tags: ["pagos"] }
)