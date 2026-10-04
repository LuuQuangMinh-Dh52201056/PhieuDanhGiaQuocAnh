import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, CheckCircle2, Download, FilePenLine, Images, LoaderCircle, RefreshCcw, Share2 } from 'lucide-react'
import { AppHeader } from '../components/AppHeader'
import { AppFooter } from '../components/AppFooter'
import { ChecklistReport } from '../components/ChecklistReport'
import { EvaluationReport } from '../components/EvaluationReport'
import { LINH_XUAN_LOGO_DATA_URL } from '../components/TrainingCenterBrand'
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

const DESKTOP_EXPORT_SCALE = 2.5
const MOBILE_EXPORT_SCALE = 2
const DESKTOP_MAX_CANVAS_PIXELS = 16_000_000
const MOBILE_MAX_CANVAS_PIXELS = 10_000_000
const DESKTOP_MAX_CANVAS_SIDE = 8192
const MOBILE_MAX_CANVAS_SIDE = 4096

function getUltraSharpPixelRatio(width: number, height: number, compactDevice: boolean) {
  const targetScale = compactDevice ? MOBILE_EXPORT_SCALE : DESKTOP_EXPORT_SCALE
  const maxPixels = compactDevice ? MOBILE_MAX_CANVAS_PIXELS : DESKTOP_MAX_CANVAS_PIXELS
  const maxSide = compactDevice ? MOBILE_MAX_CANVAS_SIDE : DESKTOP_MAX_CANVAS_SIDE
  return Math.max(1, Math.min(
    targetScale,
    maxSide / Math.max(width, height),
    Math.sqrt(maxPixels / (width * height)),
  ))
}

function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
}

export function ReportPreviewPage({ state, onChange, onEdit, onNew }: ReportPreviewPageProps) {
  const reportRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState<'download' | 'share' | 'save' | null>(null)
  const [message, setMessage] = useState('')
  const [exportFile, setExportFile] = useState<File | null>(null)
  const [isPreparing, setIsPreparing] = useState(true)
  const [fallbackImageUrl, setFallbackImageUrl] = useState('')
  const objectUrlsRef = useRef(new Set<string>())
  const isAppleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isCompactDevice = isMobileDevice || window.matchMedia('(max-width: 1024px)').matches
  const isChecklist = state.trainingType === 'BASIC' || state.trainingType === 'ROAD'

  useLayoutEffect(() => {
    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }

    const startedAt = window.performance.now()
    let frame = 0
    const keepPreviewAtTopWhileItSettles = () => {
      resetScroll()
      if (window.performance.now() - startedAt < 500) {
        frame = window.requestAnimationFrame(keepPreviewAtTopWhileItSettles)
      }
    }

    resetScroll()
    frame = window.requestAnimationFrame(keepPreviewAtTopWhileItSettles)

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [])

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

  const prepareNode = useCallback(async () => {
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
    const alreadyUsedStableExportColors = node.classList.contains('report-export-flat')
    node.classList.add('report-export-flat')
    Object.assign(node.style, {
      transform: 'none',
      position: 'static',
      left: '0',
      marginLeft: '0',
    })
    // Chờ hai khung hình để WebKit áp dụng trọn bộ màu xuất ổn định trước khi chụp.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    return {
      node,
      restore: () => {
        if (!alreadyUsedStableExportColors) node.classList.remove('report-export-flat')
        if (previousStyle === null) node.removeAttribute('style')
        else node.setAttribute('style', previousStyle)
      },
    }
  }, [])

  const renderReportCanvas = useCallback(async () => {
    const { toCanvas } = await import('html-to-image')
    const { node, restore } = await prepareNode()
    let canvas: HTMLCanvasElement | null = null
    let logoRects: ExportLogoRect[] = []
    try {
      const reportRect = node.getBoundingClientRect()
      const pixelRatio = getUltraSharpPixelRatio(node.offsetWidth, node.offsetHeight, isCompactDevice)
      logoRects = Array.from(node.querySelectorAll<HTMLElement>('[data-export-logo-slot]')).map((slot) => {
        const rect = slot.getBoundingClientRect()
        return {
          x: rect.left - reportRect.left,
          y: rect.top - reportRect.top,
          width: rect.width,
          height: rect.height,
        }
      })
      const renderOptions = {
        cacheBust: true,
        backgroundColor: '#f8fbff',
        imagePlaceholder: LINH_XUAN_LOGO_DATA_URL,
        skipAutoScale: true,
      }
      try {
        canvas = await toCanvas(node, { ...renderOptions, pixelRatio })
      } catch (error) {
        if (pixelRatio <= 1.5) throw error
        // Thử lại một lần ở mức tương thích nếu thiết bị thiếu bộ nhớ đồ họa.
        canvas = await toCanvas(node, { ...renderOptions, pixelRatio: 1.5 })
      }
    } finally {
      restore()
    }
    if (!canvas) throw new Error('Không thể dựng ảnh phiếu đánh giá')

    // WebKit đôi khi bỏ ảnh nằm trong SVG foreignObject. Vẽ logo PNG thêm lần
    // cuối trực tiếp lên canvas để đầu và chân phiếu luôn có logo.
    const logo = new Image()
    await new Promise<void>((resolve, reject) => {
      logo.addEventListener('load', () => resolve(), { once: true })
      logo.addEventListener('error', () => reject(new Error('Không thể nạp logo Linh Xuân')), { once: true })
      logo.src = LINH_XUAN_LOGO_DATA_URL
    })
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Không thể hoàn thiện logo trên ảnh')
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
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
      context.drawImage(logo, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight)
    })
    return canvas
  }, [isCompactDevice, prepareNode])

  const createExportFile = useCallback(async () => {
    const canvas = await renderReportCanvas()
    try {
      const blob = await canvasToPngBlob(canvas)
      if (!blob) throw new Error('Không thể tạo tệp ảnh')
      return new File([blob], generateFileName(state), { type: 'image/png' })
    } finally {
      // Giải phóng vùng nhớ lớn ngay sau khi đã đóng gói file PNG.
      canvas.width = 1
      canvas.height = 1
    }
  }, [renderReportCanvas, state])

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      setIsPreparing(true)
      setExportFile(null)
      setMessage('Đang chuẩn bị ảnh PNG sắc nét để lưu trên thiết bị...')
      void createExportFile()
        .then((file) => {
          if (cancelled) return
          setExportFile(file)
          setMessage('Ảnh PNG sắc nét đã sẵn sàng để lưu hoặc chia sẻ.')
        })
        .catch(() => {
          if (cancelled) return
          setMessage('Chưa thể chuẩn bị ảnh. Vui lòng tải lại trang và thử lại.')
        })
        .finally(() => {
          if (!cancelled) setIsPreparing(false)
        })
    }, 180)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [createExportFile])

  useEffect(() => () => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    objectUrlsRef.current.clear()
  }, [])

  const createTrackedUrl = (file: File, autoRevoke = true) => {
    const url = URL.createObjectURL(file)
    objectUrlsRef.current.add(url)
    if (autoRevoke) {
      window.setTimeout(() => {
        URL.revokeObjectURL(url)
        objectUrlsRef.current.delete(url)
      }, 60_000)
    }
    return url
  }

  const showSaveFallback = (file: File) => {
    if (fallbackImageUrl) {
      URL.revokeObjectURL(fallbackImageUrl)
      objectUrlsRef.current.delete(fallbackImageUrl)
    }
    const url = createTrackedUrl(file, false)
    setFallbackImageUrl(url)
    setMessage('Ảnh đã mở ở chế độ lưu thủ công. Chạm giữ ảnh để lưu vào thư viện ảnh của điện thoại.')
  }

  const closeSaveFallback = () => {
    if (fallbackImageUrl) {
      URL.revokeObjectURL(fallbackImageUrl)
      objectUrlsRef.current.delete(fallbackImageUrl)
    }
    setFallbackImageUrl('')
  }

  const safeCanShare = (file: File) => {
    try {
      return typeof navigator.share === 'function'
        && typeof navigator.canShare === 'function'
        && navigator.canShare({ files: [file] })
    } catch {
      return false
    }
  }

  const triggerDownload = (file: File) => {
    const url = createTrackedUrl(file)
    const link = document.createElement('a')
    link.download = file.name
    link.href = url
    link.rel = 'noopener'
    link.style.display = 'none'
    document.body.appendChild(link)
    try {
      link.click()
      setMessage(isMobileDevice
        ? 'Đã gửi ảnh PNG vào mục Tải xuống của điện thoại.'
        : 'Đã bắt đầu tải ảnh PNG sắc nét về máy.')
    } catch {
      showSaveFallback(file)
    } finally {
      link.remove()
    }
  }

  const downloadImage = () => {
    if (!exportFile) {
      setMessage('Ảnh đang được chuẩn bị. Vui lòng chờ thêm ít giây.')
      return
    }
    setBusy('download')
    triggerDownload(exportFile)
    window.setTimeout(() => setBusy(null), 350)
  }

  const shareImage = (intent: 'share' | 'photos' = 'share') => {
    if (!exportFile) {
      setMessage('Ảnh đang được chuẩn bị. Vui lòng chờ thêm ít giây.')
      return
    }

    if (!safeCanShare(exportFile)) {
      if (isAppleMobile) showSaveFallback(exportFile)
      else triggerDownload(exportFile)
      return
    }

    setBusy(intent === 'photos' ? 'save' : 'share')
    setMessage(intent === 'photos'
      ? 'Trong bảng chia sẻ, chọn “Lưu hình ảnh” để đưa phiếu vào ứng dụng Ảnh.'
      : 'Đang mở bảng chia sẻ của thiết bị...')

    // File đã được dựng sẵn nên navigator.share() được gọi ngay trong thao tác chạm.
    // Điều này giữ user-activation trên Safari iOS và các trình duyệt Android.
    const shareData: ShareData = isAppleMobile
      ? { files: [exportFile] }
      : {
          title: state.trainingType === 'BASIC'
            ? 'Phiếu đánh giá tập xe cơ bản'
            : state.trainingType === 'ROAD' ? 'Phiếu đánh giá đường trường' : 'Phiếu đánh giá sa hình',
          text: `Phiếu đánh giá của ${state.studentName}`,
          files: [exportFile],
        }

    navigator.share(shareData)
      .then(() => {
        setMessage(intent === 'photos'
          ? 'Phiếu đã được chuyển tới ứng dụng bạn chọn.'
          : 'Đã mở bảng chia sẻ thành công.')
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') {
          setMessage('Đã đóng bảng chia sẻ.')
          return
        }
        if (isMobileDevice) showSaveFallback(exportFile)
        else triggerDownload(exportFile)
      })
      .finally(() => setBusy(null))
  }

  const saveImage = () => {
    if (isAppleMobile) shareImage('photos')
    else downloadImage()
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
            <span><strong>Lưu trên iPhone:</strong> chạm “Lưu Ảnh”, sau đó chọn “Lưu hình ảnh” trong bảng chia sẻ của iOS.</span>
            <button className="mobile-save-alternative" type="button" disabled={!exportFile} onClick={() => exportFile && showSaveFallback(exportFile)}>Mở ảnh trực tiếp</button>
          </div>
        )}

        {isMobileDevice && !isAppleMobile && (
          <div className="ios-save-guide">
            <Download size={19} />
            <span><strong>Lưu trên Android:</strong> chạm “Lưu Ảnh”; tệp PNG sẽ nằm trong thư mục Tải xuống.</span>
            <button className="mobile-save-alternative" type="button" disabled={!exportFile} onClick={() => exportFile && showSaveFallback(exportFile)}>Mở cách lưu khác</button>
          </div>
        )}

        <div className="export-action-bar">
          <button className="button button--ghost" type="button" onClick={onEdit}><ArrowLeft size={18} /> Sửa đánh giá</button>
          <button className="button button--outline" type="button" onClick={() => shareImage('share')} disabled={busy !== null || isPreparing || !exportFile}>
            {busy === 'share' ? <LoaderCircle className="spin" size={19} /> : <Share2 size={19} />} Chia sẻ
          </button>
          <button
            className="button button--primary button--large"
            type="button"
            onClick={saveImage}
            disabled={busy !== null || isPreparing || !exportFile}
          >
            {busy === 'download' || busy === 'save' || isPreparing
              ? <LoaderCircle className="spin" size={19} />
              : isAppleMobile ? <Images size={19} /> : <Download size={19} />}
            Lưu Ảnh
          </button>
          <button className="button button--danger-ghost" type="button" onClick={onNew}><RefreshCcw size={18} /> Tạo phiếu mới</button>
        </div>
        {message && <div className="export-message" role="status"><CheckCircle2 size={19} /> {message}</div>}

        {fallbackImageUrl && (
          <div className="mobile-save-fallback" role="dialog" aria-modal="true" aria-labelledby="mobile-save-title">
            <div className="mobile-save-fallback__panel">
              <h2 id="mobile-save-title">Lưu phiếu vào điện thoại</h2>
              <p>Chạm giữ ảnh bên dưới rồi chọn “Lưu vào Ảnh” hoặc “Tải hình ảnh xuống”. Bạn cũng có thể mở ảnh toàn màn hình.</p>
              <img className="mobile-save-fallback__image" src={fallbackImageUrl} alt="Phiếu đánh giá đã hoàn thành" />
              <div className="mobile-save-fallback__actions">
                <a href={fallbackImageUrl} target="_blank" rel="noopener noreferrer">Mở ảnh toàn màn hình</a>
                <button type="button" onClick={closeSaveFallback}>Đóng hướng dẫn</button>
              </div>
            </div>
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  )
}
