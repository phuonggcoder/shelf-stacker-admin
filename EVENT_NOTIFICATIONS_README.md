# Event Notifications - Hướng dẫn sử dụng

## Tổng quan

Event Notifications là một module mới được thêm vào admin panel để quản lý thông báo theo sự kiện hệ thống. Module này hoàn toàn tách biệt với module thông báo thông thường và cung cấp các tính năng nâng cao cho việc gửi thông báo dựa trên các sự kiện cụ thể.

## Tính năng chính

### 1. Gửi Event Notifications
- **Single User**: Gửi thông báo cho 1 user cụ thể
- **Multicast**: Gửi thông báo cho nhiều user cùng lúc
- **Broadcast**: Gửi thông báo cho tất cả user

### 2. Các loại Event được hỗ trợ

#### Login Events
- `user_login`: Đăng nhập thành công
- `user_register`: Đăng ký tài khoản
- `email_verified`: Xác thực email

#### Order Events
- `order_created`: Tạo đơn hàng mới
- `order_status_update`: Cập nhật trạng thái đơn hàng
- `order_delivered`: Đơn hàng đã giao
- `order_cancelled`: Đơn hàng bị hủy

#### Payment Events
- `payment_success`: Thanh toán thành công
- `payment_failed`: Thanh toán thất bại
- `payment_refunded`: Hoàn tiền

#### Marketing Events
- `promotion_created`: Tạo khuyến mãi mới
- `flash_sale`: Flash sale

#### System Events
- `system_maintenance`: Bảo trì hệ thống
- `app_update`: Cập nhật ứng dụng

## Cách sử dụng

### 1. Truy cập Event Notifications
- Đăng nhập vào admin panel
- Trong sidebar, click vào "Event Notifications" (biểu tượng calendar)
- Hoặc truy cập trực tiếp: `http://localhost:3000/event-notifications`

### 2. Gửi Event Notification

#### Bước 1: Chọn loại Event
- Chọn loại event từ dropdown "Loại Event"
- Form sẽ tự động hiển thị các trường dữ liệu phù hợp

#### Bước 2: Chọn kiểu gửi
- **Single**: Nhập User ID cụ thể
- **Multicast**: Nhập danh sách User ID (phân tách bằng dấu phẩy)
- **Broadcast**: Gửi cho tất cả user

#### Bước 3: Điền thông tin Event
- Điền các thông tin cần thiết theo loại event đã chọn
- Các trường bắt buộc sẽ được đánh dấu

#### Bước 4: Tùy chỉnh thông báo (tùy chọn)
- Tiêu đề tùy chỉnh
- Nội dung tùy chỉnh
- Hình ảnh đính kèm

#### Bước 5: Gửi
- Click "Gửi Event Notification"
- Hệ thống sẽ hiển thị kết quả

### 3. Quản lý Templates (Đang phát triển)
- Tạo template cho các loại event
- Chỉnh sửa và xóa template
- Xem danh sách template

### 4. Xem lịch sử (Đang phát triển)
- Xem lịch sử các event đã gửi
- Lọc theo loại event và trạng thái
- Xem chi tiết từng event

### 5. Thống kê (Đang phát triển)
- Thống kê tổng quan
- Biểu đồ theo thời gian
- Phân tích hiệu quả

## Ví dụ sử dụng

### Ví dụ 1: Gửi thông báo đăng nhập
```
Event: user_login
Kiểu gửi: Single
User ID: user123
Thông tin:
- Thời gian: 2024-01-15 10:30
- Thiết bị: Mobile
- Vị trí: Hanoi, Vietnam
- IP: 192.168.1.1
```

### Ví dụ 2: Gửi thông báo đơn hàng mới
```
Event: order_created
Kiểu gửi: Single
User ID: user456
Thông tin:
- Order ID: ORD123456
- Tổng tiền: 150,000 VND
- Số lượng: 3 sản phẩm
- Thời gian: 2024-01-15 14:20
```

### Ví dụ 3: Gửi thông báo khuyến mãi cho tất cả
```
Event: promotion_created
Kiểu gửi: Broadcast
Thông tin:
- Promotion ID: PROM123
- Tiêu đề: Giảm giá 20%
- Giảm giá: 20%
- Hiệu lực từ: 2024-01-15 00:00
- Hiệu lực đến: 2024-01-20 23:59
- Đơn hàng tối thiểu: 100,000 VND
```

## API Endpoints

### Gửi Event Notification
```http
POST /api/noti/event
Content-Type: multipart/form-data
Authorization: Bearer {token}

{
  "event": "user_login",
  "userId": "user_id_here",
  "data": {
    "loginTime": "2024-01-15T10:30:00Z",
    "device": "mobile",
    "location": "Hanoi, Vietnam"
  },
  "title": "Đăng nhập thành công",
  "message": "Chào mừng bạn quay trở lại!"
}
```

### Gửi Multicast
```http
POST /api/noti/event-multicast
Content-Type: multipart/form-data
Authorization: Bearer {token}

{
  "event": "order_status_update",
  "userIds": ["user1", "user2", "user3"],
  "data": {
    "orderId": "ORD123456",
    "status": "Delivered"
  }
}
```

### Gửi Broadcast
```http
POST /api/noti/event-broadcast
Content-Type: multipart/form-data
Authorization: Bearer {token}

{
  "event": "system_maintenance",
  "data": {
    "maintenanceTime": "2024-01-16T02:00:00Z",
    "duration": "2 hours",
    "reason": "Cập nhật hệ thống"
  }
}
```

## Cấu trúc dữ liệu Event

### Login Events
```javascript
{
  "event": "user_login",
  "data": {
    "loginTime": "2024-01-15T10:30:00Z",
    "device": "mobile|web|app",
    "location": "Hanoi, Vietnam",
    "ipAddress": "192.168.1.1"
  }
}
```

### Order Events
```javascript
{
  "event": "order_created",
  "data": {
    "orderId": "ORD123456",
    "amount": 150000,
    "items": 3,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Payment Events
```javascript
{
  "event": "payment_success",
  "data": {
    "orderId": "ORD123456",
    "paymentId": "PAY789012",
    "amount": 150000,
    "paymentMethod": "zalopay",
    "paidAt": "2024-01-15T10:35:00Z"
  }
}
```

## Lưu ý quan trọng

### 1. Bảo mật
- Tất cả API calls cần authentication token
- Validate dữ liệu trước khi gửi
- Log tất cả hoạt động

### 2. Performance
- Không gửi quá 5 notification/phút cho cùng 1 user
- Sử dụng debounce cho các event liên tục
- Cache template để giảm API calls

### 3. Error Handling
- Xử lý lỗi network
- Retry mechanism cho failed notifications
- Fallback cho template không tồn tại

### 4. Rate Limiting
- Giới hạn số lượng notification gửi
- Throttle cho broadcast messages
- Queue system cho large-scale sending

## Troubleshooting

### Lỗi thường gặp

1. **"User not found"**
   - Kiểm tra User ID có đúng không
   - Đảm bảo user tồn tại trong hệ thống

2. **"Template not found"**
   - Kiểm tra loại event có template không
   - Tạo template mới nếu cần

3. **"Rate limit exceeded"**
   - Giảm tần suất gửi notification
   - Chờ một lúc rồi thử lại

4. **"Network error"**
   - Kiểm tra kết nối internet
   - Thử lại sau vài giây

### Debug
- Mở Developer Tools (F12)
- Xem Console để kiểm tra lỗi
- Kiểm tra Network tab để xem API calls

## Phát triển tương lai

### Tính năng sắp tới
- [ ] Template management hoàn chỉnh
- [ ] History và analytics
- [ ] Scheduled notifications
- [ ] A/B testing
- [ ] Push notifications
- [ ] Email integration
- [ ] SMS integration

### Cải tiến
- [ ] UI/UX optimization
- [ ] Performance optimization
- [ ] Mobile responsive
- [ ] Dark mode
- [ ] Multi-language support

## Liên hệ

Nếu có vấn đề hoặc câu hỏi, vui lòng liên hệ:
- Email: support@example.com
- Documentation: https://docs.example.com/event-notifications
- GitHub Issues: https://github.com/example/event-notifications/issues
