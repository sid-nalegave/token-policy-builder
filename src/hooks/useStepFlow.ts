import { useState, useCallback, useMemo } from 'react'
import type { PolicyInputs } from '@/engine/types'
import { STEP_CONFIGS } from '@/data/stepConfigs'

function clearSkippedInputs(inputs: PolicyInputs): PolicyInputs {
  const next = { ...inputs }
  for (const step of STEP_CONFIGS) {
    if (step.skippable(next)) {
      delete next[step.id]
    }
  }
  return next
}

function findNextUnskipped(
  fromIndex: number,
  direction: 1 | -1,
  inputs: PolicyInputs
): number | null {
  let i = fromIndex + direction
  while (i >= 0 && i < STEP_CONFIGS.length) {
    if (!STEP_CONFIGS[i].skippable(inputs)) return i
    i += direction
  }
  return null
}

export function useStepFlow() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [inputs, setInputs] = useState<PolicyInputs>({})
  const [direction, setDirection] = useState(1)

  const setAnswer = useCallback(
    (stepId: keyof PolicyInputs, value: string) => {
      const stepIdx = STEP_CONFIGS.findIndex((s) => s.id === stepId)
      const updated = clearSkippedInputs({
        ...inputs,
        [stepId]: value,
      })
      setInputs(updated)

      const next = findNextUnskipped(stepIdx, 1, updated)
      if (next !== null) {
        setDirection(1)
        setCurrentStepIndex(next)
      }
    },
    [inputs]
  )

  const goBack = useCallback(() => {
    const prev = findNextUnskipped(currentStepIndex, -1, inputs)
    if (prev !== null) {
      setDirection(-1)
      setCurrentStepIndex(prev)
    }
  }, [currentStepIndex, inputs])

  const goToStep = useCallback(
    (index: number) => {
      const step = STEP_CONFIGS[index]
      if (!step) return
      if (index === currentStepIndex) return
      if (step.skippable(inputs)) return
      if (inputs[step.id] === undefined) return
      setDirection(index > currentStepIndex ? 1 : -1)
      setCurrentStepIndex(index)
    },
    [inputs, currentStepIndex]
  )

  const goForward = useCallback(() => {
    const next = findNextUnskipped(currentStepIndex, 1, inputs)
    if (next !== null) {
      setDirection(1)
      setCurrentStepIndex(next)
    }
  }, [currentStepIndex, inputs])

  const currentStep = STEP_CONFIGS[currentStepIndex]

  const isComplete = useMemo(() => {
    return STEP_CONFIGS.every(
      (step) => step.skippable(inputs) || inputs[step.id] !== undefined
    )
  }, [inputs])

  const canGoBack = findNextUnskipped(currentStepIndex, -1, inputs) !== null

  const reset = useCallback(() => {
    setInputs({})
    setCurrentStepIndex(0)
    setDirection(1)
  }, [])

  return {
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
    totalSteps: STEP_CONFIGS.length,
  }
}
