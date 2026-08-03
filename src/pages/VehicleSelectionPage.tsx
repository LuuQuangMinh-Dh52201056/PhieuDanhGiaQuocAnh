import { ArrowRight, CheckCircle2, Gauge, Joystick, Truck } from 'lucide-react'
import { AppFooter } from '../components/AppFooter'
import { AppHeader } from '../components/AppHeader'
import { VEHICLE_CATEGORIES } from '../data/lessonConfigs'
import type { VehicleCategory } from '../types/evaluation'

interface VehicleSelectionPageProps {
  onSelect: (category: VehicleCategory) => void
}

export function VehicleSelectionPage({ onSelect }: VehicleSelectionPageProps) {
  const vehicleIcons = {
    B_MANUAL: <Joystick size={43} />,
    B_AUTOMATIC: <Gauge size={43} />,
    C1: <Truck size={43} />,
  }

  return (
    <div className="app-shell vehicle-page">
      <AppHeader activeStep={1} />
      <main className="vehicle-hero">
        <div className="vehicle-hero__copy">
          <h1>PHIẾU ĐÁNH GIÁ THỰC HÀNH LÁI XE</h1>
          <p>Chọn hạng xe, nội dung tập và chấm nhanh để xuất phiếu PNG rõ nét.</p>
          <div className="hero-points">
            <span><CheckCircle2 size={17} /> Đúng nội dung từng hạng</span>
            <span><CheckCircle2 size={17} /> Mức độ xanh – cam – đỏ</span>
            <span><CheckCircle2 size={17} /> Không lưu dữ liệu</span>
          </div>
        </div>

        <div className="vehicle-selector-panel">
          <div className="panel-heading">
            <span className="panel-heading__number">01</span><div><small>BẮT ĐẦU ĐÁNH GIÁ</small><h2>Chọn hạng xe</h2></div>
          </div>
          <div className="vehicle-card-grid">
            {VEHICLE_CATEGORIES.map((category) => (
              <button className="vehicle-card" type="button" key={category.id} onClick={() => onSelect(category.id)}>
                {category.id === 'B_MANUAL' && <span className="vehicle-card__popular">★ Phổ biến</span>}
                <div className="vehicle-card__badge">{vehicleIcons[category.id]}</div>
                <div className="vehicle-card__content">
                  <small>HẠNG XE</small>
                  <h3>{category.label}</h3>
                  <p>{category.description}</p>
                  <span>Chọn hạng này</span>
                </div>
                <span className="vehicle-card__arrow"><ArrowRight size={20} /></span>
              </button>
            ))}
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  )
}
