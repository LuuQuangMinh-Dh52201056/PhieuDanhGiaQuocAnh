import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCheck, ClipboardCheck, MessageSquareText, Sparkles } from 'lucide-react'
import { AppHeader } from '../components/AppHeader'
import { AppFooter } from '../components/AppFooter'
import { LessonEvaluationCard } from '../components/LessonEvaluationCard'
import { VEHICLE_LABELS } from '../data/lessonConfigs'
import type { EvaluationState, LessonEvaluation } from '../types/evaluation'

interface EvaluationPageProps {
  state: EvaluationState
  onChange: (updates: Partial<EvaluationState>) => void
  onBack: () => void
  onPreview: () => void
}

const courseQuickComments = [
  'Tiếp thu tốt',
  'Cần luyện dốc cầu',
  'Cần luyện ghép xe',
  'Cần cải thiện canh bánh xe',
  'Cần ổn định tâm lý',
  'Có thể thi thử',
]

export function EvaluationPage({ state, onChange, onBack, onPreview }: EvaluationPageProps) {
  const [validationMessage, setValidationMessage] = useState('')
  const itemLabel = 'bài'
  const quickComments = courseQuickComments
  const completed = useMemo(() => state.lessons.filter((lesson) => lesson.status).length, [state.lessons])

  const updateLesson = (updated: LessonEvaluation) => {
    onChange({ lessons: state.lessons.map((lesson) => lesson.id === updated.id ? updated : lesson) })
    if (validationMessage) setValidationMessage('')
  }

  const updateEmergency = (updated: LessonEvaluation) => {
    onChange({ emergencyEvaluation: updated })
    if (validationMessage) setValidationMessage('')
  }

  const markRemainingGood = () => {
    onChange({
      lessons: state.lessons.map((lesson) => lesson.status ? lesson : { ...lesson, status: 'GOOD' as const }),
    })
  }

  const addQuickComment = (comment: string) => {
    if (state.teacherComment.includes(comment)) return
    const separator = state.teacherComment.trim() ? ' • ' : ''
    onChange({ teacherComment: `${state.teacherComment.trim()}${separator}${comment}` })
  }

  const validateAndPreview = () => {
    const missing = state.lessons.find((lesson) => !lesson.status)
    if (missing) {
      setValidationMessage(`Vui lòng chọn mức đánh giá cho Bài ${missing.order}: ${missing.name}.`)
      document.getElementById(`lesson-${missing.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (!state.emergencyEvaluation?.status) {
      setValidationMessage('Vui lòng đánh giá phần xử lý tình huống khẩn cấp.')
      document.getElementById('lesson-emergency')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    onPreview()
  }

  return (
    <div className="app-shell evaluation-shell">
      <AppHeader activeStep={4} />
      <main className="content-page evaluation-page">
        <section className="evaluation-intro">
          <div className="page-heading page-heading--light">
            <div className="page-heading__number">04</div>
            <div>
              <span>HẠNG XE {state.vehicleCategory ? VEHICLE_LABELS[state.vehicleCategory] : ''}</span>
              <h1>Đánh giá từng bài thi</h1>
              <p>Chọn một mức đánh giá, ghi nhận lỗi và thêm nhận xét nếu cần.</p>
            </div>
          </div>

          <div className="evaluation-progress-card">
            <div className="progress-ring" style={{ '--progress': `${(completed / state.lessons.length) * 360}deg` } as React.CSSProperties}>
              <div><strong>{completed}</strong><span>/ {state.lessons.length}</span></div>
            </div>
            <div className="progress-copy">
              <small>TIẾN ĐỘ ĐÁNH GIÁ</small>
              <strong>{completed === state.lessons.length ? `Đã hoàn thành ${state.lessons.length} ${itemLabel}` : `Còn ${state.lessons.length - completed} ${itemLabel} chưa đánh giá`}</strong>
              <div className="progress-bar"><span style={{ width: `${(completed / state.lessons.length) * 100}%` }} /></div>
            </div>
            <button type="button" onClick={markRemainingGood}><CheckCheck size={18} /> Đánh dấu {itemLabel} còn lại là Tốt</button>
          </div>
        </section>

        <div className="lesson-list">
          {state.lessons.map((lesson) => (
            <LessonEvaluationCard key={lesson.id} lesson={lesson} onChange={updateLesson} />
          ))}
        </div>

        {state.emergencyEvaluation && (
          <section className="emergency-wrap">
            <div className="section-divider">
              <span><Sparkles size={16} /> TÌNH HUỐNG KHẨN CẤP</span>
              <p>Mục đánh giá riêng, không tính vào tổng số bài thi chính.</p>
            </div>
            <LessonEvaluationCard lesson={state.emergencyEvaluation} onChange={updateEmergency} isEmergency />
          </section>
        )}

        <section className="teacher-comment-card">
          <div className="teacher-comment-card__heading">
            <div className="comment-icon"><MessageSquareText size={25} /></div>
            <div><small>TỔNG KẾT CUỐI BUỔI</small><h2>Nhận xét của giáo viên</h2></div>
          </div>
          <textarea
            value={state.teacherComment}
            onChange={(event) => onChange({ teacherComment: event.target.value })}
            placeholder="Nhập nhận xét tổng quan về kỹ năng, tâm lý và nội dung học viên cần luyện thêm..."
            maxLength={500}
            aria-label="Nhận xét của giáo viên"
          />
          <div className="comment-toolbar">
            <div className="quick-comments">
              {quickComments.map((comment) => (
                <button type="button" key={comment} onClick={() => addQuickComment(comment)} className={state.teacherComment.includes(comment) ? 'is-added' : ''}>
                  <span>+</span> {comment}
                </button>
              ))}
            </div>
            <small>{state.teacherComment.length}/500</small>
          </div>
        </section>

        {validationMessage && <div className="validation-banner" role="alert"><ClipboardCheck size={20} /><span>{validationMessage}</span></div>}

        <div className="evaluation-actions">
          <button className="button button--ghost" type="button" onClick={onBack}><ArrowLeft size={18} /> Sửa thông tin</button>
          <div className="evaluation-actions__note"><strong>{completed}/{state.lessons.length}</strong><span>{itemLabel} đã đánh giá</span></div>
          <button className="button button--primary button--large" type="button" onClick={validateAndPreview}>Xem phiếu đánh giá <ArrowRight size={19} /></button>
        </div>
      </main>
      <AppFooter />
    </div>
  )
}
