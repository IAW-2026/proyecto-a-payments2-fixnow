import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { PaymentStatus } from "@prisma/client"
import { isValidServiceRequest, unauthorizedResponse } from "@/lib/internal-auth"

export const dynamic = "force-dynamic"

const DEFAULT_COMMISSION_RATE =
  Number(process.env.FIXNOW_COMMISSION_RATE) || 0.1

export async function POST(request: Request) {
  try {
    if (!isValidServiceRequest(request)) {
      return unauthorizedResponse()
    }

    const body = await request.json().catch(() => null)

    const jobId = body?.job_id || body?.jobId
    const clientId = body?.client_id || body?.clientId
    const professionalId = body?.professional_id || body?.professionalId
    const amount = Number(body?.amount)

    const commissionRate = Number(
      body?.commission_rate ?? body?.commissionRate ?? DEFAULT_COMMISSION_RATE
    )

    if (!jobId || !clientId || !professionalId) {
      return NextResponse.json(
        {
          error:
            "Faltan datos obligatorios: job_id, client_id o professional_id",
        },
        { status: 400 }
      )
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "El monto debe ser un número mayor a 0" },
        { status: 422 }
      )
    }

    if (
      !Number.isFinite(commissionRate) ||
      commissionRate < 0 ||
      commissionRate > 1
    ) {
      return NextResponse.json(
        { error: "commission_rate debe ser un número decimal entre 0 y 1" },
        { status: 422 }
      )
    }

    const existingPayment = await prisma.payment.findUnique({
      where: { jobId: String(jobId) },
    })

    if (existingPayment) {
      return NextResponse.json(
        {
          error: "Ya existe un pago para este job_id",
          payment_id: existingPayment.id,
          job_id: existingPayment.jobId,
          status: existingPayment.status,
          checkout_url: `/payments/checkout/${encodeURIComponent(
            existingPayment.jobId
          )}?amount=${Number(existingPayment.amount)}&client_id=${encodeURIComponent(
            existingPayment.clientId
          )}`,
        },
        { status: 409 }
      )
    }

    const commission = amount * commissionRate

    const payment = await prisma.payment.create({
      data: {
        jobId: String(jobId),
        clientId: String(clientId),
        professionalId: String(professionalId),
        amount,
        commission,
        status: PaymentStatus.pending,
      },
    })

    return NextResponse.json(
      {
        payment_id: payment.id,
        job_id: payment.jobId,
        amount: Number(payment.amount),
        commission: Number(payment.commission),
        status: payment.status,
        mp_payment_id: payment.mpPaymentId,
        paid_at: payment.paidAt,
        created_at: payment.createdAt.toISOString(),

        // Rider tiene que usar esto para redirigir al cliente a pagar:
        // https://proyecto-a-payments2-fixnow.vercel.app + checkout_url
        checkout_url: `/payments/checkout/${encodeURIComponent(
          payment.jobId
        )}?amount=${Number(payment.amount)}&client_id=${encodeURIComponent(
          payment.clientId
        )}`,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido"

    console.error("Error en POST /api/payments:", errorMessage)

    return NextResponse.json(
      {
        error: "Error interno creando el pago",
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}