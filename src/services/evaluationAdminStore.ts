import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'

import {
  firestoreDatabase,
} from '../lib/firebase'

export type AdminTrainingType =
  | 'BASIC'
  | 'EXAM'
  | 'ROAD'

export interface EvaluationAdminRecord {
  id: string

  teacherName: string
  studentName: string

  trainingType:
    AdminTrainingType

  vehicleCategory: string
  vehicleNumber?: string

  evaluationDate: string

  practiceAttempt?: string
  trainingCourse?: string

  overallResult?:
    string | null

  teacherComment?: string

  evaluationData?: unknown

  createdAt: string
  updatedAt: string
}

function requireFirestoreDatabase(): Firestore {
  if (!firestoreDatabase) {
    throw new Error(
      'Firebase chưa được cấu hình hoặc chưa khởi tạo.',
    )
  }

  return firestoreDatabase
}

export interface SaveEvaluationAdminInput {
  /**
   * Vẫn giữ để App.tsx hiện tại
   * không báo lỗi TypeScript.
   *
   * Chế độ không đăng nhập luôn tạo
   * một document mới trên Firebase.
   */
  id?: string

  teacherName: string
  studentName: string

  trainingType:
    AdminTrainingType

  vehicleCategory: string
  vehicleNumber?: string

  evaluationDate?: string

  practiceAttempt?: string
  trainingCourse?: string

  overallResult?:
    string | null

  teacherComment?: string

  evaluationData?: unknown
}

function cleanText(
  value: unknown,
): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
}

function timestampToIso(
  value: unknown,
): string {
  if (
    value instanceof Timestamp
  ) {
    return value
      .toDate()
      .toISOString()
  }

  if (
    typeof value === 'string' &&
    value.trim()
  ) {
    return value
  }

  return new Date()
    .toISOString()
}

function isTrainingType(
  value: unknown,
): value is AdminTrainingType {
  return (
    value === 'BASIC' ||
    value === 'EXAM' ||
    value === 'ROAD'
  )
}

function mapDocument(
  id: string,
  data: DocumentData,
): EvaluationAdminRecord {
  const trainingType =
    isTrainingType(
      data.trainingType,
    )
      ? data.trainingType
      : 'BASIC'

  return {
    id,

    teacherName:
      cleanText(
        data.teacherName,
      ),

    studentName:
      cleanText(
        data.studentName,
      ),

    trainingType,

    vehicleCategory:
      cleanText(
        data.vehicleCategory,
      ),

    vehicleNumber:
      cleanText(
        data.vehicleNumber,
      ) || undefined,

    evaluationDate:
      cleanText(
        data.evaluationDate,
      ),

    practiceAttempt:
      cleanText(
        data.practiceAttempt,
      ) || undefined,

    trainingCourse:
      cleanText(
        data.trainingCourse,
      ) || undefined,

    overallResult:
      cleanText(
        data.overallResult,
      ) || null,

    teacherComment:
      String(
        data.teacherComment ??
          '',
      ).trim(),

    evaluationData:
      data.evaluationData ??
      null,

    createdAt:
      timestampToIso(
        data.createdAt,
      ),

    updatedAt:
      timestampToIso(
        data.updatedAt,
      ),
  }
}

/**
 * Lưu một phiếu mới lên Firebase.
 *
 * Không dùng localStorage.
 * Không yêu cầu đăng nhập.
 */
export async function saveEvaluationAdminRecord(
  input:
    SaveEvaluationAdminInput,
): Promise<EvaluationAdminRecord> {
  const teacherName =
    cleanText(
      input.teacherName,
    )

  const studentName =
    cleanText(
      input.studentName,
    )

  const vehicleCategory =
    cleanText(
      input.vehicleCategory,
    )

  if (!teacherName) {
    throw new Error(
      'Tên giáo viên không được để trống.',
    )
  }

  if (!studentName) {
    throw new Error(
      'Tên học viên không được để trống.',
    )
  }

  if (!vehicleCategory) {
    throw new Error(
      'Hạng xe không được để trống.',
    )
  }

  if (
    !isTrainingType(
      input.trainingType,
    )
  ) {
    throw new Error(
      'Loại đánh giá không hợp lệ.',
    )
  }

  const evaluationDate =
    input.evaluationDate ||
    new Date()
      .toISOString()
      .slice(0, 10)

  const dataToSave = {
    teacherName,
    studentName,

    trainingType:
      input.trainingType,

    vehicleCategory,

    vehicleNumber:
      cleanText(
        input.vehicleNumber,
      ),

    evaluationDate,

    practiceAttempt:
      cleanText(
        input.practiceAttempt,
      ),

    trainingCourse:
      cleanText(
        input.trainingCourse,
      ),

    overallResult:
      cleanText(
        input.overallResult,
      ) || null,

    teacherComment:
      String(
        input.teacherComment ??
          '',
      ).trim(),

    evaluationData:
      input.evaluationData ??
      null,

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp(),
  }

  const reference =
    await addDoc(
      collection(
        requireFirestoreDatabase(),
        'evaluations',
      ),

      dataToSave,
    )

  const now =
    new Date()
      .toISOString()

  return {
    id:
      reference.id,

    teacherName,
    studentName,

    trainingType:
      input.trainingType,

    vehicleCategory,

    vehicleNumber:
      cleanText(
        input.vehicleNumber,
      ) || undefined,

    evaluationDate,

    practiceAttempt:
      cleanText(
        input.practiceAttempt,
      ) || undefined,

    trainingCourse:
      cleanText(
        input.trainingCourse,
      ) || undefined,

    overallResult:
      cleanText(
        input.overallResult,
      ) || null,

    teacherComment:
      String(
        input.teacherComment ??
          '',
      ).trim(),

    evaluationData:
      input.evaluationData ??
      null,

    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Xóa vĩnh viễn một phiếu khỏi Firestore.
 *
 * Lưu ý: quyền xóa thực tế vẫn do Firestore Rules quyết định.
 */
export async function deleteEvaluationAdminRecord(
  id: string,
): Promise<void> {
  const normalizedId =
    cleanText(id)

  if (!normalizedId) {
    throw new Error(
      'Mã phiếu không hợp lệ.',
    )
  }

  await deleteDoc(
    doc(
      requireFirestoreDatabase(),
      'evaluations',
      normalizedId,
    ),
  )
}

/**
 * Theo dõi toàn bộ dữ liệu theo thời gian thực.
 *
 * Điện thoại khác tạo phiếu mới thì trang
 * admin đang mở sẽ tự nhận dữ liệu.
 */
export function subscribeEvaluationAdminRecords(
  onRecords: (
    records:
      EvaluationAdminRecord[],
  ) => void,

  onError?: (
    error: Error,
  ) => void,
): () => void {
  try {
    const recordsQuery =
      query(
        collection(
          requireFirestoreDatabase(),
          'evaluations',
        ),

        orderBy(
          'createdAt',
          'desc',
        ),
      )

    return onSnapshot(
      recordsQuery,

      (snapshot) => {
        const records =
          snapshot.docs.map(
            (document) =>
              mapDocument(
                document.id,
                document.data(),
              ),
          )

        onRecords(records)
      },

      (error) => {
        console.error(
          'Không thể tải dữ liệu Firebase:',
          error,
        )

        onError?.(error)
      },
    )
  } catch (error) {
    const normalizedError =
      error instanceof Error
        ? error
        : new Error(
            'Không thể khởi tạo Firebase.',
          )

    console.error(
      'Không thể khởi tạo Firebase:',
      normalizedError,
    )

    queueMicrotask(() => {
      onError?.(normalizedError)
    })

    return () => undefined
  }
}