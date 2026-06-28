"use client"

import { useSearchParams } from "next/navigation"

export function SidebarUser() {
  const searchParams = useSearchParams()

  const role = searchParams.get("role")?.toLowerCase()
  const clientId =
    searchParams.get("client_id") || searchParams.get("clientId")
  const professionalId =
    searchParams.get("professional_id") || searchParams.get("professionalId")

  const isRider = role === "rider" || Boolean(clientId)

  const displayName = isRider ? "Cliente FixNow" : "Profesional FixNow"

  const displayEmail = isRider
    ? clientId || "anonymous_client"
    : professionalId || "anonymous_professional"

  return (
    <div className="border-t border-border p-4">
      <div className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
          {isRider ? "C" : "P"}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {displayEmail}
          </p>
        </div>
      </div>
    </div>
  )
}