import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react'
import { TrainingCenterBrand } from '../components/TrainingCenterBrand'
import { VEHICLE_CATEGORIES } from '../data/lessonConfigs'
import type { VehicleCategory } from '../types/evaluation'

interface VehicleSelectionPageProps {
  onSelect: (category: VehicleCategory) => void
}

export function VehicleSelectionPage({ onSelect }: VehicleSelectionPageProps) {
  return (
    <main className="vehicle-page">
      <div className="vehicle-page__glow vehicle-page__glow--one" />
      <div className="vehicle-page__glow vehicle-page__glow--two" />
      <section className="vehicle-hero">
        <nav className="vehicle-nav">
          <TrainingCenterBrand light />
          <div className="privacy-pill"><ShieldCheck size={16} /> Dữ liệu chỉ tồn tại tạm thời</div>
        </nav>

        <div className="vehicle-hero__copy">
          <div className="eyebrow"><Sparkles size={16} /> PHIẾU ĐÁNH GIÁ ĐIỆN TỬ</div>
          <h1>PHIẾU ĐÁNH GIÁ<br /><span>THỰC HÀNH LÁI XE</span></h1>
          <p>Chọn hạng xe, nội dung tập, chấm nhanh và xuất phiếu PNG sắc nét ngay trên điện thoại.</p>
          <div className="hero-points">
            <span><CheckCircle2 size={17} /> Đúng kỹ năng từng nội dung</span>
            <span><CheckCircle2 size={17} /> Tổng kết tự động</span>
            <span><CheckCircle2 size={17} /> Không lưu dữ liệu</span>
          </div>
        </div>

        <div className="vehicle-selector-panel">
          <div className="panel-heading">
            <span className="panel-heading__number">01</span>
            <div>
              <small>BẮT ĐẦU ĐÁNH GIÁ</small>
              <h2>Chọn hạng xe</h2>
            </div>
          </div>
          <div className="vehicle-card-grid">
            {VEHICLE_CATEGORIES.map((category) => (
              <button className="vehicle-card" type="button" key={category.id} onClick={() => onSelect(category.id)}>
                <div className="vehicle-card__badge">{category.shortLabel}</div>
                <div className="vehicle-card__content">
                  <small>HẠNG XE</small>
                  <h3>{category.label}</h3>
                  <p>{category.description}</p>
                  <span>{category.feature}</span>
                </div>
                <span className="vehicle-card__arrow"><ArrowRight size={20} /></span>
              </button>
            ))}
          </div>
          <p className="selector-hint">Chọn đúng hạng xe để hệ thống hiển thị tiêu chí và lỗi phù hợp.</p>
        </div>
      </section>

      <footer className="vehicle-footer">
        <span>AN TOÀN</span><i /> <span>TỰ TIN</span><i /> <span>VỮNG TAY LÁI</span>
      </footer>
    </main>
  )
}
