import { useEffect, useRef, useState } from 'react'
import { toCanvas } from 'html-to-image'
import { ArrowLeft, CheckCircle2, Download, FilePenLine, Images, LoaderCircle, RefreshCcw, Share2 } from 'lucide-react'
import { AppHeader } from '../components/AppHeader'
import { AppFooter } from '../components/AppFooter'
import { ChecklistReport } from '../components/ChecklistReport'
import { EvaluationReport } from '../components/EvaluationReport'
import { PHU_GIAO_LOGO_DATA_URL } from '../components/TrainingCenterBrand'
import type { EvaluationState } from '../types/evaluation'
import { CONCLUSION_META, COURSE_CONCLUSIONS, generateFileName } from '../utils/evaluation'

interface ReportPreviewPageProps {
  state: EvaluationState
  onChange: (updates: Partial<EvaluationState>) => void
  onEdit: () => void
  onNew: () => void
}

interface ExportLogoRect {
  x: number
  y: number
  width: number
  height: number
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
    const images = Array.from(node.querySelectorAll('img'))
    await Promise.all(images.map(async (image) => {
      if (!image.complete) {
        await new Promise<void>((resolve) => {
          image.addEventListener('load', () => resolve(), { once: true })
          image.addEventListener('error', () => resolve(), { once: true })
        })
      }
      try {
        await image.decode?.()
      } catch {
        // Vẫn tiếp tục xuất nếu trình duyệt cũ không hỗ trợ decode().
      }
    }))
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

  const renderReportCanvas = async () => {
    const { node, restore } = await prepareNode()
    let canvas: HTMLCanvasElement | null = null
    let logoRects: ExportLogoRect[] = []
    try {
      const reportRect = node.getBoundingClientRect()
      logoRects = Array.from(node.querySelectorAll<HTMLElement>('[data-export-logo-slot]')).map((slot) => {
        const rect = slot.getBoundingClientRect()
        return {
          x: rect.left - reportRect.left,
          y: rect.top - reportRect.top,
          width: rect.width,
          height: rect.height,
        }
      })
      canvas = await toCanvas(node, {
        pixelRatio: 1,
        cacheBust: true,
        backgroundColor: '#f5f7fa',
        imagePlaceholder: PHU_GIAO_LOGO_DATA_URL,
      })
    } finally {
      restore()
    }
    if (!canvas) throw new Error('Không thể dựng ảnh phiếu đánh giá')

    // WebKit đôi khi bỏ ảnh nằm trong SVG foreignObject. Vẽ logo PNG thêm lần
    // cuối trực tiếp lên canvas để đầu và chân phiếu luôn có logo.
    const logo = new Image()
    await new Promise<void>((resolve, reject) => {
      logo.addEventListener('load', () => resolve(), { once: true })
      logo.addEventListener('error', () => reject(new Error('Không thể nạp logo Phú Giáo')), { once: true })
      logo.src = PHU_GIAO_LOGO_DATA_URL
    })
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Không thể hoàn thiện logo trên ảnh')
    const scaleX = canvas.width / node.offsetWidth
    const scaleY = canvas.height / node.offsetHeight
    logoRects.forEach((rect) => {
      const x = rect.x * scaleX
      const y = rect.y * scaleY
      const width = rect.width * scaleX
      const height = rect.height * scaleY
      const imageScale = Math.min(width / logo.naturalWidth, height / logo.naturalHeight)
      const drawWidth = logo.naturalWidth * imageScale
      const drawHeight = logo.naturalHeight * imageScale
      context.save()
      context.beginPath()
      context.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2)
      context.clip()
      context.drawImage(logo, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight)
      context.restore()
    })
    return canvas
  }

  const downloadImage = async () => {
    setBusy('download')
    setMessage('')
    try {
      const canvas = await renderReportCanvas()
      const dataUrl = canvas.toDataURL('image/png')
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
      const canvas = await renderReportCanvas()
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
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
      <AppFooter />
    </div>
  )
}
