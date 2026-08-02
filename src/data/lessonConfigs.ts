import type { LessonConfig, LessonEvaluation, VehicleCategory, VehicleCategoryInfo } from '../types/evaluation'

export const VEHICLE_CATEGORIES: VehicleCategoryInfo[] = [
  {
    id: 'B_MANUAL',
    shortLabel: 'BSS',
    label: 'B SỐ SÀN',
    description: 'Đánh giá phối hợp côn, ga, phanh và thao tác chuyển số.',
    feature: '11 bài thi • Xe số sàn',
  },
  {
    id: 'B_AUTOMATIC',
    shortLabel: 'BTĐ',
    label: 'B SỐ TỰ ĐỘNG',
    description: 'Tập trung kiểm soát tốc độ, canh xe và quan sát gương.',
    feature: '11 bài thi • Xe tự động',
  },
  {
    id: 'C1',
    shortLabel: 'C1',
    label: 'HẠNG C1',
    description: 'Đánh giá xe tải, canh thân xe, bánh sau và đuôi xe.',
    feature: '10 bài thi • Xe tải',
  },
]

export const VEHICLE_LABELS: Record<VehicleCategory, string> = {
  B_MANUAL: 'B SỐ SÀN',
  B_AUTOMATIC: 'B SỐ TỰ ĐỘNG',
  C1: 'C1',
}

const commonLessons: LessonConfig[] = [
  {
    id: 'start', order: 1, symbol: '⚑', name: 'Xuất phát', shortName: 'Xuất phát',
    focus: ['Thắt dây an toàn', 'Đúng số/chế độ lái', 'Xi nhan trái', 'Hạ phanh tay', 'Xuất phát đúng thời gian'],
    errors: ['Quên dây an toàn', 'Quên xi nhan trái', 'Không hạ phanh tay', 'Vào sai số hoặc sai chế độ lái', 'Chết máy', 'Xuất phát chậm', 'Tắt xi nhan sai thời điểm'],
  },
  {
    id: 'pedestrian', order: 2, symbol: '♙', name: 'Dừng xe nhường đường cho người đi bộ', shortName: 'Dừng người đi bộ',
    focus: ['Kiểm soát tốc độ', 'Canh đúng vị trí dừng', 'Dừng xe ổn định'],
    errors: ['Dừng chưa tới vị trí', 'Dừng quá vạch', 'Đè vạch', 'Phanh quá gấp', 'Chết máy'],
  },
  {
    id: 'hill', order: 3, symbol: '◢', name: 'Dừng và khởi hành ngang dốc', shortName: 'Khởi hành ngang dốc',
    focus: ['Dừng đúng vị trí', 'Giữ xe không bị trôi', 'Giữ đúng điểm côn', 'Phối hợp côn, ga và phanh', 'Khởi hành ổn định'],
    errors: ['Dừng sai vị trí', 'Tuột dốc', 'Chết máy', 'Không giữ được điểm côn', 'Ga quá lớn', 'Khởi hành quá chậm'],
    seriousErrors: ['Tuột dốc'],
  },
  {
    id: 'right-angle', order: 4, symbol: '⌑', name: 'Qua vệt bánh xe và đường hẹp vuông góc', shortName: 'Vệt bánh xe & đường hẹp',
    focus: ['Canh đúng bánh xe', 'Giữ tốc độ chậm', 'Đánh lái đúng điểm', 'Trả lái đúng lúc', 'Không đè vạch'],
    errors: ['Không vào đúng vệt bánh xe', 'Đè vạch', 'Đánh lái sớm', 'Đánh lái muộn', 'Trả lái chậm', 'Xe đi quá nhanh'],
  },
  {
    id: 'traffic-light', order: 5, symbol: '●', name: 'Qua ngã tư có tín hiệu giao thông', shortName: 'Ngã tư có tín hiệu',
    focus: ['Quan sát đèn tín hiệu', 'Dừng đúng vạch', 'Đi đúng thời điểm', 'Xi nhan đúng hướng'],
    errors: ['Vượt đèn đỏ', 'Dừng quá vạch', 'Quên xi nhan', 'Đi sai hướng', 'Xuất phát chậm', 'Không quan sát tín hiệu'],
    seriousErrors: ['Vượt đèn đỏ'],
  },
  {
    id: 'winding-road', order: 6, symbol: 'S', name: 'Qua đường vòng quanh co', shortName: 'Đường vòng quanh co',
    focus: ['Kiểm soát tốc độ', 'Canh đầu xe', 'Canh bánh sau', 'Điều khiển vô lăng đều', 'Không chạm vạch'],
    errors: ['Đè vạch', 'Đánh lái sớm', 'Đánh lái muộn', 'Trả lái chậm', 'Không quan sát gương', 'Đi quá nhanh'],
  },
  {
    id: 'vertical-parking', order: 7, symbol: 'P', name: 'Ghép xe dọc vào nơi đỗ', shortName: 'Ghép xe dọc',
    focus: ['Đặt xe đúng vị trí', 'Quan sát gương', 'Đánh lái đúng điểm', 'Kiểm soát tốc độ lùi', 'Đưa xe vào đúng ô'],
    errors: ['Đánh lái sớm', 'Đánh lái muộn', 'Không quan sát gương', 'Xe vào lệch', 'Đè hoặc chạm vạch', 'Không vào đủ vị trí', 'Quá thời gian'],
    seriousErrors: ['Không vào đủ vị trí'],
  },
  {
    id: 'railway', order: 8, symbol: '╳', name: 'Dừng xe tại nơi giao nhau với đường sắt', shortName: 'Giao nhau với đường sắt',
    focus: ['Quan sát biển báo', 'Giảm tốc độ', 'Dừng đúng vị trí', 'Di chuyển đúng thời điểm'],
    errors: ['Không dừng xe', 'Dừng chưa tới vị trí', 'Dừng quá vạch', 'Không quan sát biển báo', 'Khởi hành chậm', 'Chết máy'],
  },
  {
    id: 'gear-change', order: 9, symbol: 'H', name: 'Thay đổi số trên đường thẳng', shortName: 'Thay đổi số đường thẳng',
    focus: ['Tăng tốc đúng thời điểm', 'Chuyển số đúng', 'Điều khiển côn phù hợp', 'Giữ xe đi thẳng', 'Giảm số đúng vị trí'],
    errors: ['Chuyển sai số', 'Không đạt tốc độ yêu cầu', 'Quá tốc độ', 'Xe bị giật', 'Chết máy', 'Xe lệch hướng', 'Giảm số sai thời điểm'],
  },
  {
    id: 'parallel-parking', order: 10, symbol: '▣', name: 'Ghép xe ngang vào nơi đỗ', shortName: 'Ghép xe ngang',
    focus: ['Đặt xe đúng vị trí', 'Quan sát gương', 'Đánh lái đúng điểm', 'Kiểm soát tốc độ lùi', 'Đưa xe vào đúng ô'],
    errors: ['Đánh lái sớm', 'Đánh lái muộn', 'Không quan sát gương', 'Xe vào lệch', 'Đè hoặc chạm vạch', 'Không vào đủ vị trí', 'Quá thời gian'],
    seriousErrors: ['Không vào đủ vị trí'],
  },
  {
    id: 'finish', order: 11, symbol: '⚑', name: 'Kết thúc', shortName: 'Kết thúc',
    focus: ['Xi nhan phải', 'Đi đúng làn', 'Qua vạch kết thúc', 'Dừng đúng vị trí', 'Kéo phanh tay', 'Đưa cần số đúng vị trí'],
    errors: ['Quên xi nhan phải', 'Đi sai làn', 'Dừng sai vị trí', 'Quên kéo phanh tay', 'Quên về số hoặc chế độ P', 'Kết thúc sai quy trình'],
  },
]

const emergency: LessonConfig = {
  id: 'emergency', order: 12, symbol: '!', name: 'Xử lý tình huống khẩn cấp', shortName: 'Tình huống khẩn cấp',
  focus: ['Nhận biết tín hiệu', 'Dừng xe an toàn', 'Bấm đúng nút', 'Chờ tín hiệu xác nhận', 'Tắt nút đúng lúc'],
  errors: ['Không nhận biết tín hiệu', 'Dừng xe quá chậm', 'Quên bấm nút khẩn cấp', 'Bấm sai nút', 'Tắt nút quá sớm', 'Di chuyển khi chưa có tín hiệu'],
}

function forAutomatic(lesson: LessonConfig): LessonConfig {
  const updated = { ...lesson, focus: [...lesson.focus], errors: [...lesson.errors] }
  updated.errors = updated.errors.filter((error) => !['Chết máy', 'Không giữ được điểm côn', 'Chuyển sai số', 'Xe bị giật', 'Giảm số sai thời điểm'].includes(error))

  if (lesson.id === 'hill') {
    updated.focus = ['Dừng đúng vị trí', 'Giữ phanh ổn định', 'Chuyển chân từ phanh sang ga đúng lúc', 'Không để xe trôi', 'Khởi hành nhẹ nhàng']
    updated.errors = ['Dừng sai vị trí', 'Xe bị trôi', 'Đạp ga quá mạnh', 'Nhả phanh quá sớm', 'Khởi hành quá chậm']
    updated.seriousErrors = ['Xe bị trôi']
  }
  if (lesson.id === 'gear-change') {
    updated.name = 'Thay đổi tốc độ trên đường thẳng'
    updated.shortName = 'Thay đổi tốc độ đường thẳng'
    updated.focus = ['Tăng tốc đúng thời điểm', 'Kiểm soát chân ga', 'Giữ xe đi thẳng', 'Giảm tốc đúng vị trí']
    updated.errors = ['Không đạt tốc độ yêu cầu', 'Quá tốc độ', 'Đạp ga quá mạnh', 'Phanh quá gấp', 'Xe lệch hướng', 'Giảm tốc sai vị trí']
  }
  return updated
}

function forC1(lesson: LessonConfig): LessonConfig {
  const updated = { ...lesson, focus: [...lesson.focus], errors: [...lesson.errors] }
  if (lesson.id === 'right-angle') updated.errors.push('Canh thân xe chưa tốt', 'Canh bánh sau chưa chính xác')
  if (lesson.id === 'winding-road') updated.errors.push('Canh thân xe chưa tốt', 'Không kiểm soát được đuôi xe')
  if (lesson.id === 'vertical-parking') updated.errors.push('Canh đuôi xe chưa tốt', 'Khoảng cách thân xe không phù hợp')
  if (lesson.id === 'parallel-parking') updated.errors.push('Canh thân xe chưa tốt', 'Không kiểm soát được đuôi xe')
  return updated
}

export function getLessonConfigs(category: VehicleCategory): LessonConfig[] {
  if (category === 'B_AUTOMATIC') return commonLessons.map(forAutomatic)
  if (category === 'C1') {
    return commonLessons
      .filter((lesson) => lesson.id !== 'parallel-parking')
      .map((lesson, index) => forC1({ ...lesson, order: index + 1 }))
  }
  return commonLessons.map((lesson) => ({ ...lesson, focus: [...lesson.focus], errors: [...lesson.errors] }))
}

export function createLessonEvaluations(category: VehicleCategory): LessonEvaluation[] {
  return getLessonConfigs(category).map((lesson) => ({ ...lesson, status: null, selectedErrors: [], note: '' }))
}

export function createEmergencyEvaluation(): LessonEvaluation {
  return { ...emergency, focus: [...emergency.focus], errors: [...emergency.errors], status: null, selectedErrors: [], note: '' }
}
