import type {
  PolicyInputs,
  PolicyResult,
  PolicyWarning,
  PolicyCitation,
} from './types'

// ── Warning detection ──────────────────────────────────────────────────────

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
      message:
        'FedRAMP High controls SC-10, SC-23, and AC-12 require server-enforced session management, server-side session identifier generation, and demonstrable session termination. Client-side token deletion is insufficient — the token remains valid server-side. Adopt a Backend for Frontend (BFF) pattern. FedRAMP-authorized SPA products (Okta, Salesforce) all use server-side session backends.',
    })
  }

  // SPA + refresh tokens
  // BFF not configured is implied — no BFF input exists; the warning advises adoption
  if (appType === 'spa' && refreshTokenUsage === 'yes') {
    warnings.push({
      id: 'spa-refresh-no-bff',
      message:
        'Refresh tokens in browser-accessible storage are vulnerable to XSS exfiltration. Rotation alone is insufficient — a persistent attacker can steal rotated tokens continuously before the application uses them. Primary mitigation: BFF pattern (tokens never reach the browser). If BFF is not feasible: DPoP sender-constraining plus strict CSP.',
    })
  }

  // SPA + high sensitivity + no token binding
  if (appType === 'spa' && sensitivityTier === 'high' && tokenBinding === 'none') {
    warnings.push({
      id: 'spa-high-no-binding',
      message:
        'No sender-constraining configured. A stolen bearer token is valid for the full access token lifetime with no way to invalidate it mid-flight. Short access token lifetime and refresh token rotation reduce the window — they do not eliminate the risk. BFF pattern recommended as primary mitigation.',
    })
  }

  // Mobile + sliding window
  // iOS background suspension can interrupt token refresh
  if (appType === 'mobile' && idleBehavior === 'sliding') {
    warnings.push({
      id: 'mobile-sliding-window',
      message:
        'iOS aggressively suspends background processes, which can interrupt token refresh and cause unexpected session termination. Validate token refresh behavior against OWASP MASTG and platform-specific guidance before relying on sliding window behavior.',
    })
  }

  // M2M + HIPAA
  // HIPAA §164.312(a)(1) covers automated access to ePHI
  if (appType === 'm2m' && complianceFramework === 'hipaa') {
    warnings.push({
      id: 'm2m-hipaa',
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
      message:
        'Idle timeout alone is insufficient at high sensitivity. An attacker with a hijacked session can generate periodic activity to prevent the idle timeout from firing indefinitely. NIST 800-63B Rev 4 mandates an absolute session limit at AAL2 (SHALL) and recommends an inactivity timeout (SHOULD) — both should be applied. Add an absolute session limit.',
    })
  }

  // TODO(phase-5): consumer + refresh token lifetime > 30 days
  // Requires computed refreshTokenLifetime.value — add after numeric values are filled in.

  // TODO(phase-5): idle timeout > absolute session limit
  // Requires computed idleTimeoutApp.value and absoluteSessionLimit.value.

  return warnings
}

// ── Citations assembly ─────────────────────────────────────────────────────

function assembleCitations(inputs: PolicyInputs): PolicyCitation[] {
  const citations: PolicyCitation[] = []
  const isM2M = inputs.appType === 'm2m'
  const usesRefreshTokens = inputs.refreshTokenUsage === 'yes' && !isM2M

  // Access token lifetime — always cited
  // NOTE: RFC 9700 §2.2.1 covers sender-constraining, not lifetime. The correct
  // sub-section for short-lived access token guidance must be confirmed in phase-5.
  citations.push({
    field: 'accessTokenLifetime',
    standard: 'RFC 9700',
    note: 'TODO(phase-5): identify correct clause for short-lived access token requirement and connect to recommendation.',
  })
  citations.push({
    field: 'accessTokenLifetime',
    standard: 'RFC 9068',
    note: 'TODO(phase-5): connect JWT access token lifetime to profile guidance.',
  })

  // Refresh token lifetime and rotation
  if (usesRefreshTokens) {
    citations.push({
      field: 'refreshTokenLifetime',
      standard: 'RFC 9700',
      clause: '§2.2.2',
      note: 'TODO(phase-5): connect refresh token lifetime to rotation and binding requirements.',
    })
    citations.push({
      field: 'refreshTokenRotation',
      standard: 'RFC 9700',
      clause: '§2.2.2',
      note: 'TODO(phase-5): public clients MUST use rotation OR sender-constraining (RFC 9700 §2.2.2). Confidential clients: rotation is an additional protection; §2.2.2 does not mandate it.',
    })
  }

  // Session limits — not applicable for M2M
  if (!isM2M) {
    citations.push({
      field: 'absoluteSessionLimit',
      standard: 'NIST SP 800-63B Rev 4',
      note: 'TODO(phase-5): cite AAL2+ absolute session limit clause.',
    })
    citations.push({
      field: 'idleTimeoutIdp',
      standard: 'NIST SP 800-63B Rev 4',
      note: 'TODO(phase-5): cite inactivity timeout clause and IdP/app-layer alignment requirement.',
    })
    citations.push({
      field: 'idleTimeoutApp',
      standard: 'NIST SP 800-63B Rev 4',
      note: 'TODO(phase-5): cite app-layer idle detection requirement.',
    })
  }

  // Token storage — varies by app type
  if (inputs.appType === 'spa') {
    citations.push({
      field: 'tokenStorage',
      standard: 'draft-ietf-oauth-browser-based-apps-26',
      note: 'TODO(phase-5): cite BFF as primary token storage pattern for browser-based apps.',
    })
  } else if (inputs.appType === 'server') {
    citations.push({
      field: 'tokenStorage',
      standard: 'RFC 6749',
      note: 'TODO(phase-5): confidential client — tokens held server-side, never exposed to the browser.',
    })
  } else if (inputs.appType === 'mobile') {
    citations.push({
      field: 'tokenStorage',
      standard: 'RFC 8252',
      note: 'TODO(phase-5): cite secure storage requirements for native apps per OAuth 2.0 for Native Apps; cross-reference OWASP MASTG.',
    })
  } else if (inputs.appType === 'm2m') {
    citations.push({
      field: 'tokenStorage',
      standard: 'RFC 6749',
      clause: '§4.4',
      note: 'TODO(phase-5): client credentials — secrets stored server-side, never in code or client-accessible config.',
    })
  }

  // Token binding
  if (inputs.tokenBinding === 'dpop') {
    citations.push({
      field: 'tokenBinding',
      standard: 'RFC 9449',
      clause: '§11.2',
      note: 'TODO(phase-5): DPoP binding rationale; note nonce requirement for lifetime extension.',
    })
  }
  if (inputs.tokenBinding === 'mtls') {
    citations.push({
      field: 'tokenBinding',
      standard: 'RFC 8705',
      note: 'TODO(phase-5): mTLS binding rationale; standards are silent on lifetime extension.',
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

// ── Re-auth triggers ───────────────────────────────────────────────────────

function buildReAuthTriggers(inputs: PolicyInputs): {
  idp: string[]
  app: string[]
} {
  if (inputs.appType === 'm2m') {
    return { idp: [], app: [] }
  }

  return {
    idp: [
      'TODO(phase-5): absolute session limit (max age) — hard cap on total session length',
      'TODO(phase-5): inactivity timeout — must mirror the app-layer idle timeout value',
    ],
    app: [
      'TODO(phase-5): idle detection and session termination after N minutes of inactivity',
      'Step-up re-authentication before sensitive actions — accessing PHI, changing credentials, payment transactions',
      'Re-authentication on privilege escalation',
    ],
  }
}

// ── Disclaimer assembly ────────────────────────────────────────────────────

const BASE_DISCLAIMER =
  'Recommendations are grounded in NIST SP 800-63B Rev 4, RFC 9700, RFC 6749, RFC 9068, and draft-ietf-oauth-browser-based-apps-26 — not a compliance determination or substitute for a security review. Verify against your ATO, organizational requirements, or legal counsel. Standards basis last verified: March 2026.'

// Token revocation advisory — applies to all app types but is not a targeted
// warning since this tool cannot verify AS revocation support. Surfaced as a
// disclaimer note rather than a warning to avoid false-positive fatigue.
const REVOCATION_ADVISORY =
  'This tool cannot verify whether your authorization server supports RFC 7009 token revocation. Revocation is required for NIST 800-63B §7.1 logout compliance (user-session apps) and recommended for all deployments. Verify support before relying on token expiry as the sole invalidation mechanism.'

function buildDisclaimer(): string[] {
  return [BASE_DISCLAIMER, REVOCATION_ADVISORY]
}

// ── computePolicy ──────────────────────────────────────────────────────────

// Placeholder used for all numeric fields until phase-5 values are designed.
const TODO = 'TODO(phase-5): value to be filled in during rules engine logic phase'

export function computePolicy(inputs: PolicyInputs): PolicyResult {
  const isM2M = inputs.appType === 'm2m'
  const usesRefreshTokens = inputs.refreshTokenUsage === 'yes' && !isM2M

  const warnings = detectWarnings(inputs)
  const citations = assembleCitations(inputs)
  const reAuth = buildReAuthTriggers(inputs)

  return {
    accessTokenLifetime: {
      value: 0, // TODO(phase-5)
      rationale: TODO,
      standardsFloor: TODO,
    },

    // RFC 6749 §4.4.3 permits but does not require refresh tokens for the client
    // credentials grant. Not issued for M2M — the client re-authenticates directly.
    refreshTokenLifetime: usesRefreshTokens
      ? { value: 0, rationale: TODO, standardsFloor: TODO } // TODO(phase-5)
      : null,

    refreshTokenRotation: {
      // TODO(phase-5): refine per RFC 9700 §2.2.2 — public clients (SPA, mobile) MUST
      // use rotation OR sender-constraining. Confidential clients (server): rotation
      // is an additional protection; §2.2.2 does not mandate it.
      // Stub uses 'required' for public clients, 'recommended' for confidential.
      value: isM2M || !usesRefreshTokens
        ? 'not-applicable'
        : inputs.appType === 'server'
        ? 'recommended'
        : 'required',
      rationale: TODO,
      standardsFloor: TODO,
    },

    absoluteSessionLimit: isM2M
      ? null
      : { value: 0, rationale: TODO, standardsFloor: TODO }, // TODO(phase-5)

    idleTimeoutIdp: isM2M
      ? null
      : { value: 0, rationale: TODO, standardsFloor: TODO }, // TODO(phase-5)

    idleTimeoutApp: isM2M
      ? null
      : { value: 0, rationale: TODO, standardsFloor: TODO }, // TODO(phase-5)

    tokenStorage: {
      recommendation: TODO, // TODO(phase-5)
      rationale: TODO,
    },

    reAuthTriggersIdp: reAuth.idp,
    reAuthTriggersApp: reAuth.app,
    warnings,
    citations,
    disclaimer: buildDisclaimer(),
  }
}
