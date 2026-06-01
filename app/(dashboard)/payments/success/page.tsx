"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Landmark,
  Loader2,
  Smartphone,
  Receipt,
} from "lucide-react"

type PaymentStatus = "pending" | "processing" | "paid" | "failed"

type PaymentStatusResponse = {
  found: boolean
  payment?: {
    id: string
    jobId: string
    clientId: string
    professionalId: string
    amount: string
    commission?: string
    status: PaymentStatus
    mpPaymentId?: string | null
    paidAt: string | null
    createdAt?: string
  } | null
  error?: string
}

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const jobId =
    searchParams.get("job_id") ||
    searchParams.get("jobId") ||
    searchParams.get("external_reference")

  const collectionId =
    searchParams.get("collection_id") ||
    searchParams.get("collectionId") ||
    searchParams.get("payment_id") ||
    searchParams.get("paymentId")

  const amountFromUrl = searchParams.get("amount") || "0"

  const clientId =
    searchParams.get("client_id") ||
    searchParams.get("clientId") ||
    "anonymous_client"

  const returnUrl =
    searchParams.get("return_url") ||
    searchParams.get("returnUrl")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payment, setPayment] =
    useState<PaymentStatusResponse["payment"]>(null)

  useEffect(() => {
    async function loadPaymentStatus() {
      try {
        let statusUrl = ""

        if (jobId) {
          statusUrl = `/api/payments/status?job_id=${encodeURIComponent(jobId)}`
        } else if (collectionId) {
          statusUrl = `/api/payments/status?collection_id=${encodeURIComponent(
            collectionId
          )}`
        } else {
          setError("No se recibió un identificador válido del pago.")
          return
        }

        const response = await fetch(statusUrl, {
          method: "GET",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
        })

        const data: PaymentStatusResponse = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error || "No se pudo consultar el estado del pago."
          )
        }

        if (!data.found || !data.payment) {
          setError("No encontramos este pago en FixNow.")
          return
        }

        setPayment(data.payment)
      } catch (error) {
        console.error("Error consultando estado del pago:", error)

        setError(
          error instanceof Error
            ? error.message
            : "No se pudo consultar el estado del pago."
        )
      } finally {
        setLoading(false)
      }
    }

    loadPaymentStatus()
  }, [jobId, collectionId])

  const handleDownloadPDF = () => {
    window.print()
  }

  // viewSummaryHref ahora apunta a la raíz "/" que mapea a tu página principal
  const backToClientAppHref = returnUrl || "https://google.com"
  const viewPaymentsHref = `/payments?role=rider&client_id=${encodeURIComponent(clientId)}`
  const viewSummaryHref = `/?role=rider&client_id=${encodeURIComponent(clientId)}`
  
  const retryPaymentHref = payment?.jobId
    ? `/payments/checkout/${encodeURIComponent(
        payment.jobId
      )}?amount=${encodeURIComponent(
        payment.amount
      )}&client_id=${encodeURIComponent(clientId)}`
    : viewPaymentsHref

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="mt-2 text-sm font-medium text-slate-500">
          Consultando estado del pago...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertCircle className="h-8 w-8" />
          </div>

          <h1 className="text-2xl font-bold text-slate-800">
            No se pudo validar el pago
          </h1>

          <p className="mt-2 text-sm text-slate-500">{error}</p>

          <Link
            href={viewPaymentsHref}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-medium text-white shadow-md shadow-blue-600/10 transition-all hover:bg-blue-700"
          >
            Ir a mis pagos
          </Link>
        </div>
      </div>
    )
  }

  const status = payment?.status || "processing"

  const isPaid = status === "paid"
  const isPending = status === "pending" || status === "processing"
  const isFailed = status === "failed"

  const displayJobId = payment?.jobId || jobId || collectionId || "Sin identificar"
  const displayAmount = Number(payment?.amount || amountFromUrl || 0)

  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center bg-slate-50 p-4 antialiased">
      
      <style jsx global>{`
        aside, [class*="sidebar"], nav {
          pointer-events: none !important;
          opacity: 0.6 !important;
        }
      `}</style>

      <div
        id="receipt-print-area"
        className="flex w-full max-w-md flex-col items-center rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-xl"
      >
        {isPaid && (
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-500">
            <CheckCircle2 className="h-10 w-10 stroke-[1.5]" />
          </div>
        )}

        {isPending && (
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-amber-100 bg-amber-50 text-amber-500">
            <Clock className="h-10 w-10 stroke-[1.5]" />
          </div>
        )}

        {isFailed && (
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-500">
            <AlertCircle className="h-10 w-10 stroke-[1.5]" />
          </div>
        )}

        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
          {isPaid && "¡Pago recibido!"}
          {isPending && "Pago en proceso"}
          {isFailed && "Pago no acreditado"}
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          {isPaid && "El pago fue confirmado correctamente por FixNow."}
          {isPending &&
            "Mercado Pago todavía está procesando la operación. Podés volver a revisar en unos instantes."}
          {isFailed &&
            "No pudimos acreditar este pago. Podés volver a intentarlo desde la pantalla de pagos."}
        </p>

        <div className="my-5 w-full border-b border-dashed border-slate-200" />

        <div className="w-full space-y-3.5 rounded-xl border border-slate-100 bg-slate-50 p-5 text-left">
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-slate-400">Trabajo:</span>
            <span className="font-semibold text-slate-700">
              #{String(displayJobId).slice(-10)}
            </span>
          </div>

          {payment?.mpPaymentId && (
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-slate-400">Pago MP:</span>
              <span className="font-semibold text-slate-700">
                #{payment.mpPaymentId}
              </span>
            </div>
          )}

          <div className="flex justify-between gap-4 text-sm">
            <span className="text-slate-400">Detalle:</span>
            <span className="font-semibold text-slate-700">
              Servicio FixNow
            </span>
          </div>

          <div className="flex justify-between gap-4 text-sm">
            <span className="text-slate-400">Estado:</span>
            <span
              className={
                isPaid
                  ? "rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600"
                  : isPending
                    ? "rounded-full border border-amber-100 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600"
                    : "rounded-full border border-red-100 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600"
              }
            >
              {isPaid && "Acreditado"}
              {isPending && "Procesando"}
              {isFailed && "Fallido"}
            </span>
          </div>

          <div className="my-1 w-full border-b border-slate-200/60" />

          <div className="flex items-baseline justify-between pt-1">
            <span className="text-sm font-medium text-slate-500">
              Monto:
            </span>
            <span className="text-2xl font-black text-slate-800">
              ${displayAmount.toLocaleString("es-AR")}
            </span>
          </div>
        </div>

        {isPaid && (
          <button
            onClick={handleDownloadPDF}
            className="group mt-4 flex cursor-pointer items-center gap-2 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700 print:hidden"
          >
            <Download className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
            Descargar comprobante
          </button>
        )}
      </div>

      <div className="mt-6 flex w-full max-w-md flex-col gap-3 print:hidden">
        <Link
          href={backToClientAppHref}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-medium text-white shadow-md transition-all hover:bg-slate-800"
        >
          <Smartphone className="h-4 w-4" />
          Volver a Cliente App
        </Link>

        <Link
          href={viewPaymentsHref}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-medium text-white shadow-md shadow-blue-600/10 transition-all hover:bg-blue-700"
        >
          <Receipt className="h-4 w-4" />
          Ver mis pagos
        </Link>

        {isFailed && (
          <Link
            href={retryPaymentHref}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-medium text-white transition-all hover:bg-red-700"
          >
            Reintentar pago
          </Link>
        )}

        <Link
          href={viewSummaryHref}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 transition-all hover:bg-slate-50"
        >
          <Landmark className="h-4 w-4" />
          Ver mi resumen
        </Link>
      </div>
    </div>
  )
}