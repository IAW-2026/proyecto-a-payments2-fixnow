import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache" 
import { prisma } from "@/lib/prisma"
import { PaymentStatus } from "@prisma/client"

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const topic = searchParams.get("topic") || searchParams.get("type")

    // Filtro operacional para descartar notificaciones ajenas al dominio de pagos
    if (topic !== "payment") {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const body = await request.json().catch(() => null)
    const resourceId = body?.data?.id || body?.id

    if (!resourceId) {
      return NextResponse.json({ error: "No se encontro el ID del recurso" }, { status: 400 })
    }

    // Validacion defensiva del token de acceso de Mercado Pago antes del procesamiento del recurso externo
    const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN
    
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
      },
    })

    if (!response.ok) {
      console.error(`[Webhook Error] No se pudo validar el pago ${resourceId} en Mercado Pago`)
      return NextResponse.json({ error: "Error al validar con Mercado Pago" }, { status: 502 })
    }

    const paymentData = await response.json()
    const jobId = paymentData.external_reference
    const mpStatus = paymentData.status

    if (!jobId) {
      return NextResponse.json({ error: "No se encontro external_reference (jobId)" }, { status: 400 })
    }

    // Si el estado es aprobado en el origen, se actualiza de forma atomica usando el enum de Prisma correspondiente
    if (mpStatus === "approved") {
      // @ts-ignore
      await prisma.payment.updateMany({
        where: { 
          jobId: String(jobId),
          status: { not: PaymentStatus.paid } 
        },
        data: {
          status: PaymentStatus.paid,
          mpPaymentId: String(resourceId),
          paidAt: new Date(),
        },
      })
      
      console.log(`[Webhook exitoso] Trabajo #${jobId} marcado como PAGADO.`)

      // Revalidación selectiva de la cache de la ruta raiz para forzar la actualizacion de los componentes de servidor
      revalidatePath("/") 
    }

    // Retorno obligatorio de 200 OK exigido por el protocolo de notificaciones asincronicas de Mercado Pago
    return NextResponse.json({ received: true }, { status: 200 })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    console.error("Error critico en el Webhook:", errorMessage)
    
    return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 })
  }
}