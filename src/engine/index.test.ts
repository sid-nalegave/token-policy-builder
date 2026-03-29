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

// ── no-revocation — moved to disclaimer ───────────────────────────────────

describe('revocation advisory in disclaimer', () => {
  it('no-revocation is not in warnings', () => {
    expect(warningIds(base)).not.toContain('no-revocation')
    expect(warningIds({ ...base, appType: 'm2m' })).not.toContain('no-revocation')
  })

  it('disclaimer always contains RFC 7009 revocation advisory', () => {
    expect(computePolicy(base).disclaimer.some((d) => d.includes('RFC 7009'))).toBe(true)
  })

  it('disclaimer always contains the base boilerplate', () => {
    expect(computePolicy(base).disclaimer.some((d) => d.includes('NIST SP 800-63B Rev 4'))).toBe(true)
  })

  it('disclaimer applies to M2M as well', () => {
    expect(
      computePolicy({ ...base, appType: 'm2m' }).disclaimer.some((d) => d.includes('RFC 7009'))
    ).toBe(true)
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

  it('refreshTokenRotation is required for public client (SPA) with refresh tokens', () => {
    const result = computePolicy({ ...base, appType: 'spa', refreshTokenUsage: 'yes' })
    expect(result.refreshTokenRotation.value).toBe('required')
  })

  it('refreshTokenRotation is recommended for confidential client (server) with refresh tokens', () => {
    const result = computePolicy({ ...base, appType: 'server', refreshTokenUsage: 'yes' })
    expect(result.refreshTokenRotation.value).toBe('recommended')
  })
})

// ── tokenStorage citations ────────────────────────────────────────────────

describe('tokenStorage citations', () => {
  function storeCitation(inputs: PolicyInputs) {
    return computePolicy(inputs).citations.find((c) => c.field === 'tokenStorage')
  }

  it('SPA cites draft-ietf-oauth-browser-based-apps-26', () => {
    expect(storeCitation({ ...base, appType: 'spa' })?.standard).toBe(
      'draft-ietf-oauth-browser-based-apps-26'
    )
  })

  it('server cites RFC 6749', () => {
    expect(storeCitation({ ...base, appType: 'server' })?.standard).toBe('RFC 6749')
  })

  it('mobile cites RFC 8252', () => {
    expect(storeCitation({ ...base, appType: 'mobile' })?.standard).toBe('RFC 8252')
  })

  it('M2M cites RFC 6749 §4.4', () => {
    const citation = storeCitation({ ...base, appType: 'm2m' })
    expect(citation?.standard).toBe('RFC 6749')
    expect(citation?.clause).toBe('§4.4')
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
