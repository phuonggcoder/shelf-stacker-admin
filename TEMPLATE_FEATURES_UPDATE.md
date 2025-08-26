# Template Features Update

## 🎉 Tính năng mới đã thêm

### 1. **Chọn sự kiện cho template**
- Template bây giờ có trường **"Sự kiện"** bắt buộc
- Các sự kiện có sẵn:
  - `login_success` - Đăng nhập thành công
  - `order_success` - Đặt hàng thành công
  - `payment_success` - Thanh toán thành công
  - `delivery_success` - Giao hàng thành công
  - `email_verified` - Xác thực email
  - `custom` - Tùy chỉnh

### 2. **Nút chèn biến nhanh**
- 10 nút chèn biến có sẵn:
  - **Đơn hàng ID** → `{{order_id}}`
  - **Tên người dùng** → `{{user_name}}`
  - **Tổng tiền** → `{{total_amount}}`
  - **Tên shipper** → `{{shipper_name}}`
  - **Địa chỉ giao hàng** → `{{delivery_address}}`
  - **Phương thức thanh toán** → `{{payment_method}}`
  - **Ngày đặt hàng** → `{{order_date}}`
  - **Ngày giao hàng dự kiến** → `{{estimated_delivery}}`
  - **Mã theo dõi** → `{{tracking_number}}`
  - **Tên cửa hàng** → `{{store_name}}`

### 3. **Cải thiện giao diện**
- Modal lớn hơn (modal-xl)
- Form layout 2 cột cho tên và loại
- Placeholder text hướng dẫn
- Validation bắt buộc cho các trường quan trọng

## 🧪 Cách test

### 1. **Test trang chính**
```
URL: http://localhost:3000/notification-admin
```
- Click **"Tạo Template mới"**
- Chọn sự kiện từ dropdown
- Click các nút biến để chèn vào nội dung
- Lưu template

### 2. **Test trang đơn giản**
```
URL: http://localhost:3000/notification-admin-simple
```
- Test cơ bản events và modal

### 3. **Test trang template features**
```
URL: http://localhost:3000/notification-admin-test
```
- Test riêng tính năng template
- Test chèn biến trong textarea riêng

## 📝 Ví dụ sử dụng

### Template cho đơn hàng thành công:
```
Tên: "Thông báo đơn hàng thành công"
Loại: "user"
Sự kiện: "order_success"
Tiêu đề: "Đơn hàng đã được xác nhận"
Nội dung: "Xin chào {{user_name}}, đơn hàng {{order_id}} của bạn đã được xác nhận với tổng tiền {{total_amount}}. Đơn hàng sẽ được giao đến {{delivery_address}} vào {{estimated_delivery}}. Mã theo dõi: {{tracking_number}}"
```

### Template cho giao hàng thành công:
```
Tên: "Thông báo giao hàng thành công"
Loại: "both"
Sự kiện: "delivery_success"
Tiêu đề: "Giao hàng thành công"
Nội dung: "Đơn hàng {{order_id}} đã được giao thành công bởi {{shipper_name}} đến {{delivery_address}}. Cảm ơn bạn đã sử dụng dịch vụ của {{store_name}}!"
```

## 🔧 Cách chèn biến

### Phương pháp 1: Click nút
1. Click vào textarea nội dung
2. Đặt con trỏ tại vị trí muốn chèn
3. Click nút biến tương ứng

### Phương pháp 2: Gõ trực tiếp
- Gõ `{{` để bắt đầu biến
- Gõ tên biến: `order_id`, `user_name`, `total_amount`, v.v.
- Gõ `}}` để kết thúc biến

## 🎯 Các biến có sẵn

| Biến | Mô tả | Ví dụ |
|------|-------|-------|
| `{{order_id}}` | ID đơn hàng | "ORD-2024-001" |
| `{{user_name}}` | Tên người dùng | "Nguyễn Văn A" |
| `{{total_amount}}` | Tổng tiền đơn hàng | "500,000 VNĐ" |
| `{{shipper_name}}` | Tên shipper | "Trần Văn B" |
| `{{delivery_address}}` | Địa chỉ giao hàng | "123 Đường ABC, Quận 1, TP.HCM" |
| `{{payment_method}}` | Phương thức thanh toán | "Tiền mặt" |
| `{{order_date}}` | Ngày đặt hàng | "25/08/2024" |
| `{{estimated_delivery}}` | Ngày giao hàng dự kiến | "27/08/2024" |
| `{{tracking_number}}` | Mã theo dõi | "TRK-123456" |
| `{{store_name}}` | Tên cửa hàng | "Shelf Stacker" |

## 🚀 Kết quả mong đợi

✅ **Template modal mở được** với form đầy đủ  
✅ **Dropdown sự kiện** có đầy đủ các lựa chọn  
✅ **Nút chèn biến** hoạt động và chèn đúng vị trí  
✅ **Validation** hoạt động cho các trường bắt buộc  
✅ **Lưu template** thành công với dữ liệu đầy đủ  

## 🔍 Debug

Nếu có vấn đề:
1. Mở Developer Tools (F12)
2. Xem Console logs
3. Test từng trang một
4. Kiểm tra các element có tồn tại không

---

**Lưu ý**: Các biến sẽ được thay thế bằng giá trị thực tế khi gửi thông báo!
