"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { AlertCircle, CreditCard, ShieldCheck, Wrench } from "lucide-react"

type CheckoutResponse = {
  success?: boolean
  mock?: boolean
  checkout_url?: string
  error?: string
  details?: string
  detalles?: unknown
  mercadoPagoStatus?: number
  mercadoPagoError?: unknown
  debug?: unknown
}

type PaymentStatusResponse = {
  found?: boolean
  payment?: {
    id?: string
    jobId?: string
    clientId?: string
    professionalId?: string
    amount?: number | string
    commission?: number | string
    status?: string
    mpPaymentId?: string | null
    paidAt?: string | null
    createdAt?: string
  }
  payment_id?: string
  job_id?: string
  amount?: number | string
  commission?: number | string
  status?: string
  paid_at?: string | null
  error?: string
  details?: string
}
export default function CheckoutJobPage() {
  const params = useParams()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(false)
  const [loadingPayment, setLoadingPayment] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [amountFromDb, setAmountFromDb] = useState<number | null>(null)

  const rawJobId = params.jobId
  const jobId = Array.isArray(rawJobId) ? rawJobId[0] : String(rawJobId || "")

  const amountFromUrl = searchParams.get("amount")
  const serviceType = searchParams.get("service_type") || "Servicio Técnico"
  const description =
    searchParams.get("description") ||
    "Reparación general realizada del hogar."

  const parsedAmountFromUrl = Number(amountFromUrl || 0)
  const parsedAmount =
    amountFromDb !== null ? amountFromDb : parsedAmountFromUrl

  useEffect(() => {
    async function fetchPayment() {
      try {
        setLoadingPayment(true)
        setError(null)

        if (!jobId) {
          setError("No se encontró el jobId del pago.")
          return
        }

        const response = await fetch(
          `/api/payments/status?job_id=${encodeURIComponent(jobId)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        )

        const contentType = response.headers.get("content-type") || ""
        const rawText = await response.text()

        if (!rawText.trim()) {
          throw new Error(
            `El endpoint /api/payments/status respondió vacío. Status: ${response.status}.`
          )
        }

        if (!contentType.includes("application/json")) {
          throw new Error(
            `El endpoint /api/payments/status no devolvió JSON. Status: ${response.status}. Respuesta: ${rawText.slice(
              0,
              250
            )}`
          )
        }

        const data: PaymentStatusResponse = JSON.parse(rawText)

        if (!response.ok) {
          throw new Error(
            data.error ||
              data.details ||
              "No se pudo obtener la información del pago."
          )
        }

        const amount = Number(data.amount)

        if (Number.isFinite(amount) && amount > 0) {
          setAmountFromDb(amount)
        } else if (Number.isFinite(parsedAmountFromUrl) && parsedAmountFromUrl > 0) {
          setAmountFromDb(parsedAmountFromUrl)
        } else {
          setAmountFromDb(0)
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Error inesperado al cargar el pago"

        console.error("Error cargando información del pago:", errorMessage)
        setError(errorMessage)

        if (Number.isFinite(parsedAmountFromUrl) && parsedAmountFromUrl > 0) {
          setAmountFromDb(parsedAmountFromUrl)
        } else {
          setAmountFromDb(0)
        }
      } finally {
        setLoadingPayment(false)
      }
    }

    fetchPayment()
  }, [jobId, parsedAmountFromUrl])

  async function handleProcederAlPago() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
        }),
      })

      const contentType = response.headers.get("content-type") || ""
      const rawText = await response.text()

      let data: CheckoutResponse = {}

      if (!rawText.trim()) {
        throw new Error(
          `El endpoint /api/payments/checkout respondio vacio. Status: ${response.status}.`
        )
      }

      if (contentType.includes("application/json")) {
        try {
          data = JSON.parse(rawText)
        } catch {
          throw new Error(
            `El endpoint devolvio JSON invalido. Status: ${response.status}. Respuesta: ${rawText.slice(
              0,
              250
            )}`
          )
        }
      } else {
        throw new Error(
          `El endpoint no devolvio JSON. Status: ${response.status}. Respuesta: ${rawText.slice(
            0,
            250
          )}`
        )
      }

      if (!response.ok) {
        const detailedError = [
          data.error,
          data.details,
          data.mercadoPagoError
            ? `Mercado Pago: ${JSON.stringify(data.mercadoPagoError)}`
            : null,
          data.debug ? `Debug: ${JSON.stringify(data.debug)}` : null,
        ]
          .filter(Boolean)
          .join(" | ")

        throw new Error(
          detailedError || "No se pudo generar el checkout de Mercado Pago."
        )
      }

      if (!data.checkout_url) {
        throw new Error("El backend no devolvio checkout_url.")
      }

      window.location.href = data.checkout_url
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error inesperado al generar el checkout"

      console.error("Error al conectar con la pasarela:", errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto mt-8 flex min-h-[80vh] w-full max-w-md items-center justify-center">
      <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Wrench className="h-5 w-5" />
          </div>

          <div>
            <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
              Resumen de Orden
            </h1>

            <p className="text-xs text-muted-foreground">
              Trabajo ordenado: #{jobId.slice(-6)}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="mt-5 space-y-3 text-sm">
          <div>
            <span className="block text-muted-foreground">Especialidad</span>
            <span className="font-medium text-foreground">{serviceType}</span>
          </div>

          <div>
            <span className="block text-muted-foreground">
              Descripción del trabajo realizado
            </span>

            <p className="mt-1 rounded-lg border border-border/50 bg-muted/40 p-2.5 text-xs font-medium text-foreground">
              {description}
            </p>
          </div>
        </div>

        <div className="my-5 border-t border-dashed border-border" />

        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            Monto total a abonar:
          </span>

          <span className="font-[family-name:var(--font-display)] text-3xl font-black text-foreground">
            {loadingPayment
              ? "Cargando..."
              : `$${parsedAmount.toLocaleString("es-AR")}`}
          </span>
        </div>

        <button
          type="button"
          onClick={handleProcederAlPago}
          disabled={loading || loadingPayment || !jobId || parsedAmount <= 0}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CreditCard className="h-4 w-4" />
          {loading ? "Generando checkout real..." : "Pagar con Mercado Pago"}
        </button>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          Cobro protegido por la pasarela oficial de Mercado Pago Sandbox.
        </div>
      </div>
    </div>
  )
}