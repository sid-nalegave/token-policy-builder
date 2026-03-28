import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StepNavigatorProps {
  onBack: () => void
  onNext: () => void
  canGoBack: boolean
  showNext: boolean
}

export function StepNavigator({
  onBack,
  onNext,
  canGoBack,
  showNext,
}: StepNavigatorProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        {canGoBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft data-icon="inline-start" />
            Back
          </Button>
        )}
      </div>
      <div>
        {showNext && (
          <Button size="sm" onClick={onNext}>
            Next
            <ChevronRight data-icon="inline-end" />
          </Button>
        )}
      </div>
    </div>
  )
}
