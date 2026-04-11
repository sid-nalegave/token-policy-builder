import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { PolicyCitation } from '@/engine/types'

interface FieldCitationsProps {
  citations: PolicyCitation[]
}

export function FieldCitations({ citations }: FieldCitationsProps) {
  const [open, setOpen] = useState(false)

  if (citations.length === 0) return null

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="font-mono uppercase tracking-label">Standards references ({citations.length})</span>
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>
      {open && (
        <dl className="mt-1.5 pl-1 border-l border-border">
          {citations.map((c, i) => (
            <div key={i} className="mb-2">
              <dt className="text-xs font-mono font-medium text-foreground">
                {c.standard}{c.clause ? ` ${c.clause}` : ''}
              </dt>
              <dd className="text-xs text-muted-foreground leading-relaxed">{c.note}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
