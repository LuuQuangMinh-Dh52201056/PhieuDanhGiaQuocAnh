// Nhúng logo thành data URL để Safari không phải tải lại ảnh khi dựng PNG.
import embeddedLogoPhuGiao from '../hinhanh/logoPHUGIAO.jfif?inline'

const logoPhuGiao = embeddedLogoPhuGiao.replace('data:application/octet-stream', 'data:image/jpeg')

interface TrainingCenterBrandProps {
  compact?: boolean
  light?: boolean
}

export function TrainingCenterBrand({ compact = false, light = false }: TrainingCenterBrandProps) {
  return (
    <div className={`training-brand ${compact ? 'training-brand--compact' : ''} ${light ? 'training-brand--light' : ''}`}>
      <div className="training-brand__mark" aria-hidden="true">
        <img src={logoPhuGiao} alt="" />
      </div>
      <div className="training-brand__copy">
        <small>TRUNG TÂM GIÁO DỤC NGHỀ NGHIỆP</small>
        <strong>PHÚ GIÁO</strong>
      </div>
    </div>
  )
}
