import type {
  AppType,
  UserPopulation,
  SensitivityTier,
  ComplianceFramework,
  PolicyInputs,
  PolicyResult,
  PolicyWarning,
  PolicyCitation,
  NumericRecommendation,
} from './types'

// ── Lookup tables ───────────────────────────────────────────────────────────

const AT_BASE: Record<AppType, number> = { spa: 30, server: 60, mobile: 30, m2m: 60 }
const AT_SENSITIVITY_CAP: Record<SensitivityTier, number> = { low: 60, medium: 30, high: 15 }
const AT_COMPLIANCE_CAP: Partial<Record<ComplianceFramework, number>> = {
  'fedramp-moderate': 30,
  'fedramp-high': 15,
}

const RT_BASE: Record<AppType, number> = { spa: 1440, server: 10080, mobile: 20160, m2m: 0 }
const RT_SENSITIVITY_CAP: Record<SensitivityTier, number> = { low: 43200, medium: 10080, high: 480 }
const RT_COMPLIANCE_CAP: Partial<Record<ComplianceFramework, number>> = {
  hipaa: 720,
  'fedramp-moderate': 1440,
  'fedramp-high': 720,
}
const RT_POPULATION_CAP: Partial<Record<UserPopulation, number>> = {
  consumers: 43200,
  partners: 1440,
}

const ABS_SESSION_SENSITIVITY: Record<SensitivityTier, number> = { low: 1440, medium: 720, high: 480 }
const ABS_SESSION_COMPLIANCE: Partial<Record<ComplianceFramework, number>> = {
  hipaa: 480,
  'fedramp-moderate': 720,
  'fedramp-high': 720,
}

const IDLE_SENSITIVITY: Record<SensitivityTier, number> = { low: 60, medium: 30, high: 15 }
const IDLE_COMPLIANCE: Partial<Record<ComplianceFramework, number>> = {
  hipaa: 15,
  'fedramp-moderate': 30,
  'fedramp-high': 15,
}

// ── bindingMin helper ───────────────────────────────────────────────────────

// Returns [value, bindingLabel] for the minimum candidate.
// When tied, the FIRST candidate in the array wins — callers must order candidates
// from least to most specific: [base, population, sensitivity, compliance].
// Ties resolve to the less specific constraint, which is the more intuitive label
// (e.g. server+low+none shows "Server confidential client baseline", not "Low sensitivity").
function bindingMin(candidates: Array<[number, string]>): [number, string] {
  let result = candidates[0]
  for (const c of candidates) {
    if (c[0] < result[0]) result = c
  }
  return result
}

// ── Binding constraint label map ────────────────────────────────────────────

const APP_TYPE_BASE_LABEL: Record<AppType, string> = {
  spa: 'SPA public client baseline',
  server: 'Server confidential client baseline',
  mobile: 'Mobile public client baseline',
  m2m: 'M2M confidential client baseline',
}

const SENSITIVITY_LABEL: Record<SensitivityTier, string> = {
  low: 'Low sensitivity',
  medium: 'Medium sensitivity',
  high: 'High sensitivity',
}

const COMPLIANCE_LABEL: Partial<Record<ComplianceFramework, string>> = {
  hipaa: 'HIPAA community practice',
  'fedramp-moderate': 'FedRAMP Moderate compliance controls',
  'fedramp-high': 'FedRAMP High compliance controls',
}

const POPULATION_LABEL: Partial<Record<UserPopulation, string>> = {
  consumers: 'Consumer population boundary',
  partners: 'Partner population boundary',
}

// ── Numeric field computations ──────────────────────────────────────────────

function computeAccessTokenLifetime(inputs: PolicyInputs): NumericRecommendation {
  const appType = inputs.appType ?? 'server'
  const sensitivityTier = inputs.sensitivityTier ?? 'low'
  const complianceFramework = inputs.complianceFramework ?? 'none'

  const candidates: Array<[number, string]> = [
    [AT_BASE[appType], APP_TYPE_BASE_LABEL[appType]],
    [AT_SENSITIVITY_CAP[sensitivityTier], SENSITIVITY_LABEL[sensitivityTier]],
  ]
  const complianceCap = AT_COMPLIANCE_CAP[complianceFramework]
  if (complianceCap !== undefined) {
    candidates.push([complianceCap, COMPLIANCE_LABEL[complianceFramework]!])
  }

  const [value, rawLabel] = bindingMin(candidates)
  // Post-check: if compliance is active and its cap matches the result, name compliance.
  // Preserves < tie-breaking for cases with no active compliance (e.g. server+low+none)
  // while ensuring a selected compliance framework is named when it determines the value.
  const label =
    complianceCap !== undefined && complianceCap === value
      ? COMPLIANCE_LABEL[complianceFramework]!
      : rawLabel

  let upgradeNote: string | undefined
  if (inputs.tokenBinding === 'none') {
    if (appType === 'm2m') {
      upgradeNote = 'mTLS (RFC 8705) would bind tokens to the client certificate for this M2M flow.'
    } else if (sensitivityTier !== 'low') {
      upgradeNote =
        'Consider DPoP sender-constraining (RFC 9449) to reduce post-theft exposure without shortening token lifetime.'
    }
  }

  return {
    value,
    rationale: `${label} drives this value.`,
    standardsFloor:
      'No specific value mandated. RFC 9700 §4.14.2 recommends short-lived access tokens combined with refresh tokens.',
    upgradeNote,
  }
}

function computeRefreshTokenLifetime(inputs: PolicyInputs): NumericRecommendation | null {
  const isM2M = inputs.appType === 'm2m'
  if (isM2M || inputs.refreshTokenUsage !== 'yes') return null

  const appType = inputs.appType ?? 'server'
  const sensitivityTier = inputs.sensitivityTier ?? 'low'
  const complianceFramework = inputs.complianceFramework ?? 'none'
  const userPopulation = inputs.userPopulation ?? 'employees'

  const candidates: Array<[number, string]> = [
    [RT_BASE[appType], APP_TYPE_BASE_LABEL[appType]],
  ]
  const populationCap = RT_POPULATION_CAP[userPopulation]
  if (populationCap !== undefined) {
    candidates.push([populationCap, POPULATION_LABEL[userPopulation]!])
  }
  candidates.push([RT_SENSITIVITY_CAP[sensitivityTier], SENSITIVITY_LABEL[sensitivityTier]])
  const complianceCap = RT_COMPLIANCE_CAP[complianceFramework]
  if (complianceCap !== undefined) {
    candidates.push([complianceCap, COMPLIANCE_LABEL[complianceFramework]!])
  }

  const [value, rawLabel] = bindingMin(candidates)
  const label =
    complianceCap !== undefined && complianceCap === value
      ? COMPLIANCE_LABEL[complianceFramework]!
      : rawLabel

  // upgradeNote fires on population='partners' regardless of whether the population cap
  // was the binding constraint. For SPA+partners, RT_BASE['spa']=1440 ties with
  // RT_POPULATION_CAP['partners']=1440 — the partner cap adds no restriction over the base,
  // but the note is still contextually correct: external trust boundary is the reason the
  // value is acceptable at 24h, not just a coincidence of the SPA base. No population
  // post-check equivalent to the compliance post-check is applied here because the cap not
  // binding below the base means it genuinely isn't the constraining factor.
  const upgradeNote =
    userPopulation === 'partners'
      ? 'Partner population boundary drives daily re-authentication. External trust boundaries warrant shorter persistent access windows than internal employees.'
      : undefined

  return {
    value,
    rationale: `${label} drives this value.`,
    standardsFloor:
      'No specific value mandated. RFC 6749 §10.4 recommends limiting refresh token lifetime.',
    upgradeNote,
  }
}

function computeAbsoluteSessionLimit(inputs: PolicyInputs): NumericRecommendation | null {
  if (inputs.appType === 'm2m') return null

  const sensitivityTier = inputs.sensitivityTier ?? 'low'
  const complianceFramework = inputs.complianceFramework ?? 'none'

  const candidates: Array<[number, string]> = [
    [ABS_SESSION_SENSITIVITY[sensitivityTier], SENSITIVITY_LABEL[sensitivityTier]],
  ]
  const complianceCap = ABS_SESSION_COMPLIANCE[complianceFramework]
  if (complianceCap !== undefined) {
    candidates.push([complianceCap, COMPLIANCE_LABEL[complianceFramework]!])
  }

  const [value, rawLabel] = bindingMin(candidates)
  const isComplianceBinding = complianceCap !== undefined && complianceCap === value
  const label = isComplianceBinding ? COMPLIANCE_LABEL[complianceFramework]! : rawLabel

  const sensitivityFloorMap: Record<SensitivityTier, string> = {
    low: 'Community practice. NIST SP 800-63B Rev 4 AAL1: session limit SHALL be established; SHOULD ≤30 days.',
    medium:
      'NIST SP 800-63B Rev 4 AAL2: SHALL establish; SHOULD ≤24h. Recommendation is stricter at 12h — aligned with Rev 3 AAL2 SHALL.',
    high: 'Community practice — stricter than AAL2 24h SHOULD, aligned with AAL3 12h SHALL as a conservative target.',
  }
  // Keyed on ComplianceFramework to avoid silent breakage if COMPLIANCE_LABEL strings change.
  const complianceFloorMap: Partial<Record<ComplianceFramework, string>> = {
    hipaa:
      'Community practice for ePHI access environments. HIPAA §164.312(a)(2)(iii) requires automatic logoff — no specific numeric value mandated.',
    'fedramp-moderate':
      'NIST SP 800-63B Rev 4 AAL2: SHALL establish; SHOULD ≤24h. Recommendation is stricter at 12h — aligned with Rev 3 AAL2 SHALL.',
    'fedramp-high': 'NIST SP 800-63B Rev 4 AAL3: SHALL ≤12h.',
  }
  const standardsFloor =
    (isComplianceBinding ? complianceFloorMap[complianceFramework] : undefined) ??
    sensitivityFloorMap[sensitivityTier]

  return {
    value,
    rationale: `${label} drives this value.`,
    standardsFloor,
  }
}

function computeIdleTimeout(inputs: PolicyInputs): NumericRecommendation | null {
  if (inputs.appType === 'm2m') return null

  const sensitivityTier = inputs.sensitivityTier ?? 'low'
  const complianceFramework = inputs.complianceFramework ?? 'none'

  const candidates: Array<[number, string]> = [
    [IDLE_SENSITIVITY[sensitivityTier], SENSITIVITY_LABEL[sensitivityTier]],
  ]
  const complianceCap = IDLE_COMPLIANCE[complianceFramework]
  if (complianceCap !== undefined) {
    candidates.push([complianceCap, COMPLIANCE_LABEL[complianceFramework]!])
  }

  const [value, rawLabel] = bindingMin(candidates)
  const isComplianceBinding = complianceCap !== undefined && complianceCap === value
  const label = isComplianceBinding ? COMPLIANCE_LABEL[complianceFramework]! : rawLabel

  const sensitivityFloorMap: Record<SensitivityTier, string> = {
    low: 'Community practice. NIST SP 800-63B Rev 4 AAL1: inactivity timeout is optional (MAY).',
    medium:
      'NIST SP 800-63B Rev 4 AAL2: inactivity timeout SHOULD ≤60 min. Recommendation is stricter at 30 min — aligned with Rev 3 AAL2 SHALL 30 min.',
    high: 'NIST SP 800-63B Rev 4 AAL3: inactivity timeout SHOULD ≤15 min.',
  }
  // Keyed on ComplianceFramework to avoid silent breakage if COMPLIANCE_LABEL strings change.
  const complianceFloorMap: Partial<Record<ComplianceFramework, string>> = {
    hipaa:
      'Community practice. HIPAA §164.312(a)(2)(iii) automatic logoff is addressable — no specific numeric value mandated. 15 min is industry standard for clinical environments.',
    'fedramp-moderate':
      'NIST SP 800-63B Rev 4 AAL2: inactivity timeout SHOULD ≤60 min. SC-10 mandates inactivity disconnect — 30 min aligned with NIST Rev 3 AAL2 SHALL 30 min.',
    'fedramp-high':
      'NIST SP 800-63B Rev 4 AAL3: inactivity timeout SHOULD ≤15 min. SC-10 FedRAMP High: 15 min for user sessions.',
  }

  return {
    value,
    rationale: `${label} drives this value.`,
    standardsFloor:
      (isComplianceBinding ? complianceFloorMap[complianceFramework] : undefined) ??
      sensitivityFloorMap[sensitivityTier],
  }
}

// ── Warning detection ───────────────────────────────────────────────────────

function detectWarnings(inputs: PolicyInputs): PolicyWarning[] {
  const warnings: PolicyWarning[] = []
  const {
    appType,
    complianceFramework,
    refreshTokenUsage,
    sensitivityTier,
    tokenBinding,
    idleBehavior,
  } = inputs

  // SPA + FedRAMP High
  // SC-10, SC-23, AC-12 require server-enforced session management
  if (appType === 'spa' && complianceFramework === 'fedramp-high') {
    warnings.push({
      id: 'spa-fedramp-high',
      kind: 'conditional',
      message:
        'FedRAMP High controls SC-10, SC-23, and AC-12 require server-enforced session management, server-side session identifier generation, and demonstrable session termination. Client-side token deletion is insufficient — the token remains valid server-side. Adopt a Backend for Frontend (BFF) pattern. FedRAMP-authorized SPA products (Okta, Salesforce) all use server-side session backends.',
    })
  }

  // SPA + refresh tokens
  // BFF not configured is implied — no BFF input exists; the warning advises adoption
  if (appType === 'spa' && refreshTokenUsage === 'yes') {
    warnings.push({
      id: 'spa-refresh-no-bff',
      kind: 'conditional',
      message:
        'Refresh tokens in browser-accessible storage are vulnerable to XSS exfiltration. Rotation alone is insufficient — a persistent attacker can steal rotated tokens continuously before the application uses them. Primary mitigation: BFF pattern (tokens never reach the browser). If BFF is not feasible: DPoP sender-constraining plus strict CSP.',
    })
  }

  // SPA + high sensitivity + no token binding
  if (appType === 'spa' && sensitivityTier === 'high' && tokenBinding === 'none') {
    warnings.push({
      id: 'spa-high-no-binding',
      kind: 'conditional',
      message:
        'No sender-constraining configured. A stolen bearer token is valid for the full access token lifetime with no way to invalidate it mid-flight. Short access token lifetime and refresh token rotation reduce the window — they do not eliminate the risk. BFF pattern recommended as primary mitigation.',
    })
  }

  // Mobile + sliding window
  // iOS background suspension can interrupt token refresh
  if (appType === 'mobile' && idleBehavior === 'sliding') {
    warnings.push({
      id: 'mobile-sliding-window',
      kind: 'conditional',
      message:
        'iOS aggressively suspends background processes, which can interrupt token refresh and cause unexpected session termination. Validate token refresh behavior against OWASP MASTG and platform-specific guidance before relying on sliding window behavior.',
    })
  }

  // M2M + HIPAA
  // HIPAA §164.312(a)(1) covers automated access to ePHI
  if (appType === 'm2m' && complianceFramework === 'hipaa') {
    warnings.push({
      id: 'm2m-hipaa',
      kind: 'conditional',
      message:
        'HIPAA §164.312(a)(1) covers software programs granted access rights to ePHI — including M2M. BAA requirements under 45 CFR §§164.502(e) and 164.504(e) apply regardless of whether access is human or automated. This tool covers technical token controls only.',
    })
  }

  // High sensitivity + sliding window
  // Sliding window alone is insufficient at high sensitivity — NIST 800-63B requires both
  // inactivity timeout and absolute session limit at AAL2+
  if (sensitivityTier === 'high' && idleBehavior === 'sliding') {
    warnings.push({
      id: 'high-sliding-no-absolute',
      kind: 'conditional',
      message:
        'Idle timeout alone is insufficient at high sensitivity. An attacker with a hijacked session can generate periodic activity to prevent the idle timeout from firing indefinitely. NIST 800-63B Rev 4 mandates an absolute session limit at AAL2 (SHALL) and recommends an inactivity timeout (SHOULD) — both should be applied. Add an absolute session limit.',
    })
  }

  return warnings
}

function detectComputedWarnings(
  inputs: PolicyInputs,
  computed: { rtLifetime: number | null; idleTimeout: number | null; absoluteSession: number | null }
): PolicyWarning[] {
  const warnings: PolicyWarning[] = []

  // Defensive guard: currently unreachable — consumer cap (43200) equals the low sensitivity
  // cap and no RT base exceeds 20160, so rtLifetime can never exceed 43200 with present
  // values. Kept to protect against future table adjustments that could push the computed
  // value past 30 days without anyone noticing.
  if (
    inputs.userPopulation === 'consumers' &&
    computed.rtLifetime !== null &&
    computed.rtLifetime > 43200
  ) {
    warnings.push({
      id: 'consumer-rt-30d',
      kind: 'conditional',
      message:
        'Refresh token lifetime exceeds 30 days for a consumer population. Shared and lost devices increase the risk of unauthorized access. Consider capping refresh token lifetime at 30 days for consumer-facing applications.',
    })
  }

  // Guards against misconfigured sessions. Currently unreachable — for every valid
  // sensitivity+compliance combination, idle timeout is strictly less than the absolute
  // session limit (verified programmatically). Kept as a safety net against future table
  // changes or inputs that produce unexpected combinations.
  if (
    computed.idleTimeout !== null &&
    computed.absoluteSession !== null &&
    computed.idleTimeout > computed.absoluteSession
  ) {
    warnings.push({
      id: 'idle-exceeds-absolute',
      kind: 'conditional',
      message:
        'Idle timeout is longer than the absolute session limit. The absolute session limit will fire before the idle timeout — the idle timeout is effectively unreachable. Reduce the idle timeout to be shorter than the absolute session limit.',
    })
  }

  return warnings
}

// ── Citations assembly ──────────────────────────────────────────────────────

function assembleCitations(inputs: PolicyInputs): PolicyCitation[] {
  const citations: PolicyCitation[] = []
  const isM2M = inputs.appType === 'm2m'
  const usesRefreshTokens = inputs.refreshTokenUsage === 'yes' && !isM2M

  // Access token lifetime — always cited
  citations.push({
    field: 'accessTokenLifetime',
    standard: 'RFC 9700',
    clause: '§4.14.2',
    note: 'Short-lived access tokens combined with refresh tokens. No specific numeric value mandated — recommendation reflects community practice by app type, sensitivity, and compliance framework.',
  })
  citations.push({
    field: 'accessTokenLifetime',
    standard: 'RFC 9068',
    note: 'JWT access token profile. Access token lifetime is set by the authorization server; this tool recommends values consistent with the short-lived access token pattern.',
  })

  // Refresh token lifetime and rotation
  if (usesRefreshTokens) {
    citations.push({
      field: 'refreshTokenLifetime',
      standard: 'RFC 6749',
      clause: '§10.4',
      note: 'Refresh token lifetime should be limited. Recommendation reflects minimum of app-type base, sensitivity cap, compliance cap, and user population cap.',
    })
    citations.push({
      field: 'refreshTokenRotation',
      standard: 'RFC 9700',
      clause: '§2.2.2',
      note: 'Public clients MUST use refresh token rotation OR sender-constraining. Confidential clients: rotation is additional protection; §2.2.2 does not mandate it.',
    })
  }

  // Session limits — not applicable for M2M
  if (!isM2M) {
    citations.push({
      field: 'absoluteSessionLimit',
      standard: 'NIST SP 800-63B Rev 4',
      note: 'AAL2: absolute session limit SHALL be established; SHOULD ≤24h. AAL3: SHALL ≤12h. Recommendation may be stricter — aligned with Rev 3 SHALL values where Rev 4 relaxed to SHOULD.',
    })
    citations.push({
      field: 'idleTimeoutIdp',
      standard: 'NIST SP 800-63B Rev 4',
      note: 'IdP inactivity timeout must mirror the application-layer value. NIST SP 800-63B Rev 3 §7.2.1: CSP and RP govern sessions independently in federated scenarios.',
    })
    citations.push({
      field: 'idleTimeoutApp',
      standard: 'NIST SP 800-63B Rev 4',
      note: 'AAL2: inactivity timeout SHOULD ≤60 min. AAL3: SHOULD ≤15 min. Application layer must enforce independently from the IdP.',
    })
  }

  // Token storage — varies by app type
  if (inputs.appType === 'spa') {
    citations.push({
      field: 'tokenStorage',
      standard: 'draft-ietf-oauth-browser-based-apps-26',
      clause: '§6.1',
      note: 'BFF pattern is the recommended token storage architecture for browser-based apps — tokens never reach the browser. httpOnly cookies are the fallback when BFF is not feasible.',
    })
  } else if (inputs.appType === 'server') {
    citations.push({
      field: 'tokenStorage',
      standard: 'RFC 6749',
      clause: '§10.3',
      note: 'Confidential client — tokens held server-side, never exposed to the browser.',
    })
  } else if (inputs.appType === 'mobile') {
    citations.push({
      field: 'tokenStorage',
      standard: 'RFC 8252',
      clause: '§8.12',
      note: 'Native apps must use platform secure storage. Cross-reference OWASP MASTG for iOS Keychain and Android Keystore implementation guidance.',
    })
  } else if (inputs.appType === 'm2m') {
    citations.push({
      field: 'tokenStorage',
      standard: 'RFC 6749',
      clause: '§4.4',
      note: 'Client credentials — secrets stored server-side in a secrets manager or restricted environment variable store. Never in source code or client-accessible config.',
    })
  }

  // Token binding
  if (inputs.tokenBinding === 'dpop') {
    citations.push({
      field: 'tokenBinding',
      standard: 'RFC 9449',
      clause: '§11.2',
      note: 'DPoP sender-constrains tokens to the client key pair. Without server-issued nonces, DPoP SHOULD NOT be used to extend token lifetime — binding reduces post-theft utility, not the lifetime recommendation.',
    })
  }
  if (inputs.tokenBinding === 'mtls') {
    citations.push({
      field: 'tokenBinding',
      standard: 'RFC 8705',
      note: 'mTLS certificate-bound tokens. Standards are silent on lifetime extension for mTLS-bound tokens — binding reduces post-theft utility but does not change the lifetime recommendation.',
    })
  }

  // FedRAMP ATO version note
  if (
    inputs.complianceFramework === 'fedramp-moderate' ||
    inputs.complianceFramework === 'fedramp-high'
  ) {
    citations.push({
      field: 'complianceNote',
      standard: 'NIST SP 800-63B Rev 4',
      note: 'Recommendations cite NIST SP 800-63B Rev 4 (August 2025). If your ATO references Rev 3, verify — AAL2 idle timeout was 30 minutes (SHALL) under Rev 3, relaxed to 1 hour (SHOULD) in Rev 4.',
    })
  }

  return citations
}

// ── Re-auth triggers ────────────────────────────────────────────────────────

function buildReAuthTriggers(
  inputs: PolicyInputs,
  absoluteSessionLimit: number | null,
  idleTimeout: number | null
): { idp: string[]; app: string[] } {
  if (inputs.appType === 'm2m') {
    return { idp: [], app: [] }
  }

  return {
    idp: [
      `Set max_age to ${absoluteSessionLimit} minutes to enforce the absolute session limit at the IdP.`,
      `Set inactivity timeout to ${idleTimeout} minutes — must match the application-layer idle timeout.`,
    ],
    app: [
      `Redirect to login after ${idleTimeout} minutes of inactivity.`,
      'Step-up re-authentication before sensitive actions — accessing PHI, changing credentials, payment transactions.',
      'Re-authentication on privilege escalation.',
    ],
  }
}

// ── Disclaimer assembly ─────────────────────────────────────────────────────

const BASE_DISCLAIMER =
  'Recommendations are grounded in NIST SP 800-63B Rev 4, RFC 9700, RFC 6749, RFC 9068, and draft-ietf-oauth-browser-based-apps-26 — not a compliance determination or substitute for a security review. Verify against your ATO, organizational requirements, or legal counsel. Standards basis last verified: March 2026.'

function buildDisclaimer(): string[] {
  return [BASE_DISCLAIMER]
}

// ── computePolicy ───────────────────────────────────────────────────────────

export function computePolicy(inputs: PolicyInputs): PolicyResult {
  const isM2M = inputs.appType === 'm2m'
  const usesRefreshTokens = inputs.refreshTokenUsage === 'yes' && !isM2M

  const accessTokenLifetime = computeAccessTokenLifetime(inputs)
  const refreshTokenLifetime = computeRefreshTokenLifetime(inputs)
  const absoluteSessionLimit = computeAbsoluteSessionLimit(inputs)
  const idleTimeout = computeIdleTimeout(inputs)

  // ── Refresh token rotation ──────────────────────────────────────────────
  let refreshTokenRotation: PolicyResult['refreshTokenRotation']

  if (!usesRefreshTokens) {
    refreshTokenRotation = {
      value: 'not-applicable',
      rationale: 'Refresh tokens not in use.',
      standardsFloor: '',
    }
  } else if (inputs.appType === 'spa' || inputs.appType === 'mobile') {
    const binding = inputs.tokenBinding
    const bindingRationale =
      binding === 'dpop'
        ? 'DPoP sender-constraining satisfies RFC 9700 §2.2.2. Rotation adds defense-in-depth.'
        : binding === 'mtls'
        ? 'mTLS sender-constraining satisfies RFC 9700 §2.2.2. Rotation adds defense-in-depth.'
        : null
    refreshTokenRotation = {
      value: bindingRationale ? 'recommended' : 'required',
      rationale:
        bindingRationale ?? 'Rotation required for public clients (RFC 9700 §2.2.2).',
      standardsFloor:
        'RFC 9700 §2.2.2: refresh tokens for public clients MUST be sender-constrained or use rotation.',
    }
  } else {
    // Confidential client (server)
    const sensitivityTier = inputs.sensitivityTier ?? 'low'
    const complianceFramework = inputs.complianceFramework ?? 'none'
    const isHighAssurance =
      sensitivityTier === 'high' ||
      complianceFramework === 'hipaa' ||
      complianceFramework === 'fedramp-moderate' ||
      complianceFramework === 'fedramp-high'
    refreshTokenRotation = {
      value: 'recommended',
      rationale: isHighAssurance
        ? 'Defense-in-depth at high assurance. Community practice in regulated environments.'
        : 'Additional protection — not required by RFC 9700 §2.2.2 for confidential clients.',
      standardsFloor: 'RFC 9700 §2.2.2 does not require rotation for confidential clients.',
    }
  }

  // ── Token storage ───────────────────────────────────────────────────────
  const appType = inputs.appType ?? 'server'
  const tokenStorageMap: Record<AppType, PolicyResult['tokenStorage']> = {
    spa: {
      recommendation:
        'BFF pattern (Backend for Frontend) — tokens are held server-side and never reach the browser.',
      rationale:
        'Browser-accessible storage (localStorage, sessionStorage) is vulnerable to XSS. The BFF pattern eliminates token exposure to the browser entirely. draft-ietf-oauth-browser-based-apps-26 §6.1.',
      upgradeNote:
        'If BFF is not feasible: httpOnly cookies with Secure and SameSite=Strict attributes. localStorage and sessionStorage are not acceptable for medium or high sensitivity.',
    },
    server: {
      recommendation: 'Server-side session store. Tokens never sent to the client browser.',
      rationale: 'Confidential client — tokens held server-side per RFC 6749 §10.3.',
    },
    mobile: {
      recommendation: 'Platform secure storage — iOS Keychain Services, Android Keystore.',
      rationale:
        'Native secure storage isolates tokens from other apps and prevents extraction. RFC 8252 §8.12; OWASP MASTG for platform-specific guidance.',
    },
    m2m: {
      recommendation:
        'Server-side secret store (vault, secrets manager, or environment variables with restricted access). Never in source code or client-accessible config.',
      rationale: 'Community practice for client credentials management.',
      upgradeNote:
        'Prefer a dedicated secrets manager (HashiCorp Vault, AWS Secrets Manager) over environment variables for rotation and audit trail support.',
    },
  }

  const computed = {
    rtLifetime: refreshTokenLifetime?.value ?? null,
    idleTimeout: idleTimeout?.value ?? null,
    absoluteSession: absoluteSessionLimit?.value ?? null,
  }

  const conditionalWarnings = [
    ...detectWarnings(inputs),
    ...detectComputedWarnings(inputs, computed),
  ]

  const advisories: PolicyWarning[] = [
    {
      id: 'token-revocation',
      kind: 'advisory',
      message:
        'Verify your authorization server supports and enforces RFC 7009 token revocation. Without revocation, compromised tokens remain valid until expiry.',
    },
  ]

  const reAuth = buildReAuthTriggers(inputs, computed.absoluteSession, computed.idleTimeout)
  const citations = assembleCitations(inputs)

  return {
    accessTokenLifetime,
    refreshTokenLifetime,
    refreshTokenRotation,
    absoluteSessionLimit,
    idleTimeoutIdp: idleTimeout,
    idleTimeoutApp: idleTimeout,
    tokenStorage: tokenStorageMap[appType],
    reAuthTriggersIdp: reAuth.idp,
    reAuthTriggersApp: reAuth.app,
    warnings: [...conditionalWarnings, ...advisories],
    citations,
    disclaimer: buildDisclaimer(),
  }
}
