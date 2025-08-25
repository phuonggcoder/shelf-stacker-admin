# Test Notification Admin System

## 🧪 Cách test hệ thống

### 1. **Test trang đơn giản (Khuyến nghị)**
```
URL: http://localhost:3000/notification-admin-simple
```
- Trang này có JavaScript đơn giản, dễ debug
- Có thể test events và template creation
- Console logs rõ ràng

### 2. **Test trang chính**
```
URL: http://localhost:3000/notification-admin
```
- Trang đầy đủ tính năng
- Có thể có lỗi JavaScript phức tạp

## 🔍 Debug Steps

### Bước 1: Mở Developer Tools
1. Nhấn **F12** hoặc **Ctrl+Shift+I**
2. Chuyển sang tab **Console**
3. Xóa tất cả logs cũ

### Bước 2: Test trang đơn giản
1. Truy cập: `http://localhost:3000/notification-admin-simple`
2. Xem console logs khi trang load
3. Click **"Load Events"** - sẽ thấy 6 events
4. Click **"Create Template Modal"** - modal sẽ mở
5. Click **"Check Console Status"** - kiểm tra Bootstrap

### Bước 3: Test trang chính
1. Truy cập: `http://localhost:3000/notification-admin`
2. Xem console logs khi trang load
3. Chuyển sang tab **"Gửi theo sự kiện"**
4. Xem có events hiển thị không
5. Click **"Tạo Template mới"**

## 🐛 Các lỗi thường gặp

### Lỗi 1: "Events container not found"
- **Nguyên nhân**: Element `eventsList` không tồn tại
- **Giải pháp**: Kiểm tra HTML structure

### Lỗi 2: "Modal element not found"
- **Nguyên nhân**: Element `templateModal` không tồn tại
- **Giải pháp**: Kiểm tra modal HTML

### Lỗi 3: "Bootstrap Modal not available"
- **Nguyên nhân**: Bootstrap không load được
- **Giải pháp**: Kiểm tra CDN link

### Lỗi 4: "NotificationAdmin not initialized"
- **Nguyên nhân**: JavaScript không load hoặc có lỗi
- **Giải pháp**: Kiểm tra file path và syntax

## 📋 Console Logs cần kiểm tra

### Trang đơn giản:
- [ ] `=== Page Loaded ===`
- [ ] `DOM Content Loaded`
- [ ] `Bootstrap available: true`
- [ ] `Loading events...`
- [ ] `Events loaded: [...]`
- [ ] `Events displayed successfully`
- [ ] `Creating template modal...`
- [ ] `Modal shown successfully`

### Trang chính:
- [ ] `NotificationAdmin constructor called`
- [ ] `NotificationAdmin initialized`
- [ ] `NotificationAdmin init() called`
- [ ] `Setting up event listeners...`
- [ ] `Event listeners initialized`
- [ ] `Loading initial data...`
- [ ] `Loading events...`
- [ ] `Events loaded: [...]`
- [ ] `Displaying events: [...]`
- [ ] `Events displayed successfully`

## 🚀 Kết quả mong đợi

### Trang đơn giản:
✅ **Events hiển thị**: 6 events trong danh sách  
✅ **Modal mở được**: Template creation modal  
✅ **Console logs**: Tất cả logs hiển thị đúng  

### Trang chính:
✅ **Events hiển thị**: Trong tab "Gửi theo sự kiện"  
✅ **Template modal**: Mở được khi click "Tạo Template mới"  
✅ **Tabs hoạt động**: Chuyển đổi giữa các tab  
✅ **Forms hoạt động**: Các form submit được  

## 🔧 Nếu vẫn có vấn đề

### 1. **Kiểm tra Network**
- Mở Developer Tools → Network tab
- Refresh trang
- Xem có file nào load lỗi không

### 2. **Kiểm tra Elements**
- Mở Developer Tools → Elements tab
- Tìm element `eventsList` và `templateModal`
- Xem có tồn tại không

### 3. **Kiểm tra Console Errors**
- Xem có lỗi JavaScript nào không
- Copy lỗi và báo cáo

### 4. **Test từng bước**
- Test trang đơn giản trước
- Nếu trang đơn giản OK → vấn đề ở trang chính
- Nếu trang đơn giản lỗi → vấn đề cơ bản

## 📞 Báo cáo lỗi

Khi báo cáo lỗi, hãy cung cấp:

1. **URL đang test**: Trang nào
2. **Console logs**: Copy tất cả logs
3. **Console errors**: Copy tất cả errors
4. **Mô tả**: Lỗi gì, khi nào xảy ra
5. **Screenshot**: Nếu có thể

---

**Lưu ý**: Luôn test trang đơn giản trước để xác định vấn đề cơ bản!
