// PNG data URL tương thích ổn định với Safari và html-to-image.
import embeddedLinhXuanLogo from '../hinhanh/linh-xuan-logo.png?inline'

export const LINH_XUAN_LOGO_DATA_URL = embeddedLinhXuanLogo

interface TrainingCenterBrandProps {
  compact?: boolean
  light?: boolean
}

export function TrainingCenterBrand({ compact = false, light = false }: TrainingCenterBrandProps) {
  return (
    <div className={`training-brand ${compact ? 'training-brand--compact' : ''} ${light ? 'training-brand--light' : ''}`}>
      <div
        className="training-brand__mark"
        aria-hidden="true"
        data-export-logo-slot
        style={{ backgroundImage: `url(${LINH_XUAN_LOGO_DATA_URL})` }}
      >
        <img src={LINH_XUAN_LOGO_DATA_URL} alt="" />
      </div>
      <div className="training-brand__copy">
        <small>TRUNG TÂM ĐÀO TẠO LÁI XE</small>
        <strong>LINH XUÂN</strong>
      </div>
    </div>
  )
}
