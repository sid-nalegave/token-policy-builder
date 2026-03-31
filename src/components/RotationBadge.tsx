import type { PolicyResult } from '@/engine/types'

interface RotationBadgeProps {
  rotation: PolicyResult['refreshTokenRotation']
}

const badgeClasses: Record<string, string> = {
  required: 'bg-primary text-primary-foreground',
  recommended: 'bg-accent text-accent-foreground',
  'not-applicable': 'bg-muted text-muted-foreground',
}

const badgeLabel: Record<string, string> = {
  required: 'Required',
  recommended: 'Recommended',
  'not-applicable': 'Not applicable',
}

export function RotationBadge({ rotation }: RotationBadgeProps) {
  const isNA = rotation.value === 'not-applicable'
  return (
    <div className="flex flex-col">
      <span className="text-[11px] font-medium uppercase tracking-label text-muted-foreground">
        Refresh token rotation
      </span>
      <div className="mt-1">
        <span
          className={`inline-block rounded-pill px-2 py-0.5 text-xs font-medium ${badgeClasses[rotation.value]}`}
        >
          {badgeLabel[rotation.value]}
        </span>
      </div>
      {!isNA && (
        <>
          <p className="text-sm text-muted-foreground mt-1">{rotation.rationale}</p>
          <p className="text-xs text-muted-foreground/70 mt-1 font-mono">
            {rotation.standardsFloor}
          </p>
        </>
      )}
    </div>
  )
}
