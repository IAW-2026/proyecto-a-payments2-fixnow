import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { PaymentStatus } from "@prisma/client" 

const COMMISSION_RATE = Number(process.env.FIXNOW_COMMISSION_RATE) || 0.1

export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      "Endpoint dev payments activo. Usa POST para crear un pago mockeado de FixNow.",
  })
}
export async function POST() {
  try {
    // Se cambia la verificacion para usar una variable de entorno personalizada
    if (process.env.ENABLE_MOCKS !== "true") {
      return NextResponse.json(
        { error: "Endpoint de pruebas deshabilitado en este entorno" },
        { status: 403 }
      )
    }

    const jobId = `job-dev-${Date.now()}`
    const amount = 1000
    const clientId = "anonymous_client"
    const professionalId = "anonymous_professional"
    const commission = amount * COMMISSION_RATE

    // Persistencia del recurso de pago mockeado en la base de datos de pruebas
    const payment = await prisma.payment.create({
      data: {
        jobId,
        clientId,
        professionalId,
        amount,
        commission,
        status: PaymentStatus.pending,
      },
    })

    // Se cambia la estrategia a revalidatePath para limpiar la cache de la ruta del dashboard
    try {
      revalidatePath("/dashboard/payments")
    } catch (cacheError) {
      console.log("Aviso de cache controlado:", cacheError)
    }

    // Se devuelven las URLs correspondientes cumpliendo con los patrones RESTful y URI templates
    return NextResponse.json(
      {
        success: true,
        payment: {
          id: payment.id,
          jobId: payment.jobId,
          clientId: payment.clientId,
          professionalId: payment.professionalId,
          amount: payment.amount.toString(),
          commission: payment.commission.toString(),
          status: payment.status,
        },
        links: {
          riderPayments: `/payments?role=rider&client_id=${clientId}`,
          checkout: `/payments/checkout/${jobId}?amount=${amount}&client_id=${clientId}`,
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    // Se utiliza el tipado unknown para cumplir con las reglas estrictas de TypeScript
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    console.error("Error creando pago de prueba:", errorMessage)

    return NextResponse.json(
      {
        error: "Error creando pago de prueba",
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}