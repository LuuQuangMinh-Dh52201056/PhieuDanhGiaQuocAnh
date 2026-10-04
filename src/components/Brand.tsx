import { TrainingCenterBrand } from './TrainingCenterBrand'

interface BrandProps {
  compact?: boolean
  dark?: boolean
}

/**
 * Tên cũ được giữ lại như một lớp tương thích cho các màn hình mở rộng.
 * Mọi nơi đều dùng chung nhận diện Văn Phòng Đào Tạo Lái Xe Linh Xuân.
 */
export function BrandMark({ compact = false, dark = false }: BrandProps) {
  return <TrainingCenterBrand compact={compact} light={dark} />
}
