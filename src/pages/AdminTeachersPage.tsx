import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  deleteEvaluationAdminRecord,
  getEvaluationAdminRecords,
  subscribeEvaluationAdminRecords,
  type AdminTrainingType,
  type EvaluationAdminRecord,
} from '../services/evaluationAdminStore'

import '../styles/admin-teachers.css'

/**
 * Bổ sung các trường chi tiết.
 *
 * Cách viết này vẫn build được trong trường hợp
 * interface EvaluationAdminRecord cũ chưa khai báo đủ.
 */
type AdminRecord =
  EvaluationAdminRecord & {
    vehicleNumber?: string
    practiceAttempt?: string
    trainingCourse?: string
    teacherComment?: string
    evaluationData?: unknown
    updatedAt?: string
  }

type TrainingFilter =
  | 'ALL'
  | AdminTrainingType

type DatePreset =
  | 'ALL'
  | 'TODAY'
  | 'SEVEN_DAYS'
  | 'THIS_MONTH'
  | 'CUSTOM'

type SortMode =
  | 'NEWEST'
  | 'OLDEST'
  | 'TEACHER_ASC'
  | 'TEACHER_DESC'
  | 'STUDENT_ASC'
  | 'STUDENT_DESC'

type AdminView =
  | 'RECORDS'
  | 'TEACHERS'

interface TeacherSummary {
  key: string
  teacherName: string
  totalEvaluations: number
  totalStudents: number
  latestCreatedAt: string
  trainingTypes: AdminTrainingType[]
  vehicleCategories: string[]
  records: AdminRecord[]
}

interface AdminDetailItem {
  order: string | number
  title: string
  description?: string
  result: string
}

const TRAINING_LABELS: Record<
  AdminTrainingType,
  string
> = {
  BASIC: 'Tập cơ bản',
  EXAM: 'Sa hình',
  ROAD: 'Đường trường',
}

const RESULT_LABELS: Record<
  string,
  string
> = {
  UNDERSTOOD: 'Đã hiểu',
  NEEDS_WORK: 'Cần lưu ý',
  UNCLEAR: 'Chưa rõ',

  GOOD: 'Tốt',
  FAIR: 'Khá',
  AVERAGE: 'Trung bình',
  WEAK: 'Yếu',

  BASIC_UNDERSTOOD:
    'Tốt – nắm vững kiến thức, thao tác tốt',

  BASIC_NEEDS_WORK:
    'Cần lưu ý – cần chú ý và luyện tập thêm',

  BASIC_PRACTICE:
    'Cần luyện thêm – cần luyện tập và theo dõi thêm',

  ROAD_PASSED: 'Đạt yêu cầu',
  ROAD_NOT_PASSED: 'Chưa đạt',

  PASSED: 'Đạt',
  NOT_PASSED: 'Chưa đạt',

  COMPLETED: 'Hoàn thành',
  NOT_COMPLETED: 'Chưa hoàn thành',

  PASS: 'Đạt',
  FAIL: 'Chưa đạt',
}

function normalizeText(
  value: string,
): string {
  return value
    .trim()
    .toLocaleLowerCase('vi-VN')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getDateInputValue(
  date: Date,
): string {
  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, '0')

  const day =
    String(
      date.getDate(),
    ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function parseDateValue(
  value: string,
): Date {
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    return new Date(
      `${value}T00:00:00`,
    )
  }

  return new Date(value)
}

function formatDate(
  value: string,
): string {
  if (!value) {
    return '—'
  }

  const date =
    parseDateValue(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return new Intl.DateTimeFormat(
    'vi-VN',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  ).format(date)
}

function formatDateTime(
  value: string,
): string {
  if (!value) {
    return '—'
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return new Intl.DateTimeFormat(
    'vi-VN',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date)
}

function getUpdatedAt(
  record: AdminRecord,
): string {
  return (
    record.updatedAt ||
    record.createdAt
  )
}

function isToday(
  value: string,
): boolean {
  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return false
  }

  const today =
    new Date()

  return (
    date.getFullYear() ===
      today.getFullYear() &&
    date.getMonth() ===
      today.getMonth() &&
    date.getDate() ===
      today.getDate()
  )
}

function isRecordInDateRange(
  record: AdminRecord,
  startDate: string,
  endDate: string,
): boolean {
  const rawDate =
    record.evaluationDate ||
    record.createdAt

  const recordDate =
    parseDateValue(rawDate)

  if (
    Number.isNaN(
      recordDate.getTime(),
    )
  ) {
    return false
  }

  recordDate.setHours(
    0,
    0,
    0,
    0,
  )

  if (startDate) {
    const start =
      parseDateValue(
        startDate,
      )

    start.setHours(
      0,
      0,
      0,
      0,
    )

    if (
      recordDate < start
    ) {
      return false
    }
  }

  if (endDate) {
    const end =
      parseDateValue(
        endDate,
      )

    end.setHours(
      23,
      59,
      59,
      999,
    )

    if (
      recordDate > end
    ) {
      return false
    }
  }

  return true
}

function getDisplayResult(
  value:
    string | null | undefined,
): string {
  if (!value) {
    return 'Chưa ghi'
  }

  return (
    RESULT_LABELS[value] ||
    value
  )
}

function escapeCsv(
  value: unknown,
): string {
  const text =
    String(value ?? '')

  return `"${text.replace(
    /"/g,
    '""',
  )}"`
}

function exportRecordsToCsv(
  records: AdminRecord[],
): void {
  const header = [
    'Tên giáo viên',
    'Tên học viên',
    'Loại đánh giá',
    'Hạng xe',
    'Số xe',
    'Lần tập',
    'Khóa học',
    'Ngày đánh giá',
    'Kết quả chung',
    'Nhận xét giáo viên',
    'Thời gian tạo',
    'Thời gian cập nhật',
  ]

  const rows =
    records.map(
      (record) => [
        record.teacherName,
        record.studentName,

        TRAINING_LABELS[
          record.trainingType
        ],

        record.vehicleCategory,

        record.vehicleNumber ||
          '',

        record.practiceAttempt ||
          '',

        record.trainingCourse ||
          '',

        record.evaluationDate,

        getDisplayResult(
          record.overallResult,
        ),

        record.teacherComment ||
          '',

        formatDateTime(
          record.createdAt,
        ),

        formatDateTime(
          getUpdatedAt(record),
        ),
      ],
    )

  const content = [
    header,
    ...rows,
  ]
    .map((row) =>
      row
        .map(escapeCsv)
        .join(','),
    )
    .join('\n')

  const blob =
    new Blob(
      [`\uFEFF${content}`],
      {
        type:
          'text/csv;charset=utf-8',
      },
    )

  const url =
    URL.createObjectURL(blob)

  const link =
    document.createElement('a')

  link.href = url

  link.download =
    `du-lieu-danh-gia-${getDateInputValue(
      new Date(),
    )}.csv`

  document.body.appendChild(
    link,
  )

  link.click()
  link.remove()

  URL.revokeObjectURL(url)
}

function asObject(
  value: unknown,
): Record<string, unknown> | null {
  if (
    value &&
    typeof value ===
      'object' &&
    !Array.isArray(value)
  ) {
    return value as Record<
      string,
      unknown
    >
  }

  return null
}

function readText(
  source:
    Record<string, unknown>,
  keys: string[],
): string {
  for (
    const key of keys
  ) {
    const value =
      source[key]

    if (
      typeof value ===
        'string' ||
      typeof value ===
        'number' ||
      typeof value ===
        'boolean'
    ) {
      const text =
        String(value).trim()

      if (text) {
        return text
      }
    }
  }

  return ''
}

function createDetailItem(
  rawItem: unknown,
  index: number,
): AdminDetailItem {
  const item =
    asObject(rawItem) || {}

  const rawResult =
    readText(
      item,
      [
        'rating',
        'status',
        'result',
        'evaluation',
        'level',
        'conclusion',
      ],
    )

  return {
    order:
      readText(
        item,
        [
          'order',
          'number',
          'index',
        ],
      ) ||
      index + 1,

    title:
      readText(
        item,
        [
          'title',
          'name',
          'label',
        ],
      ) ||
      `Nội dung ${index + 1}`,

    description:
      readText(
        item,
        [
          'description',
          'note',
          'detail',
          'comment',
        ],
      ) ||
      undefined,

    result:
      getDisplayResult(
        rawResult,
      ),
  }
}

function getEvaluationItems(
  record: AdminRecord,
): AdminDetailItem[] {
  const snapshot =
    asObject(
      record.evaluationData,
    )

  if (!snapshot) {
    return []
  }

  const items:
    AdminDetailItem[] = []

  if (
    record.trainingType ===
    'EXAM'
  ) {
    const lessons =
      snapshot.lessons

    if (
      Array.isArray(lessons)
    ) {
      lessons.forEach(
        (
          lesson,
          index,
        ) => {
          items.push(
            createDetailItem(
              lesson,
              index,
            ),
          )
        },
      )
    }

    const emergency =
      asObject(
        snapshot.emergencyEvaluation,
      )

    if (emergency) {
      const emergencyResult =
        readText(
          emergency,
          [
            'rating',
            'status',
            'result',
            'evaluation',
          ],
        )

      items.push({
        order:
          items.length + 1,

        title:
          readText(
            emergency,
            [
              'title',
              'name',
              'label',
            ],
          ) ||
          'Thao tác tình huống khẩn cấp',

        description:
          readText(
            emergency,
            [
              'description',
              'note',
              'detail',
            ],
          ) ||
          undefined,

        result:
          getDisplayResult(
            emergencyResult,
          ),
      })
    }

    return items
  }

  const checklistItems =
    snapshot.checklistItems

  if (
    !Array.isArray(
      checklistItems,
    )
  ) {
    return []
  }

  return checklistItems.map(
    createDetailItem,
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle
        cx="11"
        cy="11"
        r="7"
      />

      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
      />

      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  )
}

function TeacherIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle
        cx="12"
        cy="8"
        r="4"
      />

      <path d="M4 21c.8-5 3.4-7 8-7s7.2 2 8 7" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M6 3h8l4 4v14H6z" />

      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  )
}

function CarIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="m5 16-1-3 2-5h12l2 5-1 3" />

      <path d="M4 13h16v6H4z" />

      <circle
        cx="7"
        cy="19"
        r="1.5"
      />

      <circle
        cx="17"
        cy="19"
        r="1.5"
      />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M4 5h16M7 12h10M10 19h4" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />

      <path d="M20 4v7h-7" />
    </svg>
  )
}

function AdminBrand() {
  const [
    imageError,
    setImageError,
  ] = useState(false)

  return (
    <div className="admin-pro-brand">
      <div className="admin-pro-brand-mark">
        {!imageError ? (
          <img
            src="/assets/logo-phu-giao.png"
            alt="Logo Trung tâm Giáo dục nghề nghiệp Phú Giáo"
            onError={() =>
              setImageError(true)
            }
          />
        ) : (
          <span>PG</span>
        )}
      </div>

      <div className="admin-pro-brand-copy">
        <small>
          TRUNG TÂM GIÁO DỤC
          NGHỀ NGHIỆP
        </small>

        <strong>
          PHÚ GIÁO
        </strong>
      </div>
    </div>
  )
}

export default function AdminTeachersPage() {
  const [
    records,
    setRecords,
  ] =
    useState<AdminRecord[]>(
      () =>
        getEvaluationAdminRecords() as
          AdminRecord[],
    )

  const [
    activeView,
    setActiveView,
  ] =
    useState<AdminView>(
      'RECORDS',
    )

  const [
    searchText,
    setSearchText,
  ] = useState('')

  const [
    trainingFilter,
    setTrainingFilter,
  ] =
    useState<TrainingFilter>(
      'ALL',
    )

  const [
    vehicleFilter,
    setVehicleFilter,
  ] = useState('ALL')

  const [
    datePreset,
    setDatePreset,
  ] =
    useState<DatePreset>(
      'ALL',
    )

  const [
    startDate,
    setStartDate,
  ] = useState('')

  const [
    endDate,
    setEndDate,
  ] = useState('')

  const [
    sortMode,
    setSortMode,
  ] =
    useState<SortMode>(
      'NEWEST',
    )

  const [
    selectedRecord,
    setSelectedRecord,
  ] =
    useState<
      AdminRecord | null
    >(null)

  const [
    selectedTeacher,
    setSelectedTeacher,
  ] =
    useState<
      TeacherSummary | null
    >(null)

  const refreshRecords =
    () => {
      setRecords(
        getEvaluationAdminRecords() as
          AdminRecord[],
      )
    }

  useEffect(() => {
    return subscribeEvaluationAdminRecords(
      refreshRecords,
    )
  }, [])

  const vehicleOptions =
    useMemo(() => {
      return Array.from(
        new Set(
          records
            .map((record) =>
              record.vehicleCategory.trim(),
            )
            .filter(Boolean),
        ),
      ).sort((left, right) =>
        left.localeCompare(
          right,
          'vi-VN',
        ),
      )
    }, [records])

  const applyDatePreset = (
    preset: DatePreset,
  ) => {
    setDatePreset(preset)

    const today =
      new Date()

    if (
      preset === 'ALL'
    ) {
      setStartDate('')
      setEndDate('')
      return
    }

    if (
      preset === 'TODAY'
    ) {
      const value =
        getDateInputValue(
          today,
        )

      setStartDate(value)
      setEndDate(value)
      return
    }

    if (
      preset ===
      'SEVEN_DAYS'
    ) {
      const start =
        new Date(today)

      start.setDate(
        start.getDate() - 6,
      )

      setStartDate(
        getDateInputValue(
          start,
        ),
      )

      setEndDate(
        getDateInputValue(
          today,
        ),
      )

      return
    }

    if (
      preset ===
      'THIS_MONTH'
    ) {
      const start =
        new Date(
          today.getFullYear(),
          today.getMonth(),
          1,
        )

      setStartDate(
        getDateInputValue(
          start,
        ),
      )

      setEndDate(
        getDateInputValue(
          today,
        ),
      )
    }
  }

  const filteredRecords =
    useMemo(() => {
      const search =
        normalizeText(
          searchText,
        )

      const result =
        records.filter(
          (record) => {
            const matchesTraining =
              trainingFilter ===
                'ALL' ||
              record.trainingType ===
                trainingFilter

            const matchesVehicle =
              vehicleFilter ===
                'ALL' ||
              record.vehicleCategory ===
                vehicleFilter

            const matchesDate =
              isRecordInDateRange(
                record,
                startDate,
                endDate,
              )

            const matchesSearch =
              !search ||
              [
                record.teacherName,
                record.studentName,
                record.vehicleCategory,
                record.vehicleNumber ||
                  '',
                record.trainingCourse ||
                  '',
                record.practiceAttempt ||
                  '',

                TRAINING_LABELS[
                  record.trainingType
                ],

                getDisplayResult(
                  record.overallResult,
                ),

                record.teacherComment ||
                  '',
              ].some((value) =>
                normalizeText(
                  value,
                ).includes(search),
              )

            return (
              matchesTraining &&
              matchesVehicle &&
              matchesDate &&
              matchesSearch
            )
          },
        )

      return [...result].sort(
        (
          left,
          right,
        ) => {
          if (
            sortMode ===
            'OLDEST'
          ) {
            return (
              new Date(
                left.createdAt,
              ).getTime() -
              new Date(
                right.createdAt,
              ).getTime()
            )
          }

          if (
            sortMode ===
            'TEACHER_ASC'
          ) {
            return left.teacherName.localeCompare(
              right.teacherName,
              'vi-VN',
            )
          }

          if (
            sortMode ===
            'TEACHER_DESC'
          ) {
            return right.teacherName.localeCompare(
              left.teacherName,
              'vi-VN',
            )
          }

          if (
            sortMode ===
            'STUDENT_ASC'
          ) {
            return left.studentName.localeCompare(
              right.studentName,
              'vi-VN',
            )
          }

          if (
            sortMode ===
            'STUDENT_DESC'
          ) {
            return right.studentName.localeCompare(
              left.studentName,
              'vi-VN',
            )
          }

          return (
            new Date(
              getUpdatedAt(
                right,
              ),
            ).getTime() -
            new Date(
              getUpdatedAt(
                left,
              ),
            ).getTime()
          )
        },
      )
    }, [
      records,
      searchText,
      trainingFilter,
      vehicleFilter,
      startDate,
      endDate,
      sortMode,
    ])

  const teacherSummaries =
    useMemo<
      TeacherSummary[]
    >(() => {
      const teacherMap =
        new Map<
          string,
          AdminRecord[]
        >()

      for (
        const record of
        filteredRecords
      ) {
        const key =
          normalizeText(
            record.teacherName,
          )

        const current =
          teacherMap.get(key) ||
          []

        current.push(record)

        teacherMap.set(
          key,
          current,
        )
      }

      return Array.from(
        teacherMap.entries(),
      )
        .map(
          ([key, items]) => {
            const sorted =
              [...items].sort(
                (
                  left,
                  right,
                ) =>
                  new Date(
                    getUpdatedAt(
                      right,
                    ),
                  ).getTime() -
                  new Date(
                    getUpdatedAt(
                      left,
                    ),
                  ).getTime(),
              )

            return {
              key,

              teacherName:
                sorted[0]
                  .teacherName,

              totalEvaluations:
                sorted.length,

              totalStudents:
                new Set(
                  sorted.map(
                    (item) =>
                      normalizeText(
                        item.studentName,
                      ),
                  ),
                ).size,

              latestCreatedAt:
                getUpdatedAt(
                  sorted[0],
                ),

              trainingTypes:
                Array.from(
                  new Set(
                    sorted.map(
                      (item) =>
                        item.trainingType,
                    ),
                  ),
                ),

              vehicleCategories:
                Array.from(
                  new Set(
                    sorted.map(
                      (item) =>
                        item.vehicleCategory,
                    ),
                  ),
                ),

              records: sorted,
            }
          },
        )
        .sort(
          (
            left,
            right,
          ) =>
            right.totalEvaluations -
            left.totalEvaluations,
        )
    }, [filteredRecords])

  const totalTeachers =
    new Set(
      records.map(
        (record) =>
          normalizeText(
            record.teacherName,
          ),
      ),
    ).size

  const totalToday =
    records.filter(
      (record) =>
        isToday(
          record.createdAt,
        ),
    ).length

  const hasActiveFilters =
    Boolean(
      searchText.trim(),
    ) ||
    trainingFilter !==
      'ALL' ||
    vehicleFilter !==
      'ALL' ||
    Boolean(startDate) ||
    Boolean(endDate)

  const clearFilters = () => {
    setSearchText('')
    setTrainingFilter('ALL')
    setVehicleFilter('ALL')
    setDatePreset('ALL')
    setStartDate('')
    setEndDate('')
    setSortMode('NEWEST')
  }

  const handleDelete = (
    record: AdminRecord,
  ) => {
    const accepted =
      window.confirm(
        `Xóa phiếu của học viên "${record.studentName}" do giáo viên "${record.teacherName}" nhập?`,
      )

    if (!accepted) {
      return
    }

    deleteEvaluationAdminRecord(
      record.id,
    )

    setSelectedRecord(null)
    setSelectedTeacher(null)

    refreshRecords()
  }

  const selectedItems =
    selectedRecord
      ? getEvaluationItems(
          selectedRecord,
        )
      : []

  return (
    <main className="admin-pro-page">
      <header className="admin-pro-header">
        <AdminBrand />

        <div className="admin-pro-header-right">
          <div className="admin-pro-online">
            <i />

            Hệ thống đang hoạt động
          </div>

          <div className="admin-pro-account">
            <small>
              QUẢN TRỊ VIÊN
            </small>

            <strong>
              Quản lý dữ liệu đánh giá
            </strong>
          </div>
        </div>
      </header>

      <section className="admin-pro-hero">
        <div>
          <span className="admin-pro-eyebrow">
            TRUNG TÂM ĐIỀU HÀNH
          </span>

          <h1>
            Quản lý dữ liệu
            <em>
              {' '}
              giáo viên & học viên
            </em>
          </h1>

          <p>
            Theo dõi toàn bộ phiếu
            đã đánh giá, lọc theo
            ngày, nội dung và từng
            hạng xe trên một giao
            diện quản trị duy nhất.
          </p>
        </div>

        <div className="admin-pro-hero-actions">
          <button
            type="button"
            onClick={
              refreshRecords
            }
          >
            <RefreshIcon />

            Làm mới
          </button>

          <button
            type="button"
            className="is-primary"
            disabled={
              filteredRecords.length ===
              0
            }
            onClick={() =>
              exportRecordsToCsv(
                filteredRecords,
              )
            }
          >
            <DownloadIcon />

            Xuất CSV
          </button>
        </div>
      </section>

      <section className="admin-pro-content">
        <div className="admin-pro-kpis">
          <article>
            <div className="admin-pro-kpi-icon">
              <TeacherIcon />
            </div>

            <div>
              <span>
                TỔNG GIÁO VIÊN
              </span>

              <strong>
                {totalTeachers}
              </strong>

              <small>
                Có dữ liệu trên hệ thống
              </small>
            </div>
          </article>

          <article>
            <div className="admin-pro-kpi-icon">
              <FileIcon />
            </div>

            <div>
              <span>
                TỔNG PHIẾU
              </span>

              <strong>
                {records.length}
              </strong>

              <small>
                Phiếu đánh giá đã lưu
              </small>
            </div>
          </article>

          <article>
            <div className="admin-pro-kpi-icon">
              <CalendarIcon />
            </div>

            <div>
              <span>
                HÔM NAY
              </span>

              <strong>
                {totalToday}
              </strong>

              <small>
                Phiếu tạo trong ngày
              </small>
            </div>
          </article>

          <article>
            <div className="admin-pro-kpi-icon">
              <CarIcon />
            </div>

            <div>
              <span>
                HẠNG XE
              </span>

              <strong>
                {vehicleOptions.length}
              </strong>

              <small>
                Hạng xe có dữ liệu
              </small>
            </div>
          </article>
        </div>

        <section className="admin-pro-filter-card">
          <div className="admin-pro-filter-heading">
            <div>
              <FilterIcon />

              <div>
                <strong>
                  Bộ lọc dữ liệu nâng cao
                </strong>

                <small>
                  Lọc theo ngày, loại
                  phiếu và từng hạng xe
                </small>
              </div>
            </div>

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={
                  clearFilters
                }
              >
                Xóa toàn bộ lọc
              </button>
            ) : null}
          </div>

          <div className="admin-pro-date-presets">
            {(
              [
                [
                  'ALL',
                  'Tất cả thời gian',
                ],
                [
                  'TODAY',
                  'Hôm nay',
                ],
                [
                  'SEVEN_DAYS',
                  '7 ngày gần nhất',
                ],
                [
                  'THIS_MONTH',
                  'Tháng này',
                ],
              ] as Array<
                [
                  DatePreset,
                  string,
                ]
              >
            ).map(
              ([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={
                    datePreset ===
                    value
                      ? 'is-selected'
                      : ''
                  }
                  onClick={() =>
                    applyDatePreset(
                      value,
                    )
                  }
                >
                  {label}
                </button>
              ),
            )}
          </div>

          <div className="admin-pro-filter-grid">
            <label className="admin-pro-search">
              <span>
                Tìm kiếm
              </span>

              <div>
                <SearchIcon />

                <input
                  type="search"
                  value={
                    searchText
                  }
                  onChange={(
                    event,
                  ) =>
                    setSearchText(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Tên giáo viên, học viên, số xe, kết quả..."
                />
              </div>
            </label>

            <label>
              <span>
                Từ ngày
              </span>

              <input
                type="date"
                value={
                  startDate
                }
                onChange={(
                  event,
                ) => {
                  setStartDate(
                    event.target
                      .value,
                  )

                  setDatePreset(
                    'CUSTOM',
                  )
                }}
              />
            </label>

            <label>
              <span>
                Đến ngày
              </span>

              <input
                type="date"
                value={
                  endDate
                }
                onChange={(
                  event,
                ) => {
                  setEndDate(
                    event.target
                      .value,
                  )

                  setDatePreset(
                    'CUSTOM',
                  )
                }}
              />
            </label>

            <label>
              <span>
                Loại đánh giá
              </span>

              <select
                value={
                  trainingFilter
                }
                onChange={(
                  event,
                ) =>
                  setTrainingFilter(
                    event.target
                      .value as
                      TrainingFilter,
                  )
                }
              >
                <option value="ALL">
                  Tất cả loại phiếu
                </option>

                <option value="BASIC">
                  Tập cơ bản
                </option>

                <option value="EXAM">
                  Sa hình
                </option>

                <option value="ROAD">
                  Đường trường
                </option>
              </select>
            </label>

            <label>
              <span>
                Hạng xe
              </span>

              <select
                value={
                  vehicleFilter
                }
                onChange={(
                  event,
                ) =>
                  setVehicleFilter(
                    event.target
                      .value,
                  )
                }
              >
                <option value="ALL">
                  Tất cả hạng xe
                </option>

                {vehicleOptions.map(
                  (category) => (
                    <option
                      key={
                        category
                      }
                      value={
                        category
                      }
                    >
                      {category}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              <span>
                Sắp xếp
              </span>

              <select
                value={
                  sortMode
                }
                onChange={(
                  event,
                ) =>
                  setSortMode(
                    event.target
                      .value as
                      SortMode,
                  )
                }
              >
                <option value="NEWEST">
                  Mới nhất trước
                </option>

                <option value="OLDEST">
                  Cũ nhất trước
                </option>

                <option value="TEACHER_ASC">
                  Giáo viên A–Z
                </option>

                <option value="TEACHER_DESC">
                  Giáo viên Z–A
                </option>

                <option value="STUDENT_ASC">
                  Học viên A–Z
                </option>

                <option value="STUDENT_DESC">
                  Học viên Z–A
                </option>
              </select>
            </label>
          </div>

          <div className="admin-pro-filter-result">
            <span>
              Đang hiển thị
            </span>

            <strong>
              {
                filteredRecords.length
              }
            </strong>

            <span>
              / {records.length} phiếu
            </span>

            {vehicleFilter !==
            'ALL' ? (
              <em>
                Hạng xe:{' '}
                {vehicleFilter}
              </em>
            ) : null}

            {startDate ||
            endDate ? (
              <em>
                Ngày:{' '}
                {startDate
                  ? formatDate(
                      startDate,
                    )
                  : 'đầu kỳ'}
                {' → '}
                {endDate
                  ? formatDate(
                      endDate,
                    )
                  : 'hiện tại'}
              </em>
            ) : null}
          </div>
        </section>

        <section className="admin-pro-data-card">
          <div className="admin-pro-data-heading">
            <div>
              <span>
                DỮ LIỆU ĐÃ ĐÁNH GIÁ
              </span>

              <h2>
                Danh sách quản lý
              </h2>
            </div>

            <div className="admin-pro-view-switch">
              <button
                type="button"
                className={
                  activeView ===
                  'RECORDS'
                    ? 'is-selected'
                    : ''
                }
                onClick={() =>
                  setActiveView(
                    'RECORDS',
                  )
                }
              >
                Danh sách phiếu
              </button>

              <button
                type="button"
                className={
                  activeView ===
                  'TEACHERS'
                    ? 'is-selected'
                    : ''
                }
                onClick={() =>
                  setActiveView(
                    'TEACHERS',
                  )
                }
              >
                Theo giáo viên
              </button>
            </div>
          </div>

          {activeView ===
          'RECORDS' ? (
            <div className="admin-pro-table-wrap">
              <table className="admin-pro-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Giáo viên</th>
                    <th>Học viên</th>
                    <th>Loại phiếu</th>
                    <th>Hạng xe</th>
                    <th>Số xe</th>
                    <th>Ngày đánh giá</th>
                    <th>Kết quả</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {filteredRecords.map(
                    (
                      record,
                      index,
                    ) => (
                      <tr
                        key={
                          record.id
                        }
                      >
                        <td>
                          <span className="admin-pro-index">
                            {String(
                              index +
                                1,
                            ).padStart(
                              2,
                              '0',
                            )}
                          </span>
                        </td>

                        <td>
                          <div className="admin-pro-person">
                            <span>
                              {record.teacherName
                                .charAt(
                                  0,
                                )
                                .toUpperCase()}
                            </span>

                            <strong>
                              {
                                record.teacherName
                              }
                            </strong>
                          </div>
                        </td>

                        <td>
                          <strong>
                            {
                              record.studentName
                            }
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`admin-pro-type admin-pro-type--${record.trainingType.toLocaleLowerCase()}`}
                          >
                            {
                              TRAINING_LABELS[
                                record
                                  .trainingType
                              ]
                            }
                          </span>
                        </td>

                        <td>
                          <span className="admin-pro-vehicle">
                            {
                              record.vehicleCategory
                            }
                          </span>
                        </td>

                        <td>
                          {record.vehicleNumber ||
                            '—'}
                        </td>

                        <td>
                          {formatDate(
                            record.evaluationDate,
                          )}
                        </td>

                        <td>
                          <span className="admin-pro-result">
                            {getDisplayResult(
                              record.overallResult,
                            )}
                          </span>
                        </td>

                        <td>
                          <div className="admin-pro-row-actions">
                            <button
                              type="button"
                              className="admin-pro-detail"
                              onClick={() =>
                                setSelectedRecord(
                                  record,
                                )
                              }
                            >
                              Xem chi tiết
                            </button>

                            <button
                              type="button"
                              className="admin-pro-delete"
                              onClick={() =>
                                handleDelete(
                                  record,
                                )
                              }
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>

              {filteredRecords.length ===
              0 ? (
                <div className="admin-pro-empty">
                  <FileIcon />

                  <h3>
                    Không tìm thấy dữ liệu
                  </h3>

                  <p>
                    Thay đổi ngày,
                    hạng xe hoặc từ
                    khóa tìm kiếm.
                  </p>

                  <button
                    type="button"
                    onClick={
                      clearFilters
                    }
                  >
                    Đặt lại bộ lọc
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="admin-pro-table-wrap">
              <table className="admin-pro-table admin-pro-table-teachers">
                <thead>
                  <tr>
                    <th>Giáo viên</th>
                    <th>Số phiếu</th>
                    <th>Học viên</th>
                    <th>Loại đánh giá</th>
                    <th>Hạng xe</th>
                    <th>Cập nhật gần nhất</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {teacherSummaries.map(
                    (
                      teacher,
                    ) => (
                      <tr
                        key={
                          teacher.key
                        }
                      >
                        <td>
                          <div className="admin-pro-person">
                            <span>
                              {teacher.teacherName
                                .charAt(
                                  0,
                                )
                                .toUpperCase()}
                            </span>

                            <div>
                              <strong>
                                {
                                  teacher.teacherName
                                }
                              </strong>

                              <small>
                                {
                                  teacher.totalEvaluations
                                }{' '}
                                phiếu đã nhập
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <strong className="admin-pro-count">
                            {
                              teacher.totalEvaluations
                            }
                          </strong>
                        </td>

                        <td>
                          {
                            teacher.totalStudents
                          }
                        </td>

                        <td>
                          <div className="admin-pro-tags">
                            {teacher.trainingTypes.map(
                              (
                                type,
                              ) => (
                                <span
                                  key={
                                    type
                                  }
                                >
                                  {
                                    TRAINING_LABELS[
                                      type
                                    ]
                                  }
                                </span>
                              ),
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="admin-pro-tags is-muted">
                            {teacher.vehicleCategories.map(
                              (
                                category,
                              ) => (
                                <span
                                  key={
                                    category
                                  }
                                >
                                  {
                                    category
                                  }
                                </span>
                              ),
                            )}
                          </div>
                        </td>

                        <td>
                          <strong>
                            {formatDate(
                              teacher.latestCreatedAt,
                            )}
                          </strong>

                          <small className="admin-pro-time">
                            {formatDateTime(
                              teacher.latestCreatedAt,
                            )}
                          </small>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="admin-pro-detail"
                            onClick={() =>
                              setSelectedTeacher(
                                teacher,
                              )
                            }
                          >
                            Xem phiếu
                          </button>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      {selectedTeacher ? (
        <div
          className="admin-pro-overlay"
          onMouseDown={() =>
            setSelectedTeacher(
              null,
            )
          }
        >
          <aside
            className="admin-pro-drawer"
            onMouseDown={(
              event,
            ) =>
              event.stopPropagation()
            }
          >
            <div className="admin-pro-drawer-heading">
              <div className="admin-pro-person">
                <span>
                  {selectedTeacher.teacherName
                    .charAt(0)
                    .toUpperCase()}
                </span>

                <div>
                  <small>
                    GIÁO VIÊN
                  </small>

                  <h2>
                    {
                      selectedTeacher.teacherName
                    }
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedTeacher(
                    null,
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="admin-pro-drawer-stats">
              <div>
                <span>
                  Số phiếu
                </span>

                <strong>
                  {
                    selectedTeacher.totalEvaluations
                  }
                </strong>
              </div>

              <div>
                <span>
                  Học viên
                </span>

                <strong>
                  {
                    selectedTeacher.totalStudents
                  }
                </strong>
              </div>

              <div>
                <span>
                  Hạng xe
                </span>

                <strong>
                  {
                    selectedTeacher
                      .vehicleCategories
                      .length
                  }
                </strong>
              </div>
            </div>

            <div className="admin-pro-drawer-list">
              {selectedTeacher.records.map(
                (record) => (
                  <article
                    key={
                      record.id
                    }
                  >
                    <div>
                      <span
                        className={`admin-pro-type admin-pro-type--${record.trainingType.toLocaleLowerCase()}`}
                      >
                        {
                          TRAINING_LABELS[
                            record.trainingType
                          ]
                        }
                      </span>

                      <b className="admin-pro-vehicle">
                        {
                          record.vehicleCategory
                        }
                      </b>
                    </div>

                    <h3>
                      {
                        record.studentName
                      }
                    </h3>

                    <dl>
                      <div>
                        <dt>
                          Ngày đánh giá
                        </dt>

                        <dd>
                          {formatDate(
                            record.evaluationDate,
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Số xe
                        </dt>

                        <dd>
                          {record.vehicleNumber ||
                            'Chưa nhập'}
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Kết quả
                        </dt>

                        <dd>
                          {getDisplayResult(
                            record.overallResult,
                          )}
                        </dd>
                      </div>
                    </dl>

                    <div className="admin-pro-drawer-actions">
                      <button
                        type="button"
                        className="primary"
                        onClick={() => {
                          setSelectedTeacher(
                            null,
                          )

                          setSelectedRecord(
                            record,
                          )
                        }}
                      >
                        Xem đầy đủ
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            record,
                          )
                        }
                      >
                        Xóa phiếu
                      </button>
                    </div>
                  </article>
                ),
              )}
            </div>
          </aside>
        </div>
      ) : null}

      {selectedRecord ? (
        <div
          className="admin-detail-overlay"
          onMouseDown={() =>
            setSelectedRecord(
              null,
            )
          }
        >
          <section
            className="admin-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Chi tiết phiếu của học viên ${selectedRecord.studentName}`}
            onMouseDown={(
              event,
            ) =>
              event.stopPropagation()
            }
          >
            <header className="admin-detail-header">
              <div>
                <span>
                  CHI TIẾT PHIẾU ĐÁNH GIÁ
                </span>

                <h2>
                  {
                    selectedRecord.studentName
                  }
                </h2>

                <p>
                  Mã phiếu:{' '}
                  {
                    selectedRecord.id
                  }
                </p>
              </div>

              <button
                type="button"
                aria-label="Đóng chi tiết"
                onClick={() =>
                  setSelectedRecord(
                    null,
                  )
                }
              >
                ×
              </button>
            </header>

            <div className="admin-detail-summary">
              <article>
                <small>
                  GIÁO VIÊN
                </small>

                <strong>
                  {
                    selectedRecord.teacherName
                  }
                </strong>
              </article>

              <article>
                <small>
                  LOẠI PHIẾU
                </small>

                <strong>
                  {
                    TRAINING_LABELS[
                      selectedRecord
                        .trainingType
                    ]
                  }
                </strong>
              </article>

              <article>
                <small>
                  HẠNG XE
                </small>

                <strong>
                  {
                    selectedRecord.vehicleCategory
                  }
                </strong>
              </article>

              <article>
                <small>
                  NGÀY ĐÁNH GIÁ
                </small>

                <strong>
                  {formatDate(
                    selectedRecord.evaluationDate,
                  )}
                </strong>
              </article>
            </div>

            <div className="admin-detail-grid">
              <section className="admin-detail-card">
                <h3>
                  Thông tin buổi học
                </h3>

                <dl>
                  <div>
                    <dt>
                      Học viên
                    </dt>

                    <dd>
                      {
                        selectedRecord.studentName
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Giáo viên
                    </dt>

                    <dd>
                      {
                        selectedRecord.teacherName
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Số xe
                    </dt>

                    <dd>
                      {selectedRecord.vehicleNumber ||
                        'Chưa nhập'}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Hạng xe
                    </dt>

                    <dd>
                      {
                        selectedRecord.vehicleCategory
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Khóa học
                    </dt>

                    <dd>
                      {selectedRecord.trainingCourse ||
                        'Chưa nhập'}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Lần tập
                    </dt>

                    <dd>
                      {selectedRecord.practiceAttempt ||
                        'Chưa nhập'}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Thời gian tạo
                    </dt>

                    <dd>
                      {formatDateTime(
                        selectedRecord.createdAt,
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Cập nhật cuối
                    </dt>

                    <dd>
                      {formatDateTime(
                        getUpdatedAt(
                          selectedRecord,
                        ),
                      )}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="admin-detail-card admin-detail-result-card">
                <h3>
                  Kết quả chung
                </h3>

                <strong>
                  {getDisplayResult(
                    selectedRecord.overallResult,
                  )}
                </strong>

                <h4>
                  Nhận xét giáo viên
                </h4>

                <p>
                  {selectedRecord.teacherComment ||
                    'Giáo viên chưa nhập nhận xét.'}
                </p>
              </section>
            </div>

            <section className="admin-detail-card admin-detail-full">
              <h3>
                Nội dung đánh giá chi tiết
              </h3>

              {selectedItems.length >
              0 ? (
                <div className="admin-detail-table-wrap">
                  <table className="admin-detail-table">
                    <thead>
                      <tr>
                        <th>
                          STT
                        </th>

                        <th>
                          Nội dung
                        </th>

                        <th>
                          Mô tả
                        </th>

                        <th>
                          Kết quả
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedItems.map(
                        (
                          item,
                          index,
                        ) => (
                          <tr
                            key={`${item.title}-${index}`}
                          >
                            <td>
                              {
                                item.order
                              }
                            </td>

                            <td>
                              <strong>
                                {
                                  item.title
                                }
                              </strong>
                            </td>

                            <td>
                              {item.description ||
                                '—'}
                            </td>

                            <td>
                              <span>
                                {
                                  item.result
                                }
                              </span>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="admin-detail-empty">
                  Phiếu này chưa có dữ
                  liệu chi tiết. Phiếu
                  cũ được tạo trước khi
                  bổ sung chức năng lưu
                  toàn bộ nội dung sẽ
                  chỉ hiển thị thông tin
                  cơ bản. Hãy tạo phiếu
                  mới hoặc mở phiếu cũ,
                  sửa rồi lưu lại.
                </div>
              )}
            </section>

            <footer className="admin-detail-footer">
              <button
                type="button"
                className="danger"
                onClick={() =>
                  handleDelete(
                    selectedRecord,
                  )
                }
              >
                Xóa phiếu
              </button>

              <button
                type="button"
                className="primary"
                onClick={() =>
                  setSelectedRecord(
                    null,
                  )
                }
              >
                Đóng chi tiết
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </main>
  )
}