import { Check } from 'lucide-react'
import { BrandMark } from './Brand'
import { TrainingCenterBrand } from './TrainingCenterBrand'

interface AppHeaderProps {
  activeStep: number
  centerBrand?: boolean
}

const steps = ['Chọn hạng', 'Nội dung', 'Thông tin', 'Đánh giá', 'Xem phiếu']

export function AppHeader({ activeStep, centerBrand = false }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        {centerBrand ? <TrainingCenterBrand compact light /> : <BrandMark compact />}
        <div className="stepper" aria-label={`Bước ${activeStep} trên 5`}>
          {steps.map((step, index) => {
            const number = index + 1
            const done = number < activeStep
            const active = number === activeStep
            return (
              <div className={`stepper__item ${done ? 'is-done' : ''} ${active ? 'is-active' : ''}`} key={step}>
                <span className="stepper__number">{done ? <Check size={14} strokeWidth={3} /> : number}</span>
                <span className="stepper__label">{step}</span>
              </div>
            )
          })}
        </div>
      </div>
    </header>
  )
}
