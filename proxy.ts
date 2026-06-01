import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

// protege ABSOLUTAMENTE TODO el entorno visual,
// excepto las páginas de login/registro y cualquier endpoint de la carpeta api.
const isProtectedRoute = createRouteMatcher([
  "/((?!sign-in|sign-up|api).*)",
])

export default clerkMiddleware(async (auth, req) => {
  // Si la ruta matchea con la protección (ej: /payments, /wallet, /reports),
  // Clerk frena en seco a los usuarios que no iniciaron sesión.
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
}