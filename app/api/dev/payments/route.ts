import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { revalidateTag } from "next/cache"
import { PaymentStatus } from "@prisma/client" 

const COMMISSION_RATE = Number(process.env.FIXNOW_COMMISSION_RATE) || 0.1

export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      "Endpoint dev payments activo. Usá POST para crear un pago mockeado de FixNow.",
  })
}

export async function POST() {
  try {
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "Endpoint disponible solo en desarrollo" },
        { status: 403 }
      )
    }

    const jobId = `job-dev-${Date.now()}`
    const amount = 15000
    const clientId = "anonymous_client"
    const professionalId = "anonymous_professional"
    const commission = amount * COMMISSION_RATE

   
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

    // Esto limpia la caché de Next.js para que los dashboards se actualicen
    try {
      revalidateTag("pagos","max")
    } catch (cacheError) {
      console.log("Aviso de caché controlado:", cacheError)
    }

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
  } catch (error: any) {
    console.error("Error creando pago de prueba:", error)

    return NextResponse.json(
      {
        error: "Error creando pago de prueba",
        details: error.message,
      },
      { status: 500 }
    )
  }
}