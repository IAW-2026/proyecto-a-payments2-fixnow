"use client"

import { useState } from "react"

type PaymentForCheckout = {
  id: string
  jobId: string
}

interface PayWithMercadoPagoButtonProps {
  payment: PaymentForCheckout
}

export function PayWithMercadoPagoButton({
  payment,
}: PayWithMercadoPagoButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handlePay() {
    try {
      setLoading(true)

      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId: payment.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "No se pudo generar el checkout")
      }

      if (!data.checkout_url) {
        throw new Error("Mercado Pago no devolvió una URL de checkout")
      }

      window.location.href = data.checkout_url
    } catch (error) {
      console.error("Error iniciando pago:", error)
      alert("No se pudo iniciar el pago. Intentá nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handlePay}
      disabled={loading}
      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Redirigiendo..." : "Pagar"}
    </button>
  )
}