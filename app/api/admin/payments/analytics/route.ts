import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isValidServiceRequest, unauthorizedResponse } from "@/lib/internal-auth"

export const dynamic = "force-dynamic"

type Period = "30d" | "90d" | "6m" | "1y" | "all"

function getStartDate(period: Period) {
  const now = new Date()

  if (period === "30d") {
    now.setDate(now.getDate() - 30)
    return now
  }

  if (period === "90d") {
    now.setDate(now.getDate() - 90)
    return now
  }

  if (period === "6m") {
    now.setMonth(now.getMonth() - 6)
    return now
  }

  if (period === "1y") {
    now.setFullYear(now.getFullYear() - 1)
    return now
  }

  return null
}

function toNumber(value: unknown) {
  if (value === null || value === undefined) return 0
  return Number(value)
}

export async function GET(request: Request) {
  try {
    if (!isValidServiceRequest(request)) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)

    const periodParam = searchParams.get("period") || "30d"

    const period: Period =
      periodParam === "90d" ||
      periodParam === "6m" ||
      periodParam === "1y" ||
      periodParam === "all"
        ? periodParam
        : "30d"

    const startDate = getStartDate(period)

    const payments = await prisma.payment.findMany({
      where: startDate
        ? {
            createdAt: {
              gte: startDate,
            },
          }
        : undefined,
      orderBy: {
        createdAt: "desc",
      },
    })

    const paidPayments = payments.filter((payment) => payment.status === "paid")
    const pendingPayments = payments.filter(
      (payment) => payment.status === "pending"
    )
    const processingPayments = payments.filter(
      (payment) => payment.status === "processing"
    )
    const failedPayments = payments.filter(
      (payment) => payment.status === "failed"
    )

    const grossRevenue = paidPayments.reduce(
      (total, payment) => total + toNumber(payment.amount),
      0
    )

    const fixnowCommission = paidPayments.reduce(
      (total, payment) => total + toNumber(payment.commission),
      0
    )

    const professionalPayout = grossRevenue - fixnowCommission

    const averageTicket =
      paidPayments.length > 0 ? grossRevenue / paidPayments.length : 0

    const paymentsFormatted = payments.map((payment) => {
      const amount = toNumber(payment.amount)
      const commission = toNumber(payment.commission)

      return {
        paymentId: payment.id,
        jobId: payment.jobId,
        clientId: payment.clientId,
        professionalId: payment.professionalId,
        amount,
        commission,
        professionalAmount: amount - commission,
        status: payment.status,
        paidAt: payment.paidAt?.toISOString() || null,
        createdAt: payment.createdAt.toISOString(),
        updatedAt: payment.updatedAt.toISOString(),
      }
    })

    return NextResponse.json({
      period,
      generatedAt: new Date().toISOString(),

      summary: {
        grossRevenue,
        fixnowCommission,
        professionalPayout,
        averageTicket,

        totalPayments: payments.length,
        paidPayments: paidPayments.length,
        pendingPayments: pendingPayments.length,
        processingPayments: processingPayments.length,
        failedPayments: failedPayments.length,
      },

      payments: paymentsFormatted,
    })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido"

    console.error("Error en GET /api/admin/payments/analytics:", errorMessage)

    return NextResponse.json(
      {
        error: "Error interno obteniendo analytics de pagos",
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}