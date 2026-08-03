import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CheckCheck, ClipboardCheck, MessageSquareText } from 'lucide-react'
import { AppHeader } from '../components/AppHeader'
import { VEHICLE_LABELS } from '../data/lessonConfigs'
import { getChecklistOverallOptions, getChecklistRatingOptions } from '../data/checklistConfigs'
import type { ChecklistItemEvaluation, ChecklistRating, EvaluationState } from '../types/evaluation'

interface ChecklistEvaluationPageProps {
  state: EvaluationState
  onChange: (updates: Partial<EvaluationState>) => void
  onBack: () => void
  onPreview: () => void
}

const basicComments = [
  'Tiếp thu tốt',
  'Cần làm quen thêm với xe',
  'Cần luyện thao tác bàn đạp',
  'Cần luyện thêm vô lăng',
  'Cần cải thiện quan sát',
  'Cần luyện tập thêm',
]

const roadComments = [
  'Đạt yêu cầu',
  'Cần giữ làn tốt hơn',
  'Cần kiểm soát tốc độ',
  'Cần quan sát biển báo',
  'Cần ổn định tâm lý',
  'Cần luyện tập thêm',
]

export function ChecklistEvaluationPage({ state, onChange, onBack, onPreview }: ChecklistEvaluationPageProps) {
  const [validationMessage, setValidationMessage] = useState('')
  const isRoad = state.trainingType === 'ROAD'
  const ratingOptions = getChecklistRatingOptions(state.trainingType ?? 'BASIC')
  const overallOptions = getChecklistOverallOptions(state.trainingType ?? 'BASIC')
  const completed = useMemo(() => state.checklistItems.filter((item) => item.rating).length, [state.checklistItems])
  const positiveRating: ChecklistRating = isRoad ? 'GOOD' : 'UNDERSTOOD'
  const comments = isRoad ? roadComments : basicComments

  const updateItem = (item: ChecklistItemEvaluation, rating: ChecklistRating) => {
    onChange({
      checklistItems: state.checklistItems.map((current) => current.id === item.id ? { ...current, rating } : current),
    })
    if (validationMessage) setValidationMessage('')
  }

  const markAllPositive = () => {
    onChange({ checklistItems: state.checklistItems.map((item) => ({ ...item, rating: positiveRating })) })
    setValidationMessage('')
  }

  const addComment = (comment: string) => {
    if (state.teacherComment.includes(comment)) return
    const separator = state.teacherComment.trim() ? ' • ' : ''
    onChange({ teacherComment: `${state.teacherComment.trim()}${separator}${comment}` })
  }

  const validate = () => {
    const missing = state.checklistItems.find((item) => !item.rating)
    if (missing) {
      setValidationMessage(`Vui lòng tích một mức đánh giá cho mục ${missing.order}: ${missing.title}.`)
      document.getElementById(`checklist-${missing.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (!state.checklistOverall) {
      setValidationMessage('Vui lòng tích một mức đánh giá chung trước khi xem phiếu.')
      document.getElementById('checklist-overall')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    onPreview()
  }

  return (
    <div className="app-shell checklist-shell">
      <AppHeader activeStep={4} />
      <main className="content-page checklist-page">
        <section className="checklist-intro">
          <div className="page-heading page-heading--light">
            <div className="page-heading__number">04</div>
            <div>
              <span>HẠNG XE {state.vehicleCategory ? VEHICLE_LABELS[state.vehicleCategory] : ''}</span>
              <h1>{isRoad ? 'Phiếu đánh giá đường trường' : 'Phiếu đánh giá buổi học cơ bản'}</h1>
              <p>Chạm vào một ô ở mỗi nội dung để tích đánh giá. Không cần nhập lỗi chi tiết.</p>
            </div>
          </div>

          <div className="checklist-progress">
            <div><strong>{completed}</strong><span>/ {state.checklistItems.length} nội dung đã tích</span></div>
            <div className="progress-bar"><span style={{ width: `${(completed / state.checklistItems.length) * 100}%` }} /></div>
            <button type="button" onClick={markAllPositive}><CheckCheck size={18} /> Đánh dấu tất cả là {isRoad ? 'Tốt' : 'Đã hiểu'}</button>
          </div>
        </section>

        <section className="checklist-list" aria-label={isRoad ? 'Đánh giá đường trường' : 'Đánh giá tập cơ bản'}>
          <div className={`checklist-column-guide checklist-column-guide--${ratingOptions.length}`}>
            <span>NỘI DUNG</span>
            {ratingOptions.map((option) => <span key={option.id}>{option.label}</span>)}
          </div>
          {state.checklistItems.map((item) => (
            <article className="checklist-item-card" id={`checklist-${item.id}`} key={item.id}>
              <div className="checklist-item-copy">
                <span className="checklist-item-number">{String(item.order).padStart(2, '0')}</span>
                <div>
                  <strong>{item.title}</strong>
                  {item.description && <small>({item.description})</small>}
                </div>
              </div>
              <div className={`checklist-rating-grid checklist-rating-grid--${ratingOptions.length}`} role="radiogroup" aria-label={`Đánh giá ${item.title}`}>
                {ratingOptions.map((option) => (
                  <button
                    type="button"
                    key={option.id}
                    data-testid={`check-${item.id}-${option.id}`}
                    className={item.rating === option.id ? 'is-selected' : ''}
                    onClick={() => updateItem(item, option.id)}
                    role="radio"
                    aria-checked={item.rating === option.id}
                    aria-label={`${option.label} cho ${item.title}`}
                  >
                    <span>{item.rating === option.id && <Check size={18} strokeWidth={3} />}</span>
                    <small>{option.label}</small>
                  </button>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="checklist-overall-card" id="checklist-overall">
          <div><small>II. ĐÁNH GIÁ CHUNG</small><h2>Tích kết quả chung của buổi học</h2></div>
          <div className="checklist-overall-options">
            {overallOptions.map((option) => (
              <button
                type="button"
                key={option.id}
                data-testid={`overall-${option.id}`}
                className={state.checklistOverall === option.id ? 'is-selected' : ''}
                onClick={() => { onChange({ checklistOverall: option.id }); setValidationMessage('') }}
              >
                <span>{state.checklistOverall === option.id && <Check size={19} strokeWidth={3} />}</span>
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className="teacher-comment-card checklist-comment-card">
          <div className="teacher-comment-card__heading">
            <div className="comment-icon"><MessageSquareText size={25} /></div>
            <div><small>III. NHẬN XÉT CỦA GIÁO VIÊN</small><h2>Nhận xét cuối buổi học</h2></div>
          </div>
          <textarea
            value={state.teacherComment}
            onChange={(event) => onChange({ teacherComment: event.target.value })}
            placeholder="Nhập nhận xét của giáo viên..."
            maxLength={500}
            aria-label="Nhận xét của giáo viên"
          />
          <div className="comment-toolbar">
            <div className="quick-comments">
              {comments.map((comment) => (
                <button type="button" key={comment} onClick={() => addComment(comment)} className={state.teacherComment.includes(comment) ? 'is-added' : ''}>
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
          <div className="evaluation-actions__note"><strong>{completed}/{state.checklistItems.length}</strong><span>nội dung đã tích</span></div>
          <button className="button button--green button--large" type="button" onClick={validate}>Xem phiếu đánh giá <ArrowRight size={19} /></button>
        </div>
      </main>
    </div>
  )
}
