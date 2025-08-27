# 🚨 Notification Sender Tool Guide

## 📋 **Tổng quan**

Script `send-all-notification.js` cho phép gửi notification đến:
- **👤 User cụ thể** - Gửi cho 1 user
- **👥 Nhiều users** - Gửi cho nhiều users cùng lúc  
- **🌍 Tất cả users** - Gửi cho toàn bộ hệ thống

---

## 🚀 **Cách sử dụng:**

### **1. Gửi Urgent Notification**

#### **Gửi cho tất cả users:**
```bash
node send-all-notification.js --urgent-all
```

#### **Gửi cho user cụ thể:**
```bash
node send-all-notification.js --urgent-user 68aad2cd5a2b85fef2e23a74
```

#### **Gửi cho nhiều users:**
```bash
node send-all-notification.js --urgent-multiple "68aad2cd5a2b85fef2e23a74,68aad2cd5a2b85fef2e23a75,68aad2cd5a2b85fef2e23a76"
```

### **2. Gửi các loại notification khác**

#### **Maintenance Notification:**
```bash
node send-all-notification.js --maintenance
```

#### **Promotion Notification:**
```bash
node send-all-notification.js --promotion
```

#### **Marketing Notification:**
```bash
node send-all-notification.js --marketing
```

### **3. Interactive Mode (Tùy chỉnh)**
```bash
node send-all-notification.js --custom
```

---

## 🔧 **Các hàm chính:**

### **1. Gửi cho User cụ thể:**
```javascript
const { sendUrgentToUser } = require('./send-all-notification.js');

// Gửi urgent notification cho user
await sendUrgentToUser(
  '68aad2cd5a2b85fef2e23a74', 
  '🚨 Thông báo khẩn cấp!', 
  'Hệ thống đang gặp sự cố kỹ thuật.'
);
```

### **2. Gửi cho nhiều Users:**
```javascript
const { sendUrgentToMultipleUsers } = require('./send-all-notification.js');

// Gửi urgent notification cho nhiều users
await sendUrgentToMultipleUsers(
  ['68aad2cd5a2b85fef2e23a74', '68aad2cd5a2b85fef2e23a75'],
  '🚨 Thông báo khẩn cấp!', 
  'Hệ thống đang gặp sự cố kỹ thuật.'
);
```

### **3. Gửi cho tất cả Users:**
```javascript
const { sendUrgentToAllUsers } = require('./send-all-notification.js');

// Gửi urgent notification cho tất cả users
await sendUrgentToAllUsers(
  '🚨 Thông báo khẩn cấp!', 
  'Hệ thống đang gặp sự cố kỹ thuật.'
);
```

---

## 📊 **Các loại Notification:**

### **1. Urgent Notification**
- **Type**: `urgent`
- **Priority**: `high`
- **Use case**: Sự cố hệ thống, thông báo khẩn cấp

### **2. System Notification**
- **Type**: `system`
- **Category**: `system`
- **Use case**: Bảo trì, cập nhật hệ thống

### **3. Marketing Notification**
- **Type**: `marketing`
- **Category**: `marketing`
- **Use case**: Quảng cáo, thông báo sản phẩm mới

### **4. Promotion Notification**
- **Type**: `promotion`
- **Category**: `promotion`
- **Use case**: Khuyến mãi, giảm giá

### **5. Maintenance Notification**
- **Type**: `system`
- **Category**: `maintenance`
- **Use case**: Bảo trì hệ thống

---

## 🎯 **Interactive Mode:**

Khi chạy `--custom`, script sẽ hỏi:

1. **Chọn target:**
   - 1. Specific User (User cụ thể)
   - 2. Multiple Users (Nhiều users)
   - 3. All Users (Tất cả users)

2. **Chọn loại notification:**
   - 1. Urgent (Khẩn cấp)
   - 2. System (Hệ thống)
   - 3. Marketing (Quảng cáo)
   - 4. Promotion (Khuyến mãi)
   - 5. Maintenance (Bảo trì)

3. **Nhập thông tin:**
   - Title (Tiêu đề)
   - Message (Nội dung)
   - Image URL (Hình ảnh, tùy chọn)
   - User ID(s) (nếu chọn user cụ thể)

---

## 📝 **Ví dụ sử dụng:**

### **Ví dụ 1: Gửi urgent cho user cụ thể**
```bash
node send-all-notification.js --urgent-user 68aad2cd5a2b85fef2e23a74
```

**Kết quả:**
```
🚨 SEND NOTIFICATION TOOL
=========================
🌐 API URL: http://localhost:3000

👤 Sending notification to user: 68aad2cd5a2b85fef2e23a74
📋 Title: 🚨 Thông báo khẩn cấp!
📋 Message: Hệ thống đang gặp sự cố kỹ thuật.
📋 Type: urgent
✅ Notification sent to user successfully!
```

### **Ví dụ 2: Gửi urgent cho tất cả users**
```bash
node send-all-notification.js --urgent-all
```

**Kết quả:**
```
🚨 SEND NOTIFICATION TOOL
=========================
🌐 API URL: http://localhost:3000

🌍 Sending notification to ALL users...
📋 Title: 🚨 Thông báo khẩn cấp!
📋 Message: Hệ thống đang gặp sự cố kỹ thuật.
📋 Type: urgent
✅ Notification sent to all users successfully!
```

### **Ví dụ 3: Interactive mode**
```bash
node send-all-notification.js --custom
```

**Kết quả:**
```
🚨 CUSTOM NOTIFICATION SENDER
=============================
Choose target:
1. Specific User
2. Multiple Users
3. All Users
Enter choice (1-3): 1

Choose notification type:
1. Urgent
2. System
3. Marketing
4. Promotion
5. Maintenance
Enter choice (1-5): 1

Enter notification title: 🚨 Test Notification
Enter notification message: This is a test notification
Enter image URL (optional, press Enter to skip): 
Enter user ID: 68aad2cd5a2b85fef2e23a74

👤 Sending notification to user: 68aad2cd5a2b85fef2e23a74
📋 Title: 🚨 Test Notification
📋 Message: This is a test notification
📋 Type: urgent
✅ Notification sent to user successfully!
✅ Custom notification sent successfully!
```

---

## ⚙️ **Cấu hình:**

### **1. Thay đổi API URL:**
```javascript
const BASE_URL = 'http://localhost:3000'; // Local
// const BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com'; // Production
```

### **2. Thay đổi Token:**
```javascript
const TEST_TOKEN = 'your-admin-token-here';
```

### **3. Thay đổi Template mặc định:**
```javascript
const notificationTemplates = {
  urgent: {
    title: '🚨 Thông báo khẩn cấp!',
    message: 'Hệ thống đang gặp sự cố kỹ thuật. Vui lòng thử lại sau 30 phút.',
    type: 'urgent'
  },
  // Thêm template khác...
};
```

---

## 🔍 **Troubleshooting:**

### **1. Rate Limit Error:**
```
⚠️ Rate limit exceeded. Please wait 30 seconds before sending another notification.
```
**Giải pháp:** Đợi 30 giây trước khi gửi notification tiếp theo.

### **2. Authentication Error:**
```
❌ Error sending notification: Unauthorized
```
**Giải pháp:** Kiểm tra lại token trong `TEST_TOKEN`.

### **3. User Not Found:**
```
❌ Failed to send notification: User not found
```
**Giải pháp:** Kiểm tra lại User ID có tồn tại không.

### **4. Network Error:**
```
❌ Error sending notification: Network Error
```
**Giải pháp:** Kiểm tra kết nối mạng và API URL.

---

## 📋 **Tất cả lệnh có sẵn:**

```bash
# Urgent notifications
node send-all-notification.js --urgent-all                    # Gửi urgent cho tất cả
node send-all-notification.js --urgent-user <userId>          # Gửi urgent cho user cụ thể
node send-all-notification.js --urgent-multiple <userIds>     # Gửi urgent cho nhiều users

# Other notifications
node send-all-notification.js --maintenance                   # Gửi maintenance cho tất cả
node send-all-notification.js --promotion                     # Gửi promotion cho tất cả
node send-all-notification.js --marketing                     # Gửi marketing cho tất cả

# Interactive mode
node send-all-notification.js --custom                        # Chế độ tương tác
```

---

## 🎉 **Kết quả:**

✅ **Script hoàn chỉnh** để gửi notification cho user urgent và gửi tất cả  
✅ **Hỗ trợ 3 target types**: User cụ thể, nhiều users, tất cả users  
✅ **5 loại notification**: Urgent, System, Marketing, Promotion, Maintenance  
✅ **Interactive mode** để tùy chỉnh dễ dàng  
✅ **Error handling** và rate limiting  
✅ **Documentation đầy đủ** cho việc sử dụng  

**🚀 Script đã sẵn sàng sử dụng!**

