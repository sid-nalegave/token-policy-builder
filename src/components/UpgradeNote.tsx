import { Lightbulb } from 'lucide-react'

interface UpgradeNoteProps {
  note: string | undefined
}

export function UpgradeNote({ note }: UpgradeNoteProps) {
  if (!note) return null
  return (
    <div className="rounded-md border border-upgrade-border bg-upgrade p-2.5 mt-2 flex gap-2 items-start">
      <Lightbulb size={12} className="text-upgrade-text shrink-0 mt-0.5" />
      <p className="text-xs text-upgrade-text leading-relaxed">{note}</p>
    </div>
  )
}
