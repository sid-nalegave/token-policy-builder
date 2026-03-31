import type { PolicyResult, PolicyInputs } from '@/engine/types'
import { formatMinutes } from './formatMinutes'

export function toPolicyStatement(result: PolicyResult, inputs: PolicyInputs): string {
  const sentences: string[] = []

  sentences.push(
    `Access token lifetime: ${formatMinutes(result.accessTokenLifetime.value)}.`
  )

  if (result.refreshTokenLifetime !== null) {
    const rotation = result.refreshTokenRotation.value
    const rotationNote =
      rotation === 'required'
        ? ', with rotation required'
        : rotation === 'recommended'
        ? ', with rotation recommended'
        : ''
    sentences.push(
      `Refresh token lifetime: ${formatMinutes(result.refreshTokenLifetime.value)}${rotationNote}.`
    )
  }

  if (result.absoluteSessionLimit !== null) {
    sentences.push(
      `Absolute session limit: ${formatMinutes(result.absoluteSessionLimit.value)}.`
    )
  }

  if (result.idleTimeoutIdp !== null && result.idleTimeoutApp !== null) {
    if (result.idleTimeoutIdp.value === result.idleTimeoutApp.value) {
      sentences.push(
        `Idle timeout: ${formatMinutes(result.idleTimeoutIdp.value)} (IdP and application).`
      )
    } else {
      sentences.push(
        `Idle timeout: ${formatMinutes(result.idleTimeoutIdp.value)} (IdP), ${formatMinutes(result.idleTimeoutApp.value)} (application).`
      )
    }
  } else if (result.idleTimeoutIdp !== null) {
    sentences.push(`Idle timeout — IdP: ${formatMinutes(result.idleTimeoutIdp.value)}.`)
  } else if (result.idleTimeoutApp !== null) {
    sentences.push(`Idle timeout — application: ${formatMinutes(result.idleTimeoutApp.value)}.`)
  }

  sentences.push(`Token storage: ${result.tokenStorage.recommendation}.`)

  const appType = inputs.appType ?? 'server'
  const appLabel: Record<string, string> = {
    spa: 'single-page application',
    server: 'server-side application',
    mobile: 'mobile application',
    m2m: 'machine-to-machine client',
  }

  sentences.push(
    `This policy applies to a ${appLabel[appType]}. Recommendations are grounded in NIST SP 800-63B Rev 4, RFC 9700, RFC 6749, RFC 9068, and draft-ietf-oauth-browser-based-apps-26. This is not a compliance determination — verify against your ATO, organizational requirements, or legal counsel.`
  )

  return sentences.join(' ')
}
