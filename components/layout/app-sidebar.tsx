"use client"

import { SidebarUser } from "@/components/layout/sidebar-user"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useSearchParams } from "next/navigation"
import { CreditCard, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"

const MOCK_MODE = true
const DEV_PROFESSIONAL_ID = "anonymous_professional"
const DEV_CLIENT_ID = "anonymous_client"

const navItems = [
  { href: "/", label: "Resumen", icon: LayoutDashboard },
  { href: "/payments", label: "Pagos", icon: CreditCard },
]

interface AppSidebarProps {
  forcedRole?: string
}

export function AppSidebar({ forcedRole }: AppSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const clientId = searchParams.get("client_id") || searchParams.get("clientId")
  const professionalId =
    searchParams.get("professional_id") || searchParams.get("professionalId")
  const urlRole = searchParams.get("role")?.toLowerCase()

  const inferredRole = clientId
    ? "rider"
    : professionalId
      ? "driver"
      : undefined

  const role = (urlRole || inferredRole || forcedRole || "driver").toLowerCase()

  function buildHref(href: string) {
    const params = new URLSearchParams()
    params.set("role", role)

    if (role === "rider") {
      const activeClientId = clientId || (MOCK_MODE ? DEV_CLIENT_ID : "")
      if (activeClientId) params.set("client_id", activeClientId)
    } else {
      const activeProfId =
        professionalId || (MOCK_MODE ? DEV_PROFESSIONAL_ID : "")
      if (activeProfId) params.set("professional_id", activeProfId)
    }

    return `${href}?${params.toString()}`
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <Image
          src="/images/logo-fixnow-sfondo.jpeg"
          alt="Logo FixNow"
          width={32}
          height={32}
          className="rounded-lg"
        />

        <div className="min-w-0">
          <span className="block font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
            FixNow
          </span>

          <span className="block text-xs text-muted-foreground">
            Payments App
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon

          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={buildHref(item.href)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          )
        })}

        
      </nav>

      <SidebarUser />
    </aside>
  )
}