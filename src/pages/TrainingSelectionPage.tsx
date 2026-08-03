import { ArrowLeft, ArrowRight, BookOpenCheck, Map, Route } from 'lucide-react'
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
      <AppHeader activeStep={2} />
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
          <button className="training-option training-option--basic" type="button" data-testid="training-basic" onClick={() => onSelect('BASIC')}>
            <span className="training-option__icon"><BookOpenCheck size={31} /></span>
            <span className="training-option__tag">13 NỘI DUNG</span>
            <strong>Tập cơ bản</strong>
            <small>Đánh giá buổi học làm quen xe và sa hình cơ bản bằng bảng tích nhanh.</small>
            <span className="training-option__action">Bắt đầu đánh giá <ArrowRight size={18} /></span>
          </button>

          <button className="training-option training-option--course" type="button" data-testid="training-course" onClick={() => onSelect('COURSE')}>
            <span className="training-option__icon"><Map size={31} /></span>
            <span className="training-option__tag">{vehicleCategory === 'C1' ? '10 BÀI THI' : '11 BÀI THI'}</span>
            <strong>Sa hình</strong>
            <small>Đánh giá trọn quy trình các bài thi sát hạch đúng theo hạng xe đã chọn.</small>
            <span className="training-option__action">Bắt đầu đánh giá <ArrowRight size={18} /></span>
          </button>

          <button className="training-option training-option--road" type="button" data-testid="training-road" onClick={() => onSelect('ROAD')}>
            <span className="training-option__icon"><Route size={31} /></span>
            <span className="training-option__tag">11 NỘI DUNG</span>
            <strong>Đường trường</strong>
            <small>Đánh giá kỹ năng vận hành xe, giữ làn, tốc độ, quan sát và nhận diện tình huống.</small>
            <span className="training-option__action">Bắt đầu đánh giá <ArrowRight size={18} /></span>
          </button>
        </section>

        <div className="training-selection-actions">
          <button className="button button--ghost" type="button" onClick={onBack}><ArrowLeft size={18} /> Chọn lại hạng xe</button>
          <p><strong>{VEHICLE_LABELS[vehicleCategory]}</strong> đã được chọn. Bạn có thể quay lại để đổi hạng xe.</p>
        </div>
      </main>
    </div>
  )
}
