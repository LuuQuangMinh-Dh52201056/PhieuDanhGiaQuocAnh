import type { EvaluationState, EvaluationStatus, FinalConclusion, LessonEvaluation } from '../types/evaluation'

export const STATUS_META: Record<EvaluationStatus, { label: string; shortLabel: string; className: string }> = {
  GOOD: { label: 'Tốt', shortLabel: 'TỐT', className: 'good' },
  NOTICE: { label: 'Cần lưu ý', shortLabel: 'LƯU Ý', className: 'notice' },
  NEEDS_PRACTICE: { label: 'Cần luyện thêm', shortLabel: 'LUYỆN THÊM', className: 'practice' },
}

export const CONCLUSION_META: Record<FinalConclusion, { label: string; description: string; className: string }> = {
  READY_FOR_MOCK_TEST: {
    label: 'SẴN SÀNG THI THỬ',
    description: 'Học viên thực hiện ổn định, có thể bước vào buổi thi thử.',
    className: 'ready',
  },
  NEEDS_IMPROVEMENT: {
    label: 'CẦN HOÀN THIỆN THÊM',
    description: 'Học viên cần củng cố các bài còn lưu ý để đạt kết quả tốt hơn.',
    className: 'improve',
  },
  CONTINUE_PRACTICE: {
    label: 'CẦN TIẾP TỤC LUYỆN TẬP',
    description: 'Học viên cần thêm thời gian luyện tập trước khi thi thử.',
    className: 'continue',
  },
}

export function getTodayInputValue(): string {
  const date = new Date()
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

export function formatDate(value: string): string {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

export function slugifyVietnamese(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9]+/g, '') || 'HocVien'
}

export function generateFileName(state: EvaluationState): string {
  return `DanhGiaSaHinh_${slugifyVietnamese(state.studentName)}_${formatDate(state.evaluationDate).replace(/\//g, '-')}.png`
}

export function summarize(lessons: LessonEvaluation[]) {
  return lessons.reduce(
    (totals, lesson) => {
      if (lesson.status) totals[lesson.status] += 1
      return totals
    },
    { GOOD: 0, NOTICE: 0, NEEDS_PRACTICE: 0 } as Record<EvaluationStatus, number>,
  )
}

export function calculateConclusion(lessons: LessonEvaluation[]): FinalConclusion {
  const totals = summarize(lessons)
  const hasSeriousError = lessons.some((lesson) =>
    lesson.seriousErrors?.some((error) => lesson.selectedErrors.includes(error)),
  )

  if (totals.NEEDS_PRACTICE >= 3 || hasSeriousError) return 'CONTINUE_PRACTICE'
  if (totals.NEEDS_PRACTICE > 0 || totals.NOTICE >= 4) return 'NEEDS_IMPROVEMENT'
  if (totals.GOOD > lessons.length / 2) return 'READY_FOR_MOCK_TEST'
  return 'NEEDS_IMPROVEMENT'
}
