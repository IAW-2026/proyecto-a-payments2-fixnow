import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { revalidateTag } from "next/cache"
import { PaymentStatus } from "@prisma/client"
import { auth } from "@clerk/nextjs/server" 

// Flag de consistencia con el resto de la app
const MOCK_MODE = true 

export async function POST(request: Request) {
  try {
    //(Etapa 3 - Descomentar cuando MOCK_MODE = false):
    /*
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: "No autorizado. Debe iniciar sesión mediante Clerk." },
        { status: 401 }
      )
    }
    */

    const body = await request.json().catch(() => null)

    const paymentId = body?.paymentId
    const jobId = body?.jobId

    if (!paymentId && !jobId) {
      return NextResponse.json(
        { error: "Falta paymentId o jobId" },
        { status: 400 }
      )
    }

    const payment = paymentId
      ? await prisma.payment.findUnique({
          where: { id: String(paymentId) },
        })
      : await prisma.payment.findUnique({
          where: { jobId: String(jobId) },
        })

    if (!payment) {
      return NextResponse.json(
        {
          error: "Pago no encontrado",
          received: { paymentId, jobId },
        },
        { status: 404 }
      )
    }

    /*
    // Evita que un cliente intente pagar el viaje de OTRO cliente interceptando la petición
    if (!MOCK_MODE && payment.clientId !== userId) {
      return NextResponse.json(
        { error: "Operación prohibida. El pago no pertenece al usuario autenticado." },
        { status: 403 }
      )
    }
    */

    if (payment.status === PaymentStatus.paid) {
      return NextResponse.json(
        {
          error: "Este pago ya fue abonado",
          paymentId: payment.id,
          jobId: payment.jobId,
        },
        { status: 409 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ""

    if (!baseUrl) {
      return NextResponse.json(
        {
          error: "Falta NEXT_PUBLIC_APP_URL en .env",
        },
        { status: 500 }
      )
    }

    const successUrl = `${baseUrl}/payments/success?role=rider&job_id=${encodeURIComponent(
      payment.jobId
    )}&client_id=${encodeURIComponent(payment.clientId)}&amount=${Number(
      payment.amount
    )}`

    const failureUrl = `${baseUrl}/payments/failure?role=rider&job_id=${encodeURIComponent(
      payment.jobId
    )}&client_id=${encodeURIComponent(payment.clientId)}`

    const pendingUrl = `${baseUrl}/payments/pending?role=rider&job_id=${encodeURIComponent(
      payment.jobId
    )}&client_id=${encodeURIComponent(payment.clientId)}`

    /*
      ============================================================
      MERCADO PAGO REAL — ACTIVO
      ============================================================
    */

    if (process.env.MOCK_MERCADO_PAGO === "true") {
      return NextResponse.json(
        {
          error:
            "MOCK_MERCADO_PAGO está en true. Para abrir Mercado Pago real, ponelo en false.",
        },
        { status: 400 }
      )
    }

    const mpAccessToken =
      process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN

    if (!mpAccessToken) {
      return NextResponse.json(
        {
          error: "Falta MERCADO_PAGO_ACCESS_TOKEN o MP_ACCESS_TOKEN en .env",
        },
        { status: 500 }
      )
    }

    const preferenceBody = {
      items: [
        {
          title: `Servicio de FixNow - Trabajo #${payment.jobId.slice(-6)}`,
          unit_price: Number(payment.amount),
          quantity: 1,
          currency_id: "ARS",
        },
      ],
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
      },
      notification_url: `${baseUrl}/api/payments/webhook?source_news=webhooks`,
      external_reference: payment.jobId,
      auto_return: "approved",
      metadata: {
        payment_id: payment.id,
        job_id: payment.jobId,
        client_id: payment.clientId,
        professional_id: payment.professionalId,
        calculated_commission: Number(payment.commission),
      },
    }

    const response = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mpAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferenceBody),
      }
    )

    const rawText = await response.text()

    let mercadoPagoData: any = null

    try {
      mercadoPagoData = rawText ? JSON.parse(rawText) : null
    } catch {
      return NextResponse.json(
        {
          error: "Mercado Pago no devolvió JSON válido",
          mercadoPagoStatus: response.status,
          raw: rawText.slice(0, 800),
        },
        { status: 502 }
      )
    }

    if (!response.ok) {
      console.error("Error devuelto por Mercado Pago:", mercadoPagoData)

      return NextResponse.json(
        {
          error: "No se pudo crear el checkout de Mercado Pago",
          mercadoPagoStatus: response.status,
          mercadoPagoError: mercadoPagoData,
          debug: {
            baseUrl,
            successUrl,
            failureUrl,
            pendingUrl,
            notificationUrl: `${baseUrl}/api/payments/webhook?source_news=webhooks`,
            jobId: payment.jobId,
            amount: Number(payment.amount),
          },
        },
        { status: response.status }
      )
    }

    const checkoutUrl =
      mercadoPagoData?.init_point || mercadoPagoData?.sandbox_init_point

    if (!checkoutUrl) {
      return NextResponse.json(
        {
          error: "Mercado Pago no devolvió init_point ni sandbox_init_point",
          mercadoPagoResponse: mercadoPagoData,
        },
        { status: 502 }
      )
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.processing,
      },
    })

    try {
      revalidateTag("pagos","max")
    } catch (cacheError) {
      console.log("Aviso de caché controlado:", cacheError)
    }

    return NextResponse.json(
      {
        success: true,
        mock: false,
        paymentId: payment.id,
        jobId: payment.jobId,
        checkout_url: checkoutUrl,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error crítico en POST /api/payments/checkout:", error)

    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error?.message || "Error desconocido",
      },
      { status: 500 }
    )
  }
}