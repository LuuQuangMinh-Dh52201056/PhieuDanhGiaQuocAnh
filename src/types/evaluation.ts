export type VehicleCategory = 'B_MANUAL' | 'B_AUTOMATIC' | 'C1'

export type TrainingType = 'BASIC' | 'COURSE' | 'ROAD'

export type EvaluationStatus = 'GOOD' | 'NOTICE' | 'NEEDS_PRACTICE'

export type FinalConclusion =
  | 'READY_FOR_MOCK_TEST'
  | 'NEEDS_IMPROVEMENT'
  | 'CONTINUE_PRACTICE'

export type BasicConclusion =
  | 'BASIC_SKILLS_ACQUIRED'
  | 'NEEDS_IMPROVEMENT'
  | 'CONTINUE_BASIC_TRAINING'

export type EvaluationConclusion = FinalConclusion | BasicConclusion

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

export interface EvaluationState {
  vehicleCategory: VehicleCategory | null
  trainingType: TrainingType | null
  studentName: string
  evaluationDate: string
  instructorName: string
  vehicleNumber: string
  practiceAttempt: string
  lessons: LessonEvaluation[]
  emergencyEvaluation: LessonEvaluation | null
  teacherComment: string
  finalConclusion: EvaluationConclusion | null
}

export interface VehicleCategoryInfo {
  id: VehicleCategory
  shortLabel: string
  label: string
  description: string
  feature: string
}
