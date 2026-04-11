import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStepFlow } from '@/hooks/useStepFlow'
import { STEP_CONFIGS } from '@/data/stepConfigs'
import { StepperSidebar } from '@/components/StepperSidebar'
import { StepQuestion } from '@/components/StepQuestion'
import { StepNavigator } from '@/components/StepNavigator'
import { ResultCard } from '@/components/ResultCard'
import { computePolicy } from '@/engine'
import type { PolicyInputs } from '@/engine/types'

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
}

function App() {
  const {
    currentStepIndex,
    inputs,
    direction,
    currentStep,
    setAnswer,
    goBack,
    goForward,
    goToStep,
    isComplete,
    canGoBack,
    reset,
  } = useStepFlow()

  const result = useMemo(
    () => (isComplete ? computePolicy(inputs as PolicyInputs) : null),
    [inputs, isComplete]
  )

  const currentValue = inputs[currentStep.id]
  const showNext = currentValue !== undefined

  return (
    <div className="min-h-screen bg-secondary/50 text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-4xl px-5 py-5 sm:px-8 sm:py-6">
          <h1 className="text-lg font-semibold tracking-display text-foreground sm:text-xl">
            Token Policy
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Get token lifetime and session policy recommendations with NIST and RFC citations.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
        {isComplete && result ? (
          <ResultCard
            result={result}
            inputs={inputs}
            onReset={reset}
          />
        ) : (
          <div className="rounded-xl border border-border bg-card shadow-sm">
            {/* Mobile: step indicator above content */}
            <div className="border-b border-border px-5 py-3 md:hidden">
              <StepperSidebar
                steps={STEP_CONFIGS}
                currentIndex={currentStepIndex}
                inputs={inputs}
                onStepClick={goToStep}
              />
            </div>

            <div className="md:flex">
              {/* Desktop: sidebar */}
              <div className="hidden md:flex md:w-52 md:shrink-0 md:flex-col md:border-r md:border-border md:px-4 md:py-6">
                <StepperSidebar
                  steps={STEP_CONFIGS}
                  currentIndex={currentStepIndex}
                  inputs={inputs}
                  onStepClick={goToStep}
                />
              </div>

              {/* Question + navigator */}
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex-1 overflow-x-hidden px-6 py-8 sm:px-8 sm:py-10">
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={currentStepIndex}
                      variants={variants}
                      custom={direction}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                    >
                      <StepQuestion
                        step={currentStep}
                        selectedValue={currentValue}
                        onSelect={(value) =>
                          setAnswer(currentStep.id, value)
                        }
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="border-t border-border px-6 py-4 sm:px-8">
                  <StepNavigator
                    onBack={goBack}
                    onNext={goForward}
                    canGoBack={canGoBack}
                    showNext={showNext}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
