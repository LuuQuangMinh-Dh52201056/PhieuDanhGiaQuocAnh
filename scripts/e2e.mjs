import { chromium } from 'playwright-core'
import { copyFile, mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const baseUrl = 'http://127.0.0.1:4173'
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const artifactDir = path.resolve('artifacts')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function chooseVehicle(page, name) {
  await page.getByRole('button', { name }).click()
}

async function enterStudent(page, name) {
  await page.getByLabel('Họ và tên học viên').fill(name)
  await page.getByLabel('Giáo viên hướng dẫn').fill('Trần Quốc Anh')
  await page.getByLabel('Số xe').fill('51H-123.45')
  await page.getByLabel('Lần tập thứ').fill('7')
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

  await chooseVehicle(page, 'HẠNG XE B SỐ SÀN')
  const bssDate = await enterStudent(page, 'Nguyễn Văn An')
  assert(await page.locator('.lesson-card:not(.lesson-card--emergency)').count() === 11, 'BSS phải có đúng 11 bài thi')

  await page.getByRole('button', { name: 'Đánh dấu bài còn lại là Tốt' }).click()
  await page.getByTestId('status-hill-NEEDS_PRACTICE').click()
  await page.getByText('Tuột dốc', { exact: true }).click()
  await page.getByTestId('status-right-angle-NOTICE').click()
  await page.getByTestId('status-emergency-NOTICE').click()
  await page.getByRole('button', { name: 'Cần luyện dốc cầu' }).click()
  await page.locator('#lesson-hill').screenshot({ path: path.join(artifactDir, 'evaluation-mobile.png') })
  await page.getByRole('button', { name: 'Xem phiếu đánh giá' }).click()

  await page.getByTestId('evaluation-report').waitFor({ state: 'visible' })
  const reportText = await page.getByTestId('evaluation-report').innerText()
  assert(reportText.includes('9 bài'), 'Tổng số bài Tốt phải là 9')
  assert(reportText.includes('1 bài'), 'Phiếu phải hiển thị các tổng kết một bài')
  assert(reportText.includes('CẦN TIẾP TỤC LUYỆN TẬP'), 'Lỗi tuột dốc phải tạo kết luận cần tiếp tục luyện tập')
  assert(reportText.includes('Tuột dốc'), 'Phiếu phải hiển thị lỗi đã chọn')
  await page.screenshot({ path: path.join(artifactDir, 'report-mobile.png'), fullPage: false })

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Tải ảnh PNG' }).click()
  const download = await downloadPromise
  const [year, month, day] = bssDate.split('-')
  assert(download.suggestedFilename() === `DanhGiaSaHinh_NguyenVanAn_${day}-${month}-${year}.png`, `Tên ảnh không đúng: ${download.suggestedFilename()}`)
  const downloadPath = await download.path()
  assert(downloadPath, 'Không nhận được tệp PNG')
  await copyFile(downloadPath, path.join(artifactDir, 'exported-report.png'))
  const png = await readFile(downloadPath)
  assert(png.readUInt32BE(16) === 1080, `Ảnh xuất phải rộng 1080px, thực tế ${png.readUInt32BE(16)}px`)
  assert(png.readUInt32BE(20) >= 1920, `Ảnh xuất phải cao ít nhất 1920px, thực tế ${png.readUInt32BE(20)}px`)

  await page.goto(baseUrl)
  await chooseVehicle(page, 'HẠNG XE B SỐ TỰ ĐỘNG')
  await enterStudent(page, 'Học viên BTĐ')
  assert(await page.getByText('Không giữ được điểm côn', { exact: true }).count() === 0, 'BTĐ không được có tiêu chí điểm côn')
  assert(await page.getByText('Chết máy', { exact: true }).count() === 0, 'BTĐ không được có lỗi chết máy do côn')
  assert(await page.getByText('Thay đổi tốc độ trên đường thẳng', { exact: true }).count() === 1, 'BTĐ phải dùng bài thay đổi tốc độ')

  await page.goto(baseUrl)
  await chooseVehicle(page, 'HẠNG XE HẠNG C1')
  await enterStudent(page, 'Học viên C1')
  assert(await page.locator('.lesson-card:not(.lesson-card--emergency)').count() === 10, 'C1 phải có đúng 10 bài thi')
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
  await mobile.close()

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
  const desktopPage = await desktop.newPage()
  await desktopPage.goto(baseUrl)
  await desktopPage.screenshot({ path: path.join(artifactDir, 'home-desktop.png'), fullPage: false })
  await desktop.close()

  console.log('E2E_OK: responsive, BSS/BTĐ 11 lessons, C1 10 lessons, summary, conclusion and PNG export verified')
} finally {
  await browser.close()
}
