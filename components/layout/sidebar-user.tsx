"use client"

import { UserButton, useUser } from "@clerk/nextjs"

export function SidebarUser() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <div className="border-t border-border p-4">
        <div className="h-10 rounded-lg bg-muted" />
      </div>
    )
  }

  return (
    <div className="border-t border-border p-4">
      <div className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5">
        <UserButton />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {user?.fullName ?? "Usuario FixNow"}
          </p>

          <p className="truncate text-xs text-muted-foreground">
            {user?.primaryEmailAddress?.emailAddress ?? "Sin email"}
          </p>
        </div>
      </div>
    </div>
  )
}