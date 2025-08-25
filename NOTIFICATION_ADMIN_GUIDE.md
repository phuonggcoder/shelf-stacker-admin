# Notification Admin System - Hướng dẫn sử dụng

## 🎉 Hệ thống mới đã sẵn sàng!

### 📍 **URL truy cập:**
```
http://localhost:3000/notification-admin
```

## 🚀 **Tính năng chính:**

### 1. **Quản lý Template**
- ✅ Tạo template mới với modal đầy đủ
- ✅ Chọn sự kiện cho template
- ✅ Nút chèn biến nhanh (10 biến có sẵn)
- ✅ Xem danh sách template
- ✅ Chỉnh sửa và xóa template

### 2. **Gửi theo sự kiện**
- ✅ Chọn sự kiện từ danh sách
- ✅ Chọn loại người nhận (User/Shipper/Both)
- ✅ Chọn template để sử dụng
- ✅ Gửi thông báo theo sự kiện

### 3. **Gửi theo thời gian**
- ✅ Lên lịch gửi thông báo
- ✅ Chọn thời gian cụ thể
- ✅ Xem danh sách thông báo đã lên lịch

### 4. **Gửi nhanh**
- ✅ Gửi thông báo ngay lập tức
- ✅ Chọn loại gửi (Single/Multicast/Broadcast)
- ✅ Sử dụng template tùy chọn

### 5. **Lịch sử**
- ✅ Xem lịch sử thông báo đã gửi
- ✅ Theo dõi trạng thái gửi

## 🎯 **Các biến có sẵn:**

| Nút | Biến | Mô tả |
|-----|------|-------|
| Đơn hàng ID | `{{order_id}}` | ID đơn hàng |
| Tên người dùng | `{{user_name}}` | Tên người dùng |
| Tổng tiền | `{{total_amount}}` | Tổng tiền đơn hàng |
| Tên shipper | `{{shipper_name}}` | Tên shipper |
| Địa chỉ giao hàng | `{{delivery_address}}` | Địa chỉ giao hàng |
| Phương thức thanh toán | `{{payment_method}}` | Phương thức thanh toán |
| Ngày đặt hàng | `{{order_date}}` | Ngày đặt hàng |
| Ngày giao hàng dự kiến | `{{estimated_delivery}}` | Ngày giao hàng dự kiến |
| Mã theo dõi | `{{tracking_number}}` | Mã theo dõi |
| Tên cửa hàng | `{{store_name}}` | Tên cửa hàng |

## 📝 **Ví dụ sử dụng:**

### Tạo template cho đơn hàng thành công:
1. Click **"Tạo Template mới"**
2. Điền thông tin:
   - **Tên**: "Thông báo đơn hàng thành công"
   - **Loại**: "User"
   - **Sự kiện**: "Đặt hàng thành công"
   - **Tiêu đề**: "Đơn hàng đã được xác nhận"
   - **Nội dung**: Click các nút biến để chèn:
     ```
     Xin chào {{user_name}}, đơn hàng {{order_id}} của bạn đã được xác nhận với tổng tiền {{total_amount}}. 
     Đơn hàng sẽ được giao đến {{delivery_address}} vào {{estimated_delivery}}. 
     Mã theo dõi: {{tracking_number}}
     ```
3. Click **"Lưu Template"**

### Gửi thông báo theo sự kiện:
1. Chuyển sang tab **"Gửi theo sự kiện"**
2. Click chọn sự kiện **"Đặt hàng thành công"**
3. Chọn **"Loại người nhận"**: User
4. Chọn **"Template"**: Thông báo đơn hàng thành công
5. Click **"Gửi theo sự kiện"**

## 🔧 **Cách test:**

### 1. **Test template creation:**
- Truy cập: `http://localhost:3000/notification-admin`
- Click **"Tạo Template mới"**
- Điền thông tin và test các nút chèn biến
- Lưu template

### 2. **Test events:**
- Chuyển sang tab **"Gửi theo sự kiện"**
- Click các sự kiện để xem hiệu ứng
- Test form gửi thông báo

### 3. **Test các tab khác:**
- **"Gửi theo thời gian"**: Test lên lịch
- **"Gửi nhanh"**: Test gửi ngay
- **"Lịch sử"**: Xem lịch sử

## 🐛 **Debug:**

Nếu có vấn đề:
1. **Mở Developer Tools** (F12)
2. **Xem Console** để kiểm tra logs
3. **Kiểm tra Network** tab nếu có lỗi API
4. **Refresh trang** nếu cần

## 📋 **Console logs cần kiểm tra:**

- ✅ `Notification Admin System loaded`
- ✅ `DOM loaded, initializing...`
- ✅ `Initializing notification admin system...`
- ✅ `System initialized successfully`
- ✅ `Events loaded: 6`
- ✅ `Templates loaded: 1`
- ✅ `Modal opened successfully` (khi tạo template)
- ✅ `Variable inserted successfully` (khi chèn biến)

## 🎨 **Giao diện:**

- **Sidebar**: Gradient xanh tím đẹp mắt
- **Stats cards**: 4 thẻ thống kê với hiệu ứng hover
- **Tabs**: 5 tab chức năng chính
- **Modal**: Modal lớn cho tạo template
- **Responsive**: Hoạt động tốt trên mobile

---

**🎉 Hệ thống đã sẵn sàng sử dụng! Hãy test ngay và cho tôi biết kết quả!**
