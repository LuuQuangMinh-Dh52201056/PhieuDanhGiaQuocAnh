import { ChevronRight, CircleCheck, Target, MessageSquareText } from 'lucide-react'
import type { EvaluationStatus, LessonEvaluation } from '../types/evaluation'
import { StatusSelector } from './StatusSelector'

interface LessonEvaluationCardProps {
  lesson: LessonEvaluation
  onChange: (lesson: LessonEvaluation) => void
  isEmergency?: boolean
}

export function LessonEvaluationCard({ lesson, onChange, isEmergency = false }: LessonEvaluationCardProps) {
  const isBasicSkill = lesson.id.startsWith('basic-')
  const setStatus = (status: EvaluationStatus) => {
    onChange({
      ...lesson,
      status,
      selectedErrors: status === 'GOOD' ? [] : lesson.selectedErrors,
    })
  }

  const toggleError = (error: string) => {
    const selected = lesson.selectedErrors.includes(error)
    const selectedErrors = selected
      ? lesson.selectedErrors.filter((item) => item !== error)
      : [...lesson.selectedErrors, error]
    onChange({
      ...lesson,
      selectedErrors,
      status: !selected && lesson.status === 'GOOD' ? 'NOTICE' : lesson.status,
    })
  }

  return (
    <article
      id={`lesson-${lesson.id}`}
      className={`lesson-card ${lesson.status ? `lesson-card--${lesson.status.toLowerCase()}` : ''} ${isEmergency ? 'lesson-card--emergency' : ''}`}
    >
      <header className="lesson-card__header">
        <div className="lesson-index" aria-hidden="true">
          {isEmergency ? '!' : String(lesson.order).padStart(2, '0')}
        </div>
        <div className="lesson-title">
          <span>{isEmergency ? 'ĐÁNH GIÁ RIÊNG' : `${isBasicSkill ? 'KỸ NĂNG' : 'BÀI'} ${lesson.order}`}</span>
          <h3>{lesson.name}</h3>
        </div>
        <div className="lesson-symbol" aria-hidden="true">{lesson.symbol}</div>
      </header>

      <div className="lesson-card__body">
        <StatusSelector
          value={lesson.status}
          onChange={setStatus}
          lessonName={lesson.name}
          lessonId={lesson.id}
        />

        <div className="focus-line">
          <Target size={17} />
          <strong>Trọng điểm:</strong>
          <span>{lesson.focus.join(' • ')}</span>
        </div>

        <div className="error-section">
          <div className="section-mini-title">
            <CircleCheck size={17} />
            <span>Lỗi ghi nhận</span>
            <small>Chọn nếu học viên mắc lỗi</small>
          </div>
          <div className="error-grid">
            {lesson.errors.map((error) => {
              const id = `${lesson.id}-${error}`.replace(/\s+/g, '-').toLowerCase()
              return (
                <label key={error} className={`error-option ${lesson.selectedErrors.includes(error) ? 'is-selected' : ''}`} htmlFor={id}>
                  <input
                    id={id}
                    type="checkbox"
                    checked={lesson.selectedErrors.includes(error)}
                    onChange={() => toggleError(error)}
                  />
                  <span className="custom-check"><CheckIcon /></span>
                  <span>{error}</span>
                </label>
              )
            })}
          </div>
        </div>

        <label className="lesson-note">
          <MessageSquareText size={17} />
          <span>Ghi chú thêm</span>
          <ChevronRight size={15} />
          <input
            type="text"
            value={lesson.note}
            onChange={(event) => onChange({ ...lesson, note: event.target.value })}
            maxLength={140}
            placeholder="Nhập nhận xét ngắn cho bài này..."
            aria-label={`Ghi chú cho ${lesson.name}`}
          />
        </label>
      </div>
    </article>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 14 14" aria-hidden="true">
      <path d="m3 7 2.5 2.5L11 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
