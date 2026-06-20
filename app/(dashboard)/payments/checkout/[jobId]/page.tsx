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
          setAmountFromDb(0)
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

        const rawAmount = data.amount ?? data.payment?.amount
        const amount = Number(rawAmount)

        if (Number.isFinite(amount) && amount > 0) {
          setAmountFromDb(amount)
        } else if (
          Number.isFinite(parsedAmountFromUrl) &&
          parsedAmountFromUrl > 0
        ) {
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

      if (contentType.includes("application/json"))