import { NextResponse } from "next/server"

export function isValidServiceRequest(request: Request) {
  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false
  }

  const token = authHeader.replace("Bearer ", "").trim()

  const expectedToken =
    process.env.INTERNAL_API_SECRET ||
    process.env.INTERNAL_API_SECET_KEY

  return Boolean(expectedToken && token === expectedToken)
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Unauthorized. Service token inválido o ausente." },
    { status: 401 }
  )
}