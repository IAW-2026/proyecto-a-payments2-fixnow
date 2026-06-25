// lib/internal-notifications.ts

export async function notifyRiderPaymentConfirmation({
  jobId,
  amount,
  paidAt,
}: {
  jobId: string
  amount: number
  paidAt: string
}) {
  if (!process.env.RIDER_API_URL) {
    throw new Error("Falta RIDER_API_URL en variables de entorno")
  }

  if (!process.env.INTERNAL_API_SECRET) {
    throw new Error("Falta INTERNAL_API_SECRET en variables de entorno")
  }

  const response = await fetch(
    `${process.env.RIDER_API_URL}/api/v1/jobs/${encodeURIComponent(
      jobId
    )}/payment-confirmation`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`,
      },
      body: JSON.stringify({
        status: "paid",
        amount_paid: amount,
        paid_at: paidAt,
      }),
    }
  )

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(
      `No se pudo notificar a Rider App. Status: ${response.status}. ${text}`
    )
  }
}

export async function notifyDriverPayout({
  jobId,
  professionalId,
  amount,
}: {
  jobId: string
  professionalId: string
  amount: number
}) {
  if (!process.env.DRIVER_API_URL) {
    throw new Error("Falta DRIVER_API_URL en variables de entorno")
  }

  if (!process.env.INTERNAL_API_SECRET) {
    throw new Error("Falta INTERNAL_API_SECRET en variables de entorno")
  }

  const response = await fetch(
    `${process.env.DRIVER_API_URL}/api/jobs/${encodeURIComponent(
      jobId
    )}/payout-notifications`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`,
      },
      body: JSON.stringify({
        professional_id: professionalId,
        amount,
      }),
    }
  )

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(
      `No se pudo notificar a Driver App. Status: ${response.status}. ${text}`
    )
  }
}