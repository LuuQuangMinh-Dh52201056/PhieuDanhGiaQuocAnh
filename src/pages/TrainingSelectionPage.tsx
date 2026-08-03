import { ArrowLeft, ArrowRight, BookOpenCheck, Clock3, Map, Route } from 'lucide-react'
import { AppHeader } from '../components/AppHeader'
import { TrainingCenterBrand } from '../components/TrainingCenterBrand'
import { VEHICLE_LABELS } from '../data/lessonConfigs'
import type { TrainingType, VehicleCategory } from '../types/evaluation'

interface TrainingSelectionPageProps {
  vehicleCategory: VehicleCategory
  onSelect: (type: TrainingType) => void
  onBack: () => void
}

export function TrainingSelectionPage({ vehicleCategory, onSelect, onBack }: TrainingSelectionPageProps) {
  return (
    <div className="app-shell training-selection-shell">
      <AppHeader activeStep={2} centerBrand />
      <main className="content-page training-selection-page">
        <section className="training-selection-hero">
          <div className="training-selection-hero__brand"><TrainingCenterBrand /></div>
          <div className="page-heading">
            <div className="page-heading__number">02</div>
            <div>
              <span>HẠNG XE {VEHICLE_LABELS[vehicleCategory]}</span>
              <h1>Chọn nội dung tập</h1>
              <p>Mỗi nội dung có bộ kỹ năng và phiếu đánh giá riêng phù hợp với buổi học.</p>
            </div>
          </div>
        </section>

        <section className="training-option-grid" aria-label="Chọn nội dung tập">
          <button className="training-option training-option--basic" type="button" onClick={() => onSelect('BASIC')}>
            <span className="training-option__icon"><BookOpenCheck size={31} /></span>
            <span className="training-option__tag">8 KỸ NĂNG</span>
            <strong>Tập cơ bản</strong>
            <small>Làm quen vị trí lái, bàn đạp, vô lăng, khởi hành, dừng và lùi xe.</small>
            <span className="training-option__action">Bắt đầu đánh giá <ArrowRight size={18} /></span>
          </button>

          <button className="training-option training-option--course" type="button" onClick={() => onSelect('COURSE')}>
            <span className="training-option__icon"><Map size={31} /></span>
            <span className="training-option__tag">{vehicleCategory === 'C1' ? '10 BÀI THI' : '11 BÀI THI'}</span>
            <strong>Sa hình</strong>
            <small>Đánh giá trọn quy trình các bài thi sát hạch đúng theo hạng xe đã chọn.</small>
            <span className="training-option__action">Bắt đầu đánh giá <ArrowRight size={18} /></span>
          </button>

          <div className="training-option training-option--road" aria-disabled="true">
            <span className="training-option__icon"><Route size={31} /></span>
            <span className="training-option__tag"><Clock3 size={13} /> SẮP PHÁT TRIỂN</span>
            <strong>Đường trường</strong>
            <small>Nội dung đánh giá thực hành đường trường sẽ được bổ sung ở phiên bản sau.</small>
            <span className="training-option__action">Chưa khả dụng</span>
          </div>
        </section>

        <div className="training-selection-actions">
          <button className="button button--ghost" type="button" onClick={onBack}><ArrowLeft size={18} /> Chọn lại hạng xe</button>
          <p><strong>{VEHICLE_LABELS[vehicleCategory]}</strong> đã được chọn. Bạn có thể quay lại để đổi hạng xe.</p>
        </div>
      </main>
    </div>
  )
}
