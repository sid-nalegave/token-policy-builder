import { Pencil } from 'lucide-react'
import type { PolicyInputs } from '@/engine/types'

interface InputSummaryProps {
  inputs: PolicyInputs
  onEdit: () => void
}

const APP_TYPE: Record<string, string> = {
  spa: 'SPA',
  server: 'Server',
  mobile: 'Mobile',
  m2m: 'M2M',
}

const POPULATION: Record<string, string> = {
  employees: 'Employees',
  consumers: 'Consumers',
  partners: 'Partners',
}

const SENSITIVITY: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

const COMPLIANCE: Record<string, string> = {
  none: 'None',
  soc2: 'SOC 2',
  hipaa: 'HIPAA',
  'fedramp-moderate': 'FedRAMP Mod',
  'fedramp-high': 'FedRAMP High',
}

const BINDING: Record<string, string> = {
  none: 'None',
  dpop: 'DPoP',
  mtls: 'mTLS',
}

interface Cell {
  label: string
  value: string
}

function SummaryCell({ label, value }: Cell) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-medium uppercase tracking-label text-muted-foreground/40">
        {label}
      </span>
      <span className="text-xs font-mono font-medium text-foreground/80">
        {value}
      </span>
    </div>
  )
}

export function InputSummary({ inputs, onEdit }: InputSummaryProps) {
  const isM2M = inputs.appType === 'm2m'

  const cells: Cell[] = [
    inputs.appType
      ? { label: 'App type', value: APP_TYPE[inputs.appType] }
      : null,
    !isM2M && inputs.userPopulation
      ? { label: 'Population', value: POPULATION[inputs.userPopulation] }
      : null,
    inputs.sensitivityTier
      ? { label: 'Sensitivity', value: SENSITIVITY[inputs.sensitivityTier] }
      : null,
    inputs.complianceFramework
      ? { label: 'Framework', value: COMPLIANCE[inputs.complianceFramework] }
      : null,
    !isM2M && inputs.refreshTokenUsage
      ? { label: 'Refresh tokens', value: inputs.refreshTokenUsage === 'yes' ? 'Yes' : 'No' }
      : null,
    inputs.tokenBinding
      ? { label: 'Binding', value: BINDING[inputs.tokenBinding] }
      : null,
  ].filter((c): c is Cell => c !== null)

  return (
    <div className="rounded-lg border border-border bg-secondary/60 px-4 py-3">
      {/* Mobile: 3-col grid */}
      <div className="grid grid-cols-3 gap-x-2 gap-y-3 md:hidden">
        {cells.map((cell) => (
          <SummaryCell key={cell.label} label={cell.label} value={cell.value} />
        ))}
      </div>

      {/* Desktop: single row with dividers + Edit button */}
      <div className="hidden md:flex md:items-center md:justify-between md:gap-4">
        <div className="flex items-stretch gap-0">
          {cells.map((cell, i) => (
            <div key={cell.label} className="flex items-stretch">
              {i > 0 && <div className="w-px bg-border mx-1 self-stretch" />}
              <div className={i === 0 ? 'pr-3' : 'px-3'}>
                <SummaryCell label={cell.label} value={cell.value} />
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 shrink-0 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground/60 hover:text-foreground hover:bg-background transition-colors"
        >
          <Pencil size={11} />
          Edit
        </button>
      </div>

      {/* Mobile: Edit button below grid */}
      <div className="mt-3 pt-2 border-t border-border md:hidden">
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/60 hover:text-foreground transition-colors"
        >
          <Pencil size={11} />
          Edit inputs
        </button>
      </div>
    </div>
  )
}
