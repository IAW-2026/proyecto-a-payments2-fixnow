import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    // Se da soporte analitico a variantes de parametros tipicas del frontend
    const jobId = searchParams.get("job_id") || searchParams.get("jobId")
    const collectionId = searchParams.get("collection_id") || searchParams.get("collectionId")

    if (!jobId && !collectionId) {
      return NextResponse.json(
        { error: "Falta el identificador del pago (job_id o collection_id)" },
        { status: 400 }
      )
    }

    let payment = null

    // Recuperacion de la entidad segun la estrategia de indexacion provista por la URL de consulta
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    console.error("Error en la API de status de pagos:", errorMessage)
    
    return NextResponse.json(
      { error: "Error interno del servidor", details: "No se pudo recuperar el estado del pago" },
      { status: 500 }
    )
  }
}