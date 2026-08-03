# Phiếu đánh giá thực hành lái xe

Ứng dụng web thuần frontend dành cho giáo viên hướng dẫn lái xe, hỗ trợ:

- Chọn hạng B số sàn, B số tự động hoặc C1.
- Sau khi chọn hạng xe, chọn nội dung **Tập cơ bản**, **Sa hình** hoặc **Đường trường**.
- Tập cơ bản dùng phiếu tích nhanh 13 nội dung với các mức **Đã hiểu / Còn yếu / Chưa rõ**.
- Đường trường dùng phiếu tích nhanh 11 nội dung với các mức **Tốt / Khá / Trung bình / Yếu**.
- Toàn bộ ứng dụng sử dụng thương hiệu **Trung tâm Giáo dục Nghề nghiệp Phú Giáo**; phiếu cơ bản và đường trường lấy màu xanh làm chủ đạo.
- Đánh giá đúng số bài theo từng hạng: BSS/BTĐ có 11 bài, C1 có 10 bài và không có ghép xe ngang.
- Hiển thị tiêu chí và lỗi riêng theo từng hạng xe.
- Đánh giá tình huống khẩn cấp, ghi chú từng bài và nhận xét nhanh.
- Tự tổng hợp kết quả, đề xuất kết luận và cho phép giáo viên điều chỉnh.
- Xem trước, tải PNG khổ rộng 1080 px hoặc chia sẻ bằng Web Share API.
- Trên Safari iPhone, nút **Lưu vào Ảnh** mở bảng chia sẻ iOS để lưu trực tiếp vào ứng dụng Ảnh.
- Không backend, không tài khoản, không lưu dữ liệu vào trình duyệt.

## Chạy ứng dụng

```bash
npm install
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal (thông thường là `http://localhost:5173`).

## Kiểm tra

```bash
npm run lint
npm run build
npm run test:e2e
```

Lệnh E2E cần Google Chrome tại đường dẫn cài đặt mặc định trên Windows và một dev server đang chạy ở cổng `4173`.

## Triển khai trên Render

Dự án đã có sẵn Blueprint tại `render.yaml` cho Render Static Site:

- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Rewrite: `/*` → `/index.html` để URL gốc và các đường dẫn của ứng dụng luôn hoạt động.

Đẩy mã nguồn lên GitHub/GitLab/Bitbucket, sau đó tạo Blueprint trong Render từ repository đó. Render sẽ tự đọc cấu hình và triển khai site lên CDN.
# phieu_danh_gia
