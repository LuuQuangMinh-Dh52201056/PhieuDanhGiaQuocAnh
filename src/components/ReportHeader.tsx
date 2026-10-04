import { TrainingCenterBrand } from './TrainingCenterBrand'
import { VehicleBadge } from './VehicleBadge'
import type { TrainingType, VehicleCategory } from '../types/evaluation'
import { formatDate } from '../utils/evaluation'

interface ReportHeaderProps {
  category: VehicleCategory | null
  trainingType: TrainingType
  evaluationDate: string
}

const DOCUMENT_LABELS = {
  BASIC: {
    session: 'TẬP CƠ BẢN',
    title: 'PHIẾU ĐÁNH GIÁ BUỔI HỌC',
    subtitle: 'LÀM QUEN XE & SA HÌNH CƠ BẢN',
  },
  ROAD: {
    session: 'ĐƯỜNG TRƯỜNG',
    title: 'PHIẾU ĐÁNH GIÁ ĐÀO TẠO HỌC VIÊN',
    subtitle: 'ĐÁNH GIÁ THỰC HÀNH ĐƯỜNG TRƯỜNG',
  },
  COURSE: {
    session: 'SA HÌNH',
    title: 'PHIẾU ĐÁNH GIÁ SA HÌNH',
    subtitle: 'KẾT QUẢ ĐÁNH GIÁ TỪNG BÀI THỰC HÀNH',
  },
} satisfies Record<TrainingType, { session: string; title: string; subtitle: string }>

/** Shared by every report so the on-screen document and PNG stay consistent. */
export function ReportHeader({ category, trainingType, evaluationDate }: ReportHeaderProps) {
  const isChecklist = trainingType !== 'COURSE'
  const document = DOCUMENT_LABELS[trainingType]

  return (
    <header className={`${isChecklist ? 'checklist-report-header' : 'report-header'} lx-document-header`}>
      <div className="lx-document-header__identity">
        <TrainingCenterBrand light />
        <div className="lx-document-header__edition">
          <small>HỒ SƠ ĐÁNH GIÁ THỰC HÀNH</small>
          <span>{document.session}<i aria-hidden="true" />{formatDate(evaluationDate)}</span>
        </div>
      </div>

      <div className="lx-document-header__main">
        <div className={`${isChecklist ? 'checklist-report-header__title' : 'report-title'} lx-document-header__title`}>
          <small>THEO DÕI CHẤT LƯỢNG BUỔI HỌC</small>
          <h1>{document.title}</h1>
          <p>{document.subtitle}</p>
        </div>
        <VehicleBadge category={category} className="lx-document-header__vehicle" />
      </div>

      <div className="lx-document-header__baseline">
        <span>VĂN PHÒNG ĐÀO TẠO LÁI XE LINH XUÂN</span>
        <span>AN TOÀN · TRÁCH NHIỆM · VỮNG TAY LÁI</span>
      </div>
    </header>
  )
}
