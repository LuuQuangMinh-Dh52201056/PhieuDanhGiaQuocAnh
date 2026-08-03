import { ArrowLeft, ArrowRight, CalendarDays, CarFront, GraduationCap, Hash, UserRound } from 'lucide-react'
import { AppHeader } from '../components/AppHeader'
import { VEHICLE_LABELS } from '../data/lessonConfigs'
import type { EvaluationState } from '../types/evaluation'

interface StudentInformationPageProps {
  state: EvaluationState
  onChange: (updates: Partial<EvaluationState>) => void
  onBack: () => void
  onContinue: () => void
}

export function StudentInformationPage({ state, onChange, onBack, onContinue }: StudentInformationPageProps) {
  const trainingLabel = state.trainingType === 'BASIC' ? 'TẬP CƠ BẢN' : 'SA HÌNH'
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    onContinue()
  }

  return (
    <div className="app-shell">
      <AppHeader activeStep={3} centerBrand={state.trainingType === 'BASIC'} />
      <main className="content-page content-page--narrow">
        <div className="page-heading">
          <div className="page-heading__number">03</div>
          <div>
            <span>THÔNG TIN BUỔI ĐÁNH GIÁ</span>
            <h1>Thông tin học viên</h1>
            <p>Nhập các thông tin cần thiết trước khi bắt đầu chấm bài.</p>
          </div>
        </div>

        <form className="info-card" onSubmit={submit}>
          <div className="vehicle-summary">
            <div className="vehicle-summary__icon"><CarFront size={25} /></div>
            <div><small>HẠNG XE • NỘI DUNG TẬP</small><strong>{state.vehicleCategory ? VEHICLE_LABELS[state.vehicleCategory] : '—'} • {trainingLabel}</strong></div>
            <button type="button" onClick={onBack}>Đổi nội dung</button>
          </div>

          <div className="form-grid">
            <label className="field field--wide">
              <span><UserRound size={17} /> Họ và tên học viên <b>*</b></span>
              <input
                autoFocus
                required
                value={state.studentName}
                onChange={(event) => onChange({ studentName: event.target.value })}
                placeholder="Ví dụ: Nguyễn Văn An"
                aria-label="Họ và tên học viên"
              />
            </label>

            <label className="field">
              <span><CalendarDays size={17} /> Ngày đánh giá</span>
              <input type="date" value={state.evaluationDate} onChange={(event) => onChange({ evaluationDate: event.target.value })} aria-label="Ngày đánh giá" />
            </label>

            <label className="field">
              <span><GraduationCap size={17} /> Giáo viên hướng dẫn</span>
              <input value={state.instructorName} onChange={(event) => onChange({ instructorName: event.target.value })} placeholder="Họ tên giáo viên" aria-label="Giáo viên hướng dẫn" />
            </label>

            <label className="field">
              <span><CarFront size={17} /> Số xe</span>
              <input value={state.vehicleNumber} onChange={(event) => onChange({ vehicleNumber: event.target.value })} placeholder="Ví dụ: 51H-123.45" aria-label="Số xe" />
            </label>

            <label className="field">
              <span><Hash size={17} /> Lần tập thứ</span>
              <input type="number" min="1" max="999" inputMode="numeric" value={state.practiceAttempt} onChange={(event) => onChange({ practiceAttempt: event.target.value })} placeholder="Ví dụ: 07" aria-label="Lần tập thứ" />
            </label>
          </div>

          <div className="form-note">
            <ShieldNotice />
            <p><strong>Quyền riêng tư:</strong> Thông tin chỉ tồn tại trong lúc trang đang mở và sẽ bị xóa khi tải lại.</p>
          </div>

          <div className="form-actions">
            <button className="button button--ghost" type="button" onClick={onBack}><ArrowLeft size={18} /> Quay lại</button>
            <button className="button button--primary" type="submit">Bắt đầu đánh giá <ArrowRight size={18} /></button>
          </div>
        </form>
      </main>
    </div>
  )
}

function ShieldNotice() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 3 27 7v7c0 7-4.2 12.2-11 15C9.2 26.2 5 21 5 14V7l11-4Z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="m11 16 3 3 7-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
