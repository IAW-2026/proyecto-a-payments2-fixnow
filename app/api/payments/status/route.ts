import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const jobId = searchParams.get("job_id") || searchParams.get("jobId")
    const collectionId = searchParams.get("collection_id") || searchParams.get("collectionId")

    if (!jobId && !collectionId) {
      return NextResponse.json(
        { error: "Falta el identificador del pago (job_id o collection_id)" },
        { status: 400 }
      )
    }

    let payment = null

    // Buscamos en la base de datos según el parámetro que nos mande el frontend
    if (jobId) {
      payment = await prisma.payment.findFirst({
        where: { jobId: jobId },
      })
    } else if (collectionId) {
      payment = await prisma.payment.findFirst({
        where: { mpPaymentId: collectionId },
      })
    }

    if (!payment) {
      return NextResponse.json(
        { found: false, error: "Pago no encontrado en el sistema" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      found: true,
      payment: {
        id: payment.id,
        jobId: payment.jobId,
        clientId: payment.clientId,
        professionalId: payment.professionalId,
        amount: payment.amount.toString(),
        commission: payment.commission?.toString(),
        status: payment.status.toLowerCase(),
        mpPaymentId: payment.mpPaymentId,
        paidAt: payment.paidAt ? payment.paidAt.toISOString() : null,
        createdAt: payment.createdAt.toISOString(),
      },
    })
  } catch (error: any) {
    console.error("Error en la API de status de pagos:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    )
  }
}