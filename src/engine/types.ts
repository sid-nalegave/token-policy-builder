// ── Input types ────────────────────────────────────────────────────────────

export type AppType = 'spa' | 'server' | 'mobile' | 'm2m'
export type UserPopulation = 'employees' | 'consumers' | 'partners'
export type SensitivityTier = 'low' | 'medium' | 'high'
export type ComplianceFramework =
  | 'none'
  | 'soc2'
  | 'hipaa'
  | 'fedramp-moderate'
  | 'fedramp-high'
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

// ── Output types ───────────────────────────────────────────────────────────

/**
 * A numeric policy field with its recommended value, rationale, and the
 * standards-grounded lower bound. Every numeric recommendation must trace
 * to a specific clause or be labeled community practice (CLAUDE.md).
 */
export interface NumericRecommendation {
  /** Recommended value in minutes */
  value: number
  /** Why this value was chosen — cites standard clause or community practice */
  rationale: string
  /** Standards floor annotation — exact clause, or "No specific value mandated" */
  standardsFloor: string
  /** Optional upgrade note suggesting a stronger control for this field */
  upgradeNote?: string
}

export type RefreshTokenRotation = 'required' | 'recommended' | 'not-applicable'

export interface PolicyWarning {
  id: string
  message: string
}

export interface PolicyCitation {
  /** Output field this citation applies to */
  field: string
  standard: string
  clause?: string
  /** One sentence connecting the standard to the recommendation */
  note: string
}

export interface PolicyResult {
  accessTokenLifetime: NumericRecommendation

  /**
   * null for M2M — RFC 6749 §4.4.3 permits but does not require refresh tokens
   * for the client credentials grant. M2M clients re-authenticate directly;
   * refresh tokens add attack surface without benefit.
   */
  refreshTokenLifetime: NumericRecommendation | null

  refreshTokenRotation: {
    value: RefreshTokenRotation
    rationale: string
    standardsFloor: string
  }

  /** null for M2M — no user session exists */
  absoluteSessionLimit: NumericRecommendation | null

  /** null for M2M */
  idleTimeoutIdp: NumericRecommendation | null

  /** null for M2M */
  idleTimeoutApp: NumericRecommendation | null

  tokenStorage: {
    recommendation: string
    rationale: string
    upgradeNote?: string
  }

  /** IdP session policy re-auth triggers. Empty for M2M. */
  reAuthTriggersIdp: string[]

  /** Application layer re-auth triggers. Empty for M2M. */
  reAuthTriggersApp: string[]

  warnings: PolicyWarning[]
  citations: PolicyCitation[]

  /**
   * Rendered at the bottom of the result card. First paragraph is always the
   * standard boilerplate. Additional paragraphs are appended for universal
   * advisories that apply regardless of input (e.g. token revocation).
   */
  disclaimer: string[]
}
