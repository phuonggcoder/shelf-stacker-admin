# Notification Admin System

## Tổng quan

Hệ thống Notification Admin là một module quản lý thông báo toàn diện cho admin panel, cho phép tạo và quản lý template, gửi thông báo cho người dùng, và theo dõi lịch sử gửi thông báo.

## Tính năng chính

### 1. Quản lý Template
- **Tạo template mới**: Tạo các template thông báo với các biến động
- **Chỉnh sửa template**: Cập nhật nội dung và cấu hình template
- **Xóa template**: Xóa template không còn sử dụng
- **Kích hoạt/Tạm khóa**: Bật/tắt template để sử dụng
- **Hỗ trợ biến động**: Sử dụng các biến như `{{user_name}}`, `{{order_id}}`, `{{product_name}}`, `{{date}}`

### 2. Gửi thông báo
- **Gửi cho 1 người dùng**: Chọn và gửi thông báo cho một người dùng cụ thể
- **Gửi cho nhiều người dùng**: Chọn nhiều người dùng để gửi thông báo
- **Gửi cho tất cả**: Broadcast thông báo cho toàn bộ người dùng
- **Tệp đính kèm**: Hỗ trợ đính kèm file PDF, DOC, DOCX, JPG, PNG (tối đa 10MB)
- **Xem trước**: Xem trước nội dung thông báo trước khi gửi

### 3. Lịch sử và thống kê
- **Theo dõi lịch sử**: Xem danh sách các thông báo đã gửi
- **Tìm kiếm và lọc**: Tìm kiếm theo tiêu đề, nội dung, trạng thái, ngày tháng
- **Thống kê tổng quan**: Hiển thị số lượng template, thông báo đã gửi, đang chờ, thất bại
- **Chi tiết thông báo**: Xem chi tiết từng thông báo đã gửi
- **Gửi lại**: Gửi lại thông báo thất bại

## Cấu trúc file

```
views/
├── notification-admin.html          # Giao diện chính của Notification Admin

public/assets/js/
└── notification-admin.js            # Logic JavaScript cho Notification Admin

app.js                               # Route cho /notification-admin
```

## API Endpoints

### Template Management
```
GET    /api/notifications/templates              # Lấy danh sách template
GET    /api/notifications/templates/:id          # Lấy chi tiết template
POST   /api/notifications/templates              # Tạo template mới
PUT    /api/notifications/templates/:id          # Cập nhật template
DELETE /api/notifications/templates/:id          # Xóa template
PATCH  /api/notifications/templates/:id/toggle   # Bật/tắt template
```

### Notification Sending
```
POST   /api/notifications/send                   # Gửi thông báo
```

### History & Statistics
```
GET    /api/notifications/history                # Lấy lịch sử thông báo
GET    /api/notifications/history/:id            # Chi tiết thông báo
POST   /api/notifications/history/:id/resend     # Gửi lại thông báo
GET    /api/notifications/stats                  # Thống kê tổng quan
```

### User Management
```
GET    /api/users                                # Lấy danh sách người dùng
```

## Giao diện người dùng

### 1. Dashboard
- **Thống kê tổng quan**: 4 card hiển thị số liệu quan trọng
- **Navigation tabs**: 3 tab chính cho các chức năng

### 2. Tab "Quản lý Template"
- **Bảng template**: Hiển thị danh sách template với các thao tác
- **Modal tạo/chỉnh sửa**: Form để tạo và chỉnh sửa template
- **Toolbar biến**: Các nút để chèn biến động vào nội dung

### 3. Tab "Gửi thông báo"
- **Form gửi thông báo**: Chọn template, loại gửi, người nhận
- **Quản lý người dùng**: Bảng chọn nhiều người dùng
- **Biến template**: Form nhập giá trị cho các biến
- **Upload file**: Khu vực kéo thả và chọn file
- **Xem trước**: Hiển thị nội dung thông báo trước khi gửi

### 4. Tab "Lịch sử"
- **Bộ lọc tìm kiếm**: Tìm kiếm theo nhiều tiêu chí
- **Bảng lịch sử**: Danh sách thông báo đã gửi
- **Phân trang**: Navigation cho danh sách dài
- **Chi tiết**: Modal xem chi tiết thông báo

## Các biến template hỗ trợ

| Biến | Mô tả | Ví dụ |
|------|-------|-------|
| `{{user_name}}` | Tên người dùng | "Nguyễn Văn A" |
| `{{order_id}}` | ID đơn hàng | "ORD-2024-001" |
| `{{product_name}}` | Tên sản phẩm | "Sách Lập trình Web" |
| `{{date}}` | Ngày tháng hiện tại | "15/01/2024" |

## Cấu hình và tùy chọn

### Loại template
- **Email**: Template cho email
- **Notification**: Template cho thông báo hệ thống
- **SMS**: Template cho tin nhắn SMS

### Loại gửi
- **Single**: Gửi cho 1 người dùng
- **Multicast**: Gửi cho nhiều người dùng được chọn
- **Broadcast**: Gửi cho tất cả người dùng

### Trạng thái thông báo
- **Sent**: Đã gửi thành công
- **Pending**: Đang chờ gửi
- **Failed**: Gửi thất bại

## Bảo mật

### Authentication
- Tất cả API endpoints yêu cầu Bearer token
- Token được lấy từ localStorage hoặc sessionStorage

### File Upload
- Giới hạn kích thước file: 10MB
- Các loại file được phép: PDF, DOC, DOCX, JPG, PNG
- Validation cả client và server side

### Rate Limiting
- Giới hạn số lượng request để tránh spam
- Throttling cho việc gửi thông báo hàng loạt

## Tích hợp với hệ thống hiện tại

### Navigation
- Thêm link "Notification Admin" vào sidebar của tất cả trang
- Icon: `fas fa-bell`
- Route: `/notification-admin`

### Styling
- Sử dụng Bootstrap 5.1.3
- Font Awesome 6.0.0 cho icons
- CSS custom cho giao diện admin

### JavaScript
- ES6+ syntax
- Async/await cho API calls
- Event-driven architecture
- Modular design pattern

## Hướng dẫn sử dụng

### 1. Tạo template mới
1. Vào tab "Quản lý Template"
2. Click "Tạo Template mới"
3. Điền thông tin: tên, loại, tiêu đề, nội dung
4. Sử dụng các nút biến để chèn biến động
5. Click "Lưu Template"

### 2. Gửi thông báo
1. Vào tab "Gửi thông báo"
2. Chọn template từ dropdown
3. Chọn loại gửi (single/multicast/broadcast)
4. Chọn người nhận (nếu cần)
5. Nhập giá trị cho các biến (nếu có)
6. Upload file đính kèm (tùy chọn)
7. Click "Xem trước" để kiểm tra
8. Click "Gửi thông báo"

### 3. Xem lịch sử
1. Vào tab "Lịch sử"
2. Sử dụng bộ lọc để tìm kiếm
3. Click icon "mắt" để xem chi tiết
4. Click icon "redo" để gửi lại thông báo thất bại

## Troubleshooting

### Lỗi thường gặp

1. **"Lỗi khi tải thống kê"**
   - Kiểm tra kết nối mạng
   - Kiểm tra token authentication
   - Kiểm tra API endpoint

2. **"File quá lớn"**
   - Giảm kích thước file xuống dưới 10MB
   - Nén file trước khi upload

3. **"Loại file không được hỗ trợ"**
   - Chỉ upload file PDF, DOC, DOCX, JPG, PNG
   - Kiểm tra extension file

4. **"Vui lòng chọn người nhận"**
   - Chọn ít nhất một người dùng
   - Kiểm tra loại gửi đã chọn

### Debug
- Mở Developer Tools (F12)
- Kiểm tra Console tab cho lỗi JavaScript
- Kiểm tra Network tab cho lỗi API
- Kiểm tra Application tab cho localStorage/sessionStorage

## Phát triển tương lai

### Tính năng có thể thêm
- **Template categories**: Phân loại template theo chủ đề
- **Scheduled sending**: Lên lịch gửi thông báo
- **A/B testing**: Test hiệu quả các template khác nhau
- **Analytics**: Thống kê chi tiết về engagement
- **Webhook integration**: Tích hợp với hệ thống bên ngoài
- **Multi-language support**: Hỗ trợ đa ngôn ngữ

### Cải tiến kỹ thuật
- **Real-time updates**: WebSocket cho cập nhật real-time
- **Offline support**: Cache data cho offline mode
- **Progressive Web App**: PWA features
- **Performance optimization**: Lazy loading, pagination
- **Accessibility**: WCAG compliance

## Kết luận

Hệ thống Notification Admin cung cấp một giải pháp toàn diện cho việc quản lý và gửi thông báo trong admin panel. Với giao diện thân thiện, tính năng đầy đủ và tích hợp dễ dàng, hệ thống này sẽ giúp admin quản lý thông báo một cách hiệu quả và chuyên nghiệp.

