import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { PaymentStatus } from "@prisma/client"
import { auth } from "@clerk/nextjs/server" 

const MOCK_MODE = true 

export async function POST(request: Request) {
  try {
    // El bloque de autenticacion de Clerk se mantiene comentado estructuralmente para la Etapa 2
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

    // Resolucion del recurso por ID unico o por ID de trabajo segun la carga util provista
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

    // El recurso ya paso a estado de pagado, se retorna 409 Conflict
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
        { error: "Falta NEXT_PUBLIC_APP_URL en .env" },
        { status: 500 }
      )
    }

    if (process.env.MOCK_MERCADO_PAGO === "true") {
      return NextResponse.json(
        { error: "MOCK_MERCADO_PAGO esta en true. Para abrir Mercado Pago real, ponelo en false." },
        { status: 400 }
      )
    }

    const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN
    if (!mpAccessToken) {
      return NextResponse.json(
        { error: "Falta MERCADO_PAGO_ACCESS_TOKEN o MP_ACCESS_TOKEN en .env" },
        { status: 500 }
      )
    }

    // Estructura del payload requerida por la pasarela externa de Mercado Pago 
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
        success: `${baseUrl}/payments/success?role=rider&job_id=${encodeURIComponent(payment.jobId)}&client_id=${encodeURIComponent(payment.clientId)}&amount=${Number(payment.amount)}`,
        failure: `${baseUrl}/payments/failure?role=rider&job_id=${encodeURIComponent(payment.jobId)}&client_id=${encodeURIComponent(payment.clientId)}`,
        pending: `${baseUrl}/payments/pending?role=rider&job_id=${encodeURIComponent(payment.jobId)}&client_id=${encodeURIComponent(payment.clientId)}`,
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
        { error: "Mercado Pago no devolvio JSON valido", mercadoPagoStatus: response.status },
        { status: 502 }
      )
    }

    if (!response.ok) {
      console.error("Error devuelto por Mercado Pago:", mercadoPagoData)
      return NextResponse.json(
        { error: "No se pudo crear el checkout debido a un problema con el proveedor externo", mercadoPagoStatus: response.status },
        { status: response.status }
      )
    }

    const checkoutUrl = mercadoPagoData?.init_point || mercadoPagoData?.sandbox_init_point
    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "Mercado Pago no devolvio init_point ni sandbox_init_point" },
        { status: 502 }
      )
    }

    // Transicion de estado de la entidad a procesando al generar exitosamente el punto de inicio de la pasarela
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.processing },
    })

    // Se purga la cache de la ruta donde el usuario ve reflejado el cambio transicional
    revalidatePath("/dashboard/payments")

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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
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