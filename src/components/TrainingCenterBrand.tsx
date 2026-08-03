// PNG data URL tương thích ổn định với Safari và html-to-image.
import embeddedLogoPhuGiao from '../hinhanh/logoPHUGIAO.png?inline'

export const PHU_GIAO_LOGO_DATA_URL = embeddedLogoPhuGiao

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
        style={{ backgroundImage: `url(${PHU_GIAO_LOGO_DATA_URL})` }}
      >
        <img src={PHU_GIAO_LOGO_DATA_URL} alt="" />
      </div>
      <div className="training-brand__copy">
        <small>TRUNG TÂM GIÁO DỤC NGHỀ NGHIỆP</small>
        <strong>PHÚ GIÁO</strong>
      </div>
    </div>
  )
}
