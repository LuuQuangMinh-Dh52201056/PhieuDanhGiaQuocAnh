interface TrainingCenterBrandProps {
  compact?: boolean
  light?: boolean
}

export function TrainingCenterBrand({ compact = false, light = false }: TrainingCenterBrandProps) {
  return (
    <div className={`training-brand ${compact ? 'training-brand--compact' : ''} ${light ? 'training-brand--light' : ''}`}>
      <div className="training-brand__mark" aria-hidden="true">
        <svg viewBox="0 0 120 120" role="img">
          <circle cx="60" cy="60" r="55" fill="none" stroke="currentColor" strokeWidth="5" />
          <circle cx="60" cy="60" r="45" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".55" />
          <path d="M29 72c12-4 23-1 31 8 8-11 20-15 34-12-10 4-18 10-24 19-5 6-13 7-20 2-6-5-13-10-21-17Z" fill="currentColor" />
          <path d="M60 77c-1-19 8-33 28-40-1 18-11 30-28 40Z" fill="currentColor" />
          <path d="M58 70c-10-9-13-20-8-33 12 9 15 20 8 33Z" fill="currentColor" opacity=".9" />
          <path d="M38 80c10 2 17 7 22 14 7-8 15-13 25-15" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
      <div className="training-brand__copy">
        <small>TRUNG TÂM GIÁO DỤC NGHỀ NGHIỆP</small>
        <strong>PHÚ GIÁO</strong>
      </div>
    </div>
  )
}
