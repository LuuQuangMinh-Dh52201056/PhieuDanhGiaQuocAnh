import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { AppFooter } from '../components/AppFooter'
import { AppHeader } from '../components/AppHeader'
import { VEHICLE_CATEGORIES } from '../data/lessonConfigs'
import viosWhite from '../hinhanh/vios-white.png'
import viosBlack from '../hinhanh/vios-black.png'
import c1TrainingTruck from '../hinhanh/c1-training-truck-cutout.png'
import type { VehicleCategory } from '../types/evaluation'

interface VehicleSelectionPageProps {
  onSelect: (category: VehicleCategory) => void
}

export function VehicleSelectionPage({ onSelect }: VehicleSelectionPageProps) {
  const vehicleImages: Record<VehicleCategory, { src: string; label: string }> = {
    B_MANUAL: { src: viosWhite, label: 'TOYOTA VIOS · SỐ SÀN' },
    B_AUTOMATIC: { src: viosBlack, label: 'TOYOTA VIOS · TỰ ĐỘNG' },
    C1: { src: c1TrainingTruck, label: 'KIA FRONTIER · XE TẢI' },
  }

  const vehicleVisual = (category: VehicleCategory) => {
    const vehicle = vehicleImages[category]
    return (
      <div className={`vehicle-card__photos vehicle-card__photos--single${category === 'C1' ? ' vehicle-card__photos--truck' : ''}`} aria-hidden="true">
        <img src={vehicle.src} className={`vehicle-card__photo vehicle-card__photo--single${category === 'C1' ? ' vehicle-card__photo--truck' : ''}`} alt="" />
        <span>{vehicle.label}</span>
      </div>
    )
  }

  const vehicleCodes: Record<VehicleCategory, string> = {
    B_MANUAL: 'BSS',
    B_AUTOMATIC: 'BTĐ',
    C1: 'C1',
  }

  const vehicleKinds: Record<VehicleCategory, string> = {
    B_MANUAL: 'SỐ SÀN',
    B_AUTOMATIC: 'SỐ TỰ ĐỘNG',
    C1: 'XE TẢI',
  }

  return (
    <div className="app-shell vehicle-page lx-premium">
      <AppHeader activeStep={1} />
      <main className="vehicle-hero">
        <div className="vehicle-hero__copy">
          <small className="vehicle-hero__eyebrow">HỆ THỐNG ĐÁNH GIÁ THỰC HÀNH · LINH XUÂN</small>
          <h1>PHIẾU ĐÁNH GIÁ<br />THỰC HÀNH LÁI XE</h1>
          <p>Một quy trình thống nhất từ chọn xe, chấm kỹ năng đến lưu phiếu kết quả chất lượng cao.</p>
          <div className="hero-points">
            <span><CheckCircle2 size={17} /> Đúng giáo trình từng hạng</span>
            <span><CheckCircle2 size={17} /> Chấm nhanh, dễ kiểm tra</span>
            <span><CheckCircle2 size={17} /> Ảnh PNG sắc nét</span>
          </div>
        </div>

        <div className="vehicle-selector-panel">
          <div className="panel-heading">
            <span className="panel-heading__number">01</span><div><small>HỒ SƠ PHƯƠNG TIỆN</small><h2>Chọn hạng xe đánh giá</h2></div>
          </div>
          <div className="vehicle-card-grid">
            {VEHICLE_CATEGORIES.map((category) => (
              <button
                className={`vehicle-card vehicle-card--${category.id.toLowerCase().replace('_', '-')}`}
                type="button"
                key={category.id}
                data-testid={`vehicle-${category.id.toLowerCase()}`}
                onClick={() => onSelect(category.id)}
              >
                <span className="vehicle-card__code">{vehicleCodes[category.id]}</span>
                {vehicleVisual(category.id)}
                <div className="vehicle-card__content">
                  <small>HẠNG XE</small>
                  <h3>{category.label}</h3>
                  <p>{category.description}</p>
                  <span className="vehicle-card__kind">{vehicleKinds[category.id]}</span>
                </div>
                <span className="vehicle-card__cta"><span>Chọn hồ sơ này</span><i><ArrowRight size={20} /></i></span>
              </button>
            ))}
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  )
}
