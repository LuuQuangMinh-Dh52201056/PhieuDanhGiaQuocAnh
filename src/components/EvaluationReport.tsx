import { Award, Check, ClipboardPenLine, MessageSquareText, ShieldCheck, TriangleAlert } from 'lucide-react'
import { TrainingCenterBrand } from './TrainingCenterBrand'
import { VehicleBadge } from './VehicleBadge'
import { LessonIcon } from './LessonEvaluationCard'
import { VEHICLE_LABELS } from '../data/lessonConfigs'
import type { EvaluationState } from '../types/evaluation'
import { CONCLUSION_META, formatDate, STATUS_META, summarize } from '../utils/evaluation'

interface EvaluationReportProps {
  state: EvaluationState
  reportRef: React.RefObject<HTMLDivElement>
}

export function EvaluationReport({ state, reportRef }: EvaluationReportProps) {
  const totals = summarize(state.lessons)
  const conclusion = state.finalConclusion
    ? CONCLUSION_META[state.finalConclusion]
    : CONCLUSION_META.NEEDS_IMPROVEMENT
  const emergency = state.emergencyEvaluation

  return (
    <div className="report-page" ref={reportRef} data-testid="evaluation-report">
      <header className="report-header">
        <div className="report-header__flare report-header__flare--one" />
        <div className="report-header__flare report-header__flare--two" />
        <TrainingCenterBrand light />
        <div className="report-title">
          <small>PHIẾU ĐÁNH GIÁ</small>
          <h1>KẾT QUẢ BÀI THI<br />SÁT HẠCH SA HÌNH</h1>
          <div><i /> <span>AN TOÀN — TRÁCH NHIỆM — VỮNG TAY LÁI</span> <i /></div>
        </div>
        <VehicleBadge category={state.vehicleCategory} className="report-vehicle-badge" />
      </header>

      <div className="report-body">
        <ReportSectionTitle number="1" title="THÔNG TIN HỌC VIÊN" />
        <section className="report-info-grid">
          <InfoItem label="Họ và tên" value={state.studentName} strong />
          <InfoItem label="Giáo viên hướng dẫn" value={state.instructorName || '—'} strong />
          <InfoItem label="Ngày đánh giá" value={formatDate(state.evaluationDate)} />
          <InfoItem label="Số xe" value={state.vehicleNumber || '—'} />
          <InfoItem label="Lần tập thứ" value={state.practiceAttempt || '—'} />
          <InfoItem label="Hạng xe" value={state.vehicleCategory ? VEHICLE_LABELS[state.vehicleCategory] : '—'} />
        </section>

        <ReportSectionTitle number="2" title="KẾT QUẢ ĐÁNH GIÁ TỪNG BÀI THI" />
        <section className="report-table" aria-label="Kết quả từng bài thi">
          <div className="report-table__header">
            <span>STT</span><span>NỘI DUNG BÀI THI</span><span>ĐÁNH GIÁ</span><span>LỖI & GHI CHÚ</span>
          </div>
          {state.lessons.map((lesson) => {
            const status = lesson.status ? STATUS_META[lesson.status] : null
            const details = [...lesson.selectedErrors]
            if (lesson.note.trim()) details.push(lesson.note.trim())
            return (
              <div className={`report-table__row ${status ? `row--${status.className}` : ''}`} key={lesson.id}>
                <span className="report-order">{String(lesson.order).padStart(2, '0')}</span>
                <span className="report-lesson-name"><i><LessonIcon id={lesson.id} size={17} /></i><strong>{lesson.name}</strong></span>
                <span>{status && <b className={`report-status report-status--${status.className}`}>{status.shortLabel}</b>}</span>
                <span className={`report-details ${details.length === 0 ? 'report-details--clear' : ''}`}>
                  {details.length > 0 ? details.join(' • ') : <><Check size={18} /> Không ghi nhận lỗi</>}
                </span>
              </div>
            )
          })}
        </section>

        {emergency?.status && (
          <>
            <ReportSectionTitle number="3" title="ĐÁNH GIÁ TÌNH HUỐNG KHẨN CẤP" />
            <section className="report-emergency">
              <div className="report-emergency__icon"><TriangleAlert size={31} /></div>
              <div>
                <small>XỬ LÝ TÌNH HUỐNG</small>
                <strong>{STATUS_META[emergency.status].label}</strong>
              </div>
              <p>{[...emergency.selectedErrors, emergency.note].filter(Boolean).join(' • ') || 'Thao tác đúng quy trình, bảo đảm an toàn.'}</p>
            </section>
          </>
        )}

        <ReportSectionTitle number="4" title="TỔNG KẾT KẾT QUẢ" />
        <section className="report-summary">
          <SummaryBox type="good" icon={<Award size={40} />} label="TỐT" number={totals.GOOD} unit="bài" />
          <SummaryBox type="notice" icon={<TriangleAlert size={39} />} label="CẦN LƯU Ý" number={totals.NOTICE} unit="bài" />
          <SummaryBox type="practice" icon={<ClipboardPenLine size={39} />} label="CẦN LUYỆN THÊM" number={totals.NEEDS_PRACTICE} unit="bài" />
        </section>

        <section className={`report-conclusion report-conclusion--${conclusion.className}`}>
          <div className="report-conclusion__medal"><ShieldCheck size={47} /></div>
          <div className="report-conclusion__content">
            <small><i /> KẾT LUẬN CHUNG <i /></small>
            <strong>{conclusion.label}</strong>
            <p>{conclusion.description}</p>
          </div>
        </section>

        <section className="report-comment-signature">
          <div className="report-teacher-comment">
            <MessageSquareText size={32} />
            <div><strong>NHẬN XÉT CỦA GIÁO VIÊN</strong><p>{state.teacherComment || 'Học viên cần duy trì sự tập trung, bình tĩnh và thực hiện đúng quy trình.'}</p></div>
          </div>
          <div className="report-signature">
            <strong>GIÁO VIÊN HƯỚNG DẪN</strong>
            <div className="signature-line">{state.instructorName || 'Ký và ghi rõ họ tên'}</div>
          </div>
        </section>
      </div>

      <footer className="report-footer">
        <TrainingCenterBrand compact light />
        <strong className="report-footer__tagline">AN TOÀN — TRÁCH NHIỆM — VỮNG TAY LÁI</strong>
        <i>✦</i>
      </footer>
    </div>
  )
}

function ReportSectionTitle({ number, title }: { number: string; title: string }) {
  return <div className="report-section-title"><span>{number}</span><strong>{title}</strong></div>
}

function InfoItem({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className="report-info-item"><span>{label}:</span><b className={strong ? 'is-strong' : ''}>{value}</b></div>
}

function SummaryBox({ type, icon, label, number, unit }: { type: string; icon: React.ReactNode; label: string; number: number; unit: string }) {
  return <div className={`report-summary-box report-summary-box--${type}`}><div>{icon}</div><span><small>{label}</small><strong>{number} <i>{unit}</i></strong></span></div>
}
