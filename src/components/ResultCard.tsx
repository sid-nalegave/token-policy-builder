import { useState } from 'react'
import { Copy, Check, Download, RotateCcw } from 'lucide-react'
import type { PolicyResult, PolicyInputs } from '@/engine/types'
import { Button } from '@/components/ui/button'
import { PolicyWarningBanner } from './PolicyWarningBanner'
import { PolicyField } from './PolicyField'
import { RotationBadge } from './RotationBadge'
import { TokenStorageField } from './TokenStorageField'
import { ReAuthTriggers } from './ReAuthTriggers'
import { CitationsPanel } from './CitationsPanel'
import { UpgradeNote } from './UpgradeNote'
import { toPolicyStatement } from '@/lib/toPolicyStatement'

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
          <h3 className="text-[11px] font-medium uppercase tracking-label text-muted-foreground mb-4">
            Recommended policy
          </h3>

          <div className="md:grid md:grid-cols-2 md:gap-x-8 gap-y-6 flex flex-col">
            {/* Access token — always shown */}
            <PolicyField label="Access token lifetime" field={result.accessTokenLifetime} />

            {/* Refresh token lifetime — hidden for M2M or when null */}
            {!isM2M && result.refreshTokenLifetime !== null && (
              <PolicyField
                label="Refresh token lifetime"
                field={result.refreshTokenLifetime}
              />
            )}

            {/* Rotation — hidden for M2M or when refresh tokens not in use */}
            {!isM2M && result.refreshTokenRotation.value !== 'not-applicable' && (
              <div className="md:col-span-2">
                <RotationBadge rotation={result.refreshTokenRotation} />
              </div>
            )}
          </div>

          {!isM2M && (
            <>
              <div className="border-t border-border my-6" />

              <div className="md:grid md:grid-cols-2 md:gap-x-8 gap-y-6 flex flex-col">
                {result.absoluteSessionLimit !== null && (
                  <PolicyField
                    label="Absolute session limit"
                    field={result.absoluteSessionLimit}
                  />
                )}
                {result.idleTimeoutIdp !== null && (
                  <PolicyField
                    label="Idle timeout — IdP"
                    field={result.idleTimeoutIdp}
                  />
                )}
                {result.idleTimeoutApp !== null && (
                  <PolicyField
                    label="Idle timeout — application"
                    field={result.idleTimeoutApp}
                  />
                )}
              </div>

              {isFedRAMP && (
                <UpgradeNote note={FEDRAMP_VERSION_NOTE} />
              )}
            </>
          )}

          <div className="border-t border-border my-6" />

          <TokenStorageField storage={result.tokenStorage} />
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

        {/* Citations */}
        {result.citations.length > 0 && (
          <section>
            <h3 className="text-[11px] font-medium uppercase tracking-label text-muted-foreground mb-2">
              Standards references
            </h3>
            <CitationsPanel citations={result.citations} />
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
