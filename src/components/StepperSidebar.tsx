import { Check } from 'lucide-react'
import type { StepConfig, PolicyInputs } from '@/types/steps'
import { cn } from '@/lib/utils'

interface StepperSidebarProps {
  steps: StepConfig[]
  currentIndex: number
  inputs: PolicyInputs
  onStepClick: (index: number) => void
}

type StepState = 'completed' | 'active' | 'skipped' | 'upcoming'

function getStepState(
  step: StepConfig,
  index: number,
  currentIndex: number,
  inputs: PolicyInputs
): StepState {
  if (step.skippable(inputs)) return 'skipped'
  if (index === currentIndex) return 'active'
  if (inputs[step.id] !== undefined) return 'completed'
  return 'upcoming'
}

/** Desktop: vertical sidebar. Mobile: compact "Step N of 7" line. */
export function StepperSidebar({
  steps,
  currentIndex,
  inputs,
  onStepClick,
}: StepperSidebarProps) {
  const activeStep = steps[currentIndex]
  const activeState = getStepState(activeStep, currentIndex, currentIndex, inputs)

  return (
    <>
      {/* Mobile: compact indicator */}
      <div className="flex items-center gap-2 md:hidden">
        <span className="text-xs font-medium text-muted-foreground">
          Step {currentIndex + 1} of {steps.length}
        </span>
        <span className="text-xs text-muted-foreground">·</span>
        <span className="text-xs font-medium text-foreground">
          {activeState === 'skipped' ? 'N/A' : activeStep.label}
        </span>
      </div>

      {/* Desktop: vertical step list */}
      <nav aria-label="Progress" className="hidden md:flex md:flex-col md:gap-0.5">
        <span className="mb-2 px-3 text-[11px] font-medium uppercase tracking-label text-muted-foreground">
          Step {currentIndex + 1} of {steps.length}
        </span>
        {steps.map((step, i) => {
          const state = getStepState(step, i, currentIndex, inputs)
          const isClickable = state === 'completed'

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => isClickable && onStepClick(i)}
              disabled={!isClickable}
              aria-current={state === 'active' ? 'step' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                state === 'active' && 'bg-accent',
                state === 'completed' && 'hover:bg-secondary',
                isClickable && 'cursor-pointer',
                !isClickable && 'cursor-default'
              )}
            >
              {/* Indicator */}
              <div
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium transition-colors',
                  state === 'completed' &&
                    'bg-primary text-primary-foreground',
                  state === 'active' &&
                    'border-2 border-primary text-primary bg-card',
                  state === 'skipped' &&
                    'border border-dashed border-border text-muted-foreground',
                  state === 'upcoming' &&
                    'border border-border text-muted-foreground'
                )}
              >
                {state === 'completed' ? (
                  <Check className="size-3" strokeWidth={2.5} />
                ) : (
                  i + 1
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-sm leading-tight',
                  state === 'completed' && 'text-foreground',
                  state === 'active' && 'font-medium text-accent-foreground',
                  state === 'skipped' && 'text-muted-foreground line-through',
                  state === 'upcoming' && 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>

              {/* Skipped badge */}
              {state === 'skipped' && (
                <span className="ml-auto shrink-0 text-[10px] uppercase tracking-label text-muted-foreground">
                  N/A
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </>
  )
}
