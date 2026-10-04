import { ArrowLeft, ArrowRight, BookOpenText, CalendarDays, CarFront, GraduationCap, Hash, PencilLine, Truck, UserRound } from 'lucide-react'
import { AppHeader } from '../components/AppHeader'
import { AppFooter } from '../components/AppFooter'
import { VEHICLE_LABELS } from '../data/lessonConfigs'
import type { EvaluationState } from '../types/evaluation'
import { formatDate } from '../utils/evaluation'

interface StudentInformationPageProps {
  state: EvaluationState
  onChange: (updates: Partial<EvaluationState>) => void
  onBack: () => void
  onContinue: () => void
}

export function StudentInformationPage({ state, onChange, onBack, onContinue }: StudentInformationPageProps) {
  const trainingLabel = state.trainingType === 'BASIC' ? 'TẬP CƠ BẢN' : state.trainingType === 'ROAD' ? 'ĐƯỜNG TRƯỜNG' : 'SA HÌNH'
  const vehicleCode = state.vehicleCategory === 'B_MANUAL' ? 'BSS' : state.vehicleCategory === 'B_AUTOMATIC' ? 'BTĐ' : 'C1'
  const VehicleIcon = state.vehicleCategory === 'C1' ? Truck : CarFront
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    onContinue()
  }

  return (
    <div className="app-shell lx-student-page">
      <AppHeader activeStep={3} />
      <main className="content-page content-page--narrow">
        <div className="page-heading">
          <div className="page-heading__number">03</div>
          <div>
            <span>HỒ SƠ BUỔI HỌC</span>
            <h1>Thông tin học viên</h1>
            <p>Hoàn thiện hồ sơ để phiếu đánh giá được rõ ràng và chính xác.</p>
          </div>
        </div>

        <form className="info-card" onSubmit={submit}>
          <div className="vehicle-summary">
            <div className="vehicle-summary__icon"><VehicleIcon size={26} aria-hidden="true" /></div>
            <div className="vehicle-summary__copy">
              <small>HẠNG XE & NỘI DUNG ĐÃ CHỌN</small>
              <strong>{state.vehicleCategory ? VEHICLE_LABELS[state.vehicleCategory] : '—'} <span aria-hidden="true">/</span> {trainingLabel}</strong>
              <span className="student-session-code">{vehicleCode} <i aria-hidden="true" /> PHIẾU ĐÁNH GIÁ THỰC HÀNH</span>
            </div>
            <button type="button" onClick={onBack}><PencilLine size={15} aria-hidden="true" /> Đổi nội dung</button>
          </div>

          <div className="student-form-prelude">
            <div><span className="student-form-prelude__icon"><UserRound size={19} aria-hidden="true" /></span><h2>Thông tin buổi học</h2></div>
            <p>Dấu <b>*</b> là thông tin bắt buộc</p>
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
              <div className="date-input-control">
                <strong>{formatDate(state.evaluationDate)}</strong>
                <CalendarDays size={19} aria-hidden="true" />
                <input type="date" value={state.evaluationDate} onChange={(event) => onChange({ evaluationDate: event.target.value })} aria-label="Ngày đánh giá" />
              </div>
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

            <label className="field field--wide student-course-field">
              <span><BookOpenText size={17} /> Khóa đào tạo</span>
              <input value={state.trainingCourse} onChange={(event) => onChange({ trainingCourse: event.target.value })} placeholder="Ví dụ: K24-2026" aria-label="Khóa đào tạo" />
            </label>
          </div>

          <div className="form-note">
            <ShieldNotice />
            <p><strong>Thông tin trên phiếu.</strong> Họ tên, ngày học và giáo viên sẽ được hiển thị đầy đủ trên phiếu đánh giá. Bạn có thể quay lại chỉnh sửa trước khi lưu ảnh.</p>
          </div>

          <div className="form-actions">
            <button className="button button--ghost" type="button" onClick={onBack}><ArrowLeft size={18} /> Quay lại</button>
            <button className="button button--primary" type="submit">Bắt đầu đánh giá <ArrowRight size={18} /></button>
          </div>
        </form>
      </main>
      <AppFooter />
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
