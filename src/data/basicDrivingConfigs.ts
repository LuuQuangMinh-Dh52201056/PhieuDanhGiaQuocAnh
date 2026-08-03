import type { LessonConfig, LessonEvaluation, VehicleCategory } from '../types/evaluation'

const manualSkills: LessonConfig[] = [
  {
    id: 'basic-driving-position', order: 1, symbol: '◉', name: 'Chuẩn bị vị trí lái', shortName: 'Vị trí lái',
    focus: ['Chỉnh ghế phù hợp', 'Chỉnh gương', 'Thắt dây an toàn', 'Kiểm tra cần số', 'Kiểm tra phanh tay'],
    errors: ['Ghế ngồi chưa phù hợp', 'Gương chưa đúng tầm nhìn', 'Quên thắt dây an toàn', 'Không kiểm tra cần số', 'Không kiểm tra phanh tay'],
  },
  {
    id: 'basic-pedals-manual', order: 2, symbol: 'H', name: 'Sử dụng côn, phanh, ga và cần số', shortName: 'Côn, phanh, ga & số',
    focus: ['Chân trái sử dụng côn', 'Chân phải sử dụng phanh và ga', 'Nhận biết đúng vị trí các số', 'Đạp hết côn trước khi vào số'],
    errors: ['Nhầm chân phanh và ga', 'Không đạp hết côn', 'Vào sai số', 'Nhìn cần số quá lâu', 'Thao tác bàn đạp quá mạnh'],
  },
  {
    id: 'basic-clutch-point', order: 3, symbol: '≈', name: 'Tìm và giữ điểm côn', shortName: 'Giữ điểm côn',
    focus: ['Nhả côn chậm', 'Nhận biết điểm xe bắt đầu chuyển động', 'Giữ xe ổn định tại điểm côn', 'Không để xe chết máy'],
    errors: ['Nhả côn quá nhanh', 'Không tìm được điểm côn', 'Không giữ được điểm côn', 'Xe rung giật', 'Chết máy'],
  },
  {
    id: 'basic-start-manual', order: 4, symbol: '▶', name: 'Khởi hành cơ bản', shortName: 'Khởi hành',
    focus: ['Bật xi nhan', 'Vào số 1', 'Hạ phanh tay', 'Phối hợp côn và ga', 'Cho xe di chuyển nhẹ nhàng'],
    errors: ['Quên xi nhan', 'Vào sai số', 'Quên hạ phanh tay', 'Ga quá lớn', 'Xe bị giật', 'Chết máy'],
  },
  {
    id: 'basic-steering-manual', order: 5, symbol: '◯', name: 'Điều khiển vô lăng và giữ hướng', shortName: 'Vô lăng & giữ hướng',
    focus: ['Cầm vô lăng đúng', 'Quan sát xa', 'Giữ xe đi thẳng', 'Đánh lái và trả lái nhẹ nhàng'],
    errors: ['Cầm vô lăng sai', 'Nhìn quá gần đầu xe', 'Đánh lái giật cục', 'Trả lái chậm', 'Xe lệch hướng'],
  },
  {
    id: 'basic-gears-manual', order: 6, symbol: '⇅', name: 'Chuyển số và kiểm soát tốc độ', shortName: 'Chuyển số & tốc độ',
    focus: ['Tăng tốc phù hợp', 'Chuyển đúng số', 'Nhả côn ổn định', 'Giữ xe thẳng khi chuyển số'],
    errors: ['Chuyển sai số', 'Không đạp hết côn', 'Nhả côn quá nhanh', 'Xe bị giật', 'Nhìn cần số quá lâu', 'Xe lệch hướng khi chuyển số'],
  },
  {
    id: 'basic-stop-manual', order: 7, symbol: '■', name: 'Phanh và dừng xe', shortName: 'Phanh & dừng xe',
    focus: ['Nhả ga trước khi phanh', 'Phanh từ từ', 'Đạp côn đúng thời điểm', 'Về số 0', 'Kéo phanh tay'],
    errors: ['Phanh quá gấp', 'Đạp côn quá sớm', 'Đạp côn quá muộn', 'Chết máy khi dừng', 'Quên về số 0', 'Quên kéo phanh tay'],
  },
  {
    id: 'basic-reverse-manual', order: 8, symbol: 'R', name: 'Lùi xe cơ bản', shortName: 'Lùi xe',
    focus: ['Quan sát gương', 'Vào đúng số lùi', 'Kiểm soát tốc độ thấp', 'Điều khiển đúng hướng xe'],
    errors: ['Không quan sát gương', 'Vào sai số', 'Lùi quá nhanh', 'Đánh lái sai hướng', 'Xe lệch nhiều', 'Chết máy'],
  },
]

const automaticSkills: LessonConfig[] = [
  {
    id: 'basic-driving-position', order: 1, symbol: '◉', name: 'Chuẩn bị vị trí lái', shortName: 'Vị trí lái',
    focus: ['Chỉnh ghế', 'Chỉnh gương', 'Thắt dây an toàn', 'Kiểm tra phanh tay', 'Kiểm tra cần số ở P'],
    errors: ['Ghế chưa phù hợp', 'Gương chưa đúng', 'Quên dây an toàn', 'Không kiểm tra cần số', 'Không kiểm tra phanh tay'],
  },
  {
    id: 'basic-pedals-automatic', order: 2, symbol: '◐', name: 'Sử dụng chân phanh và chân ga', shortName: 'Phanh & ga',
    focus: ['Chỉ dùng chân phải', 'Chân trái để cố định', 'Xoay chân giữa phanh và ga', 'Không đạp hai bàn đạp cùng lúc'],
    errors: ['Dùng chân trái đạp phanh', 'Sử dụng cả hai chân', 'Nhầm chân ga và phanh', 'Đặt chân liên tục trên ga', 'Đạp bàn đạp quá mạnh'],
  },
  {
    id: 'basic-automatic-selector', order: 3, symbol: 'D', name: 'Sử dụng cần số tự động', shortName: 'Cần số tự động',
    focus: ['Nhận biết P, R, N, D', 'Đạp phanh trước khi chuyển chế độ', 'Dừng xe hoàn toàn trước khi chuyển D hoặc R'],
    errors: ['Nhầm D và R', 'Không đạp phanh khi chuyển số', 'Chuyển D/R khi xe chưa dừng', 'Không kiểm tra vị trí cần số'],
  },
  {
    id: 'basic-start-automatic', order: 4, symbol: '▶', name: 'Khởi hành cơ bản', shortName: 'Khởi hành',
    focus: ['Đạp phanh', 'Chuyển sang D', 'Hạ phanh tay', 'Nhả phanh từ từ', 'Kiểm soát độ bò của xe'],
    errors: ['Chọn sai chế độ', 'Quên hạ phanh tay', 'Nhả phanh quá nhanh', 'Đạp ga quá mạnh', 'Xe tăng tốc đột ngột', 'Không quan sát trước khi đi'],
  },
  {
    id: 'basic-steering-automatic', order: 5, symbol: '◯', name: 'Điều khiển vô lăng và giữ hướng', shortName: 'Vô lăng & giữ hướng',
    focus: ['Cầm vô lăng đúng', 'Quan sát xa', 'Giữ xe đi thẳng', 'Trả lái đúng thời điểm'],
    errors: ['Cầm vô lăng sai', 'Đánh lái giật cục', 'Trả lái chậm', 'Xe lệch hướng', 'Nhìn quá gần đầu xe'],
  },
  {
    id: 'basic-speed-automatic', order: 6, symbol: '⇅', name: 'Kiểm soát tốc độ', shortName: 'Kiểm soát tốc độ',
    focus: ['Đạp ga nhẹ', 'Giữ ga đều', 'Chủ động nhả ga', 'Giảm tốc trước khi cua hoặc dừng'],
    errors: ['Đạp ga quá mạnh', 'Giữ ga không đều', 'Đi quá nhanh', 'Nhả ga quá muộn', 'Phanh đột ngột'],
  },
  {
    id: 'basic-stop-automatic', order: 7, symbol: 'P', name: 'Phanh, dừng và đỗ xe', shortName: 'Phanh, dừng & đỗ',
    focus: ['Nhả ga trước khi phanh', 'Phanh nhẹ nhàng', 'Giữ chân phanh khi dừng', 'Chuyển về P', 'Kéo phanh tay'],
    errors: ['Phanh quá gấp', 'Chuyển chân sang phanh chậm', 'Không giữ chân phanh', 'Quên chuyển về P', 'Quên kéo phanh tay'],
  },
  {
    id: 'basic-reverse-automatic', order: 8, symbol: 'R', name: 'Lùi xe cơ bản', shortName: 'Lùi xe',
    focus: ['Dừng xe hoàn toàn', 'Chuyển sang R', 'Quan sát gương', 'Nhả phanh từ từ', 'Kiểm soát tốc độ lùi'],
    errors: ['Nhầm D và R', 'Chuyển sang R khi xe chưa dừng', 'Không quan sát gương', 'Lùi quá nhanh', 'Đánh lái sai hướng', 'Đạp ga quá mạnh'],
  },
]

const c1Skills: LessonConfig[] = [
  {
    id: 'basic-c1-observation', order: 1, symbol: '◉', name: 'Chuẩn bị và quan sát', shortName: 'Chuẩn bị & quan sát',
    focus: ['Chỉnh ghế', 'Chỉnh gương chính và gương phụ', 'Quan sát điểm mù', 'Thắt dây an toàn', 'Kiểm tra cần số và phanh tay'],
    errors: ['Ghế chưa phù hợp', 'Gương chưa đủ tầm nhìn', 'Không kiểm tra điểm mù', 'Quên dây an toàn', 'Không kiểm tra cần số'],
  },
  {
    id: 'basic-c1-pedals', order: 2, symbol: 'H', name: 'Côn, phanh, ga và cần số', shortName: 'Côn, phanh, ga & số',
    focus: ['Sử dụng đúng bàn đạp', 'Nhận biết sơ đồ số', 'Đạp hết côn', 'Chuyển số dứt khoát'],
    errors: ['Không giữ được điểm côn', 'Chuyển sai số', 'Không đạp hết côn', 'Nhả côn quá nhanh', 'Xe bị giật', 'Chết máy'],
  },
  {
    id: 'basic-c1-start', order: 3, symbol: '▶', name: 'Khởi hành xe C1', shortName: 'Khởi hành C1',
    focus: ['Bật xi nhan', 'Vào đúng số', 'Giữ điểm côn', 'Bổ sung ga phù hợp', 'Hạ phanh tay'],
    errors: ['Quên xi nhan', 'Vào sai số', 'Quên hạ phanh tay', 'Không giữ được điểm côn', 'Ga quá lớn', 'Xe rung giật', 'Chết máy'],
  },
  {
    id: 'basic-c1-body-control', order: 4, symbol: '▰', name: 'Kiểm soát thân xe', shortName: 'Kiểm soát thân xe',
    focus: ['Cảm nhận chiều rộng xe', 'Giữ khoảng cách hai bên', 'Giữ thân xe đúng làn', 'Quan sát gương thường xuyên'],
    errors: ['Không cảm nhận được chiều rộng xe', 'Đi quá sát mép đường', 'Thân xe lệch làn', 'Canh khoảng cách chưa tốt', 'Ít quan sát gương'],
  },
  {
    id: 'basic-c1-turning', order: 5, symbol: '↪', name: 'Vào cua và kiểm soát đuôi xe', shortName: 'Vào cua & đuôi xe',
    focus: ['Đánh lái phù hợp', 'Quan sát bánh sau', 'Chừa khoảng trống khi cua', 'Không để đuôi xe quét vào vật cản'],
    errors: ['Đánh lái quá sớm', 'Đánh lái quá muộn', 'Vào cua quá sát', 'Không quan sát bánh sau', 'Trả lái chậm', 'Đuôi xe lệch nhiều'],
  },
  {
    id: 'basic-c1-gears', order: 6, symbol: '⇅', name: 'Chuyển số và kiểm soát tốc độ', shortName: 'Chuyển số & tốc độ',
    focus: ['Tăng số đúng thời điểm', 'Giảm số đúng thời điểm', 'Giữ xe thẳng khi chuyển số', 'Giữ tốc độ phù hợp'],
    errors: ['Chuyển sai số', 'Tăng số quá sớm', 'Tăng số quá muộn', 'Giảm số chưa phù hợp', 'Xe bị giật', 'Xe lệch hướng khi sang số'],
  },
  {
    id: 'basic-c1-stop', order: 7, symbol: '■', name: 'Phanh và dừng xe', shortName: 'Phanh & dừng xe',
    focus: ['Giảm tốc sớm', 'Phanh êm', 'Đạp côn đúng thời điểm', 'Dừng đúng vị trí', 'Giữ xe ổn định'],
    errors: ['Giảm tốc quá muộn', 'Phanh quá gấp', 'Đạp côn quá sớm', 'Chết máy', 'Dừng sai vị trí', 'Quên về số 0'],
  },
  {
    id: 'basic-c1-reverse', order: 8, symbol: 'R', name: 'Lùi và canh đuôi xe', shortName: 'Lùi & canh đuôi xe',
    focus: ['Quan sát đầy đủ các gương', 'Lùi với tốc độ rất chậm', 'Canh thân và đuôi xe', 'Điều chỉnh vô lăng nhẹ'],
    errors: ['Không quan sát đủ gương', 'Lùi quá nhanh', 'Canh đuôi xe chưa tốt', 'Đánh lái quá mạnh', 'Xe lệch hướng', 'Không kiểm soát khoảng cách'],
  },
]

export const BASIC_QUICK_COMMENTS = [
  'Tiếp thu tốt',
  'Cần luyện thêm vô lăng',
  'Cần kiểm soát tốc độ',
  'Cần cải thiện quan sát',
  'Cần ổn định tâm lý',
  'Có thể chuyển sang tập sa hình',
]

export function getBasicQuickComments(category: VehicleCategory | null): string[] {
  const comments = [...BASIC_QUICK_COMMENTS]
  if (category === 'B_MANUAL') comments.splice(2, 0, 'Cần luyện thêm điểm côn', 'Cần luyện chuyển số')
  if (category === 'C1') comments.splice(2, 0, 'Cần luyện canh thân xe', 'Cần luyện canh đuôi xe')
  return comments
}

export function getBasicSkillConfigs(category: VehicleCategory): LessonConfig[] {
  const source = category === 'B_MANUAL' ? manualSkills : category === 'B_AUTOMATIC' ? automaticSkills : c1Skills
  return source.map((skill) => ({ ...skill, focus: [...skill.focus], errors: [...skill.errors] }))
}

export function createBasicSkillEvaluations(category: VehicleCategory): LessonEvaluation[] {
  return getBasicSkillConfigs(category).map((skill) => ({ ...skill, status: null, selectedErrors: [], note: '' }))
}
