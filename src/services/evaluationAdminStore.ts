export type AdminTrainingType =
  | 'BASIC'
  | 'EXAM'
  | 'ROAD'

export interface EvaluationAdminRecord {
  id: string

  teacherName: string
  studentName: string

  trainingType: AdminTrainingType
  vehicleCategory: string

  evaluationDate: string

  vehicleNumber?: string
  practiceAttempt?: string
  trainingCourse?: string

  overallResult?: string | null
  teacherComment?: string

  /**
   * Lưu toàn bộ dữ liệu phiếu để admin
   * xem chi tiết từng nội dung đã đánh giá.
   */
  evaluationData?: unknown

  createdAt: string
  updatedAt: string
}

export interface SaveEvaluationAdminInput {
  id?: string

  teacherName: string
  studentName: string

  trainingType: AdminTrainingType
  vehicleCategory: string

  evaluationDate?: string

  vehicleNumber?: string
  practiceAttempt?: string
  trainingCourse?: string

  overallResult?: string | null
  teacherComment?: string

  evaluationData?: unknown

  createdAt?: string
  updatedAt?: string
}

const STORAGE_KEY =
  'phu-giao:evaluation-records:v2'

const OLD_STORAGE_KEY =
  'phu-giao:evaluation-records:v1'

const UPDATE_EVENT =
  'phu-giao:evaluation-records-updated'

function cleanText(
  value: unknown,
): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
}

function createId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID ===
      'function'
  ) {
    return crypto.randomUUID()
  }

  return `evaluation-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`
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

function normalizeRecord(
  value: unknown,
): EvaluationAdminRecord | null {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return null
  }

  const record =
    value as Partial<EvaluationAdminRecord>

  const teacherName =
    cleanText(record.teacherName)

  const studentName =
    cleanText(record.studentName)

  const vehicleCategory =
    cleanText(
      record.vehicleCategory,
    )

  if (
    !teacherName ||
    !studentName ||
    !vehicleCategory ||
    !isTrainingType(
      record.trainingType,
    )
  ) {
    return null
  }

  const createdAt =
    typeof record.createdAt ===
      'string' &&
    record.createdAt
      ? record.createdAt
      : new Date().toISOString()

  return {
    id:
      cleanText(record.id) ||
      createId(),

    teacherName,

    studentName,

    trainingType:
      record.trainingType,

    vehicleCategory,

    evaluationDate:
      record.evaluationDate ||
      createdAt.slice(0, 10),

    vehicleNumber:
      cleanText(
        record.vehicleNumber,
      ) || undefined,

    practiceAttempt:
      cleanText(
        record.practiceAttempt,
      ) || undefined,

    trainingCourse:
      cleanText(
        record.trainingCourse,
      ) || undefined,

    overallResult:
      cleanText(
        record.overallResult,
      ) || null,

    teacherComment:
      String(
        record.teacherComment ??
          '',
      ).trim(),

    evaluationData:
      record.evaluationData ??
      null,

    createdAt,

    updatedAt:
      record.updatedAt ||
      createdAt,
  }
}

function readStorage(
  key: string,
): EvaluationAdminRecord[] {
  if (
    typeof window ===
    'undefined'
  ) {
    return []
  }

  try {
    const raw =
      window.localStorage.getItem(
        key,
      )

    if (!raw) {
      return []
    }

    const parsed: unknown =
      JSON.parse(raw)

    if (
      !Array.isArray(parsed)
    ) {
      return []
    }

    return parsed
      .map(normalizeRecord)
      .filter(
        (
          record,
        ): record is EvaluationAdminRecord =>
          record !== null,
      )
  } catch (error) {
    console.error(
      'Không đọc được dữ liệu admin:',
      error,
    )

    return []
  }
}

function writeRecords(
  records:
    EvaluationAdminRecord[],
): void {
  if (
    typeof window ===
    'undefined'
  ) {
    return
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(records),
  )

  window.dispatchEvent(
    new CustomEvent(
      UPDATE_EVENT,
    ),
  )
}

export function getEvaluationAdminRecords(): EvaluationAdminRecord[] {
  if (
    typeof window ===
    'undefined'
  ) {
    return []
  }

  let records =
    readStorage(STORAGE_KEY)

  /**
   * Tự chuyển dữ liệu cũ V1
   * sang dữ liệu mới V2.
   */
  if (
    records.length === 0
  ) {
    records =
      readStorage(
        OLD_STORAGE_KEY,
      )

    if (
      records.length > 0
    ) {
      writeRecords(records)
    }
  }

  return records.sort(
    (left, right) =>
      new Date(
        right.updatedAt,
      ).getTime() -
      new Date(
        left.updatedAt,
      ).getTime(),
  )
}

export function saveEvaluationAdminRecord(
  input:
    SaveEvaluationAdminInput,
): EvaluationAdminRecord {
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

  const records =
    getEvaluationAdminRecords()

  const oldRecord =
    input.id
      ? records.find(
          (record) =>
            record.id ===
            input.id,
        )
      : undefined

  const createdAt =
    input.createdAt ||
    oldRecord?.createdAt ||
    new Date().toISOString()

  const record:
    EvaluationAdminRecord = {
    id:
      input.id ||
      oldRecord?.id ||
      createId(),

    teacherName,

    studentName,

    trainingType:
      input.trainingType,

    vehicleCategory,

    evaluationDate:
      input.evaluationDate ||
      oldRecord?.evaluationDate ||
      createdAt.slice(0, 10),

    vehicleNumber:
      cleanText(
        input.vehicleNumber,
      ) || undefined,

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

    createdAt,

    updatedAt:
      input.updatedAt ||
      new Date().toISOString(),
  }

  const recordIndex =
    records.findIndex(
      (item) =>
        item.id === record.id,
    )

  if (
    recordIndex >= 0
  ) {
    records[recordIndex] =
      record
  } else {
    records.unshift(record)
  }

  records.sort(
    (left, right) =>
      new Date(
        right.updatedAt,
      ).getTime() -
      new Date(
        left.updatedAt,
      ).getTime(),
  )

  writeRecords(records)

  return record
}

export function deleteEvaluationAdminRecord(
  id: string,
): void {
  const records =
    getEvaluationAdminRecords().filter(
      (record) =>
        record.id !== id,
    )

  writeRecords(records)
}

export function subscribeEvaluationAdminRecords(
  callback: () => void,
): () => void {
  if (
    typeof window ===
    'undefined'
  ) {
    return () => undefined
  }

  const handleStorage = (
    event: StorageEvent,
  ) => {
    if (
      event.key ===
        STORAGE_KEY ||
      event.key ===
        OLD_STORAGE_KEY
    ) {
      callback()
    }
  }

  const handleUpdate =
    () => {
      callback()
    }

  window.addEventListener(
    'storage',
    handleStorage,
  )

  window.addEventListener(
    UPDATE_EVENT,
    handleUpdate,
  )

  return () => {
    window.removeEventListener(
      'storage',
      handleStorage,
    )

    window.removeEventListener(
      UPDATE_EVENT,
      handleUpdate,
    )
  }
}