import { chromium } from 'playwright-core'
import { copyFile, mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const baseUrl = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4173'
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const artifactDir = path.resolve('artifacts')
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

async function assertExportedLogos(page, png, reportName) {
  const exportedWidth = png.readUInt32BE(16)
  const exportedHeight = png.readUInt32BE(20)
  assert(exportedWidth >= 2160, `${reportName} phải xuất PNG siêu nét rộng ít nhất 2160px, thực tế ${exportedWidth}px`)
  assert(exportedWidth * exportedHeight <= 10_000_000, `${reportName} vượt giới hạn bộ nhớ ảnh điện thoại 10MP`)
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

async function assertReportFooterBrand(page, reportName) {
  const report = page.getByTestId('evaluation-report')
  const headerBrand = report.locator('.report-header, .checklist-report-header').locator('.training-brand').first()
  assert(
    await headerBrand.locator('small').innerText() === 'TRUNG TÂM ĐÀO TẠO LÁI XE',
    `${reportName} phải ghi đầy đủ tên Trung tâm ở đầu phiếu`,
  )
  assert(await headerBrand.locator('strong').innerText() === 'LINH XUÂN', `${reportName} phải ghi LINH XUÂN ở đầu phiếu`)
  assert(
    await headerBrand.locator('small').evaluate((element) => getComputedStyle(element).whiteSpace) === 'nowrap',
    `${reportName} phải giữ tên Trung tâm trên một dòng ở đầu phiếu`,
  )
  const footer = report.locator('.report-footer, .checklist-report-footer')
  assert(await footer.count() === 1, `${reportName} phải có chân phiếu`)
  assert(
    await footer.locator('.training-brand__copy small').innerText() === 'TRUNG TÂM ĐÀO TẠO LÁI XE',
    `${reportName} phải ghi đầy đủ tên Trung tâm ở chân phiếu`,
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

try {
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
  const page = await mobile.newPage()
  await page.goto(baseUrl)
  await page.screenshot({ path: path.join(artifactDir, 'home-mobile.png'), fullPage: false })

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
  assert(await mobileHeaderBrand.locator('small').isVisible(), 'Điện thoại phải hiện dòng TRUNG TÂM ĐÀO TẠO LÁI XE')
  assert(await mobileHeaderBrand.locator('small').innerText() === 'TRUNG TÂM ĐÀO TẠO LÁI XE', 'Tên trung tâm trên điện thoại phải đầy đủ')
  assert(await mobileHeaderBrand.locator('strong').innerText() === 'LINH XUÂN', 'Điện thoại phải hiện đầy đủ LINH XUÂN')
  const logoSource = await page.locator('.training-brand__mark img').first().getAttribute('src')
  assert(logoSource?.startsWith('data:image/png;base64,'), 'Logo Linh Xuân phải là PNG nhúng trực tiếp để không mất khi Safari xuất ảnh')

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
  const basicDownloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Lưu Ảnh' }).click()
  const basicDownload = await basicDownloadPromise
  const [basicYear, basicMonth, basicDay] = basicDate.split('-')
  assert(basicDownload.suggestedFilename() === `DanhGiaTapXeCoBan_HocvienCoBan_${basicDay}-${basicMonth}-${basicYear}.png`, `Tên ảnh tập cơ bản không đúng: ${basicDownload.suggestedFilename()}`)
  const basicDownloadPath = await basicDownload.path()
  assert(basicDownloadPath, 'Không nhận được tệp PNG tập cơ bản')
  await copyFile(basicDownloadPath, path.join(artifactDir, 'basic-exported-report.png'))
  await assertExportedLogos(page, await readFile(basicDownloadPath), 'Phiếu tập cơ bản')

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
  assert(png.readUInt32BE(16) >= 2160, `Ảnh siêu nét trên điện thoại phải rộng ít nhất 2160px, thực tế ${png.readUInt32BE(16)}px`)
  assert(png.readUInt32BE(20) >= 3840, `Ảnh siêu nét phải cao ít nhất 3840px, thực tế ${png.readUInt32BE(20)}px`)
  assert(png.readUInt32BE(16) * png.readUInt32BE(20) <= 10_000_000, 'Ảnh điện thoại phải nằm trong giới hạn bộ nhớ an toàn 10MP')
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

  await page.setViewportSize({ width: 973, height: 650 })
  await page.goto(baseUrl)
  await chooseVehicle(page, 'HẠNG XE B SỐ SÀN', 'TẬP CƠ BẢN')
  await enterStudent(page, 'Kiểm thử giao diện 973px')
  await assertNoHorizontalOverflow(page, 'Phiếu tập cơ bản ở màn hình 973px')
  await page.screenshot({ path: path.join(artifactDir, 'basic-checklist-973.png'), fullPage: false })
  await mobile.close()

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
  const desktopPage = await desktop.newPage()
  await desktopPage.goto(baseUrl)
  const desktopHeaderBrand = desktopPage.locator('.app-header .training-brand').first()
  assert(await desktopHeaderBrand.locator('small').isVisible(), 'Máy tính phải hiện dòng TRUNG TÂM ĐÀO TẠO LÁI XE')
  assert(await desktopHeaderBrand.locator('small').innerText() === 'TRUNG TÂM ĐÀO TẠO LÁI XE', 'Tên trung tâm trên máy tính phải đầy đủ')
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

  await iphonePage.goto(`${baseUrl}/admin/giaovien/A@7979`)
  await iphonePage.locator('.admin-pro-page').waitFor({ state: 'visible' })
  await assertNoHorizontalOverflow(iphonePage, 'Trang quản trị trên iPhone')
  await iphonePage.screenshot({ path: path.join(artifactDir, 'admin-mobile.png'), fullPage: false })
  await iphone.close()

console.log('E2E_OK: Linh Xuan branding, tick forms, vehicle variants, PNG export and iPhone Photos flow verified')
} finally {
  await browser.close()
}
