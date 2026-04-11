import type { PolicyResult } from '@/engine/types'
import { UpgradeNote } from './UpgradeNote'

interface TokenStorageFieldProps {
  storage: PolicyResult['tokenStorage']
}

export function TokenStorageField({ storage }: TokenStorageFieldProps) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] font-medium uppercase tracking-label text-muted-foreground">
        Token storage
      </span>
      <p className="text-base font-semibold text-foreground mt-0.5">{storage.recommendation}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{storage.rationale}</p>
      <UpgradeNote note={storage.upgradeNote} />
    </div>
  )
}
