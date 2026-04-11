import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { PolicyCitation } from '@/engine/types'

interface CitationsPanelProps {
  citations: PolicyCitation[]
}

const FIELD_LABELS: Record<string, string> = {
  accessTokenLifetime: 'Access token lifetime',
  refreshTokenLifetime: 'Refresh token lifetime',
  refreshTokenRotation: 'Refresh token rotation',
  absoluteSessionLimit: 'Absolute session limit',
  idleTimeoutIdp: 'Idle timeout — IdP',
  idleTimeoutApp: 'Idle timeout — application',
  tokenStorage: 'Token storage',
  tokenBinding: 'Token binding',
  complianceNote: 'Compliance note',
}

export function CitationsPanel({ citations }: CitationsPanelProps) {
  const [openFields, setOpenFields] = useState<Set<string>>(new Set())

  // Group by field, preserving insertion order
  const groups = citations.reduce<Map<string, PolicyCitation[]>>((acc, c) => {
    const existing = acc.get(c.field)
    if (existing) {
      existing.push(c)
    } else {
      acc.set(c.field, [c])
    }
    return acc
  }, new Map())

  const toggle = (field: string) => {
    setOpenFields((prev) => {
      const next = new Set(prev)
      if (next.has(field)) {
        next.delete(field)
      } else {
        next.add(field)
      }
      return next
    })
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {Array.from(groups.entries()).map(([field, items]) => {
        const isOpen = openFields.has(field)
        const label = FIELD_LABELS[field] ?? field
        return (
          <div key={field} className="py-2">
            <button
              type="button"
              onClick={() => toggle(field)}
              className="flex w-full items-center justify-between gap-2 py-1 text-left"
            >
              <span className="text-[11px] uppercase tracking-label text-muted-foreground">
                {label}
              </span>
              {isOpen ? (
                <ChevronUp size={12} className="shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown size={12} className="shrink-0 text-muted-foreground" />
              )}
            </button>
            {isOpen && (
              <dl className="mt-1.5 pl-1">
                {items.map((c, i) => (
                  <div key={i} className="mb-2">
                    <dt className="text-xs font-mono font-medium text-foreground">
                      {c.standard}
                      {c.clause ? ` ${c.clause}` : ''}
                    </dt>
                    <dd className="text-xs text-muted-foreground leading-relaxed">{c.note}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )
      })}
    </div>
  )
}
