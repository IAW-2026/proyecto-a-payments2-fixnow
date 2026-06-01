import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache" 
import { prisma } from "@/lib/prisma"
import { PaymentStatus } from "@prisma/client"

export async function POST(request: Request) {
  try {
    // 1. Capturamos los parámetros que Mercado Pago manda en la URL de notificación
    const { searchParams } = new URL(request.url)
    const topic = searchParams.get("topic") || searchParams.get("type")

    // A Mercado Pago le interesan las notificaciones de tipo "payment"
    if (topic !== "payment") {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    // 2. Obtenemos el ID del pago que nos manda el cuerpo de la petición
    const body = await request.json().catch(() => null)
    const resourceId = body?.data?.id || body?.id

    if (!resourceId) {
      return NextResponse.json({ error: "No se encontró el ID del recurso" }, { status: 400 })
    }

    // 3. Consultamos a la API oficial de Mercado Pago para verificar que el pago sea real (Seguridad)
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

    // 4. Extraemos el identificador de nuestro trabajo (jobId) que guardamos en external_reference
    const jobId = paymentData.external_reference
    const mpStatus = paymentData.status // 'approved', 'pending', 'rejected', etc.

    if (!jobId) {
      return NextResponse.json({ error: "No se encontró external_reference (jobId)" }, { status: 400 })
    }

    // 5. Si el estado en Mercado Pago es aprobado, actualizamos la base de datos
    if (mpStatus === "approved") {
      await prisma.payment.updateMany({
        where: { 
          jobId: String(jobId),
          status: { not: "paid" } 
        },
        data: {
          status: "paid",
          mpPaymentId: String(resourceId),
          paidAt: new Date(),
        },
      })
      
      console.log(`[Webhook exitoso] Trabajo #${jobId} marcado como PAGADO.`)

      // 🚀 Le avisamos a Next.js que la ruta del Dashboard cambió
      revalidatePath("/") 
    }

    // 6. Siempre le respondemos un 200 OK a Mercado Pago para avisarle que recibimos la señal
    return NextResponse.json({ received: true }, { status: 200 })

  } catch (error: any) {
    console.error("Error crítico en el Webhook:", error)
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 })
  }
}