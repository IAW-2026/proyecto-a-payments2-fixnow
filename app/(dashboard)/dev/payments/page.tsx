"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

type DevPaymentResponse = {
  success: boolean
  payment?: {
    id: string
    jobId: string
    clientId: string
    professionalId: string
    amount: string
    commission: string
    status: string
  }
  links?: {
    riderPayments: string
    checkout: string
  }
  error?: string
}

export default function DevPaymentsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DevPaymentResponse | null>(null)

  // Oculta la barra lateral en esta vista y la devuelve al salir
  useEffect(() => {
    const sidebar = document.querySelector("aside")
    if (sidebar) {
      sidebar.style.display = "none"
    }
    return () => {
      if (sidebar) {
        sidebar.style.display = "flex"
      }
    }
  }, [])

  async function createDevPayment() {
    try {
      setLoading(true)
      setResult(null)

      const response = await fetch("/api/dev/payments", {
        method: "POST",
      })

      const contentType = response.headers.get("content-type") || ""
      const rawText = await response.text()

      let data: DevPaymentResponse

      if (contentType.includes("application/json")) {
        data = JSON.parse(rawText)
      } else {
        throw new Error(
          `El endpoint no devolvió JSON. Status: ${response.status}. Respuesta: ${rawText.slice(
            0,
            160
          )}`
        )
      }

      if (!response.ok) {
        throw new Error(data.error || "No se pudo crear el pago de prueba")
      }

      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error creando pago de prueba",
      })
    } finally {
      setLoading(false)
    }
  }

  const createdPayment = result?.success && result.payment ? result.payment : null

  return (

    <div className="mx-auto flex min-h-[85vh] w-full max-w-2xl flex-col justify-center space-y-6 px-4 py-8">
      
      {/* Panel de control de simulaciones */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
        <h1 className="text-2xl font-bold"> Pruebas</h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Esta pantalla crea pagos de prueba con datos mockeados de FixNow.
          El checkout y el webhook siguen siendo reales con Mercado Pago.
          Podes acceder a panel de cliente o profesional para ver cómo se reflejan estos pagos en cada cuenta. 
        </p>

  
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={createDevPayment}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creando pago..." : "Crear pago de prueba"}
          </button>

          <Link
            href="/?role=rider"
            className="rounded-xl bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            Ver Panel Cliente
          </Link>

          <Link
            href="/?role=driver"
            className="rounded-xl bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            Ver Panel Profesional
          </Link>
        </div>
      </div>

      {result?.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {result.error}
        </div>
      )}

      {/* CARD INFERIOR: Recibo y checkout específico del último pago */}
      {createdPayment && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
          <h2 className="text-lg font-semibold">Pago de prueba creado</h2>

          <div className="mt-4 space-y-2 text-sm">
            <p>
              <strong>Trabajo:</strong> {createdPayment.jobId}
            </p>
            <p>
              <strong>Monto:</strong>{" "}
              ${Number(createdPayment.amount).toLocaleString("es-AR")}
            </p>
            <p>
              <strong>Cliente mock:</strong> {createdPayment.clientId}
            </p>
            <p>
              <strong>Profesional mock:</strong>{" "}
              {createdPayment.professionalId}
            </p>
            <p>
              <strong>Estado inicial:</strong> {createdPayment.status}
            </p>
          </div>

          <div className="mt-6">
            {result?.links?.checkout && (
              <Link
                href={result.links.checkout}
                className="inline-block w-full sm:w-auto rounded-xl border border-blue-600 bg-blue-50 px-5 py-2 text-center text-sm font-bold text-blue-700 hover:bg-blue-100 transition-colors"
              >
                Ir al checkout real
              </Link>
            )}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Al tocar “Ir al checkout real”, vas a la pantalla de FixNow. Desde
            ahí, “Pagar con Mercado Pago” abre Mercado Pago real.
          </p>
        </div>
      )}
    </div>
  )
}