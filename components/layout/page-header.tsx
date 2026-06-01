import { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  subtitle?: string
  children?: ReactNode 
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5 border-border">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          {title}
        </h1>
       
        {subtitle && (
          <p className="mt-1 text-lg text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {children && (
        <div className="flex items-center gap-3 shrink-0">
          {children}
        </div>
      )}
    </div>
  )
}