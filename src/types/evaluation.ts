export type VehicleCategory = 'B_MANUAL' | 'B_AUTOMATIC' | 'C1'

export type TrainingType = 'BASIC' | 'COURSE' | 'ROAD'

export type ChecklistRating =
  | 'UNDERSTOOD'
  | 'NEEDS_WORK'
  | 'UNCLEAR'
  | 'GOOD'
  | 'FAIR'
  | 'AVERAGE'
  | 'WEAK'

export type ChecklistOverall =
  | 'BASIC_UNDERSTOOD'
  | 'BASIC_NEEDS_WORK'
  | 'BASIC_PRACTICE'
  | 'ROAD_PASSED'
  | 'ROAD_NOT_PASSED'

export type EvaluationStatus = 'GOOD' | 'NOTICE' | 'NEEDS_PRACTICE'

export type FinalConclusion =
  | 'READY_FOR_MOCK_TEST'
  | 'NEEDS_IMPROVEMENT'
  | 'CONTINUE_PRACTICE'

export interface LessonConfig {
  id: string
  order: number
  name: string
  shortName: string
  symbol: string
  focus: string[]
  errors: string[]
  seriousErrors?: string[]
}

export interface LessonEvaluation extends LessonConfig {
  status: EvaluationStatus | null
  selectedErrors: string[]
  note: string
}

export interface ChecklistItemEvaluation {
  id: string
  order: number
  title: string
  description?: string
  rating: ChecklistRating | null
}

export interface EvaluationState {
  vehicleCategory: VehicleCategory | null
  trainingType: TrainingType | null
  studentName: string
  evaluationDate: string
  instructorName: string
  vehicleNumber: string
  practiceAttempt: string
  trainingCourse: string
  lessons: LessonEvaluation[]
  emergencyEvaluation: LessonEvaluation | null
  checklistItems: ChecklistItemEvaluation[]
  checklistOverall: ChecklistOverall | null
  teacherComment: string
  finalConclusion: FinalConclusion | null
}

export interface VehicleCategoryInfo {
  id: VehicleCategory
  shortLabel: string
  label: string
  description: string
  feature: string
}
