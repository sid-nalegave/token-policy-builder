import { AlertTriangle } from 'lucide-react'
import type { PolicyWarning } from '@/engine/types'

interface PolicyWarningBannerProps {
  warnings: PolicyWarning[]
}

export function PolicyWarningBanner({ warnings }: PolicyWarningBannerProps) {
  const conditional = warnings.filter((w) => w.kind === 'conditional')
  const advisory = warnings.filter((w) => w.kind === 'advisory')

  if (conditional.length === 0 && advisory.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      {conditional.length > 0 && (
        <div className="rounded-lg border border-warning-border bg-warning p-4">
          <div className="flex gap-3 items-start">
            <AlertTriangle size={16} className="text-warning-text shrink-0 mt-0.5" />
            <div className="flex flex-col gap-2">
              {conditional.map((w) => (
                <p key={w.id} className="text-sm text-warning-text leading-relaxed">
                  {w.message}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
      {advisory.length > 0 && (
        <div className="flex flex-col gap-1.5 px-1">
          {advisory.map((w) => (
            <p key={w.id} className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-muted-foreground/80 uppercase tracking-label text-[10px] mr-1.5">
                General advisory
              </span>
              {w.message}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
