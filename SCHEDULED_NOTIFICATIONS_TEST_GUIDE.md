# ⏰ Scheduled Notifications Test Guide

## 📋 **Tổng quan**

Hướng dẫn kiểm tra toàn bộ chức năng thông báo theo thời gian (Scheduled Notifications) trong hệ thống notification. Script test này sẽ kiểm tra tất cả các tính năng từ CRUD cơ bản đến worker processing.

---

## 🚀 **Cách sử dụng:**

### **1. Chạy tất cả tests:**
```bash
node test-scheduled-notifications.js --all
```

### **2. Chạy từng test riêng lẻ:**

#### **Test CRUD Operations:**
```bash
node test-scheduled-notifications.js --crud
```

#### **Test Different Types:**
```bash
node test-scheduled-notifications.js --types
```

#### **Test Recipient Types:**
```bash
node test-scheduled-notifications.js --recipients
```

#### **Test Filters:**
```bash
node test-scheduled-notifications.js --filters
```

#### **Test Validation:**
```bash
node test-scheduled-notifications.js --validation
```

#### **Test Bulk Operations:**
```bash
node test-scheduled-notifications.js --bulk
```

#### **Test Worker Processing:**
```bash
node test-scheduled-notifications.js --worker
```

---

## 🧪 **Chi tiết các test:**

### **1. CRUD Operations Test (`--crud`)**

Kiểm tra các thao tác cơ bản:
- ✅ **Create**: Tạo thông báo theo lịch trình
- ✅ **Read**: Lấy thông tin thông báo
- ✅ **Update**: Cập nhật thông báo
- ✅ **Delete**: Xóa thông báo
- ✅ **List**: Lấy danh sách thông báo

**Kết quả mong đợi:**
```
🧪 Testing Scheduled Notification CRUD Operations...
1. Creating scheduled notification...
✅ Scheduled notification created: { success: true, data: { _id: "...", ... } }
2. Getting scheduled notification...
✅ Scheduled notification retrieved: { success: true, data: { ... } }
3. Updating scheduled notification...
✅ Scheduled notification updated: { success: true, data: { ... } }
4. Getting all scheduled notifications...
✅ All scheduled notifications: { success: true, data: { notifications: [...] } }
5. Deleting scheduled notification...
✅ Scheduled notification deleted: { success: true, data: { ... } }
```

### **2. Types Test (`--types`)**

Kiểm tra các loại thông báo khác nhau:
- ✅ **Immediate**: Gửi sau 5 phút
- ✅ **Tomorrow**: Gửi ngày mai
- ✅ **Next Week**: Gửi tuần tới

**Kết quả mong đợi:**
```
⏰ Testing Different Scheduled Notification Types...
Creating Immediate (5 minutes from now) notification...
✅ Immediate (5 minutes from now) notification created successfully
Creating Tomorrow morning notification...
✅ Tomorrow morning notification created successfully
Creating Next week notification...
✅ Next week notification created successfully
```

### **3. Recipients Test (`--recipients`)**

Kiểm tra các loại người nhận:
- ✅ **All Users**: Gửi cho tất cả
- ✅ **Specific User**: Gửi cho 1 user cụ thể
- ✅ **Multiple Users**: Gửi cho nhiều users

**Kết quả mong đợi:**
```
👥 Testing Scheduled Notification Recipients...
Testing All Users...
✅ All Users notification created successfully
Testing Specific User...
✅ Specific User notification created successfully
Testing Multiple Users...
✅ Multiple Users notification created successfully
```

### **4. Filters Test (`--filters`)**

Kiểm tra bộ lọc thông báo:
- ✅ **All**: Tất cả thông báo
- ✅ **Pending**: Đang chờ gửi
- ✅ **Sent**: Đã gửi
- ✅ **Cancelled**: Đã hủy

**Kết quả mong đợi:**
```
🔍 Testing Scheduled Notification Filters...
Testing All filter...
✅ All filter: 5 notifications found
Testing Pending filter...
✅ Pending filter: 3 notifications found
Testing Sent filter...
✅ Sent filter: 2 notifications found
Testing Cancelled filter...
✅ Cancelled filter: 0 notifications found
```

### **5. Validation Test (`--validation`)**

Kiểm tra validation dữ liệu:
- ✅ **Past Date**: Ngày trong quá khứ (phải fail)
- ✅ **Missing Title**: Thiếu tiêu đề (phải fail)
- ✅ **Missing Message**: Thiếu nội dung (phải fail)
- ✅ **Invalid Recipient**: Loại người nhận không hợp lệ (phải fail)

**Kết quả mong đợi:**
```
✅ Testing Scheduled Notification Validation...
Testing Past date...
✅ Past date failed as expected: Thời gian gửi phải trong tương lai
Testing Missing title...
✅ Missing title failed as expected: Tiêu đề là bắt buộc
Testing Missing message...
✅ Missing message failed as expected: Nội dung là bắt buộc
Testing Invalid recipient type...
✅ Invalid recipient type failed as expected: Loại người nhận không hợp lệ
```

### **6. Bulk Operations Test (`--bulk`)**

Kiểm tra thao tác hàng loạt:
- ✅ **Create Multiple**: Tạo nhiều thông báo
- ✅ **List All**: Lấy tất cả thông báo
- ✅ **Delete All**: Xóa tất cả thông báo đã tạo

**Kết quả mong đợi:**
```
📦 Testing Scheduled Notification Bulk Operations...
Creating multiple scheduled notifications...
✅ Created notification: Bulk Test Notification 1
✅ Created notification: Bulk Test Notification 2
✅ Created notification: Bulk Test Notification 3
✅ Created notification: Bulk Test Notification 4
✅ Created notification: Bulk Test Notification 5
Getting all scheduled notifications...
✅ Found 5 scheduled notifications
Cleaning up created notifications...
✅ Deleted notification: 64f8a1b2c3d4e5f6a7b8c9d0
✅ Deleted notification: 64f8a1b2c3d4e5f6a7b8c9d1
...
```

### **7. Worker Test (`--worker`)**

Kiểm tra worker xử lý thông báo:
- ✅ **Create**: Tạo thông báo gửi sau 2 phút
- ✅ **Wait**: Chờ 3 phút
- ✅ **Check**: Kiểm tra trạng thái

**Kết quả mong đợi:**
```
⚙️ Testing Scheduled Notification Worker...
Creating notification scheduled for 2 minutes from now...
✅ Worker test notification created successfully
⏰ Notification scheduled for: 1/15/2024, 2:30:00 PM
🔄 The worker should process this notification automatically
⏳ Waiting 3 minutes to check if worker processed the notification...
📊 Notification status: sent
📅 Sent at: 2024-01-15T14:30:00.000Z
✅ Worker successfully processed the notification!
```

---

## 🔧 **Cấu hình:**

### **1. Thay đổi API URL:**
```javascript
const BASE_URL = 'http://localhost:3000'; // Local
// const BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com'; // Production
```

### **2. Thay đổi Token:**
```javascript
const TEST_TOKEN = 'your-admin-token-here';
```

---

## 📊 **API Endpoints được test:**

### **Scheduled Notifications:**
- `POST /api/noti/schedule` - Tạo thông báo theo lịch trình
- `GET /api/noti/scheduled/:id` - Lấy thông báo theo ID
- `PUT /api/noti/scheduled/:id` - Cập nhật thông báo
- `DELETE /api/noti/scheduled/:id` - Xóa thông báo
- `GET /api/noti/scheduled` - Lấy danh sách thông báo

### **Parameters:**
- `page` - Trang hiện tại
- `limit` - Số lượng item mỗi trang
- `filter` - Bộ lọc (all, pending, sent, cancelled)

---

## 🎯 **Các trường hợp test:**

### **1. Dữ liệu hợp lệ:**
```javascript
{
  title: 'Test Notification',
  message: 'This is a test notification',
  type: 'scheduled',
  sendAt: '2024-01-16T09:00:00.000Z',
  recipients: { type: 'all' }
}
```

### **2. Dữ liệu không hợp lệ:**
```javascript
// Past date
sendAt: '2024-01-14T09:00:00.000Z'

// Missing title
{ message: 'Test', sendAt: '2024-01-16T09:00:00.000Z' }

// Invalid recipient type
recipients: { type: 'invalid' }
```

---

## 🔍 **Troubleshooting:**

### **1. Authentication Error:**
```
❌ Error: Unauthorized
```
**Giải pháp:** Kiểm tra lại token trong `TEST_TOKEN`

### **2. Network Error:**
```
❌ Error: Network Error
```
**Giải pháp:** Kiểm tra kết nối mạng và API URL

### **3. Validation Error:**
```
❌ Error: Thời gian gửi phải trong tương lai
```
**Giải pháp:** Đây là lỗi mong đợi trong test validation

### **4. Worker Not Processing:**
```
⚠️ Worker has not processed the notification yet
```
**Giải pháp:** Kiểm tra worker có đang chạy không

---

## 📝 **Ví dụ chạy test:**

### **Chạy tất cả tests:**
```bash
node test-scheduled-notifications.js --all
```

**Kết quả:**
```
⏰ SCHEDULED NOTIFICATIONS TEST SUITE
=====================================
🌐 API URL: http://localhost:3000

🧪 Testing Scheduled Notification CRUD Operations...
✅ Scheduled notification created successfully
✅ Scheduled notification retrieved successfully
✅ Scheduled notification updated successfully
✅ All scheduled notifications retrieved
✅ Scheduled notification deleted successfully

⏰ Testing Different Scheduled Notification Types...
✅ Immediate notification created successfully
✅ Tomorrow morning notification created successfully
✅ Next week notification created successfully

👥 Testing Scheduled Notification Recipients...
✅ All Users notification created successfully
✅ Specific User notification created successfully
✅ Multiple Users notification created successfully

🔍 Testing Scheduled Notification Filters...
✅ All filter: 8 notifications found
✅ Pending filter: 6 notifications found
✅ Sent filter: 2 notifications found
✅ Cancelled filter: 0 notifications found

✅ Testing Scheduled Notification Validation...
✅ Past date failed as expected
✅ Missing title failed as expected
✅ Missing message failed as expected
✅ Invalid recipient type failed as expected

📦 Testing Scheduled Notification Bulk Operations...
✅ Created 5 notifications successfully
✅ Found 13 scheduled notifications
✅ Cleaned up all test notifications

⚙️ Testing Scheduled Notification Worker...
✅ Worker test notification created successfully
⏰ Notification scheduled for: 1/15/2024, 2:30:00 PM
🔄 The worker should process this notification automatically
⏳ Waiting 3 minutes to check if worker processed the notification...
✅ Worker successfully processed the notification!

🎉 All tests completed successfully!
```

---

## 🎉 **Kết quả:**

✅ **Script test hoàn chỉnh** để kiểm tra toàn bộ chức năng thông báo theo thời gian  
✅ **7 loại test khác nhau** bao phủ tất cả tính năng  
✅ **Validation đầy đủ** cho dữ liệu đầu vào  
✅ **Worker testing** để kiểm tra xử lý tự động  
✅ **Bulk operations** để test hiệu suất  
✅ **Error handling** và troubleshooting  

**🚀 Script test đã sẵn sàng để kiểm tra chức năng thông báo theo thời gian!**

