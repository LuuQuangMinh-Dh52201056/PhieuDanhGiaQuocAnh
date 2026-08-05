import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  createChecklistItems,
} from './data/checklistConfigs'

import {
  createEmergencyEvaluation,
  createLessonEvaluations,
} from './data/lessonConfigs'

import {
  ChecklistEvaluationPage,
} from './pages/ChecklistEvaluationPage'

import {
  EvaluationPage,
} from './pages/EvaluationPage'

import {
  ReportPreviewPage,
} from './pages/ReportPreviewPage'

import {
  StudentInformationPage,
} from './pages/StudentInformationPage'

import {
  TrainingSelectionPage,
} from './pages/TrainingSelectionPage'

import {
  VehicleSelectionPage,
} from './pages/VehicleSelectionPage'

import AdminTeachersPage
  from './pages/AdminTeachersPage'

import {
  saveEvaluationAdminRecord,
  type AdminTrainingType,
} from './services/evaluationAdminStore'

import type {
  EvaluationState,
  TrainingType,
  VehicleCategory,
} from './types/evaluation'

import {
  calculateConclusion,
  getTodayInputValue,
} from './utils/evaluation'

type AppStep =
  | 'vehicle'
  | 'training'
  | 'information'
  | 'evaluation'
  | 'report'

/**
 * Đường dẫn riêng dùng để mở trang quản trị.
 *
 * Truy cập:
 * /admin/giaovien/A@7979
 */
const ADMIN_PATH =
  '/admin/giaovien/A@7979'

/**
 * Tạo trạng thái trống cho một phiếu mới.
 */
function emptyState(): EvaluationState {
  return {
    vehicleCategory: null,
    trainingType: null,

    studentName: '',
    evaluationDate:
      getTodayInputValue(),

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

/**
 * Chuẩn hóa đường dẫn.
 *
 * Hai đường dẫn sau được xem là giống nhau:
 *
 * /admin/giaovien/A@7979
 * /admin/giaovien/A@7979/
 */
function normalizePathname(
  pathname: string,
): string {
  const normalized =
    pathname.replace(/\/+$/, '')

  return normalized || '/'
}

/**
 * Kiểm tra đường dẫn hiện tại có phải
 * đường dẫn quản trị hay không.
 *
 * Hỗ trợ trường hợp trình duyệt chuyển
 * ký tự @ thành %40.
 */
function isAdminPath(
  pathname: string,
): boolean {
  let decodedPathname = pathname

  try {
    decodedPathname =
      decodeURIComponent(pathname)
  } catch {
    decodedPathname = pathname
  }

  return (
    normalizePathname(
      decodedPathname,
    ) === ADMIN_PATH
  )
}

/**
 * Chuyển loại đánh giá trong ứng dụng
 * sang loại lưu trong trang admin.
 *
 * COURSE là phiếu sát hạch sa hình,
 * nên lưu thành EXAM.
 */
function mapTrainingTypeForAdmin(
  trainingType: TrainingType,
): AdminTrainingType {
  if (
    trainingType === 'COURSE'
  ) {
    return 'EXAM'
  }

  return trainingType
}

/**
 * Lấy kết quả chung để hiển thị
 * trong danh sách quản trị.
 */
function getOverallResult(
  state: EvaluationState,
): string | null {
  if (
    state.trainingType ===
    'COURSE'
  ) {
    return state.finalConclusion
      ? String(
          state.finalConclusion,
        )
      : null
  }

  return state.checklistOverall
    ? String(
        state.checklistOverall,
      )
    : null
}

export default function App() {
  const [
    step,
    setStep,
  ] =
    useState<AppStep>(
      'vehicle',
    )

  const [
    state,
    setState,
  ] =
    useState<EvaluationState>(
      emptyState,
    )

  /**
   * ID của phiếu hiện tại.
   *
   * Khi giáo viên xem phiếu, quay lại sửa
   * rồi xem lại, hệ thống cập nhật phiếu cũ
   * thay vì tạo thêm một phiếu trùng.
   */
  const evaluationRecordId =
    useRef<string | null>(
      null,
    )

  /**
   * Kiểm tra URL ngay khi ứng dụng khởi động.
   */
  const [
    showAdmin,
    setShowAdmin,
  ] =
    useState<boolean>(() => {
      if (
        typeof window ===
        'undefined'
      ) {
        return false
      }

      return isAdminPath(
        window.location.pathname,
      )
    })

  /**
   * Theo dõi nút Back và Forward
   * của trình duyệt.
   */
  useEffect(() => {
    const handlePopState = () => {
      setShowAdmin(
        isAdminPath(
          window.location.pathname,
        ),
      )
    }

    window.addEventListener(
      'popstate',
      handlePopState,
    )

    return () => {
      window.removeEventListener(
        'popstate',
        handlePopState,
      )
    }
  }, [])

  /**
   * Cập nhật một phần trạng thái phiếu.
   */
  const updateState = (
    updates:
      Partial<EvaluationState>,
  ) => {
    setState((current) => ({
      ...current,
      ...updates,
    }))
  }

  /**
   * Cuộn về đầu trang.
   */
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'auto',
    })
  }

  /**
   * Bước 1:
   * Chọn hạng xe.
   */
  const selectVehicle = (
    category: VehicleCategory,
  ) => {
    evaluationRecordId.current =
      null

    setState({
      ...emptyState(),
      vehicleCategory: category,
    })

    setStep('training')
    scrollToTop()
  }

  /**
   * Bước 2:
   * Chọn nội dung đánh giá.
   */
  const selectTraining = (
    trainingType: TrainingType,
  ) => {
    if (
      !state.vehicleCategory
    ) {
      return
    }

    setState((current) => ({
      ...current,

      trainingType,

      /**
       * Phiếu sa hình.
       */
      lessons:
        trainingType === 'COURSE'
          ? createLessonEvaluations(
              current
                .vehicleCategory!,
            )
          : [],

      emergencyEvaluation:
        trainingType === 'COURSE'
          ? createEmergencyEvaluation()
          : null,

      /**
       * Phiếu tập cơ bản
       * hoặc đường trường.
       */
      checklistItems:
        trainingType === 'COURSE'
          ? []
          : createChecklistItems(
              trainingType,
              current
                .vehicleCategory!,
            ),

      checklistOverall: null,
      teacherComment: '',
      finalConclusion: null,
    }))

    setStep('information')
    scrollToTop()
  }

  /**
   * Bước 3:
   * Kiểm tra thông tin trước khi
   * chuyển sang trang đánh giá.
   */
  const continueToEvaluation =
    () => {
      if (
        !state.studentName.trim()
      ) {
        window.alert(
          'Vui lòng nhập họ và tên học viên.',
        )

        return
      }

      if (
        !state.instructorName.trim()
      ) {
        window.alert(
          'Vui lòng nhập tên giáo viên hướng dẫn.',
        )

        return
      }

      setStep('evaluation')
      scrollToTop()
    }

  /**
   * Tính kết quả, lưu toàn bộ dữ liệu
   * cho trang admin rồi mở trang xem phiếu.
   */
  const openReport = () => {
    if (
      !state.vehicleCategory ||
      !state.trainingType
    ) {
      window.alert(
        'Thiếu thông tin hạng xe hoặc loại đánh giá.',
      )

      return
    }

    if (
      !state.studentName.trim()
    ) {
      window.alert(
        'Vui lòng nhập họ và tên học viên.',
      )

      return
    }

    if (
      !state.instructorName.trim()
    ) {
      window.alert(
        'Vui lòng nhập tên giáo viên hướng dẫn.',
      )

      return
    }

    /**
     * Với phiếu sa hình:
     * tự tính kết luận nếu chưa có.
     */
    const nextState:
      EvaluationState = {
      ...state,

      finalConclusion:
        state.trainingType ===
        'COURSE'
          ? state.finalConclusion ??
            calculateConclusion(
              state.lessons,
            )
          : null,
    }

    setState(nextState)

    try {
      const savedRecord =
        saveEvaluationAdminRecord({
          /**
           * Có ID:
           * cập nhật phiếu hiện tại.
           *
           * Không có ID:
           * tạo một phiếu mới.
           */
          id:
            evaluationRecordId
              .current ??
            undefined,

          /**
           * Giáo viên và học viên.
           */
          teacherName:
            nextState
              .instructorName,

          studentName:
            nextState
              .studentName,

          /**
           * Loại phiếu và hạng xe.
           */
          trainingType:
            mapTrainingTypeForAdmin(
              nextState
                .trainingType!,
            ),

          vehicleCategory:
            String(
              nextState
                .vehicleCategory,
            ),

          /**
           * Ngày đánh giá.
           */
          evaluationDate:
            nextState
              .evaluationDate,

          /**
           * Thông tin buổi học.
           */
          vehicleNumber:
            nextState
              .vehicleNumber,

          practiceAttempt:
            nextState
              .practiceAttempt,

          trainingCourse:
            nextState
              .trainingCourse,

          /**
           * Kết quả chung.
           */
          overallResult:
            getOverallResult(
              nextState,
            ),

          /**
           * Nhận xét của giáo viên.
           */
          teacherComment:
            nextState
              .teacherComment,

          /**
           * Lưu toàn bộ trạng thái phiếu.
           *
           * Trang admin có thể xem:
           * - lessons
           * - emergencyEvaluation
           * - checklistItems
           * - checklistOverall
           * - teacherComment
           * - finalConclusion
           * - toàn bộ thông tin học viên
           */
          evaluationData:
            nextState,
        })

      /**
       * Giữ ID phiếu vừa lưu.
       */
      evaluationRecordId.current =
        savedRecord.id
    } catch (error) {
      console.error(
        'Không thể lưu dữ liệu cho trang admin:',
        error,
      )

      window.alert(
        error instanceof Error
          ? error.message
          : 'Không thể lưu dữ liệu phiếu đánh giá.',
      )

      return
    }

    setStep('report')
    scrollToTop()
  }

  /**
   * Tạo một phiếu đánh giá mới.
   */
  const newEvaluation = () => {
    evaluationRecordId.current =
      null

    setState(
      emptyState(),
    )

    setStep('vehicle')
    scrollToTop()
  }

  /**
   * Trang quản trị riêng.
   *
   * Mở bằng:
   * http://localhost:5173/admin/giaovien/A@7979
   *
   * Trình duyệt cũng có thể hiển thị:
   * /admin/giaovien/A%407979
   */
  if (showAdmin) {
    return (
      <AdminTeachersPage />
    )
  }

  /**
   * Bước 1:
   * Chọn hạng xe.
   */
  if (
    step === 'vehicle'
  ) {
    return (
      <VehicleSelectionPage
        onSelect={
          selectVehicle
        }
      />
    )
  }

  /**
   * Bước 2:
   * Chọn nội dung tập.
   */
  if (
    step === 'training' &&
    state.vehicleCategory
  ) {
    return (
      <TrainingSelectionPage
        vehicleCategory={
          state.vehicleCategory
        }
        onSelect={
          selectTraining
        }
        onBack={
          newEvaluation
        }
      />
    )
  }

  /**
   * Bước 3:
   * Nhập thông tin học viên.
   */
  if (
    step === 'information'
  ) {
    return (
      <StudentInformationPage
        state={state}
        onChange={
          updateState
        }
        onBack={() => {
          setStep(
            'training',
          )

          scrollToTop()
        }}
        onContinue={
          continueToEvaluation
        }
      />
    )
  }

  /**
   * Bước 4:
   * Đánh giá.
   */
  if (
    step === 'evaluation'
  ) {
    /**
     * Phiếu tập cơ bản
     * hoặc đường trường.
     */
    if (
      state.trainingType ===
        'BASIC' ||
      state.trainingType ===
        'ROAD'
    ) {
      return (
        <ChecklistEvaluationPage
          state={state}
          onChange={
            updateState
          }
          onBack={() => {
            setStep(
              'information',
            )

            scrollToTop()
          }}
          onPreview={
            openReport
          }
        />
      )
    }

    /**
     * Phiếu sát hạch sa hình.
     */
    return (
      <EvaluationPage
        state={state}
        onChange={
          updateState
        }
        onBack={() => {
          setStep(
            'information',
          )

          scrollToTop()
        }}
        onPreview={
          openReport
        }
      />
    )
  }

  /**
   * Bước 5:
   * Xem và tải phiếu.
   */
  return (
    <ReportPreviewPage
      state={state}
      onChange={
        updateState
      }
      onEdit={() => {
        setStep(
          'evaluation',
        )

        scrollToTop()
      }}
      onNew={
        newEvaluation
      }
    />
  )
}