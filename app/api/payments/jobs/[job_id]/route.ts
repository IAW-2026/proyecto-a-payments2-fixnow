import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isValidServiceRequest, unauthorizedResponse } from "@/lib/internal-auth"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ job_id: string }> }
) {
  try {
    if (!isValidServiceRequest(request)) {
      return unauthorizedResponse()
    }

    const { job_id } = await params

    const payment = await prisma.payment.findUnique({
      where: {
        jobId: job_id,
      },
    })

    if (!payment) {
      return NextResponse.json(
        { error: "No existe un pago registrado para ese job_id" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      payment_id: payment.id,
      job_id: payment.jobId,
      amount: Number(payment.amount),
      commission: Number(payment.commission),
      status: String(payment.status).toLowerCase(),
      paid_at: payment.paidAt ? payment.paidAt.toISOString() : null,
    })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido"

    console.error("Error en GET /api/payments/jobs/[job_id]:", errorMessage)

    return NextResponse.json(
      {
        error: "Error interno consultando el pago",
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}