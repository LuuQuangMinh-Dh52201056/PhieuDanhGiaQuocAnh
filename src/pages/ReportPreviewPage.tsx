import { useEffect, useRef, useState } from 'react'
import { toBlob, toPng } from 'html-to-image'
import { ArrowLeft, CheckCircle2, Download, FilePenLine, Images, LoaderCircle, RefreshCcw, Share2 } from 'lucide-react'
import { AppHeader } from '../components/AppHeader'
import { ChecklistReport } from '../components/ChecklistReport'
import { EvaluationReport } from '../components/EvaluationReport'
import type { EvaluationState } from '../types/evaluation'
import { CONCLUSION_META, COURSE_CONCLUSIONS, generateFileName } from '../utils/evaluation'

interface ReportPreviewPageProps {
  state: EvaluationState
  onChange: (updates: Partial<EvaluationState>) => void
  onEdit: () => void
  onNew: () => void
}

export function ReportPreviewPage({ state, onChange, onEdit, onNew }: ReportPreviewPageProps) {
  const reportRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState<'download' | 'share' | 'save' | null>(null)
  const [message, setMessage] = useState('')
  const isAppleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isChecklist = state.trainingType === 'BASIC' || state.trainingType === 'ROAD'

  useEffect(() => {
    const stage = stageRef.current
    const report = reportRef.current
    if (!stage || !report) return

    const resize = () => {
      const scale = Math.min(1, (stage.clientWidth - 2) / 1080)
      stage.style.setProperty('--report-scale', String(scale))
      stage.style.height = `${report.offsetHeight * scale}px`
    }
    const observer = new ResizeObserver(resize)
    observer.observe(stage)
    observer.observe(report)
    resize()
    return () => observer.disconnect()
  }, [state])

  const prepareNode = async () => {
    const node = reportRef.current
    if (!node) throw new Error('Không tìm thấy phiếu đánh giá')
    await document.fonts.ready
    const previousStyle = node.getAttribute('style')
    Object.assign(node.style, {
      transform: 'none',
      position: 'static',
      left: '0',
      marginLeft: '0',
    })
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    return {
      node,
      restore: () => {
        if (previousStyle === null) node.removeAttribute('style')
        else node.setAttribute('style', previousStyle)
      },
    }
  }

  const downloadImage = async () => {
    setBusy('download')
    setMessage('')
    try {
      const { node, restore } = await prepareNode()
      let dataUrl: string
      try {
        dataUrl = await toPng(node, { pixelRatio: 1, cacheBust: true, backgroundColor: '#f5f7fa' })
      } finally {
        restore()
      }
      const link = document.createElement('a')
      link.download = generateFileName(state)
      link.href = dataUrl
      link.click()
      setMessage('Đã tạo ảnh PNG sắc nét và bắt đầu tải xuống.')
    } catch {
      setMessage('Chưa thể tạo ảnh. Vui lòng thử lại sau ít giây.')
    } finally {
      setBusy(null)
    }
  }

  const shareImage = async (intent: 'share' | 'photos' = 'share') => {
    setBusy(intent === 'photos' ? 'save' : 'share')
    setMessage('')
    try {
      const { node, restore } = await prepareNode()
      let blob: Blob | null
      try {
        blob = await toBlob(node, { pixelRatio: 1, cacheBust: true, backgroundColor: '#f5f7fa' })
      } finally {
        restore()
      }
      if (!blob) throw new Error('Không thể tạo tệp ảnh')
      const file = new File([blob], generateFileName(state), { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        if (intent === 'photos') {
          setMessage('Trong bảng chia sẻ iPhone, chạm “Lưu hình ảnh” để đưa ảnh vào ứng dụng Ảnh.')
          window.setTimeout(() => setBusy(null), 2500)
        }

        // Safari iOS xử lý ảnh ổn định nhất khi chỉ chia sẻ tệp, không kèm text.
        const shareData = isAppleMobile
          ? { files: [file] }
          : {
              title: state.trainingType === 'BASIC'
                ? 'Phiếu đánh giá tập xe cơ bản'
                : state.trainingType === 'ROAD' ? 'Phiếu đánh giá đường trường' : 'Phiếu đánh giá sa hình',
              text: `Phiếu đánh giá của ${state.studentName}`,
              files: [file],
            }
        await navigator.share(shareData)
        setMessage(intent === 'photos'
          ? 'Nếu bạn đã chọn “Lưu hình ảnh”, phiếu hiện đã nằm trong ứng dụng Ảnh.'
          : 'Đã mở bảng chia sẻ. Bạn có thể chọn Zalo hoặc ứng dụng mong muốn.')
      } else {
        const url = URL.createObjectURL(file)
        const link = document.createElement('a')
        link.href = url
        link.download = file.name
        link.click()
        URL.revokeObjectURL(url)
        setMessage('Thiết bị chưa hỗ trợ chia sẻ trực tiếp; ảnh đã được tải xuống để bạn gửi qua Zalo.')
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') setMessage('Đã đóng bảng chia sẻ.')
      else setMessage('Chưa thể chia sẻ ảnh trên thiết bị này. Bạn có thể dùng nút Tải ảnh PNG.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="app-shell report-preview-page">
      <AppHeader activeStep={5} />
      <main className="report-preview-content">
        <div className="report-preview-heading">
          <div>
            <span>PHIẾU ĐÃ HOÀN THÀNH</span>
            <h1>Xem trước & xuất ảnh</h1>
            <p>Kiểm tra thông tin, chọn kết luận cuối cùng rồi tải ảnh hoặc chia sẻ.</p>
          </div>
          <button type="button" onClick={onEdit}><FilePenLine size={18} /> Sửa đánh giá</button>
        </div>

        {!isChecklist && (
          <section className="conclusion-control">
            <strong>Kết luận cuối cùng</strong>
            <p>Hệ thống đã đề xuất dựa trên kết quả; giáo viên có thể thay đổi trước khi xuất.</p>
            <div className="conclusion-options">
              {COURSE_CONCLUSIONS.map((key) => (
                <button type="button" key={key} className={state.finalConclusion === key ? 'is-selected' : ''} onClick={() => onChange({ finalConclusion: key })}>
                  <span>{state.finalConclusion === key && <CheckCircle2 size={17} />}</span>{CONCLUSION_META[key].label}
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="report-preview-canvas" ref={stageRef}>
          {isChecklist
            ? <ChecklistReport state={state} reportRef={reportRef} />
            : <EvaluationReport state={state} reportRef={reportRef} />}
        </div>

        {isAppleMobile && (
          <div className="ios-save-guide">
            <Images size={19} />
            <span><strong>Lưu trên iPhone:</strong> chạm “Lưu vào Ảnh”, sau đó chọn “Lưu hình ảnh” trong bảng chia sẻ của iOS.</span>
          </div>
        )}

        <div className="export-action-bar">
          <button className="button button--ghost" type="button" onClick={onEdit}><ArrowLeft size={18} /> Sửa đánh giá</button>
          <button className="button button--outline" type="button" onClick={() => shareImage('share')} disabled={busy !== null}>
            {busy === 'share' ? <LoaderCircle className="spin" size={19} /> : <Share2 size={19} />} Chia sẻ
          </button>
          <button
            className="button button--primary button--large"
            type="button"
            onClick={() => isAppleMobile ? shareImage('photos') : downloadImage()}
            disabled={busy !== null}
          >
            {busy === 'download' || busy === 'save'
              ? <LoaderCircle className="spin" size={19} />
              : isAppleMobile ? <Images size={19} /> : <Download size={19} />}
            {isAppleMobile ? 'Lưu vào Ảnh' : 'Tải ảnh PNG'}
          </button>
          <button className="button button--danger-ghost" type="button" onClick={onNew}><RefreshCcw size={18} /> Tạo phiếu mới</button>
        </div>
        {message && <div className="export-message" role="status"><CheckCircle2 size={19} /> {message}</div>}
      </main>
    </div>
  )
}
