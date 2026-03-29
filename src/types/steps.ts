import type { PolicyInputs } from '@/engine/types'

export type { PolicyInputs }

export interface StepOption {
  value: string
  label: string
  description: string
  inlineDescription?: string
}

export interface StepConfig {
  id: keyof PolicyInputs
  label: string
  question: string
  tooltip: string
  options: StepOption[]
  skippable: (inputs: PolicyInputs) => boolean
  skipReason: string
}
