import { useState } from 'react'
import { createChecklistItems } from './data/checklistConfigs'
import { createEmergencyEvaluation, createLessonEvaluations } from './data/lessonConfigs'
import { ChecklistEvaluationPage } from './pages/ChecklistEvaluationPage'
import { EvaluationPage } from './pages/EvaluationPage'
import { ReportPreviewPage } from './pages/ReportPreviewPage'
import { StudentInformationPage } from './pages/StudentInformationPage'
import { TrainingSelectionPage } from './pages/TrainingSelectionPage'
import { VehicleSelectionPage } from './pages/VehicleSelectionPage'
import type { EvaluationState, TrainingType, VehicleCategory } from './types/evaluation'
import { calculateConclusion, getTodayInputValue } from './utils/evaluation'

type AppStep = 'vehicle' | 'training' | 'information' | 'evaluation' | 'report'

function emptyState(): EvaluationState {
  return {
    vehicleCategory: null,
    trainingType: null,
    studentName: '',
    evaluationDate: getTodayInputValue(),
    instructorName: '',
    vehicleNumber: '',
    practiceAttempt: '',
    trainingCourse: '',
    lessons: [],
    emergencyEvaluation: null,
    checklistItems: [],
    checklistOverall: null,
    teacherComment: '',
    finalConclusion: null,
  }
}

export default function App() {
  const [step, setStep] = useState<AppStep>('vehicle')
  const [state, setState] = useState<EvaluationState>(emptyState)

  const updateState = (updates: Partial<EvaluationState>) => {
    setState((current) => ({ ...current, ...updates }))
  }

  const selectVehicle = (category: VehicleCategory) => {
    setState({
      ...emptyState(),
      vehicleCategory: category,
    })
    setStep('training')
    window.scrollTo({ top: 0 })
  }

  const selectTraining = (trainingType: TrainingType) => {
    if (!state.vehicleCategory) return
    setState((current) => ({
      ...current,
      trainingType,
      lessons: trainingType === 'COURSE' ? createLessonEvaluations(current.vehicleCategory!) : [],
      emergencyEvaluation: trainingType === 'COURSE' ? createEmergencyEvaluation() : null,
      checklistItems: trainingType === 'COURSE' ? [] : createChecklistItems(trainingType, current.vehicleCategory!),
      checklistOverall: null,
      teacherComment: '',
      finalConclusion: null,
    }))
    setStep('information')
    window.scrollTo({ top: 0 })
  }

  const openReport = () => {
    setState((current) => ({
      ...current,
      finalConclusion: current.trainingType === 'COURSE'
        ? current.finalConclusion ?? calculateConclusion(current.lessons)
        : null,
    }))
    setStep('report')
    window.scrollTo({ top: 0 })
  }

  const newEvaluation = () => {
    setState(emptyState())
    setStep('vehicle')
    window.scrollTo({ top: 0 })
  }

  if (step === 'vehicle') return <VehicleSelectionPage onSelect={selectVehicle} />

  if (step === 'training' && state.vehicleCategory) {
    return (
      <TrainingSelectionPage
        vehicleCategory={state.vehicleCategory}
        onSelect={selectTraining}
        onBack={newEvaluation}
      />
    )
  }

  if (step === 'information') {
    return (
      <StudentInformationPage
        state={state}
        onChange={updateState}
        onBack={() => { setStep('training'); window.scrollTo({ top: 0 }) }}
        onContinue={() => {
          if (state.studentName.trim()) {
            setStep('evaluation')
            window.scrollTo({ top: 0 })
          }
        }}
      />
    )
  }

  if (step === 'evaluation') {
    if (state.trainingType === 'BASIC' || state.trainingType === 'ROAD') {
      return (
        <ChecklistEvaluationPage
          state={state}
          onChange={updateState}
          onBack={() => { setStep('information'); window.scrollTo({ top: 0 }) }}
          onPreview={openReport}
        />
      )
    }
    return (
      <EvaluationPage
        state={state}
        onChange={updateState}
        onBack={() => { setStep('information'); window.scrollTo({ top: 0 }) }}
        onPreview={openReport}
      />
    )
  }

  return (
    <ReportPreviewPage
      state={state}
      onChange={updateState}
      onEdit={() => { setStep('evaluation'); window.scrollTo({ top: 0 }) }}
      onNew={newEvaluation}
    />
  )
}
