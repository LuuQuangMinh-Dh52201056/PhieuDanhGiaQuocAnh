# Phiếu đánh giá thực hành lái xe Linh Xuân

Ứng dụng web dành cho giáo viên của **Văn Phòng Đào Tạo Lái Xe Linh Xuân**, tối ưu cho điện thoại, máy tính bảng và máy tính.

## Chức năng chính

- Chọn hạng **B số sàn**, **B số tự động** hoặc **C1**.
- Mỗi hạng có một ảnh xe riêng nền trong suốt: Vios trắng, Vios đen và xe tải Kia.
- Chọn nội dung **Tập cơ bản**, **Sa hình** hoặc **Đường trường**.
- Tập cơ bản gồm 13 nội dung đánh giá nhanh.
- Đường trường gồm 11 nội dung đánh giá.
- Sa hình đúng thứ tự bài thi: BSS/BTĐ có 11 bài; C1 có 10 bài và không có bài ghép xe ngang.
- Đánh giá từng bài theo ba mức xanh – cam – đỏ, chọn lỗi chi tiết, ghi chú và nhận xét nhanh.
- Đánh giá tình huống khẩn cấp và tự động tổng hợp kết luận.
- Xem trước phiếu mang nhận diện Linh Xuân, sửa lại thông tin, tạo phiếu mới và chia sẻ.
- Nhận xét tối đa 5.000 ký tự, giữ nguyên xuống dòng; phiếu tự tăng chiều cao và bố trí chữ ký ở hàng riêng để không cắt nội dung.
- Nút **Lưu Ảnh** xuất PNG, có logo ở đầu/chân phiếu; Android tải vào thư mục Tải xuống, iPhone có chia sẻ ảnh và phương án chạm giữ để lưu. Độ phân giải tự cân theo chiều dài phiếu và giới hạn bộ nhớ điện thoại.
- Giao diện xanh dương – trắng responsive, không tràn ngang từ điện thoại 320 px đến máy tính.
- Có trang quản trị giáo viên và khả năng lưu dữ liệu Firebase khi cấu hình biến môi trường; ứng dụng vẫn hoạt động độc lập nếu chưa cấu hình Firebase.

## Chạy trên máy

Yêu cầu Node.js 20 trở lên.

```bash
npm install
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal, thông thường là `http://localhost:5173`.

## Kiểm tra bản hoàn thiện

```bash
npm run lint
npm run build
```

Để chạy kiểm thử giao diện tự động, mở web ở cổng `4173` rồi chạy:

```bash
npm run dev -- --port 4173
npm run test:e2e
```

## Triển khai Render riêng

Dự án đã có `render.yaml` cho Render Static Site:

- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Rewrite: `/*` → `/index.html`
- Service name: `phieu-danh-gia-lai-xe-linh-xuan`

Đẩy thư mục dự án lên một repository Git mới, sau đó tạo Blueprint trên Render từ repository đó. Không bắt buộc cấu hình Firebase để dùng luồng tạo và lưu ảnh phiếu đánh giá.
