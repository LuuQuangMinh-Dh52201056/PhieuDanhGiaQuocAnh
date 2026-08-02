import { Check, TriangleAlert, RotateCcw } from 'lucide-react'
import type { EvaluationStatus } from '../types/evaluation'
import { STATUS_META } from '../utils/evaluation'

const statusIcons = {
  GOOD: Check,
  NOTICE: TriangleAlert,
  NEEDS_PRACTICE: RotateCcw,
}

interface StatusSelectorProps {
  value: EvaluationStatus | null
  onChange: (status: EvaluationStatus) => void
  lessonName: string
  lessonId: string
}

export function StatusSelector({ value, onChange, lessonName, lessonId }: StatusSelectorProps) {
  return (
    <div className="status-selector" role="radiogroup" aria-label={`Mức đánh giá: ${lessonName}`}>
      {(Object.keys(STATUS_META) as EvaluationStatus[]).map((status) => {
        const meta = STATUS_META[status]
        const Icon = statusIcons[status]
        return (
          <button
            type="button"
            key={status}
            data-testid={`status-${lessonId}-${status}`}
            className={`status-button status-button--${meta.className} ${value === status ? 'is-selected' : ''}`}
            onClick={() => onChange(status)}
            role="radio"
            aria-checked={value === status}
            aria-label={`${meta.label} cho ${lessonName}`}
          >
            <Icon size={18} strokeWidth={2.4} />
            <span>{meta.label}</span>
          </button>
        )
      })}
    </div>
  )
}
