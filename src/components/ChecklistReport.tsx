import { Check, MessageSquareText } from 'lucide-react'
import { TrainingCenterBrand } from './TrainingCenterBrand'
import { VehicleBadge } from './VehicleBadge'
import { getChecklistOverallOptions, getChecklistRatingOptions, getChecklistTone } from '../data/checklistConfigs'
import { VEHICLE_LABELS } from '../data/lessonConfigs'
import type { EvaluationState } from '../types/evaluation'
import { formatDate } from '../utils/evaluation'

interface ChecklistReportProps {
  state: EvaluationState
  reportRef: React.RefObject<HTMLDivElement>
}

export function ChecklistReport({ state, reportRef }: ChecklistReportProps) {
  const isRoad = state.trainingType === 'ROAD'
  const ratingOptions = getChecklistRatingOptions(state.trainingType ?? 'BASIC')
  const overallOptions = getChecklistOverallOptions(state.trainingType ?? 'BASIC')
  const tableStyle = { '--rating-count': ratingOptions.length } as React.CSSProperties

  return (
    <div className="report-page checklist-report" ref={reportRef} data-testid="evaluation-report">
      <header className="checklist-report-header">
        <div className="checklist-report-header__brand"><TrainingCenterBrand /></div>
        <div className="checklist-report-header__title">
          <small>TRUNG TÂM GIÁO DỤC NGHỀ NGHIỆP PHÚ GIÁO</small>
          <h1>{isRoad ? 'PHIẾU ĐÁNH GIÁ ĐÀO TẠO HỌC VIÊN' : 'PHIẾU ĐÁNH GIÁ BUỔI HỌC'}</h1>
          <p>{isRoad ? 'ĐÁNH GIÁ THỰC HÀNH ĐƯỜNG TRƯỜNG' : 'LÀM QUEN XE & SA HÌNH CƠ BẢN'}</p>
        </div>
        <VehicleBadge category={state.vehicleCategory} className="checklist-report-header__vehicle" />
      </header>

      <main className="checklist-report-body">
        <section className="checklist-report-info">
          <ReportInfo label="Họ và tên học viên" value={state.studentName} strong />
          <ReportInfo label="Hạng xe" value={state.vehicleCategory ? VEHICLE_LABELS[state.vehicleCategory] : '—'} />
          <ReportInfo label="Giáo viên hướng dẫn" value={state.instructorName || '—'} strong />
          <ReportInfo label={isRoad ? 'Ngày học' : 'Ngày đánh giá'} value={formatDate(state.evaluationDate)} />
          <ReportInfo label="Khóa đào tạo" value={state.trainingCourse || '—'} />
          <ReportInfo label="Lần tập thứ" value={state.practiceAttempt || '—'} />
        </section>

        <ReportHeading number="I" title={isRoad ? 'ĐÁNH GIÁ TỪNG NỘI DUNG' : 'ĐÁNH GIÁ BUỔI HỌC LÀM QUEN XE & SA HÌNH CƠ BẢN'} />

        <section className={`checklist-report-table checklist-report-table--${ratingOptions.length}`} style={tableStyle}>
          <div className="checklist-report-table__header">
            <span>Mục</span><span>Nội dung</span>
            {ratingOptions.map((option) => <span key={option.id}>{option.label}</span>)}
          </div>
          {state.checklistItems.map((item) => (
            <div className="checklist-report-table__row" key={item.id}>
              <span>{item.order}</span>
              <span className="checklist-report-table__content">
                <strong>{item.title}</strong>
                {item.description && <small>({item.description})</small>}
              </span>
              {ratingOptions.map((option) => (
                <span className={`checklist-report-check tone-${getChecklistTone(option.id)} ${item.rating === option.id ? 'is-selected' : ''}`} key={option.id}>
                  <i>{item.rating === option.id && <Check size={22} strokeWidth={3} />}</i>
                </span>
              ))}
            </div>
          ))}
        </section>

        <ReportHeading number="II" title="ĐÁNH GIÁ CHUNG" />
        <section className="checklist-report-overall">
          {overallOptions.map((option) => (
            <div key={option.id} className={`tone-${getChecklistTone(option.id)} ${state.checklistOverall === option.id ? 'is-selected' : ''}`}>
              <i>{state.checklistOverall === option.id && <Check size={22} strokeWidth={3} />}</i>
              <strong>{option.label}</strong>
            </div>
          ))}
        </section>

        <ReportHeading number="III" title="NHẬN XÉT CỦA GIÁO VIÊN" />
        <section className="checklist-report-comment">
          <MessageSquareText size={30} />
          <p>{state.teacherComment || 'Giáo viên chưa ghi nhận xét thêm.'}</p>
          <div>
            <small>GIÁO VIÊN HƯỚNG DẪN</small>
            <strong>{state.instructorName || 'Ký và ghi rõ họ tên'}</strong>
          </div>
        </section>
      </main>

      <footer className="checklist-report-footer">
        <TrainingCenterBrand compact light />
        <strong className="report-footer__tagline">AN TOÀN — TRÁCH NHIỆM — VỮNG TAY LÁI</strong>
        <span>✦</span>
      </footer>
    </div>
  )
}

function ReportInfo({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div><span>{label}:</span><b className={strong ? 'is-strong' : ''}>{value}</b></div>
}

function ReportHeading({ number, title }: { number: string; title: string }) {
  return <div className="checklist-report-heading"><span>{number}</span><strong>{title}</strong></div>
}
