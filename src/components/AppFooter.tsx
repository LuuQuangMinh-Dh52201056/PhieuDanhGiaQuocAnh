import { CircleGauge, ShieldCheck, UsersRound } from 'lucide-react'
import { TrainingCenterBrand } from './TrainingCenterBrand'

export function AppFooter() {
  return (
    <footer className="site-footer">
      <TrainingCenterBrand />
      <div className="site-footer__values">
        <span><ShieldCheck size={24} /><strong>AN TOÀN</strong></span>
        <span><UsersRound size={24} /><strong>TRÁCH NHIỆM</strong></span>
        <span><CircleGauge size={24} /><strong>VỮNG TAY LÁI</strong></span>
      </div>
    </footer>
  )
}
