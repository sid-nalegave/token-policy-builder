import { Info } from 'lucide-react'
import type { StepConfig } from '@/types/steps'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface StepQuestionProps {
  step: StepConfig
  selectedValue: string | undefined
  onSelect: (value: string) => void
}

export function StepQuestion({
  step,
  selectedValue,
  onSelect,
}: StepQuestionProps) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-medium uppercase tracking-label text-muted-foreground">
          {step.label}
        </span>
        <div className="flex items-start gap-2.5">
          <h2 className="text-lg font-semibold tracking-display text-foreground leading-snug sm:text-xl">
            {step.question}
          </h2>
          <Popover>
            {/* openOnHover is a PopoverTrigger prop in base-ui v1.3, not on the Root */}
            <PopoverTrigger
              openOnHover
              className="mt-0.5 inline-flex shrink-0 items-center justify-center rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label={`More info about ${step.label}`}
            >
              <Info className="size-4" />
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="max-w-xs">
              <p className="text-sm leading-relaxed text-popover-foreground">
                {step.tooltip}
              </p>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div role="radiogroup" aria-label={step.question} className="flex flex-col gap-2.5">
        {step.options.map((option) => {
          const isSelected = selectedValue === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(option.value)}
              className={cn(
                'group flex flex-col gap-1 rounded-lg border px-5 py-4 text-left outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring',
                isSelected
                  ? 'border-primary bg-accent shadow-sm ring-1 ring-primary/20'
                  : 'border-border bg-card hover:border-primary/30 hover:shadow-sm'
              )}
            >
              <span
                className={cn(
                  'text-[15px] font-medium',
                  isSelected ? 'text-accent-foreground' : 'text-foreground'
                )}
              >
                {option.label}
              </span>
              <span className="text-[13px] leading-relaxed text-muted-foreground">
                {option.inlineDescription ?? option.description}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
