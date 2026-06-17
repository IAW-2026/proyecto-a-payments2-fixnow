import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { PaymentStatus } from "@prisma/client"
import {
  notifyDriverPayout,
  notifyRiderPaymentConfirmation,
} from "@/lib/internal-notifications"

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const topic = searchParams.get("topic") || searchParams.get("type")

    if (topic !== "payment") {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const body = await request.json().catch(() => null)
    const resourceId = body?.data?.id || body?.id

    if (!resourceId) {
      return NextResponse.json(
        { error: "No se encontro el ID del recurso" },
        { status: 400 }
      )
    }

    const mpAccessToken =
      process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN

    if (!mpAccessToken) {
      return NextResponse.json(
        { error: "Falta MERCADO_PAGO_ACCESS_TOKEN o MP_ACCESS_TOKEN" },
        { status: 500 }
      )
    }

    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${resourceId}`,
      {
        headers: {
          Authorization: `Bearer ${mpAccessToken}`,
        },
      }
    )

    if (!response.ok) {
      console.error(
        `[Webhook Error] No se pudo validar el pago ${resourceId} en Mercado Pago`
      )

      return NextResponse.json(
        { error: "Error al validar con Mercado Pago" },
        { status: 502 }
      )
    }

    const paymentData = await response.json()

    const jobId = paymentData.external_reference
    const mpStatus = paymentData.status

    if (!jobId) {
      return NextResponse.json(
        { error: "No se encontro external_reference (jobId)" },
        { status: 400 }
      )
    }

    if (mpStatus === "approved") {
      const paidAt = new Date()

      await prisma.payment.updateMany({
        where: {
          jobId: String(jobId),
          status: { not: PaymentStatus.paid },
        },
        data: {
          status: PaymentStatus.paid,
          mpPaymentId: String(resourceId),
          paidAt,
        },
      })

      const payment = await prisma.payment.findUnique({
        where: {
          jobId: String(jobId),
        },
      })

      if (!payment) {
        return NextResponse.json(
          { error: "No se encontro el pago en Payments" },
          { status: 404 }
        )
      }

      const amount = Number(payment.amount)
      const commission = Number(payment.commission)
      const professionalAmount = amount - commission

      try {
        await notifyRiderPaymentConfirmation({
          jobId: payment.jobId,
          amount,
          paidAt: paidAt.toISOString(),
        })

        console.log(
          `[Webhook] Rider notificado correctamente para job ${payment.jobId}`
        )
      } catch (error) {
        console.error(
          `[Webhook] Error notificando a Rider para job ${payment.jobId}:`,
          error
        )
      }

      try {
        await notifyDriverPayout({
          jobId: payment.jobId,
          professionalId: payment.professionalId,
          amount: professionalAmount,
        })

        console.log(
          `[Webhook] Driver notificado correctamente para job ${payment.jobId}`
        )
      } catch (error) {
        console.error(
          `[Webhook] Error notificando a Driver para job ${payment.jobId}:`,
          error
        )
      }

      console.log(`[Webhook exitoso] Trabajo #${jobId} marcado como PAGADO.`)

      revalidatePath("/")
      revalidatePath("/dashboard/payments")
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido"

    console.error("Error critico en el Webhook:", errorMessage)

    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    )
  }
}