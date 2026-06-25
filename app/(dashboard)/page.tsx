export const dynamic = "force-dynamic"

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-6">
      <section className="max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center shadow-xl">
        <h1 className="text-3xl font-bold mb-4">FixNow Payments</h1>

        <p className="text-slate-300 mb-6">
          Servicio de pagos activo para la integración entre Rider, Driver y
          Mercado Pago.
        </p>

        <div className="rounded-xl bg-slate-800 p-4 text-left text-sm text-slate-300">
          <p>
            <strong>Crear pago:</strong> POST /api/payments
          </p>
          <p>
            <strong>Consultar pago:</strong> GET /api/payments/jobs/:job_id
          </p>
          <p>
            <strong>Checkout:</strong> POST /api/payments/checkout
          </p>
          <p>
            <strong>Webhook:</strong> POST /api/payments/webhook
          </p>
        </div>
      </section>
    </main>
  )
}