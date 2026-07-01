import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",

  // Endpoints públicos para integración con Rider, Driver, Analytics y Mercado Pago
  "/api(.*)",

  // Flujo externo de pago
  "/payments/checkout(.*)",
  "/payments/success(.*)",

  // Entorno de prueba
  "/dev/payments(.*)",
])

function isExternalPaymentsPanel(req: Request) {
  const url = new URL(req.url)

  const pathname = url.pathname
  const params = url.searchParams

  const isResumenOrPayments = pathname === "/" || pathname === "/payments"

  if (!isResumenOrPayments) {
    return false
  }

  const role = params.get("role")?.toLowerCase()

  const clientId = params.get("client_id") || params.get("clientId")

  const professionalId =
    params.get("professional_id") || params.get("professionalId")

  const isRider = role === "rider" && Boolean(clientId)
  const isDriver = role === "driver" && Boolean(professionalId)

  return isRider || isDriver
}

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req) || isExternalPaymentsPanel(req)) {
    return
  }

  await auth.protect()
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}