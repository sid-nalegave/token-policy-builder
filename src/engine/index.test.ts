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

// ── mobile-token-refresh ──────────────────────────────────────────────────

describe('warning: mobile-token-refresh', () => {
  it('fires for any mobile app', () => {
    expect(warningIds({ ...base, appType: 'mobile' })).toContain('mobile-token-refresh')
  })

  it('does not fire for SPA', () => {
    expect(warningIds({ ...base, appType: 'spa' })).not.toContain('mobile-token-refresh')
  })

  it('does not fire for server', () => {
    expect(warningIds({ ...base, appType: 'server' })).not.toContain('mobile-token-refresh')
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

// ── high-no-absolute ──────────────────────────────────────────────────────

describe('warning: high-no-absolute', () => {
  it('fires for high sensitivity non-M2M', () => {
    expect(warningIds({ ...base, sensitivityTier: 'high' })).toContain('high-no-absolute')
  })

  it('does not fire for medium sensitivity', () => {
    expect(warningIds({ ...base, sensitivityTier: 'medium' })).not.toContain('high-no-absolute')
  })

  it('does not fire for M2M with high sensitivity', () => {
    expect(
      warningIds({ appType: 'm2m', sensitivityTier: 'high', complianceFramework: 'none', tokenBinding: 'none' })
    ).not.toContain('high-no-absolute')
  })
})

// ── disclaimer ────────────────────────────────────────────────────────────

describe('disclaimer', () => {
  it('always contains the base boilerplate', () => {
    expect(computePolicy(base).disclaimer.some((d) => d.includes('NIST SP 800-63B Rev 4'))).toBe(true)
  })

  it('contains RFC 7009 revocation note', () => {
    expect(computePolicy(base).disclaimer.some((d) => d.includes('RFC 7009'))).toBe(true)
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

  it('refreshTokenRotation rationale names DPoP when dpop binding is configured', () => {
    const result = computePolicy({ ...base, appType: 'spa', refreshTokenUsage: 'yes', tokenBinding: 'dpop' })
    expect(result.refreshTokenRotation.rationale).toContain('DPoP')
    expect(result.refreshTokenRotation.rationale).not.toContain('mTLS')
  })

  it('refreshTokenRotation rationale names mTLS when mtls binding is configured', () => {
    const result = computePolicy({ ...base, appType: 'spa', refreshTokenUsage: 'yes', tokenBinding: 'mtls' })
    expect(result.refreshTokenRotation.rationale).toContain('mTLS')
    expect(result.refreshTokenRotation.rationale).not.toContain('DPoP')
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

// ── access token lifetime ─────────────────────────────────────────────────

describe('accessTokenLifetime numeric values', () => {
  it('server + low + none → 60', () => {
    expect(computePolicy({ ...base }).accessTokenLifetime.value).toBe(60)
  })

  it('server + low + fedramp-high → 15', () => {
    expect(
      computePolicy({ ...base, complianceFramework: 'fedramp-high' }).accessTokenLifetime.value
    ).toBe(15)
  })

  it('spa + high + none → 15', () => {
    expect(
      computePolicy({ ...base, appType: 'spa', sensitivityTier: 'high' }).accessTokenLifetime.value
    ).toBe(15)
  })

  it('spa + low + none → 30, rationale names SPA public client baseline', () => {
    const result = computePolicy({ ...base, appType: 'spa' })
    expect(result.accessTokenLifetime.value).toBe(30)
    expect(result.accessTokenLifetime.rationale).toContain('SPA public client baseline')
  })

  it('spa + medium + fedramp-moderate → 30, three-way tie, compliance post-check names FedRAMP Moderate', () => {
    // base=30, sensitivityCap=30, complianceCap=30 — all tie at 30
    // bindingMin strict < keeps base first; post-check: complianceCap=30=value → compliance named
    const result = computePolicy({
      ...base,
      appType: 'spa',
      sensitivityTier: 'medium',
      complianceFramework: 'fedramp-moderate',
    })
    expect(result.accessTokenLifetime.value).toBe(30)
    expect(result.accessTokenLifetime.rationale).toContain('FedRAMP Moderate')
  })

  it('server + low + none → 60, tie between base and sensitivity, rationale names Server confidential client baseline', () => {
    // base=60, sensitivityCap=60 — tie; strict < keeps first = base
    const result = computePolicy({ ...base })
    expect(result.accessTokenLifetime.value).toBe(60)
    expect(result.accessTokenLifetime.rationale).toContain('Server confidential client baseline')
  })
})

// ── refresh token lifetime ────────────────────────────────────────────────

describe('refreshTokenLifetime numeric values', () => {
  it('mobile + low + none + employees → 20160 (14d base)', () => {
    expect(
      computePolicy({
        ...base,
        appType: 'mobile',
        sensitivityTier: 'low',
        complianceFramework: 'none',
        userPopulation: 'employees',
        refreshTokenUsage: 'yes',
      }).refreshTokenLifetime?.value
    ).toBe(20160)
  })

  it('mobile + low + none + partners → 1440 (partner cap)', () => {
    expect(
      computePolicy({
        ...base,
        appType: 'mobile',
        sensitivityTier: 'low',
        complianceFramework: 'none',
        userPopulation: 'partners',
        refreshTokenUsage: 'yes',
      }).refreshTokenLifetime?.value
    ).toBe(1440)
  })

  it('server + high + hipaa → 480 (high sensitivity cap)', () => {
    expect(
      computePolicy({
        ...base,
        appType: 'server',
        sensitivityTier: 'high',
        complianceFramework: 'hipaa',
        refreshTokenUsage: 'yes',
      }).refreshTokenLifetime?.value
    ).toBe(480)
  })

  it('server + low + none + consumers → 10080 (server base, consumer cap=43200 does not bind)', () => {
    expect(
      computePolicy({
        ...base,
        appType: 'server',
        sensitivityTier: 'low',
        complianceFramework: 'none',
        userPopulation: 'consumers',
        refreshTokenUsage: 'yes',
      }).refreshTokenLifetime?.value
    ).toBe(10080)
  })
})

// ── absolute session limit ────────────────────────────────────────────────

describe('absoluteSessionLimit numeric values', () => {
  it('medium + fedramp-moderate → 720 (compliance cap = sensitivity default, picks compliance)', () => {
    expect(
      computePolicy({ ...base, sensitivityTier: 'medium', complianceFramework: 'fedramp-moderate' })
        .absoluteSessionLimit?.value
    ).toBe(720)
  })

  it('high + none → 480', () => {
    expect(
      computePolicy({ ...base, sensitivityTier: 'high' }).absoluteSessionLimit?.value
    ).toBe(480)
  })

  it('low + hipaa → 480 (hipaa cap overrides 1440 default)', () => {
    expect(
      computePolicy({ ...base, sensitivityTier: 'low', complianceFramework: 'hipaa' })
        .absoluteSessionLimit?.value
    ).toBe(480)
  })
})

// ── idle timeout ──────────────────────────────────────────────────────────

describe('idleTimeout numeric values', () => {
  it('medium + none → 30', () => {
    expect(
      computePolicy({ ...base, sensitivityTier: 'medium' }).idleTimeoutApp?.value
    ).toBe(30)
  })

  it('low + hipaa → 15 (hipaa cap overrides 60 default)', () => {
    expect(
      computePolicy({ ...base, sensitivityTier: 'low', complianceFramework: 'hipaa' })
        .idleTimeoutApp?.value
    ).toBe(15)
  })
})

// ── idleTimeoutIdp mirrors idleTimeoutApp ─────────────────────────────────

describe('idleTimeoutIdp mirrors idleTimeoutApp', () => {
  it('idleTimeoutIdp.value equals idleTimeoutApp.value', () => {
    const r = computePolicy({ ...base, sensitivityTier: 'medium', complianceFramework: 'hipaa' })
    expect(r.idleTimeoutIdp?.value).toBe(r.idleTimeoutApp?.value)
  })
})

// ── compliance-driven standardsFloor — idle timeout ──────────────────────

describe('idleTimeout standardsFloor — compliance driven', () => {
  it('low + hipaa: floor cites HIPAA, not AAL1 optional', () => {
    const r = computePolicy({ ...base, complianceFramework: 'hipaa' })
    expect(r.idleTimeoutApp!.standardsFloor).toContain('HIPAA')
    expect(r.idleTimeoutApp!.standardsFloor).not.toContain('optional')
  })

  it('low + fedramp-moderate: floor cites SC-10, not AAL1 optional', () => {
    const r = computePolicy({ ...base, complianceFramework: 'fedramp-moderate' })
    expect(r.idleTimeoutApp!.standardsFloor).toContain('SC-10')
    expect(r.idleTimeoutApp!.standardsFloor).not.toContain('optional')
  })

  it('medium + fedramp-moderate (tie): compliance named, floor cites SC-10', () => {
    const r = computePolicy({ ...base, sensitivityTier: 'medium', complianceFramework: 'fedramp-moderate' })
    expect(r.idleTimeoutApp!.rationale).toContain('FedRAMP Moderate')
    expect(r.idleTimeoutApp!.standardsFloor).toContain('SC-10')
  })
})

// ── compliance-driven standardsFloor — absolute session ───────────────────

describe('absoluteSessionLimit standardsFloor — compliance driven', () => {
  it('medium + hipaa: floor cites HIPAA, not "stricter at 12h"', () => {
    const r = computePolicy({ ...base, sensitivityTier: 'medium', complianceFramework: 'hipaa' })
    expect(r.absoluteSessionLimit!.standardsFloor).toContain('HIPAA')
    expect(r.absoluteSessionLimit!.standardsFloor).not.toContain('12h')
  })

  it('low + fedramp-high: floor cites AAL3', () => {
    const r = computePolicy({ ...base, complianceFramework: 'fedramp-high' })
    expect(r.absoluteSessionLimit!.standardsFloor).toContain('AAL3')
  })

  it('medium + fedramp-moderate (tie): compliance named, floor cites AAL2', () => {
    const r = computePolicy({ ...base, sensitivityTier: 'medium', complianceFramework: 'fedramp-moderate' })
    expect(r.absoluteSessionLimit!.rationale).toContain('FedRAMP Moderate')
    expect(r.absoluteSessionLimit!.standardsFloor).toContain('AAL2')
  })
})

// ── AT upgradeNote — DPoP vs mTLS by app type ─────────────────────────────

describe('accessTokenLifetime upgradeNote', () => {
  it('M2M + no binding: suggests mTLS, not DPoP', () => {
    const r = computePolicy({ ...base, appType: 'm2m', sensitivityTier: 'medium' })
    expect(r.accessTokenLifetime.upgradeNote).toContain('mTLS')
    expect(r.accessTokenLifetime.upgradeNote).not.toContain('DPoP')
  })

  it('M2M + low sensitivity + no binding: still suggests mTLS', () => {
    const r = computePolicy({ ...base, appType: 'm2m' })
    expect(r.accessTokenLifetime.upgradeNote).toContain('mTLS')
  })

  it('server + medium + no binding: suggests DPoP', () => {
    const r = computePolicy({ ...base, sensitivityTier: 'medium' })
    expect(r.accessTokenLifetime.upgradeNote).toContain('DPoP')
  })

  it('no upgradeNote when binding is already configured', () => {
    const r = computePolicy({ ...base, sensitivityTier: 'medium', tokenBinding: 'dpop' })
    expect(r.accessTokenLifetime.upgradeNote).toBeUndefined()
  })

  it('no upgradeNote for non-M2M low sensitivity with no binding', () => {
    // Low sensitivity non-M2M: threshold not met, no upgrade note expected
    const r = computePolicy({ ...base, appType: 'server', sensitivityTier: 'low', tokenBinding: 'none' })
    expect(r.accessTokenLifetime.upgradeNote).toBeUndefined()
  })
})


// ── deferred warnings do not fire for standard inputs ─────────────────────

describe('deferred computed warnings', () => {
  it('consumer-rt-30d does not fire for standard inputs', () => {
    expect(
      computePolicy({
        ...base,
        userPopulation: 'consumers',
        refreshTokenUsage: 'yes',
      }).warnings.map((w) => w.id)
    ).not.toContain('consumer-rt-30d')
  })

  it('idle-exceeds-absolute does not fire for standard inputs', () => {
    expect(warningIds(base)).not.toContain('idle-exceeds-absolute')
  })
})

// ── refresh=no suppression ────────────────────────────────────────────────

describe('refresh=no suppression', () => {
  it('rtLifetime is null', () => {
    expect(computePolicy({ ...base, refreshTokenUsage: 'no' }).refreshTokenLifetime).toBeNull()
  })

  it('rotation value is not-applicable', () => {
    expect(computePolicy({ ...base, refreshTokenUsage: 'no' }).refreshTokenRotation.value).toBe(
      'not-applicable'
    )
  })

  it('rotation rationale is "Refresh tokens not in use."', () => {
    expect(computePolicy({ ...base, refreshTokenUsage: 'no' }).refreshTokenRotation.rationale).toBe(
      'Refresh tokens not in use.'
    )
  })
})

// ── no-TODO checks ────────────────────────────────────────────────────────

describe('no TODO strings in output', () => {
  it('rotation rationale has no TODO', () => {
    expect(
      computePolicy({ ...base, refreshTokenUsage: 'yes' }).refreshTokenRotation.rationale
    ).not.toContain('TODO')
  })

  it('token storage recommendation has no TODO', () => {
    expect(computePolicy(base).tokenStorage.recommendation).not.toContain('TODO')
  })

  it('rotation rationale when refresh=no has no TODO', () => {
    expect(
      computePolicy({ ...base, refreshTokenUsage: 'no' }).refreshTokenRotation.rationale
    ).not.toContain('TODO')
  })

  it('access token lifetime rationale has no TODO', () => {
    expect(computePolicy(base).accessTokenLifetime.rationale).not.toContain('TODO')
  })
})

// ── conditional warning kind ──────────────────────────────────────────────

describe('conditional warning kind', () => {
  it('spa-fedramp-high has kind conditional', () => {
    const w = computePolicy({
      ...base,
      appType: 'spa',
      complianceFramework: 'fedramp-high',
    }).warnings.find((w) => w.id === 'spa-fedramp-high')
    expect(w?.kind).toBe('conditional')
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
