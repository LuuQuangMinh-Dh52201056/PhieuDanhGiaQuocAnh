import { useLayoutEffect, useRef } from 'react'

export const TEACHER_COMMENT_LIMIT = 5000

interface TeacherCommentInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

export function TeacherCommentInput({ value, onChange, placeholder }: TeacherCommentInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.style.height = 'auto'
    input.style.height = `${Math.max(180, Math.min(input.scrollHeight, 480))}px`
  }, [value])

  return (
    <>
      <textarea
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={TEACHER_COMMENT_LIMIT}
        aria-label="Nhận xét của giáo viên"
        aria-describedby="teacher-comment-help"
        rows={6}
      />
      <p className="teacher-comment-help" id="teacher-comment-help">
        Có thể viết nhiều đoạn. Phiếu và ảnh tải về tự giãn để giữ đầy đủ nhận xét, không cắt chữ.
      </p>
    </>
  )
}
