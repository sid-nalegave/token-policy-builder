export type AppType = 'spa' | 'server' | 'mobile' | 'm2m'
export type UserPopulation = 'employees' | 'consumers' | 'partners'
export type SensitivityTier = 'low' | 'medium' | 'high'
export type ComplianceFramework = 'none' | 'soc2' | 'hipaa' | 'fedramp-moderate' | 'fedramp-high'
export type RefreshTokenUsage = 'yes' | 'no'
export type IdleSessionBehavior = 'sliding' | 'fixed'
export type TokenBinding = 'none' | 'dpop' | 'mtls'

export interface PolicyInputs {
  appType?: AppType
  userPopulation?: UserPopulation
  sensitivityTier?: SensitivityTier
  complianceFramework?: ComplianceFramework
  refreshTokenUsage?: RefreshTokenUsage
  idleBehavior?: IdleSessionBehavior
  tokenBinding?: TokenBinding
}

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
