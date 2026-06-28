import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { PaymentStatus } from "@prisma/client"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)

    const paymentId = body?.paymentId
    const jobId = body?.jobId

    const serviceType =
      typeof body?.serviceType === "string" && body.serviceType.trim()
        ? body.serviceType.trim()
        : "Servicio Técnico"

    const jobDescription =
      typeof body?.description === "string" && body.description.trim()
        ? body.description.trim()
        : "Detalle del trabajo no disponible."

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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    if (process.env.MOCK_MERCADO_PAGO === "true") {
      return NextResponse.json(
        {
          error:
            "MOCK_MERCADO_PAGO esta en true. Para abrir Mercado Pago real, ponelo en false.",
        },
        { status: 400 }
      )
    }

    const mpAccessToken =
      process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN

    if (!mpAccessToken) {
      return NextResponse.json(
        {
          error:
            "Falta MERCADO_PAGO_ACCESS_TOKEN o MP_ACCESS_TOKEN en el entorno",
        },
        { status: 500 }
      )
    }

    const successUrl = new URL("/payments/success", baseUrl)
    successUrl.searchParams.set("role", "rider")
    successUrl.searchParams.set("job_id", payment.jobId)
    successUrl.searchParams.set("client_id", payment.clientId)
    successUrl.searchParams.set("amount", String(Number(payment.amount)))
    successUrl.searchParams.set("service_type", serviceType)
    successUrl.searchParams.set("description", jobDescription)

    const failureUrl = new URL("/payments/failure", baseUrl)
    failureUrl.searchParams.set("role", "rider")
    failureUrl.searchParams.set("job_id", payment.jobId)
    failureUrl.searchParams.set("client_id", payment.clientId)
    failureUrl.searchParams.set("service_type", serviceType)
    failureUrl.searchParams.set("description", jobDescription)

    const pendingUrl = new URL("/payments/pending", baseUrl)
    pendingUrl.searchParams.set("role", "rider")
    pendingUrl.searchParams.set("job_id", payment.jobId)
    pendingUrl.searchParams.set("client_id", payment.clientId)
    pendingUrl.searchParams.set("service_type", serviceType)
    pendingUrl.searchParams.set("description", jobDescription)

    const preferenceBody = {
      items: [
        {
          title: `${serviceType} - Trabajo #${payment.jobId.slice(-6)}`,
          description: jobDescription,
          unit_price: Number(payment.amount),
          quantity: 1,
          currency_id: "ARS",
        },
      ],
      back_urls: {
        success: successUrl.toString(),
        failure: failureUrl.toString(),
        pending: pendingUrl.toString(),
      },
      notification_url: `${baseUrl}/api/payments/webhook?source_news=webhooks`,
      external_reference: payment.jobId,

      metadata: {
        payment_id: payment.id,
        job_id: payment.jobId,
        client_id: payment.clientId,
        professional_id: payment.professionalId,
        calculated_commission: Number(payment.commission),
        service_type: serviceType,
        job_description: jobDescription,
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
          error: "Mercado Pago no devolvio JSON valido",
          mercadoPagoStatus: response.status,
          rawResponse: rawText,
        },
        { status: 502 }
      )
    }

    if (!response.ok) {
      console.error("Error devuelto por Mercado Pago:", mercadoPagoData)

      return NextResponse.json(
        {
          error:
            "No se pudo crear el checkout debido a un problema con Mercado Pago",
          mercadoPagoStatus: response.status,
          mercadoPagoError: mercadoPagoData,
          debug: {
            baseUrl,
            successUrl: preferenceBody.back_urls.success,
            failureUrl: preferenceBody.back_urls.failure,
            pendingUrl: preferenceBody.back_urls.pending,
            notificationUrl: preferenceBody.notification_url,
            externalReference: preferenceBody.external_reference,
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
          error: "Mercado Pago no devolvio init_point ni sandbox_init_point",
          mercadoPagoResponse: mercadoPagoData,
        },
        { status: 502 }
      )
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.processing },
    })

    revalidatePath("/dashboard/payments")

    return NextResponse.json(
      {
        success: true,
        mock: false,
        paymentId: payment.id,
        jobId: payment.jobId,
        serviceType,
        description: jobDescription,
        checkout_url: checkoutUrl,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido"

    console.error("Error critico en POST /api/payments/checkout:", errorMessage)

    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: "Error interno al procesar la solicitud de cobro",
      },
      { status: 500 }
    )
  }
}