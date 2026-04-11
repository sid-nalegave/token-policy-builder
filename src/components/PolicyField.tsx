import type { NumericRecommendation } from '@/engine/types'
import { formatMinutes } from '@/lib/formatMinutes'
import { UpgradeNote } from './UpgradeNote'

interface PolicyFieldProps {
  label: string
  field: NumericRecommendation
  dominantDriver?: string
}

export function PolicyField({ label, field, dominantDriver }: PolicyFieldProps) {
  const showDriver = field.driver !== dominantDriver

  return (
    <div className="flex flex-col">
      <span className="text-[11px] font-medium uppercase tracking-label text-muted-foreground">
        {label}
      </span>
      <span className="text-2xl font-semibold tracking-display text-foreground mt-0.5">
        {formatMinutes(field.value)}
      </span>
      {showDriver && (
        <span className="text-xs text-muted-foreground mt-0.5">{field.driver}</span>
      )}
      <UpgradeNote note={field.upgradeNote} />
    </div>
  )
}
