import { AlertTriangle, Info } from 'lucide-react'
import type { PolicyWarning } from '@/engine/types'

interface PolicyWarningBannerProps {
  warnings: PolicyWarning[]
}

const WARNING_TITLES: Record<string, string> = {
  'spa-fedramp-high': 'FedRAMP High requires server-side session management',
  'spa-refresh-no-bff': 'SPA refresh token exposure',
  'spa-high-no-binding': 'Bearer token theft risk',
  'mobile-token-refresh': 'Mobile token refresh reliability',
  'm2m-hipaa': 'HIPAA applies to M2M access',
  'high-no-absolute': 'Idle timeout insufficient alone',
  'consumer-rt-30d': 'Long-lived consumer refresh tokens',
  'idle-exceeds-absolute': 'Idle timeout exceeds session limit',
}

export function PolicyWarningBanner({ warnings }: PolicyWarningBannerProps) {
  if (warnings.length === 0) return null

  const conditional = warnings.filter((w) => w.kind === 'conditional')
  const advisory = warnings.filter((w) => w.kind === 'advisory')

  return (
    <div className="flex flex-col gap-2">
      {conditional.map((w) => (
        <div key={w.id} className="rounded-lg border border-warning-border bg-warning p-4">
          <div className="flex gap-3 items-start">
            <AlertTriangle size={15} className="text-warning-text shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-warning-text">
                {WARNING_TITLES[w.id] ?? w.id}
              </p>
              <p className="text-sm text-warning-text leading-relaxed mt-0.5">{w.message}</p>
            </div>
          </div>
        </div>
      ))}
      {advisory.map((w) => (
        <div key={w.id} className="rounded-lg border border-border bg-card p-3">
          <div className="flex gap-3 items-start">
            <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground">
                {WARNING_TITLES[w.id] ?? w.id}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{w.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
