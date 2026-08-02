import { Check } from 'lucide-react'
import { BrandMark } from './Brand'

interface AppHeaderProps {
  activeStep: number
}

const steps = ['Chọn hạng', 'Thông tin', 'Đánh giá', 'Xem phiếu']

export function AppHeader({ activeStep }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <BrandMark compact />
        <div className="stepper" aria-label={`Bước ${activeStep} trên 4`}>
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
