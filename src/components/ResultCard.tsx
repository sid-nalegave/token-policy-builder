import { useState } from 'react'
import { Copy, Check, Download, RotateCcw } from 'lucide-react'
import type { PolicyResult, PolicyInputs } from '@/engine/types'
import { Button } from '@/components/ui/button'
import { PolicyWarningBanner } from './PolicyWarningBanner'
import { PolicyField } from './PolicyField'
import { RotationBadge } from './RotationBadge'
import { TokenStorageField } from './TokenStorageField'
import { ReAuthTriggers } from './ReAuthTriggers'
import { FieldCitations } from './FieldCitations'
import { UpgradeNote } from './UpgradeNote'
import { toPolicyStatement } from '@/lib/toPolicyStatement'

const DRIVER_PILL_CLASSES: Record<string, string> = {
  'High sensitivity': 'border-warning-border bg-warning text-warning-text',
  'Medium sensitivity': 'border-info-border bg-info text-info-text',
  'Low sensitivity': 'border-border bg-secondary text-muted-foreground',
  'FedRAMP High compliance controls': 'border-warning-border bg-warning text-warning-text',
  'FedRAMP Moderate compliance controls': 'border-info-border bg-info text-info-text',
  'HIPAA industry practice': 'border-info-border bg-info text-info-text',
}
const DEFAULT_PILL = 'border-border bg-secondary text-muted-foreground'

const FEDRAMP_VERSION_NOTE =
  'Recommendations cite NIST SP 800-63B Rev 4 (August 2025). If your ATO references Rev 3, verify — AAL2 idle timeout was 30 minutes (SHALL) under Rev 3, relaxed to 1 hour (SHOULD) in Rev 4.'

interface ResultCardProps {
  result: PolicyResult
  inputs: PolicyInputs
  onReset: () => void
}

export function ResultCard({ result, inputs, onReset }: ResultCardProps) {
  const [copied, setCopied] = useState(false)
  const isM2M = inputs.appType === 'm2m'
  const isFedRAMP =
    inputs.complianceFramework === 'fedramp-moderate' ||
    inputs.complianceFramework === 'fedramp-high'

  const handleCopy = () => {
    navigator.clipboard.writeText(toPolicyStatement(result, inputs))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'token-policy.json'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  const citeFor = (field: string) => result.citations.filter((c) => c.field === field)

  // Compute dominant driver across all numeric fields to show once at section level
  const getDriver = (rationale: string) => rationale.replace(' drives this value.', '')
  const numericFields = [
    result.accessTokenLifetime,
    ...(!isM2M && result.refreshTokenLifetime ? [result.refreshTokenLifetime] : []),
    ...(!isM2M && result.absoluteSessionLimit ? [result.absoluteSessionLimit] : []),
    ...(!isM2M && result.idleTimeoutIdp ? [result.idleTimeoutIdp] : []),
    ...(!isM2M && result.idleTimeoutApp ? [result.idleTimeoutApp] : []),
  ]
  const driverCounts = numericFields.reduce<Record<string, number>>((acc, f) => {
    const d = getDriver(f.rationale)
    acc[d] = (acc[d] ?? 0) + 1
    return acc
  }, {})
  const [topDriver, topCount] = Object.entries(driverCounts).sort(([, a], [, b]) => b - a)[0]
  const dominantDriver = topCount >= 2 ? topDriver : undefined

  const showReAuth =
    !isM2M &&
    (result.reAuthTriggersIdp.length > 0 || result.reAuthTriggersApp.length > 0)

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4 sm:px-8">
        <h2 className="text-base font-semibold tracking-display text-foreground">
          Policy recommendation
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="default" size="sm" onClick={handleCopy} className="gap-1.5">
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy policy'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJSON} className="gap-1.5">
            <Download size={13} />
            Export JSON
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-6 py-6 sm:px-8">
        {/* Warnings */}
        {result.warnings.length > 0 && (
          <PolicyWarningBanner warnings={result.warnings} />
        )}

        {/* Recommended policy */}
        <section>
          <div className="flex items-baseline gap-3 mb-4">
            <h3 className="text-[11px] font-medium uppercase tracking-label text-muted-foreground">
              Recommended policy
            </h3>
            {dominantDriver && (
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${DRIVER_PILL_CLASSES[dominantDriver] ?? DEFAULT_PILL}`}>
                {dominantDriver}
              </span>
            )}
          </div>

          <div className="md:grid md:grid-cols-2 md:gap-x-8 gap-y-6 flex flex-col">
            {/* Access token — always shown */}
            <div>
              <PolicyField label="Access token lifetime" field={result.accessTokenLifetime} dominantDriver={dominantDriver} />
              <FieldCitations citations={citeFor('accessTokenLifetime')} />
            </div>

            {/* Refresh token lifetime — hidden for M2M or when null */}
            {!isM2M && result.refreshTokenLifetime !== null && (
              <div>
                <PolicyField label="Refresh token lifetime" field={result.refreshTokenLifetime} dominantDriver={dominantDriver} />
                <FieldCitations citations={citeFor('refreshTokenLifetime')} />
              </div>
            )}

            {/* Rotation — hidden for M2M or when refresh tokens not in use */}
            {!isM2M && result.refreshTokenRotation.value !== 'not-applicable' && (
              <div>
                <RotationBadge rotation={result.refreshTokenRotation} />
                <FieldCitations citations={citeFor('refreshTokenRotation')} />
              </div>
            )}
          </div>

          {!isM2M && (
            <>
              <div className="border-t border-border my-6" />

              <div className="md:grid md:grid-cols-2 md:gap-x-8 gap-y-6 flex flex-col">
                {result.absoluteSessionLimit !== null && (
                  <div>
                    <PolicyField label="Absolute session limit" field={result.absoluteSessionLimit} dominantDriver={dominantDriver} />
                    <FieldCitations citations={citeFor('absoluteSessionLimit')} />
                  </div>
                )}
                {result.idleTimeoutIdp !== null && (
                  <div>
                    <PolicyField label="Idle timeout — IdP" field={result.idleTimeoutIdp} dominantDriver={dominantDriver} />
                    <FieldCitations citations={citeFor('idleTimeoutIdp')} />
                  </div>
                )}
                {result.idleTimeoutApp !== null && (
                  <div>
                    <PolicyField label="Idle timeout — application" field={result.idleTimeoutApp} dominantDriver={dominantDriver} />
                    <FieldCitations citations={citeFor('idleTimeoutApp')} />
                  </div>
                )}
              </div>

              {isFedRAMP && (
                <UpgradeNote note={FEDRAMP_VERSION_NOTE} />
              )}
            </>
          )}

          <div className="border-t border-border my-6" />

          <div>
            <TokenStorageField storage={result.tokenStorage} />
            <FieldCitations citations={citeFor('tokenStorage')} />
          </div>
        </section>

        {/* Re-auth triggers */}
        {showReAuth && (
          <section>
            <h3 className="text-[11px] font-medium uppercase tracking-label text-muted-foreground mb-4">
              Re-authentication triggers
            </h3>
            <ReAuthTriggers
              idp={result.reAuthTriggersIdp}
              app={result.reAuthTriggersApp}
            />
          </section>
        )}

        {/* Disclaimer */}
        <div className="flex flex-col gap-2 pt-2 border-t border-border">
          {result.disclaimer.map((p, i) => (
            <p key={i} className="text-xs text-muted-foreground/70 leading-relaxed">
              {p}
            </p>
          ))}
        </div>

        {/* Start over */}
        <div className="flex justify-center pt-2">
          <Button variant="ghost" size="sm" onClick={onReset} className="gap-1.5 text-muted-foreground">
            <RotateCcw size={13} />
            Start over
          </Button>
        </div>
      </div>
    </div>
  )
}
