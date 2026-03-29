import { describe, it, expect } from 'vitest'
import { computePolicy } from './index'
import type { PolicyInputs } from './types'

// Minimal complete input set — server app, low risk, no special flags.
// Use spread to override only the fields relevant to each test.
const base: PolicyInputs = {
  appType: 'server',
  userPopulation: 'employees',
  sensitivityTier: 'low',
  complianceFramework: 'none',
  refreshTokenUsage: 'no',
  idleBehavior: 'fixed',
  tokenBinding: 'none',
}

function warningIds(inputs: PolicyInputs): string[] {
  return computePolicy(inputs).warnings.map((w) => w.id)
}

// ── spa-fedramp-high ───────────────────────────────────────────────────────

describe('warning: spa-fedramp-high', () => {
  it('fires for SPA + FedRAMP High', () => {
    expect(
      warningIds({ ...base, appType: 'spa', complianceFramework: 'fedramp-high' })
    ).toContain('spa-fedramp-high')
  })

  it('does not fire for SPA + FedRAMP Moderate', () => {
    expect(
      warningIds({ ...base, appType: 'spa', complianceFramework: 'fedramp-moderate' })
    ).not.toContain('spa-fedramp-high')
  })

  it('does not fire for server + FedRAMP High', () => {
    expect(
      warningIds({ ...base, appType: 'server', complianceFramework: 'fedramp-high' })
    ).not.toContain('spa-fedramp-high')
  })
})

// ── spa-refresh-no-bff ─────────────────────────────────────────────────────

describe('warning: spa-refresh-no-bff', () => {
  it('fires for SPA + refresh tokens', () => {
    expect(
      warningIds({ ...base, appType: 'spa', refreshTokenUsage: 'yes' })
    ).toContain('spa-refresh-no-bff')
  })

  it('does not fire for SPA without refresh tokens', () => {
    expect(
      warningIds({ ...base, appType: 'spa', refreshTokenUsage: 'no' })
    ).not.toContain('spa-refresh-no-bff')
  })

  it('does not fire for server + refresh tokens', () => {
    expect(
      warningIds({ ...base, appType: 'server', refreshTokenUsage: 'yes' })
    ).not.toContain('spa-refresh-no-bff')
  })
})

// ── spa-high-no-binding ────────────────────────────────────────────────────

describe('warning: spa-high-no-binding', () => {
  it('fires for SPA + high sensitivity + no binding', () => {
    expect(
      warningIds({ ...base, appType: 'spa', sensitivityTier: 'high', tokenBinding: 'none' })
    ).toContain('spa-high-no-binding')
  })

  it('does not fire when token binding is configured', () => {
    expect(
      warningIds({ ...base, appType: 'spa', sensitivityTier: 'high', tokenBinding: 'dpop' })
    ).not.toContain('spa-high-no-binding')
  })

  it('does not fire for SPA + medium sensitivity + no binding', () => {
    expect(
      warningIds({ ...base, appType: 'spa', sensitivityTier: 'medium', tokenBinding: 'none' })
    ).not.toContain('spa-high-no-binding')
  })

  it('does not fire for server + high sensitivity + no binding', () => {
    expect(
      warningIds({ ...base, appType: 'server', sensitivityTier: 'high', tokenBinding: 'none' })
    ).not.toContain('spa-high-no-binding')
  })
})

// ── mobile-sliding-window ─────────────────────────────────────────────────

describe('warning: mobile-sliding-window', () => {
  it('fires for mobile + sliding window', () => {
    expect(
      warningIds({ ...base, appType: 'mobile', idleBehavior: 'sliding' })
    ).toContain('mobile-sliding-window')
  })

  it('does not fire for mobile + fixed expiry', () => {
    expect(
      warningIds({ ...base, appType: 'mobile', idleBehavior: 'fixed' })
    ).not.toContain('mobile-sliding-window')
  })

  it('does not fire for SPA + sliding window', () => {
    expect(
      warningIds({ ...base, appType: 'spa', idleBehavior: 'sliding' })
    ).not.toContain('mobile-sliding-window')
  })
})

// ── m2m-hipaa ─────────────────────────────────────────────────────────────

describe('warning: m2m-hipaa', () => {
  it('fires for M2M + HIPAA', () => {
    expect(
      warningIds({ ...base, appType: 'm2m', complianceFramework: 'hipaa' })
    ).toContain('m2m-hipaa')
  })

  it('does not fire for M2M without HIPAA', () => {
    expect(
      warningIds({ ...base, appType: 'm2m', complianceFramework: 'none' })
    ).not.toContain('m2m-hipaa')
  })

  it('does not fire for server + HIPAA', () => {
    expect(
      warningIds({ ...base, appType: 'server', complianceFramework: 'hipaa' })
    ).not.toContain('m2m-hipaa')
  })
})

// ── high-sliding-no-absolute ──────────────────────────────────────────────

describe('warning: high-sliding-no-absolute', () => {
  it('fires for high sensitivity + sliding window', () => {
    expect(
      warningIds({ ...base, sensitivityTier: 'high', idleBehavior: 'sliding' })
    ).toContain('high-sliding-no-absolute')
  })

  it('does not fire for high sensitivity + fixed expiry', () => {
    expect(
      warningIds({ ...base, sensitivityTier: 'high', idleBehavior: 'fixed' })
    ).not.toContain('high-sliding-no-absolute')
  })

  it('does not fire for medium sensitivity + sliding window', () => {
    expect(
      warningIds({ ...base, sensitivityTier: 'medium', idleBehavior: 'sliding' })
    ).not.toContain('high-sliding-no-absolute')
  })
})

// ── no-revocation ─────────────────────────────────────────────────────────

describe('warning: no-revocation', () => {
  it('always fires for user-session apps', () => {
    expect(warningIds(base)).toContain('no-revocation')
  })

  it('fires for M2M with M2M-specific message', () => {
    const ids = warningIds({ ...base, appType: 'm2m' })
    expect(ids).toContain('no-revocation')
  })

  it('M2M message does not reference NIST 800-63B logout', () => {
    const result = computePolicy({ ...base, appType: 'm2m' })
    const warning = result.warnings.find((w) => w.id === 'no-revocation')
    expect(warning?.message).not.toContain('NIST 800-63B')
    expect(warning?.message).not.toContain('logout')
  })

  it('non-M2M message references NIST 800-63B logout', () => {
    const result = computePolicy(base)
    const warning = result.warnings.find((w) => w.id === 'no-revocation')
    expect(warning?.message).toContain('NIST 800-63B')
  })
})

// ── high-sliding-no-absolute: M2M defensive ───────────────────────────────

describe('warning: high-sliding-no-absolute — M2M', () => {
  it('does not fire for M2M with high sensitivity (idleBehavior not set)', () => {
    expect(
      warningIds({ appType: 'm2m', sensitivityTier: 'high', complianceFramework: 'none', tokenBinding: 'none' })
    ).not.toContain('high-sliding-no-absolute')
  })
})

// ── refresh token fields ───────────────────────────────────────────────────

describe('refresh token output', () => {
  it('refreshTokenLifetime is non-null for non-M2M app with refresh tokens', () => {
    const result = computePolicy({ ...base, refreshTokenUsage: 'yes' })
    expect(result.refreshTokenLifetime).not.toBeNull()
  })

  it('refreshTokenLifetime is null for non-M2M app without refresh tokens', () => {
    const result = computePolicy({ ...base, refreshTokenUsage: 'no' })
    expect(result.refreshTokenLifetime).toBeNull()
  })

  it('refreshTokenRotation is not-applicable when refresh tokens are not used', () => {
    const result = computePolicy({ ...base, refreshTokenUsage: 'no' })
    expect(result.refreshTokenRotation.value).toBe('not-applicable')
  })

  it('refreshTokenRotation is required for non-M2M app with refresh tokens', () => {
    const result = computePolicy({ ...base, refreshTokenUsage: 'yes' })
    expect(result.refreshTokenRotation.value).toBe('required')
  })
})

// ── M2M null fields ───────────────────────────────────────────────────────

describe('M2M output shape', () => {
  const m2mInputs: PolicyInputs = {
    appType: 'm2m',
    sensitivityTier: 'low',
    complianceFramework: 'none',
    tokenBinding: 'none',
  }

  it('refreshTokenLifetime is null', () => {
    expect(computePolicy(m2mInputs).refreshTokenLifetime).toBeNull()
  })

  it('absoluteSessionLimit is null', () => {
    expect(computePolicy(m2mInputs).absoluteSessionLimit).toBeNull()
  })

  it('idleTimeoutIdp is null', () => {
    expect(computePolicy(m2mInputs).idleTimeoutIdp).toBeNull()
  })

  it('idleTimeoutApp is null', () => {
    expect(computePolicy(m2mInputs).idleTimeoutApp).toBeNull()
  })

  it('refreshTokenRotation is not-applicable', () => {
    expect(computePolicy(m2mInputs).refreshTokenRotation.value).toBe('not-applicable')
  })

  it('reAuthTriggersIdp is empty', () => {
    expect(computePolicy(m2mInputs).reAuthTriggersIdp).toHaveLength(0)
  })

  it('reAuthTriggersApp is empty', () => {
    expect(computePolicy(m2mInputs).reAuthTriggersApp).toHaveLength(0)
  })
})
