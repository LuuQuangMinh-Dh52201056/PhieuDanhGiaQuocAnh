import { useEffect, useRef, useState } from 'react'
import { toBlob, toPng } from 'html-to-image'
import { ArrowLeft, CheckCircle2, Download, FilePenLine, LoaderCircle, RefreshCcw, Share2 } from 'lucide-react'
import { AppHeader } from '../components/AppHeader'
import { EvaluationReport } from '../components/EvaluationReport'
import type { EvaluationState, FinalConclusion } from '../types/evaluation'
import { CONCLUSION_META, generateFileName } from '../utils/evaluation'

interface ReportPreviewPageProps {
  state: EvaluationState
  onChange: (updates: Partial<EvaluationState>) => void
  onEdit: () => void
  onNew: () => void
}

export function ReportPreviewPage({ state, onChange, onEdit, onNew }: ReportPreviewPageProps) {
  const reportRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState<'download' | 'share' | null>(null)
  const [message, setMessage] = useState('')

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

  const shareImage = async () => {
    setBusy('share')
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
        await navigator.share({ title: 'Phiếu đánh giá sa hình', text: `Phiếu đánh giá của ${state.studentName}`, files: [file] })
        setMessage('Đã mở bảng chia sẻ. Bạn có thể chọn Zalo hoặc ứng dụng mong muốn.')
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
      <AppHeader activeStep={4} />
      <main className="report-preview-content">
        <div className="report-preview-heading">
          <div>
            <span>PHIẾU ĐÃ HOÀN THÀNH</span>
            <h1>Xem trước & xuất ảnh</h1>
            <p>Kiểm tra thông tin, chọn kết luận cuối cùng rồi tải ảnh hoặc chia sẻ.</p>
          </div>
          <button type="button" onClick={onEdit}><FilePenLine size={18} /> Sửa đánh giá</button>
        </div>

        <section className="conclusion-control">
          <strong>Kết luận cuối cùng</strong>
          <p>Hệ thống đã đề xuất dựa trên kết quả; giáo viên có thể thay đổi trước khi xuất.</p>
          <div className="conclusion-options">
            {(Object.keys(CONCLUSION_META) as FinalConclusion[]).map((key) => (
              <button type="button" key={key} className={state.finalConclusion === key ? 'is-selected' : ''} onClick={() => onChange({ finalConclusion: key })}>
                <span>{state.finalConclusion === key && <CheckCircle2 size={17} />}</span>{CONCLUSION_META[key].label}
              </button>
            ))}
          </div>
        </section>

        <div className="report-preview-canvas" ref={stageRef}>
          <EvaluationReport state={state} reportRef={reportRef} />
        </div>

        <div className="export-action-bar">
          <button className="button button--ghost" type="button" onClick={onEdit}><ArrowLeft size={18} /> Sửa đánh giá</button>
          <button className="button button--outline" type="button" onClick={shareImage} disabled={busy !== null}>
            {busy === 'share' ? <LoaderCircle className="spin" size={19} /> : <Share2 size={19} />} Chia sẻ
          </button>
          <button className="button button--primary button--large" type="button" onClick={downloadImage} disabled={busy !== null}>
            {busy === 'download' ? <LoaderCircle className="spin" size={19} /> : <Download size={19} />} Tải ảnh PNG
          </button>
          <button className="button button--danger-ghost" type="button" onClick={onNew}><RefreshCcw size={18} /> Tạo phiếu mới</button>
        </div>
        {message && <div className="export-message" role="status"><CheckCircle2 size={19} /> {message}</div>}
      </main>
    </div>
  )
}
