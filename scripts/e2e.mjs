import { chromium } from 'playwright-core'
import { copyFile, mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const baseUrl = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4173'
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const artifactDir = path.resolve('artifacts')
const officeTitle = 'Văn Phòng Đào Tạo Lái Xe Linh Xuân'
const officeBrand = 'VĂN PHÒNG ĐÀO TẠO LÁI XE'
const vehicleOnly = process.env.E2E_VEHICLE_ONLY === '1'
const stressComment = Array.from({ length: 8 }, (_, index) =>
  `Đoạn ${index + 1}: Học viên cần giữ sự tập trung khi quan sát gương, phối hợp thao tác và xử lý tình huống. Giáo viên đã hướng dẫn lại các điểm cần luyện tập; buổi tiếp theo sẽ kiểm tra mức độ tiến bộ. ${'TiếpTụcLuyệnTập'.repeat(14)}.`,
).join('\n\n')
const bCourseOrder = [
  'lesson-start',
  'lesson-pedestrian',
  'lesson-hill',
  'lesson-right-angle',
  'lesson-traffic-light',
  'lesson-winding-road',
  'lesson-vertical-parking',
  'lesson-parallel-parking',
  'lesson-railway',
  'lesson-gear-change',
  'lesson-finish',
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function assertNoHorizontalOverflow(page, label) {
  const width = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }))
  assert(
    width.document <= width.viewport && width.body <= width.viewport,
    `${label} bị tràn ngang: ${JSON.stringify(width)}`,
  )
}

async function assertReadableText(page, selectors, label) {
  const samples = await page.evaluate((selectors) => {
    const parseColor = (value) => {
      const channels = value.match(/[\d.]+/g)?.map(Number)
      return channels?.length >= 3 ? channels : null
    }
    const luminance = (color) => color.slice(0, 3).reduce((value, channel, index) => {
      const normalized = channel / 255
      return value + (normalized <= .04045 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4) * [.2126, .7152, .0722][index]
    }, 0)
    const contrast = (foreground, background) => {
      const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
      return (values[0] + .05) / (values[1] + .05)
    }
    return selectors.flatMap((selector) => [...document.querySelectorAll(selector)].map((element) => {
      const style = getComputedStyle(element)
      const foreground = parseColor(style.color)
      let backgrounds = [[255, 255, 255]]
      for (let parent = element; parent; parent = parent.parentElement) {
        const parentStyle = getComputedStyle(parent)
        const gradient = parentStyle.backgroundImage.match(/rgba?\([^)]+\)/g)?.map(parseColor).filter(Boolean)
        if (gradient?.length && gradient.every((color) => color[3] === undefined || color[3] === 1)) {
          backgrounds = gradient
          break
        }
        const background = parseColor(parentStyle.backgroundColor)
        if (background && (background[3] === undefined || background[3] === 1)) {
          backgrounds = [background]
          break
        }
      }
      const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && parseInt(style.fontWeight, 10) >= 700)
      return {
        selector,
        text: element.textContent?.trim(),
        color: style.color,
        minimum: large ? 3 : 4.5,
        contrast: foreground ? Math.min(...backgrounds.map((background) => contrast(foreground, background))) : 0,
      }
    }))
  }, selectors)
  assert(samples.length >= selectors.length, `${label} thiếu phần tử cần kiểm tra màu chữ`)
  for (const sample of samples) {
    assert(sample.text, `${label} bị mất chữ ở ${sample.selector}`)
    assert(sample.contrast >= sample.minimum, `${label} màu chữ không đủ tương phản: ${JSON.stringify(sample)}`)
  }
  return samples
}

async function assertStudentForm(page, label) {
  await page.locator('.info-card').waitFor({ state: 'visible' })
  await assertNoHorizontalOverflow(page, label)
  const gutters = await page.locator('.info-card').evaluate((form) => {
    const rect = form.getBoundingClientRect()
    return { viewport: document.documentElement.clientWidth, left: rect.left, right: document.documentElement.clientWidth - rect.right }
  })
  if (gutters.viewport <= 430) {
    assert(gutters.left >= 15 && gutters.right >= 15, `${label} phải có khoảng thở 16px hai bên khung: ${JSON.stringify(gutters)}`)
  }
  const samples = await assertReadableText(page, [
    '.vehicle-summary small',
    '.vehicle-summary strong',
    '.vehicle-summary button',
    '.field > span',
    '.date-input-control strong',
  ], label)
  const dateColor = await page.locator('.date-input-control > svg').evaluate((element) => getComputedStyle(element).color.match(/[\d.]+/g)?.map(Number))
  assert(dateColor && dateColor[2] > dateColor[0] && dateColor[2] > dateColor[1], `${label} biểu tượng ngày phải đồng bộ xanh dương: ${dateColor}`)
  const formElements = await page.locator('.info-card').evaluate((form) => {
    const formRect = form.getBoundingClientRect()
    return [...form.querySelectorAll('.vehicle-summary strong, .vehicle-summary button, .field, .form-actions .button')].map((element) => {
      const rect = element.getBoundingClientRect()
      let primaryTextLines = null
      if (element.matches('.button--primary')) {
        primaryTextLines = 0
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
        while (walker.nextNode()) {
          if (!walker.currentNode.textContent.trim()) continue
          const range = document.createRange()
          range.selectNodeContents(walker.currentNode)
          primaryTextLines += range.getClientRects().length
        }
      }
      return { text: element.textContent?.trim(), left: rect.left, right: rect.right, formLeft: formRect.left, formRight: formRect.right, primaryTextLines }
    })
  })
  assert(formElements.every((element) => element.left >= element.formLeft - 1 && element.right <= element.formRight + 1), `${label} chữ hoặc nút nằm ngoài khung: ${JSON.stringify(formElements)}`)
  assert(formElements.every((element) => element.primaryTextLines === null || element.primaryTextLines === 1), `${label} chữ nút chính phải gọn trên một dòng: ${JSON.stringify(formElements)}`)
  console.log(`STUDENT_FORM_OK: ${label}; lowest contrast ${Math.min(...samples.map((sample) => sample.contrast)).toFixed(2)}:1`)
}

async function verifyStudentFormLayouts(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  try {
    for (const training of ['TẬP CƠ BẢN', 'ĐƯỜNG TRƯỜNG', 'SA HÌNH']) {
      await page.goto(baseUrl)
      await chooseVehicle(page, 'HẠNG XE B SỐ TỰ ĐỘNG', training)
      for (const width of [320, 390, 1440]) {
        await page.setViewportSize({ width, height: width >= 1280 ? 1100 : 844 })
        await assertStudentForm(page, `${training} ${width}px`)
        if (training === 'TẬP CƠ BẢN' && width === 390) {
          await page.screenshot({ path: path.join(artifactDir, 'student-info-refreshed-mobile.png'), fullPage: true })
        }
        if (width === 1440) {
          const artifact = training === 'TẬP CƠ BẢN' ? 'basic' : training === 'ĐƯỜNG TRƯỜNG' ? 'road' : 'course'
          await page.screenshot({ path: path.join(artifactDir, `student-info-${artifact}-desktop.png`), fullPage: true })
        }
      }
    }
  } finally {
    await context.close()
  }
}

async function assertReportHeaderLayout(page, label) {
  const bounds = await page.getByTestId('evaluation-report').evaluate((report) => {
    const header = report.querySelector('.report-header, .checklist-report-header')
    if (!header) return null
    const headerRect = header.getBoundingClientRect()
    const elements = [...header.querySelectorAll('.training-brand, .training-brand__copy small, .training-brand__copy strong, .report-title, .checklist-report-header__title, h1, .vehicle-category-badge')]
    return elements.map((element) => {
      const rect = element.getBoundingClientRect()
      return {
        className: element.className,
        text: element.textContent?.trim(),
        left: rect.left - headerRect.left,
        right: rect.right - headerRect.left,
        top: rect.top - headerRect.top,
        bottom: rect.bottom - headerRect.top,
        headerWidth: headerRect.width,
        headerHeight: headerRect.height,
        clipped: element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1,
      }
    })
  })
  assert(bounds?.length >= 6, `${label} thiếu cấu trúc tiêu đề phiếu`)
  for (const element of bounds) {
    assert(!element.clipped && element.left >= -1 && element.top >= -1 && element.right <= element.headerWidth + 1 && element.bottom <= element.headerHeight + 1, `${label} tiêu đề/thương hiệu bị cắt: ${JSON.stringify(element)}`)
  }
  await assertReadableText(page, [
    '[data-testid="evaluation-report"] .training-brand__copy small',
    '[data-testid="evaluation-report"] .training-brand__copy strong',
    '[data-testid="evaluation-report"] h1',
  ], `${label} màu chữ đầu phiếu`)
}

async function assertVehicleCardAlignment(page, label, sameRow = false) {
  const cards = await page.locator('.vehicle-card-grid .vehicle-card').evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect()
    const cta = element.querySelector('.vehicle-card__cta')?.getBoundingClientRect()
    return { top: rect.top, bottom: rect.bottom, height: rect.height, ctaTop: cta?.top, ctaBottom: cta?.bottom, ctaHeight: cta?.height }
  }))
  assert(cards.length === 3, `${label} phải có đủ ba thẻ xe`)
  for (const key of ['height', 'ctaHeight', ...(sameRow ? ['top', 'bottom', 'ctaTop', 'ctaBottom'] : [])]) {
    const values = cards.map((card) => card[key])
    assert(values.every((value) => Number.isFinite(value)) && Math.max(...values) - Math.min(...values) <= 1, `${label} các thẻ xe phải thẳng hàng và cao đều (${key}): ${JSON.stringify(cards)}`)
  }
}

async function assertVehicleImageFrames(page, label, safeMargin = 8) {
  const images = await page.locator('.vehicle-card__photos img').evaluateAll(async (elements) => Promise.all(elements.map(async (image) => {
    await image.decode()
    const frame = image.closest('.vehicle-card__photos')?.getBoundingClientRect()
    const imageRect = image.getBoundingClientRect()
    const style = getComputedStyle(image)
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context || !frame) return null
    context.drawImage(image, 0, 0)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1
    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] <= 64) continue
      const pixel = (index - 3) / 4
      const x = pixel % canvas.width
      const y = Math.floor(pixel / canvas.width)
      minX = Math.min(minX, x); maxX = Math.max(maxX, x)
      minY = Math.min(minY, y); maxY = Math.max(maxY, y)
    }
    // Fit the painted subject, not the source PNG's transparent side margins.
    const scale = Math.min(imageRect.width / canvas.width, imageRect.height / canvas.height)
    const originLeft = imageRect.left + (imageRect.width - canvas.width * scale) / 2
    const originTop = imageRect.top + (imageRect.height - canvas.height * scale) / 2
    return {
      source: image.getAttribute('src'),
      objectFit: style.objectFit,
      paintedWidth: (maxX + 1 - minX) * scale,
      margins: {
        left: originLeft + minX * scale - frame.left,
        right: frame.right - (originLeft + (maxX + 1) * scale),
        top: originTop + minY * scale - frame.top,
        bottom: frame.bottom - (originTop + (maxY + 1) * scale),
      },
    }
  })))
  assert(images.length === 3 && images.every(Boolean), `${label} phải nạp đủ ba ảnh xe`)
  for (const image of images) {
    assert(image.objectFit === 'contain', `${label}: ${image.source} phải giữ toàn bộ xe bằng object-fit contain`)
    assert(image.paintedWidth >= 60, `${label}: ảnh xe quá nhỏ: ${JSON.stringify(image)}`)
    assert(Object.values(image.margins).every((margin) => margin >= safeMargin - 1), `${label}: xe phải nằm trọn khung với khoảng đệm ${safeMargin}px: ${JSON.stringify(image)}`)
  }
  return images
}

async function assertVehicleCardLabels(page, label) {
  const labels = await page.locator('.vehicle-card__code').allTextContents()
  assert(JSON.stringify(labels.map((value) => value.trim())) === JSON.stringify(['BSS', 'BTĐ', 'C1']), `${label} phải dùng đúng viết tắt BSS, BTĐ, C1: ${labels.join(', ')}`)
  assert(await page.locator('.vehicle-card__popular').count() === 0, `${label} phải bỏ huy hiệu Phổ biến`)
  assert(!(await page.locator('.vehicle-card-grid').innerText()).includes('Phổ biến'), `${label} không được còn chữ Phổ biến`)
}

async function verifyVehicleFrames(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  await page.goto(baseUrl)
  await page.locator('.vehicle-card-grid .vehicle-card').first().waitFor({ state: 'visible' })
  for (const width of [320, 390, 430, 1280, 1440]) {
    await page.setViewportSize({ width, height: width >= 1280 ? 1000 : 844 })
    const label = `Thẻ xe ${width}px`
    await assertNoHorizontalOverflow(page, label)
    await assertVehicleCardLabels(page, label)
    await assertVehicleCardAlignment(page, label, width >= 1280)
    const images = await assertVehicleImageFrames(page, label)
    console.log(`VEHICLE_FRAME_OK: ${width}px, painted margins ${JSON.stringify(images.map((image) => image.margins))}`)
    if (width === 390) {
      await page.screenshot({ path: path.join(artifactDir, 'home-mobile.png'), fullPage: false })
      await page.screenshot({ path: path.join(artifactDir, 'home-mobile-full.png'), fullPage: true })
    }
    if (width >= 1280) {
      await page.getByTestId('vehicle-b_automatic').hover()
      await assertVehicleCardAlignment(page, `${label} khi rê chuột`, true)
      await assertVehicleImageFrames(page, `${label} khi rê chuột`)
      await page.mouse.move(0, 0)
    }
  }
  await page.screenshot({ path: path.join(artifactDir, 'home-desktop.png'), fullPage: false })
  await context.close()
}

async function assertExportedLogos(page, png, reportName) {
  const exportedWidth = png.readUInt32BE(16)
  const exportedHeight = png.readUInt32BE(20)
  const reportSize = await page.getByTestId('evaluation-report').evaluate((element) => ({
    width: element.offsetWidth,
    height: element.offsetHeight,
  }))
  const expectedScale = Math.min(2, 4096 / Math.max(reportSize.width, reportSize.height), Math.sqrt(10_000_000 / (reportSize.width * reportSize.height)))
  assert(exportedWidth >= Math.floor(reportSize.width * expectedScale) - 2, `${reportName} phải xuất PNG ở độ nét tối đa trong giới hạn điện thoại, thực tế ${exportedWidth}px`)
  assert(exportedWidth * exportedHeight <= 10_000_000, `${reportName} vượt giới hạn bộ nhớ ảnh điện thoại 10MP`)
  assert(Math.max(exportedWidth, exportedHeight) <= 4096, `${reportName} vượt giới hạn cạnh canvas 4096px trên điện thoại`)
  // Canvas dimensions round independently to whole pixels; one pixel of width
  // rounding is amplified by the aspect ratio of a long, fully expanded report.
  const aspectRoundingTolerance = Math.ceil(reportSize.height / reportSize.width) + 2
  assert(Math.abs(exportedHeight - exportedWidth * reportSize.height / reportSize.width) <= aspectRoundingTolerance, `${reportName} xuất thiếu chiều cao nội dung: PNG ${exportedWidth}×${exportedHeight}, phiếu ${reportSize.width}×${reportSize.height}`)
  const logoSlots = await page.getByTestId('evaluation-report').locator('[data-export-logo-slot]').evaluateAll((slots) => {
    const report = slots[0]?.closest('[data-testid="evaluation-report"]')
    if (!report) return []
    const reportRect = report.getBoundingClientRect()
    return slots.map((slot) => {
      const rect = slot.getBoundingClientRect()
      return {
        x: (rect.left - reportRect.left) / reportRect.width,
        y: (rect.top - reportRect.top) / reportRect.height,
        width: rect.width / reportRect.width,
        height: rect.height / reportRect.height,
      }
    })
  })
  assert(logoSlots.length === 2, `${reportName} phải có logo Linh Xuân ở đầu và chân phiếu`)

  const blueRatios = await page.evaluate(async ({ base64, slots }) => {
    const image = new Image()
    image.src = `data:image/png;base64,${base64}`
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return []
    context.drawImage(image, 0, 0)
    return slots.map((slot) => {
      const x = Math.max(0, Math.floor(slot.x * canvas.width))
      const y = Math.max(0, Math.floor(slot.y * canvas.height))
      const width = Math.max(1, Math.min(canvas.width - x, Math.ceil(slot.width * canvas.width)))
      const height = Math.max(1, Math.min(canvas.height - y, Math.ceil(slot.height * canvas.height)))
      const pixels = context.getImageData(x, y, width, height).data
      let bluePixels = 0
      for (let index = 0; index < pixels.length; index += 4) {
        const red = pixels[index]
        const green = pixels[index + 1]
        const blue = pixels[index + 2]
        if (blue > 70 && blue > red + 25 && blue > green + 8) bluePixels += 1
      }
      return bluePixels / (pixels.length / 4)
    })
  }, { base64: png.toString('base64'), slots: logoSlots })

  assert(
    blueRatios.length === 2 && blueRatios.every((ratio) => ratio > 0.01),
    `${reportName} bị thiếu hình logo trong ảnh PNG: ${blueRatios.join(', ')}`,
  )
}

async function captureExportedHeader(browser, png) {
  // Inspect the actual PNG's header at its authored 1080px width, rather than
  // the mobile preview transform, so missing letters/colors remain visible.
  const context = await browser.newContext({ viewport: { width: 1080, height: 264 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  try {
    await page.setContent(`<body style="margin:0;background:white"><img alt="Đầu phiếu PNG đã xuất" src="data:image/png;base64,${png.toString('base64')}" style="display:block;width:1080px;height:auto"></body>`)
    await page.locator('img').evaluate((image) => image.decode())
    await page.screenshot({ path: path.join(artifactDir, 'report-header-refreshed.png'), fullPage: false })
  } finally {
    await context.close()
  }
}

async function assertReportFooterBrand(page, reportName) {
  const report = page.getByTestId('evaluation-report')
  const headerBrand = report.locator('.report-header, .checklist-report-header').locator('.training-brand').first()
  assert(
    await headerBrand.locator('small').innerText() === officeBrand,
    `${reportName} phải ghi đầy đủ tên Văn phòng ở đầu phiếu`,
  )
  assert(await headerBrand.locator('strong').innerText() === 'LINH XUÂN', `${reportName} phải ghi LINH XUÂN ở đầu phiếu`)
  assert(
    await headerBrand.locator('small').evaluate((element) => getComputedStyle(element).whiteSpace) === 'nowrap',
    `${reportName} phải giữ tên Văn phòng trên một dòng ở đầu phiếu`,
  )
  const footer = report.locator('.report-footer, .checklist-report-footer')
  assert(await footer.count() === 1, `${reportName} phải có chân phiếu`)
  assert(
    await footer.locator('.training-brand__copy small').innerText() === officeBrand,
    `${reportName} phải ghi đầy đủ tên Văn phòng ở chân phiếu`,
  )
  assert(
    await footer.locator('.training-brand__copy strong').innerText() === 'LINH XUÂN',
    `${reportName} phải ghi LINH XUÂN ở chân phiếu`,
  )
  assert(
    await footer.locator('.report-footer__tagline').innerText() === 'AN TOÀN — TRÁCH NHIỆM — VỮNG TAY LÁI',
    `${reportName} phải có đúng phương châm ở chân phiếu`,
  )
  const centerDelta = await footer.evaluate((element) => {
    const footerRect = element.getBoundingClientRect()
    const taglineRect = element.querySelector('.report-footer__tagline')?.getBoundingClientRect()
    if (!taglineRect) return Number.POSITIVE_INFINITY
    return Math.abs((taglineRect.left + taglineRect.width / 2) - (footerRect.left + footerRect.width / 2))
  })
  assert(centerDelta <= 1, `${reportName} có phương châm lệch tâm ${centerDelta}px`)
  await assertReportHeaderLayout(page, reportName)
}

async function assertReportCommentLayout(page, reportName, expectedComment) {
  const layout = await page.getByTestId('evaluation-report').evaluate((report) => {
    const footer = report.querySelector('.report-footer, .checklist-report-footer')
    const comment = report.querySelector('.report-teacher-comment p, .checklist-report-comment p')
    const signature = report.querySelector('.signature-line, .checklist-report-comment > div strong')
    const body = report.querySelector('.report-body, .checklist-report-body')
    if (!footer || !comment || !signature || !body) return null
    const reportRect = report.getBoundingClientRect()
    const footerRect = footer.getBoundingClientRect()
    const commentRect = comment.getBoundingClientRect()
    const signatureRect = signature.getBoundingClientRect()
    return {
      height: report.offsetHeight,
      text: comment.textContent,
      preservesNewlines: getComputedStyle(comment).whiteSpace,
      commentOverflow: comment.scrollHeight > comment.clientHeight + 1 || comment.scrollWidth > comment.clientWidth + 1,
      commentBottom: commentRect.bottom,
      signatureBottom: signatureRect.bottom,
      signatureText: signature.textContent,
      footerTop: footerRect.top,
      footerBottom: footerRect.bottom,
      reportBottom: reportRect.bottom,
      reportClipped: ['hidden', 'clip'].includes(getComputedStyle(report).overflowY) && report.scrollHeight > report.clientHeight + 1,
      bodyClipped: ['hidden', 'clip'].includes(getComputedStyle(body).overflowY) && body.scrollHeight > body.clientHeight + 1,
    }
  })
  assert(layout, `${reportName} thiếu cấu trúc nhận xét/chữ ký/chân phiếu`)
  assert(layout.height >= 1920, `${reportName} phải duy trì chiều cao phiếu chuẩn tối thiểu 1920px`)
  assert(!layout.commentOverflow && !layout.reportClipped && !layout.bodyClipped, `${reportName} có nội dung bị cắt: ${JSON.stringify(layout)}`)
  assert(layout.commentBottom < layout.footerTop - 1, `${reportName} nhận xét chạm hoặc bị che bởi chân phiếu`)
  assert(layout.signatureBottom < layout.footerTop - 1, `${reportName} tên giáo viên bị cắt ở chân phiếu`)
  assert(layout.footerBottom <= layout.reportBottom + 1, `${reportName} chân phiếu nằm ngoài khung xuất ảnh`)
  assert(layout.signatureText.includes('Trần Trọng Thức'), `${reportName} phải giữ nguyên tên giáo viên`)
  if (expectedComment) {
    assert(layout.text === expectedComment, `${reportName} không giữ đủ văn bản nhận xét đã nhập`)
    assert(['pre-wrap', 'pre-line', 'break-spaces'].includes(layout.preservesNewlines), `${reportName} phải giữ xuống dòng trong nhận xét`)
    assert(layout.height > 1920, `${reportName} phải tự giãn khi nhận xét dài, không ép nội dung vào khung cố định`)
  }
}

async function chooseVehicle(page, name, training = 'SA HÌNH') {
  await page.getByRole('button', { name }).click()
  const trainingTestId = training === 'TẬP CƠ BẢN' ? 'training-basic' : training === 'ĐƯỜNG TRƯỜNG' ? 'training-road' : 'training-course'
  await page.getByTestId(trainingTestId).click()
}

async function enterStudent(page, name) {
  await page.getByLabel('Họ và tên học viên').fill(name)
  await page.getByLabel('Giáo viên hướng dẫn').fill('Trần Trọng Thức')
  await page.getByLabel('Số xe').fill('51H-123.45')
  await page.getByLabel('Lần tập thứ').fill('7')
  await page.getByLabel('Khóa đào tạo').fill('K24-2026')
  const evaluationDate = await page.getByLabel('Ngày đánh giá').inputValue()
  await page.getByRole('button', { name: 'Bắt đầu đánh giá' }).click()
  return evaluationDate
}

await mkdir(artifactDir, { recursive: true })
const browser = await chromium.launch({ executablePath: chromePath, headless: true })

if (vehicleOnly) {
  try {
    await verifyVehicleFrames(browser)
    console.log('E2E_VEHICLE_OK: BSS/BTĐ/C1 labels, no popularity badge, equal card heights and uncropped vehicles at 320/390/430/1280/1440px')
  } finally {
    await browser.close()
  }
  process.exit(0)
}

try {
  await verifyStudentFormLayouts(browser)
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
  const page = await mobile.newPage()
  await page.goto(baseUrl)
  assert(await page.title() === officeTitle, 'Tiêu đề trình duyệt phải là Văn Phòng Đào Tạo Lái Xe Linh Xuân')
  await assertVehicleCardLabels(page, 'Thẻ xe điện thoại 390px')
  await assertVehicleImageFrames(page, 'Thẻ xe điện thoại 390px')
  await page.screenshot({ path: path.join(artifactDir, 'home-mobile.png'), fullPage: false })
  await page.screenshot({ path: path.join(artifactDir, 'home-mobile-full.png'), fullPage: true })

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    hero: document.querySelector('.vehicle-hero')?.getBoundingClientRect().toJSON(),
    panel: document.querySelector('.vehicle-selector-panel')?.getBoundingClientRect().toJSON(),
    card: document.querySelector('.vehicle-card')?.getBoundingClientRect().toJSON(),
  }))
  assert(dimensions.scrollWidth <= dimensions.viewport, `Trang chọn hạng bị tràn ngang: ${JSON.stringify(dimensions)}`)
  assert(await page.getByText('QUỐC ANH', { exact: true }).count() === 0, 'Không được còn thương hiệu Quốc Anh')
  const mobileHeaderBrand = page.locator('.app-header .training-brand').first()
  assert(await mobileHeaderBrand.locator('small').isVisible(), 'Điện thoại phải hiện đầy đủ dòng VĂN PHÒNG ĐÀO TẠO LÁI XE')
  assert(await mobileHeaderBrand.locator('small').innerText() === officeBrand, 'Tên văn phòng trên điện thoại phải đầy đủ')
  assert(await mobileHeaderBrand.locator('strong').innerText() === 'LINH XUÂN', 'Điện thoại phải hiện đầy đủ LINH XUÂN')
  const logoSource = await page.locator('.training-brand__mark img').first().getAttribute('src')
  assert(logoSource?.startsWith('data:image/png;base64,'), 'Logo Linh Xuân phải là PNG nhúng trực tiếp để không mất khi Safari xuất ảnh')
  assert(await page.getByTestId('vehicle-b_manual').locator('img').count() === 1, 'Ô B số sàn phải có đúng một ảnh xe, không chồng nhiều xe')
  assert(await page.getByTestId('vehicle-b_manual').locator('img[src*="vios-white"]').count() === 1, 'B số sàn phải có ảnh Vios trắng')
  assert(await page.getByTestId('vehicle-b_automatic').locator('img').count() === 1, 'Ô B tự động phải có đúng một ảnh xe')
  assert(await page.getByTestId('vehicle-b_automatic').locator('img[src*="vios-black"]').count() === 1, 'B tự động phải có ảnh Vios đen riêng')
  assert(await page.getByTestId('vehicle-c1').locator('img').count() === 1, 'Ô C1 phải có đúng một ảnh xe tải')
  assert(await page.getByTestId('vehicle-c1').locator('img[src*="c1-training-truck"]').count() === 1, 'C1 phải dùng đúng ảnh xe tải tập lái')
  assert(await page.getByTestId('vehicle-c1').locator('img').evaluate((image) => image.complete && image.naturalWidth > 100), 'Ảnh xe tải phải nạp thành công, không có ô ảnh lỗi')
  for (const testId of ['vehicle-b_manual', 'vehicle-b_automatic', 'vehicle-c1']) {
    const transparentCorners = await page.getByTestId(testId).locator('img').evaluate(async (image) => {
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) return false
      context.drawImage(image, 0, 0)
      return [[0, 0], [canvas.width - 1, 0], [0, canvas.height - 1], [canvas.width - 1, canvas.height - 1]]
        .every(([x, y]) => context.getImageData(x, y, 1, 1).data[3] < 20)
    })
    assert(transparentCorners, `${testId} phải có nền trong suốt thật, không phải mảng trắng hay nền ô vuông`)
  }
  assert(await page.getByText('Chọn hồ sơ này', { exact: true }).count() === 3, 'Mỗi hạng xe phải có nút chọn hồ sơ rõ ràng')

  await page.getByRole('button', { name: 'HẠNG XE B SỐ SÀN' }).click()
  await page.screenshot({ path: path.join(artifactDir, 'training-selection-mobile.png'), fullPage: true })
  assert(await page.getByText('Tập cơ bản', { exact: true }).count() === 1, 'Phải có lựa chọn Tập cơ bản')
  assert(await page.getByText('Sa hình', { exact: true }).count() === 1, 'Phải có lựa chọn Sa hình')
  assert(await page.getByText('Đường trường', { exact: true }).count() === 1, 'Phải có lựa chọn Đường trường')
  assert(await page.getByText('11 NỘI DUNG', { exact: true }).count() === 1, 'Đường trường phải có 11 nội dung')
  await page.getByRole('button', { name: 'TẬP CƠ BẢN' }).click()
  const dateInputValue = await page.getByLabel('Ngày đánh giá').inputValue()
  const [dateYear, dateMonth, dateDay] = dateInputValue.split('-')
  assert(
    await page.locator('.date-input-control strong').innerText() === `${dateDay}/${dateMonth}/${dateYear}`,
    'Ô ngày trên điện thoại phải hiển thị gọn theo định dạng dd/mm/yyyy',
  )
  await page.screenshot({ path: path.join(artifactDir, 'student-info-mobile.png'), fullPage: false })
  const basicDate = await enterStudent(page, 'Học viên Cơ Bản')
  assert(await page.locator('.checklist-item-card').count() === 13, 'Tập cơ bản phải có đúng 13 nội dung')
  assert(await page.getByText('Mở cửa xe và lên xe an toàn', { exact: true }).count() === 1, 'Phiếu cơ bản phải đúng nội dung mẫu')
  assert(await page.getByTestId('check-basic-pedals-UNDERSTOOD').count() === 1, 'Mỗi nội dung cơ bản phải có ô Đã hiểu')
  assert(await page.getByTestId('check-basic-pedals-NEEDS_WORK').count() === 1, 'Mỗi nội dung cơ bản phải có ô Còn yếu')
  assert(await page.getByTestId('check-basic-pedals-UNCLEAR').count() === 1, 'Mỗi nội dung cơ bản phải có ô Chưa rõ')
  await page.getByRole('button', { name: 'Đánh dấu tất cả là Đã hiểu' }).click()
  await page.getByTestId('overall-BASIC_UNDERSTOOD').click()
  const selectedTickColor = await page.getByTestId('check-basic-pedals-UNDERSTOOD').locator('span').evaluate((element) => getComputedStyle(element).backgroundColor)
  assert(/rgb\(8, 124, 240\)/.test(selectedTickColor), `Ô tick được chọn phải là xanh dương, thực tế ${selectedTickColor}`)
  await assertNoHorizontalOverflow(page, 'Phiếu tập cơ bản trên điện thoại')
  await page.screenshot({ path: path.join(artifactDir, 'basic-checklist-mobile.png'), fullPage: false })
  await page.getByRole('button', { name: 'Xem phiếu đánh giá' }).click()
  const basicReportText = await page.getByTestId('evaluation-report').innerText()
  assert(basicReportText.includes('PHIẾU ĐÁNH GIÁ BUỔI HỌC'), 'Phiếu cơ bản phải có đúng tiêu đề mẫu')
  assert(basicReportText.includes('LÀM QUEN XE & SA HÌNH CƠ BẢN'), 'Phiếu cơ bản phải có đúng nội dung buổi học')
  assert(basicReportText.includes('Tốt – nắm vững kiến thức, thao tác tốt'), 'Phiếu cơ bản phải hiển thị đánh giá chung đã tích')
  assert(basicReportText.includes('SỐ SÀN'), 'Huy hiệu phiếu cơ bản phải ghi rõ loại xe SỐ SÀN')
  assert(!basicReportText.includes('QUỐC ANH'), 'Phiếu cơ bản không được còn thương hiệu Quốc Anh')
  await assertReportFooterBrand(page, 'Phiếu tập cơ bản')
  await assertReportCommentLayout(page, 'Phiếu tập cơ bản')
  const basicDownloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Lưu Ảnh' }).click()
  const basicDownload = await basicDownloadPromise
  const [basicYear, basicMonth, basicDay] = basicDate.split('-')
  assert(basicDownload.suggestedFilename() === `DanhGiaTapXeCoBan_HocvienCoBan_${basicDay}-${basicMonth}-${basicYear}.png`, `Tên ảnh tập cơ bản không đúng: ${basicDownload.suggestedFilename()}`)
  const basicDownloadPath = await basicDownload.path()
  assert(basicDownloadPath, 'Không nhận được tệp PNG tập cơ bản')
  await copyFile(basicDownloadPath, path.join(artifactDir, 'basic-exported-report.png'))
  const basicPng = await readFile(basicDownloadPath)
  await assertExportedLogos(page, basicPng, 'Phiếu tập cơ bản')
  await captureExportedHeader(browser, basicPng)

  await page.goto(baseUrl)
  await chooseVehicle(page, 'HẠNG XE B SỐ SÀN', 'ĐƯỜNG TRƯỜNG')
  const roadDate = await enterStudent(page, 'Học viên Đường Trường')
  assert(await page.locator('.checklist-item-card').count() === 11, 'Đường trường phải có đúng 11 nội dung')
  assert(await page.getByText('Quan sát phán đoán – nhận diện tình huống', { exact: true }).count() === 1, 'Phiếu đường trường phải đúng nội dung mẫu')
  assert(await page.getByTestId('check-road-speed-GOOD').count() === 1, 'Đường trường phải có ô Tốt')
  assert(await page.getByTestId('check-road-speed-FAIR').count() === 1, 'Đường trường phải có ô Khá')
  assert(await page.getByTestId('check-road-speed-AVERAGE').count() === 1, 'Đường trường phải có ô Trung bình')
  assert(await page.getByTestId('check-road-speed-WEAK').count() === 1, 'Đường trường phải có ô Yếu')
  await page.getByRole('button', { name: 'Đánh dấu tất cả là Tốt' }).click()
  await page.getByTestId('overall-ROAD_PASSED').click()
  await page.screenshot({ path: path.join(artifactDir, 'road-checklist-mobile.png'), fullPage: false })
  await page.getByRole('button', { name: 'Xem phiếu đánh giá' }).click()
  const roadReportText = await page.getByTestId('evaluation-report').innerText()
  assert(roadReportText.includes('PHIẾU ĐÁNH GIÁ ĐÀO TẠO HỌC VIÊN'), 'Phiếu đường trường phải có đúng tiêu đề mẫu')
  assert(roadReportText.includes('Đạt yêu cầu'), 'Phiếu đường trường phải hiển thị đánh giá chung')
  await assertReportFooterBrand(page, 'Phiếu đường trường')
  await assertReportCommentLayout(page, 'Phiếu đường trường')
  const roadDownloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Lưu Ảnh' }).click()
  const roadDownload = await roadDownloadPromise
  const [roadYear, roadMonth, roadDay] = roadDate.split('-')
  assert(roadDownload.suggestedFilename() === `DanhGiaDuongTruong_HocvienDuongTruong_${roadDay}-${roadMonth}-${roadYear}.png`, `Tên ảnh đường trường không đúng: ${roadDownload.suggestedFilename()}`)
  const roadDownloadPath = await roadDownload.path()
  assert(roadDownloadPath, 'Không nhận được tệp PNG đường trường')
  await copyFile(roadDownloadPath, path.join(artifactDir, 'road-exported-report.png'))
  await assertExportedLogos(page, await readFile(roadDownloadPath), 'Phiếu đường trường')

  await page.goto(baseUrl)

  await chooseVehicle(page, 'HẠNG XE B SỐ SÀN')
  const bssDate = await enterStudent(page, 'Nguyễn Văn An')
  assert(await page.locator('.lesson-card:not(.lesson-card--emergency)').count() === 11, 'BSS phải có đúng 11 bài thi')
  const bssOrder = await page.locator('.lesson-card:not(.lesson-card--emergency)').evaluateAll((cards) => cards.map((card) => card.id))
  assert(JSON.stringify(bssOrder) === JSON.stringify(bCourseOrder), `Thứ tự bài BSS không đúng: ${bssOrder.join(', ')}`)

  await page.getByRole('button', { name: 'Đánh dấu bài còn lại là Tốt' }).click()
  await page.getByTestId('status-hill-NEEDS_PRACTICE').click()
  await page.getByText('Tuột dốc', { exact: true }).click()
  await page.getByTestId('status-right-angle-NOTICE').click()
  await page.getByTestId('status-emergency-NOTICE').click()
  await page.getByRole('button', { name: 'Cần luyện dốc cầu' }).click()
  await assertNoHorizontalOverflow(page, 'Phiếu sa hình trên điện thoại')
  await page.locator('#lesson-hill').screenshot({ path: path.join(artifactDir, 'evaluation-mobile.png') })
  await page.getByRole('button', { name: 'Xem phiếu đánh giá' }).click()

  await page.getByTestId('evaluation-report').waitFor({ state: 'visible' })
  await page.waitForTimeout(250)
  const reportScrollY = await page.evaluate(() => window.scrollY)
  assert(reportScrollY <= 80, `Trang xem phiếu phải mở ở khu vực đầu trang trên điện thoại, thực tế ${reportScrollY}px`)
  const reportText = await page.getByTestId('evaluation-report').innerText()
  assert(reportText.includes('9 bài'), 'Tổng số bài Tốt phải là 9')
  assert(reportText.includes('1 bài'), 'Phiếu phải hiển thị các tổng kết một bài')
  assert(reportText.includes('CẦN TIẾP TỤC LUYỆN TẬP'), 'Lỗi tuột dốc phải tạo kết luận cần tiếp tục luyện tập')
  assert(reportText.includes('Tuột dốc'), 'Phiếu phải hiển thị lỗi đã chọn')
  assert(reportText.includes('SỐ SÀN'), 'Huy hiệu phiếu sa hình phải ghi rõ loại xe SỐ SÀN')
  assert(reportText.includes('AN TOÀN — TRÁCH NHIỆM — VỮNG TAY LÁI'), 'Phiếu sa hình phải dùng đúng phương châm Linh Xuân')
  await assertReportFooterBrand(page, 'Phiếu sa hình')
  await assertReportCommentLayout(page, 'Phiếu sa hình')
  const reportTail = [
    'Ghép xe dọc vào nơi đỗ',
    'Ghép xe ngang vào nơi đỗ',
    'Tạm dừng ở nơi có đường sắt chạy qua',
    'Thay đổi số trên đường bằng (tăng tốc, tăng số)',
    'Kết thúc',
    'ĐÁNH GIÁ TÌNH HUỐNG KHẨN CẤP',
  ]
  for (let index = 1; index < reportTail.length; index += 1) {
    assert(reportText.indexOf(reportTail[index - 1]) < reportText.indexOf(reportTail[index]), `Thứ tự trên phiếu xuất sai tại ${reportTail[index]}`)
  }
  await page.screenshot({ path: path.join(artifactDir, 'report-mobile.png'), fullPage: false })

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Lưu Ảnh' }).click()
  const download = await downloadPromise
  const [year, month, day] = bssDate.split('-')
  assert(download.suggestedFilename() === `DanhGiaSaHinh_NguyenVanAn_${day}-${month}-${year}.png`, `Tên ảnh không đúng: ${download.suggestedFilename()}`)
  const downloadPath = await download.path()
  assert(downloadPath, 'Không nhận được tệp PNG')
  await copyFile(downloadPath, path.join(artifactDir, 'exported-report.png'))
  const png = await readFile(downloadPath)
  await assertExportedLogos(page, png, 'Phiếu sa hình')

  await page.goto(baseUrl)
  await chooseVehicle(page, 'HẠNG XE B SỐ TỰ ĐỘNG')
  await enterStudent(page, 'Học viên BTĐ')
  const automaticOrder = await page.locator('.lesson-card:not(.lesson-card--emergency)').evaluateAll((cards) => cards.map((card) => card.id))
  assert(JSON.stringify(automaticOrder) === JSON.stringify(bCourseOrder), `Thứ tự bài BTĐ không đúng: ${automaticOrder.join(', ')}`)
  assert(await page.getByText('Không giữ được điểm côn', { exact: true }).count() === 0, 'BTĐ không được có tiêu chí điểm côn')
  assert(await page.getByText('Chết máy', { exact: true }).count() === 0, 'BTĐ không được có lỗi chết máy do côn')
  assert(await page.getByText('Thay đổi tốc độ trên đường bằng (tăng tốc, kiểm soát tốc độ)', { exact: true }).count() === 1, 'BTĐ phải dùng bài thay đổi tốc độ')

  await page.goto(baseUrl)
  await chooseVehicle(page, 'HẠNG XE HẠNG C1')
  await enterStudent(page, 'Học viên C1')
  assert(await page.locator('.lesson-card:not(.lesson-card--emergency)').count() === 10, 'C1 phải có đúng 10 bài thi')
  const c1Order = await page.locator('.lesson-card:not(.lesson-card--emergency)').evaluateAll((cards) => cards.map((card) => card.id))
  assert(JSON.stringify(c1Order) === JSON.stringify(bCourseOrder.filter((id) => id !== 'lesson-parallel-parking')), `Thứ tự bài C1 không đúng: ${c1Order.join(', ')}`)
  assert(await page.getByText('Ghép xe ngang vào nơi đỗ', { exact: true }).count() === 0, 'C1 không được có bài ghép xe ngang')
  assert(await page.getByText('BÀI 10', { exact: true }).count() === 1, 'Bài Kết thúc của C1 phải được đánh số 10')
  assert(await page.getByText('Canh thân xe chưa tốt', { exact: true }).count() >= 2, 'C1 phải có lỗi canh thân xe')
  assert(await page.getByText('Không kiểm soát được đuôi xe', { exact: true }).count() >= 1, 'C1 phải có lỗi canh đuôi xe')
  await page.getByRole('button', { name: 'Đánh dấu bài còn lại là Tốt' }).click()
  await page.getByTestId('status-emergency-GOOD').click()
  await page.getByRole('button', { name: 'Xem phiếu đánh giá' }).click()
  const c1ReportText = await page.getByTestId('evaluation-report').innerText()
  assert(!c1ReportText.includes('Ghép xe ngang vào nơi đỗ'), 'Phiếu xuất C1 không được có bài ghép xe ngang')
  assert(c1ReportText.includes('10 bài'), 'Phiếu C1 phải tổng kết đủ 10 bài Tốt')
  assert(c1ReportText.includes('XE TẢI'), 'Huy hiệu C1 phải ghi rõ loại xe XE TẢI')

  await page.goto(baseUrl)
  await chooseVehicle(page, 'HẠNG XE HẠNG C1', 'TẬP CƠ BẢN')
  await enterStudent(page, 'Học viên C1 Cơ Bản')
  assert(await page.locator('.checklist-item-card').count() === 13, 'Tập cơ bản C1 phải có đúng 13 nội dung')
  assert(await page.getByText('Phân biệt được các bàn đạp Côn – Phanh – Ga', { exact: true }).count() === 1, 'C1 cơ bản phải có nội dung bàn đạp xe số sàn')

  await page.goto(baseUrl)
  await chooseVehicle(page, 'HẠNG XE B SỐ TỰ ĐỘNG', 'TẬP CƠ BẢN')
  await enterStudent(page, 'Học viên BTĐ Cơ Bản')
  assert(await page.locator('.checklist-item-card').count() === 13, 'Tập cơ bản BTĐ phải có đúng 13 nội dung')
  assert(await page.getByText('Phân biệt và sử dụng đúng bàn đạp Phanh – Ga', { exact: true }).count() === 1, 'BTĐ cơ bản phải có nội dung bàn đạp riêng')
  assert(await page.getByText('Phân biệt được các bàn đạp Côn – Phanh – Ga', { exact: true }).count() === 0, 'BTĐ cơ bản không được có nội dung bàn đạp côn')

  // Nhận xét nhiều đoạn và từ dài phải còn đủ trong cả ba loại phiếu và ảnh tải.
  for (const [training, artifact] of [
    ['TẬP CƠ BẢN', 'basic'],
    ['ĐƯỜNG TRƯỜNG', 'road'],
    ['SA HÌNH', 'course'],
  ]) {
    await page.goto(baseUrl)
    await chooseVehicle(page, 'HẠNG XE B SỐ SÀN', training)
    await enterStudent(page, `Kiểm thử nhận xét ${artifact}`)
    if (training === 'SA HÌNH') {
      await page.getByRole('button', { name: 'Đánh dấu bài còn lại là Tốt' }).click()
      await page.getByTestId('status-emergency-GOOD').click()
    } else {
      await page.getByRole('button', { name: training === 'TẬP CƠ BẢN' ? 'Đánh dấu tất cả là Đã hiểu' : 'Đánh dấu tất cả là Tốt' }).click()
      await page.getByTestId(training === 'TẬP CƠ BẢN' ? 'overall-BASIC_UNDERSTOOD' : 'overall-ROAD_PASSED').click()
    }
    const commentInput = page.getByRole('textbox', { name: 'Nhận xét của giáo viên', exact: true })
    await commentInput.fill(stressComment)
    assert(await commentInput.inputValue() === stressComment, `Phiếu ${artifact} không được cắt nhận xét dài tại ô nhập`)
    await page.getByRole('button', { name: 'Xem phiếu đánh giá' }).click()
    await assertReportFooterBrand(page, `Phiếu ${artifact} nhận xét dài`)
    await assertReportCommentLayout(page, `Phiếu ${artifact} nhận xét dài`, stressComment)
    await assertNoHorizontalOverflow(page, `Phiếu ${artifact} nhận xét dài`)
    const longDownloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Lưu Ảnh' }).click()
    const longDownload = await longDownloadPromise
    const longDownloadPath = await longDownload.path()
    assert(longDownloadPath, `Phiếu ${artifact} nhận xét dài phải tải được PNG`)
    const longPng = await readFile(longDownloadPath)
    await assertExportedLogos(page, longPng, `Phiếu ${artifact} nhận xét dài`)
    await copyFile(longDownloadPath, path.join(artifactDir, `${artifact}-long-comment-report.png`))
    console.log(`LONG_COMMENT_OK: ${artifact}, ${stressComment.length} characters, PNG ${longPng.readUInt32BE(16)}×${longPng.readUInt32BE(20)}`)
  }

  await page.setViewportSize({ width: 973, height: 650 })
  await page.goto(baseUrl)
  await chooseVehicle(page, 'HẠNG XE B SỐ SÀN', 'TẬP CƠ BẢN')
  await enterStudent(page, 'Kiểm thử giao diện 973px')
  await assertNoHorizontalOverflow(page, 'Phiếu tập cơ bản ở màn hình 973px')
  await page.screenshot({ path: path.join(artifactDir, 'basic-checklist-973.png'), fullPage: false })
  for (const width of [320, 360, 430, 973, 1100]) {
    await page.setViewportSize({ width, height: 820 })
    await page.goto(baseUrl)
    await assertNoHorizontalOverflow(page, `Trang chọn hạng ở màn hình ${width}px`)
    const cardWidth = await page.getByTestId('vehicle-b_manual').evaluate((element) => element.getBoundingClientRect().width)
    assert(cardWidth <= width - 20, `Thẻ xe ở màn hình ${width}px phải nằm gọn trong khung, thực tế ${cardWidth}px`)
    await assertVehicleCardAlignment(page, `Thẻ xe ở màn hình ${width}px`, width > 1150)
    await assertVehicleCardLabels(page, `Thẻ xe ở màn hình ${width}px`)
    if (width <= 430) await assertVehicleImageFrames(page, `Thẻ xe ở màn hình ${width}px`)
  }
  await mobile.close()

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
  const desktopPage = await desktop.newPage()
  await desktopPage.goto(baseUrl)
  for (const width of [1280, 1440]) {
    await desktopPage.setViewportSize({ width, height: 1000 })
    await assertVehicleCardAlignment(desktopPage, `Thẻ xe máy tính ${width}px`, true)
    await assertVehicleCardLabels(desktopPage, `Thẻ xe máy tính ${width}px`)
    await assertVehicleImageFrames(desktopPage, `Thẻ xe máy tính ${width}px`)
    await desktopPage.getByTestId('vehicle-b_automatic').hover()
    await assertVehicleCardAlignment(desktopPage, `Thẻ xe máy tính ${width}px khi rê chuột`, true)
    await assertVehicleImageFrames(desktopPage, `Thẻ xe máy tính ${width}px khi rê chuột`)
    await desktopPage.mouse.move(0, 0)
  }
  const desktopHeaderBrand = desktopPage.locator('.app-header .training-brand').first()
  assert(await desktopHeaderBrand.locator('small').isVisible(), 'Máy tính phải hiện dòng VĂN PHÒNG ĐÀO TẠO LÁI XE')
  assert(await desktopHeaderBrand.locator('small').innerText() === officeBrand, 'Tên văn phòng trên máy tính phải đầy đủ')
  assert(await desktopHeaderBrand.locator('strong').innerText() === 'LINH XUÂN', 'Máy tính phải hiện đầy đủ LINH XUÂN')
  await desktopPage.screenshot({ path: path.join(artifactDir, 'home-desktop.png'), fullPage: false })

  await desktopPage.goto(`${baseUrl}/admin/giaovien/A@7979`)
  await desktopPage.locator('.admin-pro-page').waitFor({ state: 'visible' })
  assert(await desktopPage.getByText('LINH XUÂN', { exact: true }).count() >= 1, 'Trang quản trị phải dùng thương hiệu Linh Xuân')
  await assertNoHorizontalOverflow(desktopPage, 'Trang quản trị trên máy tính')
  await desktopPage.screenshot({ path: path.join(artifactDir, 'admin-desktop.png'), fullPage: false })
  await desktop.close()

  const iphone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
  })
  await iphone.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined })
  })
  const iphonePage = await iphone.newPage()
  await iphonePage.goto(baseUrl)
  await chooseVehicle(iphonePage, 'HẠNG XE B SỐ SÀN')
  await enterStudent(iphonePage, 'Học viên iPhone')
  await iphonePage.getByRole('button', { name: 'Đánh dấu bài còn lại là Tốt' }).click()
  await iphonePage.getByTestId('status-emergency-GOOD').click()
  await iphonePage.getByRole('button', { name: 'Xem phiếu đánh giá' }).click()
  await iphonePage.getByTestId('evaluation-report').waitFor({ state: 'visible' })
  assert(await iphonePage.getByRole('button', { name: 'Lưu Ảnh' }).count() === 1, 'Safari iPhone phải hiển thị nút Lưu Ảnh')
  assert(await iphonePage.getByText('Lưu trên iPhone:', { exact: true }).count() === 1, 'Safari iPhone phải hiển thị hướng dẫn lưu hình ảnh')
  await iphonePage.getByRole('button', { name: 'Lưu Ảnh' }).click()
  assert(await iphonePage.getByRole('dialog', { name: 'Lưu phiếu vào điện thoại' }).count() === 1, 'iPhone không có Web Share phải mở phương án chạm giữ ảnh')
  await iphonePage.getByRole('button', { name: 'Đóng hướng dẫn' }).click()

  await iphonePage.goto(`${baseUrl}/admin/giaovien/A@7979`)
  await iphonePage.locator('.admin-pro-page').waitFor({ state: 'visible' })
  await assertNoHorizontalOverflow(iphonePage, 'Trang quản trị trên iPhone')
  await iphonePage.screenshot({ path: path.join(artifactDir, 'admin-mobile.png'), fullPage: false })
  await iphone.close()

  const android = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 1,
    userAgent: 'Mozilla/5.0 (Linux; Android 15; SM-S928B) AppleWebKit/537.36 Chrome/141.0 Mobile Safari/537.36',
  })
  const androidPage = await android.newPage()
  await androidPage.goto(baseUrl)
  await chooseVehicle(androidPage, 'HẠNG XE B SỐ SÀN')
  await enterStudent(androidPage, 'Học viên Android')
  await androidPage.getByRole('button', { name: 'Đánh dấu bài còn lại là Tốt' }).click()
  await androidPage.getByTestId('status-emergency-GOOD').click()
  await androidPage.getByRole('button', { name: 'Xem phiếu đánh giá' }).click()
  await androidPage.getByTestId('evaluation-report').waitFor({ state: 'visible' })
  assert(await androidPage.getByText('Lưu trên Android:', { exact: true }).count() === 1, 'Android phải hiển thị hướng dẫn thư mục Tải xuống')
  const androidDownloadPromise = androidPage.waitForEvent('download')
  await androidPage.getByRole('button', { name: 'Lưu Ảnh' }).click()
  const androidDownload = await androidDownloadPromise
  assert(androidDownload.suggestedFilename().endsWith('.png'), 'Android phải tải tệp PNG')
  const androidDownloadPath = await androidDownload.path()
  assert(androidDownloadPath, 'Android phải nhận được tệp ảnh đã tải')
  const androidPng = await readFile(androidDownloadPath)
  await assertExportedLogos(androidPage, androidPng, 'Ảnh tải trên Android')
  await assertReportCommentLayout(androidPage, 'Phiếu trên Android')
  await assertNoHorizontalOverflow(androidPage, 'Trang xem phiếu trên Android')
  await androidPage.screenshot({ path: path.join(artifactDir, 'report-android.png'), fullPage: false })
  await android.close()

console.log('E2E_OK: readable student form at 320/390/1440px, polished report headers, office branding, separate vehicle photos, blue ticks, full long comments and signatures, bounded PNG exports, Android download and iPhone fallback verified')
} finally {
  await browser.close()
}
