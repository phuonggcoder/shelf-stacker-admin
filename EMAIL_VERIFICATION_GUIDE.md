# Hướng dẫn Xác thực Email

## Tổng quan

Xác thực email trong hệ thống Shelf Stacker được thực hiện thông qua Event Notifications. Khi một email được xác thực thành công, hệ thống sẽ gửi thông báo cho user thông qua event `email_verified`.

## Cách thực hiện xác thực email

### 1. Sử dụng Admin Panel (Giao diện web)

#### Bước 1: Truy cập Event Notifications
- Đăng nhập vào admin panel: `http://localhost:3000/login`
- Trong sidebar, click vào "Event Notifications"
- Hoặc truy cập trực tiếp: `http://localhost:3000/event-notifications`

#### Bước 2: Gửi thông báo xác thực email
1. **Chọn loại Event**: `email_verified`
2. **Chọn kiểu gửi**:
   - **Single**: Gửi cho 1 user cụ thể
   - **Multicast**: Gửi cho nhiều user
   - **Broadcast**: Gửi cho tất cả user
3. **Điền thông tin**:
   - `verifiedTime`: Thời gian xác thực (ISO format)
   - `email`: Email đã được xác thực
4. **Tùy chỉnh thông báo** (tùy chọn):
   - Tiêu đề: "Email đã được xác thực thành công"
   - Nội dung: "Chúc mừng! Email của bạn đã được xác thực thành công."
5. **Gửi**: Click "Gửi Event Notification"

### 2. Sử dụng Postman (API)

#### Bước 1: Import Collection
1. Mở Postman
2. Import file `EMAIL_VERIFICATION_POSTMAN.json`
3. Cập nhật biến môi trường:
   - `baseUrl`: `https://server-shelf-stacker-w1ds.onrender.com`
   - `authToken`: Token đăng nhập của bạn

#### Bước 2: Lấy token đăng nhập
1. Chạy request "1. Login để lấy token"
2. Thay đổi email và password theo tài khoản admin của bạn
3. Copy `access_token` từ response
4. Cập nhật biến `authToken` trong collection

#### Bước 3: Gửi thông báo xác thực email

##### Single User
```http
POST {{baseUrl}}/api/noti/event
Authorization: Bearer {{authToken}}
Content-Type: multipart/form-data

event: email_verified
userId: user_id_here
data[verifiedTime]: 2024-01-15T10:30:00Z
data[email]: user@example.com
title: Email đã được xác thực thành công
message: Chúc mừng! Email của bạn đã được xác thực thành công.
```

##### Multicast
```http
POST {{baseUrl}}/api/noti/event-multicast
Authorization: Bearer {{authToken}}
Content-Type: multipart/form-data

event: email_verified
userIds: user1,user2,user3
data[verifiedTime]: 2024-01-15T10:30:00Z
data[email]: user@example.com
title: Email đã được xác thực thành công
message: Chúc mừng! Email của bạn đã được xác thực thành công.
```

##### Broadcast
```http
POST {{baseUrl}}/api/noti/event-broadcast
Authorization: Bearer {{authToken}}
Content-Type: multipart/form-data

event: email_verified
data[verifiedTime]: 2024-01-15T10:30:00Z
data[email]: user@example.com
title: Hệ thống xác thực email đã được cập nhật
message: Hệ thống xác thực email đã được nâng cấp với tính năng mới.
```

## Cấu trúc dữ liệu Event email_verified

```javascript
{
  "event": "email_verified",
  "data": {
    "verifiedTime": "2024-01-15T10:30:00Z",  // Thời gian xác thực (ISO format)
    "email": "user@example.com"               // Email đã được xác thực
  }
}
```

## Ví dụ thực tế

### Ví dụ 1: Xác thực email cho user cụ thể
```javascript
// Dữ liệu gửi
{
  "event": "email_verified",
  "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "data": {
    "verifiedTime": "2024-01-15T14:30:00+07:00",
    "email": "nguyenvanA@gmail.com"
  },
  "title": "Email đã được xác thực thành công",
  "message": "Chúc mừng! Email nguyenvanA@gmail.com đã được xác thực thành công."
}
```

### Ví dụ 2: Thông báo cập nhật hệ thống xác thực
```javascript
// Dữ liệu gửi broadcast
{
  "event": "email_verified",
  "data": {
    "verifiedTime": "2024-01-15T10:00:00+07:00",
    "email": "system@example.com"
  },
  "title": "Hệ thống xác thực email đã được nâng cấp",
  "message": "Hệ thống xác thực email đã được cập nhật với tính năng bảo mật mới."
}
```

## Kiểm tra trạng thái xác thực email

### 1. Xem danh sách user
```http
GET {{baseUrl}}/auth/users?page=1&limit=10
Authorization: Bearer {{authToken}}
```

### 2. Kiểm tra user cụ thể
```http
GET {{baseUrl}}/auth/users/{{userId}}
Authorization: Bearer {{authToken}}
```

Response sẽ chứa thông tin:
```json
{
  "user": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "user@example.com",
    "is_verified": true,  // Trạng thái xác thực email
    "full_name": "Nguyễn Văn A",
    // ... các thông tin khác
  }
}
```

## Lưu ý quan trọng

### 1. Bảo mật
- Luôn sử dụng HTTPS cho API calls
- Validate email format trước khi gửi
- Kiểm tra quyền admin trước khi thực hiện
- Log tất cả hoạt động xác thực email

### 2. Performance
- Không gửi quá nhiều thông báo cùng lúc
- Sử dụng multicast thay vì gửi từng user một
- Cache danh sách user để tăng tốc độ

### 3. Error Handling
- Xử lý lỗi khi user không tồn tại
- Xử lý lỗi network
- Retry mechanism cho failed notifications

### 4. Best Practices
- Sử dụng timezone phù hợp cho `verifiedTime`
- Validate email format
- Kiểm tra user tồn tại trước khi gửi
- Sử dụng template cho thông báo

## Troubleshooting

### Lỗi thường gặp

1. **"User not found"**
   - Kiểm tra User ID có đúng không
   - Đảm bảo user tồn tại trong hệ thống

2. **"Invalid email format"**
   - Kiểm tra format email
   - Sử dụng email hợp lệ

3. **"Unauthorized"**
   - Kiểm tra token có hợp lệ không
   - Đăng nhập lại để lấy token mới

4. **"Rate limit exceeded"**
   - Giảm tần suất gửi notification
   - Chờ một lúc rồi thử lại

### Debug
- Mở Developer Tools (F12) trong admin panel
- Xem Console để kiểm tra lỗi
- Kiểm tra Network tab để xem API calls
- Sử dụng Postman để test API trực tiếp

## Tích hợp với hệ thống

### 1. Tự động xác thực email
Để tích hợp xác thực email tự động, bạn có thể:

1. **Tạo webhook endpoint** để nhận thông báo xác thực
2. **Tự động gửi event** khi email được xác thực
3. **Cập nhật trạng thái user** trong database

### 2. Template customization
Bạn có thể tùy chỉnh template thông báo:

```javascript
// Template mặc định
const defaultTemplate = {
  title: "Email đã được xác thực thành công",
  message: "Chúc mừng! Email {{email}} đã được xác thực thành công vào {{verifiedTime}}."
};

// Template tùy chỉnh
const customTemplate = {
  title: "Xác thực email thành công - Shelf Stacker",
  message: "Cảm ơn bạn đã xác thực email. Tài khoản của bạn đã được kích hoạt đầy đủ."
};
```

## Kết luận

Xác thực email trong hệ thống Shelf Stacker được thực hiện thông qua Event Notifications, cung cấp tính linh hoạt và khả năng tùy chỉnh cao. Bạn có thể sử dụng cả giao diện admin panel và API để thực hiện việc này.

File Postman collection đã được tạo để hỗ trợ testing và development. Hãy đảm bảo tuân thủ các best practices về bảo mật và performance khi sử dụng tính năng này.
