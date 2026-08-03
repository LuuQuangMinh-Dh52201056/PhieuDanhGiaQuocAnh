import { CarFront } from 'lucide-react'
import type { VehicleCategory } from '../types/evaluation'

interface VehicleBadgeProps {
  category: VehicleCategory | null
  className?: string
}

export function VehicleBadge({ category, className = '' }: VehicleBadgeProps) {
  const main = category === 'C1' ? 'C1' : 'B'
  const type = category === 'B_AUTOMATIC'
    ? 'SỐ TỰ ĐỘNG'
    : category === 'B_MANUAL' ? 'SỐ SÀN' : category === 'C1' ? 'XE TẢI' : '—'

  return (
    <div className={`vehicle-category-badge ${className}`}>
      <div><CarFront size={28} /></div>
      <small>HẠNG XE</small>
      <strong>{main}</strong>
      <span>{type}</span>
    </div>
  )
}
