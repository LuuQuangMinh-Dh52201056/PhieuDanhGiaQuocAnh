import { CarFront } from 'lucide-react'

interface BrandProps {
  compact?: boolean
  dark?: boolean
}

export function BrandMark({ compact = false, dark = false }: BrandProps) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''} ${dark ? 'brand--dark' : ''}`} aria-label="Quốc Anh - Đào tạo lái xe">
      <div className="brand__mark" aria-hidden="true">
        <svg viewBox="0 0 72 72" role="img">
          <circle cx="36" cy="29" r="22" fill="none" stroke="currentColor" strokeWidth="6" />
          <circle cx="36" cy="29" r="6" fill="currentColor" />
          <path d="M15 26h15l6 4 7-4h14M36 35v16M24 58h34" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 63c14-10 28-12 50-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
      <div className="brand__copy">
        <strong>QUỐC ANH</strong>
        {!compact && <span><CarFront size={14} /> ĐÀO TẠO LÁI XE</span>}
      </div>
    </div>
  )
}
