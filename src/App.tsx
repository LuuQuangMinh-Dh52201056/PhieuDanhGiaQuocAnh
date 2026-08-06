import {
  useEffect,
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
 * Đường dẫn quản trị hiện tại.
 *
 * Local:
 * http://localhost:5173/admin/giaovien/A@7979
 *
 * Render:
 * https://ten-web.onrender.com/admin/giaovien/A@7979
 */
const ADMIN_PATH =
  '/admin/giaovien/A@7979'

/**
 * Tạo trạng thái ban đầu
 * cho một phiếu đánh giá mới.
 */
function createEmptyState(): EvaluationState {
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
 * Xóa dấu / ở cuối đường dẫn.
 *
 * Ví dụ:
 *
 * /admin/giaovien/A@7979/
 *
 * được chuyển thành:
 *
 * /admin/giaovien/A@7979
 */
function normalizePathname(
  pathname: string,
): string {
  const normalized =
    pathname.replace(
      /\/+$/,
      '',
    )

  return normalized || '/'
}

/**
 * Kiểm tra đường dẫn hiện tại
 * có phải trang admin hay không.
 *
 * Có hỗ trợ trường hợp trình duyệt
 * mã hóa ký tự @ thành %40.
 */
function isAdminPath(
  pathname: string,
): boolean {
  let decodedPathname =
    pathname

  try {
    decodedPathname =
      decodeURIComponent(
        pathname,
      )
  } catch {
    decodedPathname =
      pathname
  }

  return (
    normalizePathname(
      decodedPathname,
    ) === ADMIN_PATH
  )
}

/**
 * Chuyển loại nội dung tập
 * sang loại dữ liệu admin.
 *
 * COURSE:
 * Phiếu sát hạch sa hình.
 *
 * EXAM:
 * Tên loại lưu trên Firebase.
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
 * Lấy kết quả chung
 * của toàn bộ phiếu.
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
  /**
   * Bước hiện tại của quy trình.
   */
  const [
    step,
    setStep,
  ] =
    useState<AppStep>(
      'vehicle',
    )

  /**
   * Toàn bộ dữ liệu phiếu.
   */
  const [
    state,
    setState,
  ] =
    useState<EvaluationState>(
      createEmptyState,
    )

  /**
   * Tránh người dùng nhấn nút
   * xem phiếu nhiều lần liên tục,
   * làm tạo nhiều document Firebase.
   */
  const [
    isSaving,
    setIsSaving,
  ] = useState(false)

  /**
   * Kiểm tra URL ban đầu
   * có phải trang admin.
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
   * Theo dõi nút quay lại
   * và tiến tới của trình duyệt.
   */
  useEffect(() => {
    const handlePopState =
      () => {
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
   * Cập nhật một phần dữ liệu phiếu.
   */
  const updateState = (
    updates:
      Partial<EvaluationState>,
  ) => {
    setState(
      (current) => ({
        ...current,
        ...updates,
      }),
    )
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
    setState({
      ...createEmptyState(),

      vehicleCategory:
        category,
    })

    setStep('training')

    scrollToTop()
  }

  /**
   * Bước 2:
   * Chọn loại nội dung tập.
   */
  const selectTraining = (
    trainingType: TrainingType,
  ) => {
    if (
      !state.vehicleCategory
    ) {
      return
    }

    setState(
      (current) => ({
        ...current,

        trainingType,

        /**
         * Phiếu sát hạch sa hình.
         */
        lessons:
          trainingType ===
          'COURSE'
            ? createLessonEvaluations(
                current
                  .vehicleCategory!,
              )
            : [],

        emergencyEvaluation:
          trainingType ===
          'COURSE'
            ? createEmergencyEvaluation()
            : null,

        /**
         * Phiếu làm quen xe cơ bản
         * hoặc phiếu đường trường.
         */
        checklistItems:
          trainingType ===
          'COURSE'
            ? []
            : createChecklistItems(
                trainingType,

                current
                  .vehicleCategory!,
              ),

        checklistOverall:
          null,

        teacherComment: '',

        finalConclusion: null,
      }),
    )

    setStep('information')

    scrollToTop()
  }

  /**
   * Bước 3:
   * Kiểm tra thông tin học viên
   * và giáo viên.
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

      if (
        !state.evaluationDate
      ) {
        window.alert(
          'Vui lòng chọn ngày đánh giá.',
        )

        return
      }

      setStep('evaluation')

      scrollToTop()
    }

  /**
   * Lưu toàn bộ phiếu lên Firebase
   * rồi mở trang xem phiếu.
   */
  const openReport =
    async () => {
      /**
       * Ngăn lưu trùng khi đang
       * gửi dữ liệu lên Firebase.
       */
      if (isSaving) {
        return
      }

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

      if (
        !state.evaluationDate
      ) {
        window.alert(
          'Vui lòng chọn ngày đánh giá.',
        )

        return
      }

      /**
       * Tính kết luận cuối cùng
       * cho phiếu sát hạch sa hình.
       */
      const nextState:
        EvaluationState = {
        ...state,

        finalConclusion:
          state.trainingType ===
          'COURSE'
            ? state
                .finalConclusion ??
              calculateConclusion(
                state.lessons,
              )
            : null,
      }

      setState(nextState)

      setIsSaving(true)

      try {
        /**
         * Firebase hiện tại không
         * yêu cầu người dùng đăng nhập.
         *
         * Mỗi lần hoàn tất phiếu,
         * hệ thống tạo một document mới
         * trong collection evaluations.
         */
        await saveEvaluationAdminRecord({
          teacherName:
            nextState
              .instructorName
              .trim(),

          studentName:
            nextState
              .studentName
              .trim(),

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

          vehicleNumber:
            nextState
              .vehicleNumber
              .trim(),

          evaluationDate:
            nextState
              .evaluationDate,

          practiceAttempt:
            nextState
              .practiceAttempt
              .trim(),

          trainingCourse:
            nextState
              .trainingCourse
              .trim(),

          overallResult:
            getOverallResult(
              nextState,
            ),

          teacherComment:
            nextState
              .teacherComment
              .trim(),

          /**
           * Lưu toàn bộ dữ liệu phiếu.
           *
           * Trang admin sẽ dùng phần này
           * để xem chi tiết từng nội dung.
           */
          evaluationData:
            nextState,
        })

        setStep('report')

        scrollToTop()
      } catch (error) {
        console.error(
          'Không thể lưu dữ liệu lên Firebase:',
          error,
        )

        let message =
          'Không thể lưu phiếu đánh giá lên Firebase.'

        if (
          error instanceof Error
        ) {
          message =
            error.message
        }

        /**
         * Một số lỗi Firebase thường gặp.
         */
        if (
          message.includes(
            'permission-denied',
          ) ||
          message.includes(
            'Missing or insufficient permissions',
          )
        ) {
          message =
            'Firebase đang từ chối quyền lưu dữ liệu. Hãy kiểm tra Firestore Rules đã Publish hay chưa.'
        }

        if (
          message.includes(
            'unavailable',
          )
        ) {
          message =
            'Không thể kết nối Firebase. Hãy kiểm tra Internet rồi thử lại.'
        }

        window.alert(message)
      } finally {
        setIsSaving(false)
      }
    }

  /**
   * Tạo phiếu đánh giá mới.
   */
  const newEvaluation = () => {
    setState(
      createEmptyState(),
    )

    setStep('vehicle')

    setIsSaving(false)

    scrollToTop()
  }

  /**
   * Trang admin hiện tại.
   *
   * Trang admin đọc toàn bộ dữ liệu
   * từ collection evaluations.
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
   * Thực hiện đánh giá.
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

          onPreview={() => {
            void openReport()
          }}
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

        onPreview={() => {
          void openReport()
        }}
      />
    )
  }

  /**
   * Bước 5:
   * Xem và tải phiếu đánh giá.
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