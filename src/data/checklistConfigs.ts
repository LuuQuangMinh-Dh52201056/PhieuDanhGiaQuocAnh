import type {
  ChecklistItemEvaluation,
  ChecklistOverall,
  ChecklistRating,
  TrainingType,
  VehicleCategory,
} from '../types/evaluation'

export interface ChecklistOption<T extends string> {
  id: T
  label: string
}

export const BASIC_RATING_OPTIONS: ChecklistOption<ChecklistRating>[] = [
  { id: 'UNDERSTOOD', label: 'Đã hiểu' },
  { id: 'NEEDS_WORK', label: 'Cần lưu ý' },
  { id: 'UNCLEAR', label: 'Chưa rõ' },
]

export const ROAD_RATING_OPTIONS: ChecklistOption<ChecklistRating>[] = [
  { id: 'GOOD', label: 'Tốt' },
  { id: 'FAIR', label: 'Khá' },
  { id: 'AVERAGE', label: 'Trung bình' },
  { id: 'WEAK', label: 'Yếu' },
]

export const BASIC_OVERALL_OPTIONS: ChecklistOption<ChecklistOverall>[] = [
  { id: 'BASIC_UNDERSTOOD', label: 'Tốt – nắm vững kiến thức, thao tác tốt' },
  { id: 'BASIC_NEEDS_WORK', label: 'Cần lưu ý – cần chú ý và luyện tập thêm' },
  { id: 'BASIC_PRACTICE', label: 'Cần luyện thêm – cần luyện tập và theo dõi thêm' },
]

export const ROAD_OVERALL_OPTIONS: ChecklistOption<ChecklistOverall>[] = [
  { id: 'ROAD_PASSED', label: 'Đạt yêu cầu' },
  { id: 'ROAD_NOT_PASSED', label: 'Chưa đạt' },
]

const basicItems: Omit<ChecklistItemEvaluation, 'rating'>[] = [
  { id: 'basic-safe-entry', order: 1, title: 'Mở cửa xe và lên xe an toàn' },
  { id: 'basic-driving-position', order: 2, title: 'Cách chỉnh ghế, gương, dây an toàn, ngồi đúng tư thế' },
  { id: 'basic-controls', order: 3, title: 'Biết được vị trí và cách sử dụng các nút cơ bản trên xe' },
  { id: 'basic-pedals', order: 4, title: 'Phân biệt được các bàn đạp Côn – Phanh – Ga' },
  { id: 'basic-pedal-timing', order: 5, title: 'Hiểu được khi nào cần đạp côn, đạp phanh, tăng ga' },
  { id: 'basic-gears', order: 6, title: 'Thao tác số nhuần nhuyễn' },
  { id: 'basic-pedal-risk', order: 7, title: 'Hiểu nguy hiểm khi đạp nhầm bàn đạp' },
  { id: 'basic-observation', order: 8, title: 'Biết quan sát trước khi di chuyển xe, chuyển làn, chuyển hướng' },
  { id: 'basic-situations', order: 9, title: 'Hiểu các tình huống giáo viên đưa ra' },
  { id: 'basic-lane', order: 10, title: 'Điều khiển xe đi đúng hướng, đúng làn' },
  { id: 'basic-speed', order: 11, title: 'Kiểm soát xe với tốc độ an toàn' },
  { id: 'basic-hill', order: 12, title: 'Biết xử lý tình huống khi lên dốc cầu' },
  { id: 'basic-signals', order: 13, title: 'Biết bật xi nhan, bấm còi đúng lúc' },
]

const roadItems: Omit<ChecklistItemEvaluation, 'rating'>[] = [
  {
    id: 'road-review', order: 1, title: 'Test lại bài học cũ',
    description: 'Biết sử dụng các tiện ích cơ bản như xi nhan, đèn, còi, gạt nước, chỉnh gương, điều hòa...',
  },
  {
    id: 'road-attitude', order: 2, title: 'Thái độ, ý thức trong học tập',
    description: 'Qua trao đổi, hướng dẫn có biết lắng nghe, tiếp thu hay không...',
  },
  { id: 'road-psychology', order: 3, title: 'Tâm lý khi vận hành xe' },
  { id: 'road-steering', order: 4, title: 'Kỹ năng đánh lái' },
  { id: 'road-gears', order: 5, title: 'Kỹ năng chuyển đổi số trong khi chạy' },
  { id: 'road-pedals', order: 6, title: 'Sử dụng Côn – Phanh – Ga' },
  { id: 'road-awareness', order: 7, title: 'Quan sát phán đoán – nhận diện tình huống' },
  { id: 'road-lane-distance', order: 8, title: 'Giữ làn – giữ khoảng cách' },
  { id: 'road-speed', order: 9, title: 'Kiểm soát tốc độ' },
  { id: 'road-signs', order: 10, title: 'Kỹ năng nhận diện biển báo' },
  {
    id: 'road-test', order: 11, title: 'Khả năng thực hiện bài sát hạch đường trường (nếu có)',
    description: 'Xuất phát – Tăng số, tăng tốc độ – Giảm số, giảm tốc độ – Kết thúc',
  },
]

function adaptForVehicle(
  items: Omit<ChecklistItemEvaluation, 'rating'>[],
  category: VehicleCategory,
): Omit<ChecklistItemEvaluation, 'rating'>[] {
  if (category !== 'B_AUTOMATIC') return items
  return items.map((item) => {
    if (item.id === 'basic-pedals') return { ...item, title: 'Phân biệt và sử dụng đúng bàn đạp Phanh – Ga' }
    if (item.id === 'basic-pedal-timing') return { ...item, title: 'Hiểu được khi nào cần đạp phanh, tăng ga' }
    if (item.id === 'basic-gears') return { ...item, title: 'Sử dụng đúng các chế độ số P – R – N – D' }
    if (item.id === 'road-gears') return { ...item, title: 'Sử dụng chế độ số tự động khi chạy' }
    if (item.id === 'road-pedals') return { ...item, title: 'Sử dụng Phanh – Ga' }
    return item
  })
}

export function createChecklistItems(type: TrainingType, category: VehicleCategory): ChecklistItemEvaluation[] {
  const source = type === 'ROAD' ? roadItems : basicItems
  return adaptForVehicle(source, category).map((item) => ({ ...item, rating: null }))
}

export function getChecklistRatingOptions(type: TrainingType) {
  return type === 'ROAD' ? ROAD_RATING_OPTIONS : BASIC_RATING_OPTIONS
}

export function getChecklistOverallOptions(type: TrainingType) {
  return type === 'ROAD' ? ROAD_OVERALL_OPTIONS : BASIC_OVERALL_OPTIONS
}

export function getChecklistTone(value: ChecklistRating | ChecklistOverall): 'green' | 'orange' | 'red' {
  if (['UNDERSTOOD', 'GOOD', 'FAIR', 'BASIC_UNDERSTOOD', 'ROAD_PASSED'].includes(value)) return 'green'
  if (['NEEDS_WORK', 'AVERAGE', 'BASIC_NEEDS_WORK'].includes(value)) return 'orange'
  return 'red'
}
