import { useState } from 'react'
import { createEmergencyEvaluation, createLessonEvaluations } from './data/lessonConfigs'
import { EvaluationPage } from './pages/EvaluationPage'
import { ReportPreviewPage } from './pages/ReportPreviewPage'
import { StudentInformationPage } from './pages/StudentInformationPage'
import { VehicleSelectionPage } from './pages/VehicleSelectionPage'
import type { EvaluationState, VehicleCategory } from './types/evaluation'
import { calculateConclusion, getTodayInputValue } from './utils/evaluation'

type AppStep = 'vehicle' | 'information' | 'evaluation' | 'report'

function emptyState(): EvaluationState {
  return {
    vehicleCategory: null,
    studentName: '',
    evaluationDate: getTodayInputValue(),
    instructorName: '',
    vehicleNumber: '',
    practiceAttempt: '',
    lessons: [],
    emergencyEvaluation: null,
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
      lessons: createLessonEvaluations(category),
      emergencyEvaluation: createEmergencyEvaluation(),
    })
    setStep('information')
    window.scrollTo({ top: 0 })
  }

  const openReport = () => {
    setState((current) => ({ ...current, finalConclusion: current.finalConclusion ?? calculateConclusion(current.lessons) }))
    setStep('report')
    window.scrollTo({ top: 0 })
  }

  const newEvaluation = () => {
    setState(emptyState())
    setStep('vehicle')
    window.scrollTo({ top: 0 })
  }

  if (step === 'vehicle') return <VehicleSelectionPage onSelect={selectVehicle} />

  if (step === 'information') {
    return (
      <StudentInformationPage
        state={state}
        onChange={updateState}
        onBack={newEvaluation}
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
