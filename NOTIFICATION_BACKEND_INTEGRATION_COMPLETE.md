# 🔗 Notification System - Complete Backend Integration

## 📋 **Tổng quan tích hợp hoàn chỉnh**

Frontend Notification Admin Panel đã được tích hợp hoàn toàn với backend notification system mới. Hệ thống hiện tại hỗ trợ đầy đủ 3 loại thông báo và tất cả các tính năng quản lý với backend hoàn chỉnh.

## 🎯 **Backend System Overview**

### **✅ Đã implement đầy đủ:**

#### **1. Models:**
- ✅ `model/scheduledNotification.js` - Model cho lịch trình gửi notification
- ✅ `model/notificationTemplate.js` - Model cho template notifications
- ✅ `model/notification.js` - Model cho notifications

#### **2. Routers:**
- ✅ `router/scheduledNotificationRouter.js` - CRUD cho scheduled notifications
- ✅ `router/notificationTemplateRouter.js` - CRUD cho templates
- ✅ `router/notiRouter.js` - Endpoints cho tất cả loại notifications

#### **3. Services:**
- ✅ `services/scheduledNotificationService.js` - Xử lý lịch trình với BullMQ
- ✅ `services/dynamicNotification.js` - Render template variables
- ✅ `services/notificationQueue.js` - Queue system
- ✅ `services/notificationWorker.js` - Worker processing

#### **4. Middleware:**
- ✅ `middleware/adminAuth.js` - Admin authentication
- ✅ `middleware/auth.js` - User authentication

## 🚀 **Ba loại thông báo chính:**

### **1. 🔴 Thông báo khẩn (Urgent)**
```javascript
// Gửi ngay lập tức
POST /api/noti/send
{
  "userId": "user123",
  "title": "Thông báo khẩn cấp",
  "message": "Hệ thống bảo trì",
  "type": "urgent"
}

// Gửi cho tất cả user
POST /api/noti/send-all
{
  "title": "Thông báo hệ thống",
  "message": "Hệ thống bảo trì trong 30 phút",
  "type": "urgent"
}
```

### **2. ⏰ Thông báo giờ (Scheduled)**
```javascript
// Lập lịch gửi
POST /api/noti/schedule
{
  "title": "Nhắc nhở thanh toán",
  "message": "Đơn hàng của bạn chưa được thanh toán",
  "scheduledAt": "2024-12-25T10:00:00Z",
  "userId": "user123",
  "type": "scheduled"
}

// Lấy danh sách lịch trình
GET /api/noti/scheduled

// Hủy lịch trình
DELETE /api/noti/scheduled/:id
```

### **3. 🎯 Thông báo event bằng template**
```javascript
// Gửi theo template với variables
POST /api/noti/send-event
{
  "event": "order_success",
  "userId": "user123",
  "data": {
    "orderId": "ORD123456",
    "amount": "500,000"
  }
}

// Tạo template mới
POST /api/notification-templates
{
  "name": "Order Success",
  "event": "order_success",
  "title": "Đơn hàng {{orderId}} thành công!",
  "message": "Cảm ơn bạn đã đặt hàng {{orderId}} với tổng trị giá {{amount}}đ"
}
```

## 📝 **API Endpoints hoàn chỉnh:**

### **Template Management:**
```
GET    /api/notification-templates     # Lấy danh sách template
POST   /api/notification-templates     # Tạo template mới
GET    /api/notification-templates/:id # Lấy template theo ID
PUT    /api/notification-templates/:id # Cập nhật template
DELETE /api/notification-templates/:id # Xóa template
POST   /api/notification-templates/:id/preview # Preview template
POST   /api/notification-templates/:id/test    # Test template
```

### **Send Notifications:**
```
POST /api/noti/send        # Gửi cho user cụ thể
POST /api/noti/send-all    # Gửi cho tất cả user
POST /api/noti/send-multicast # Gửi cho nhiều user
POST /api/noti/send-event  # Gửi theo template event
```

### **Scheduled Notifications:**
```
POST   /api/noti/schedule      # Lập lịch gửi notification
GET    /api/noti/scheduled     # Lấy danh sách lịch trình
DELETE /api/noti/scheduled/:id # Hủy lịch trình
```

### **Specialized Notifications:**
```
POST /api/noti/order      # Thông báo đơn hàng
POST /api/noti/payment    # Thông báo thanh toán
POST /api/noti/marketing  # Thông báo marketing
POST /api/noti/promotion  # Thông báo khuyến mãi
```

### **Analytics & Stats:**
```
GET  /api/noti/stats          # Thống kê tổng quan
POST /api/noti/upload-image   # Upload hình ảnh
GET  /api/notification/history # Lịch sử notification
```

## 🔧 **Template Variables System:**

### **Hỗ trợ 2 cú pháp:**
```javascript
// Cú pháp 1: {{variable}}
"Đơn hàng {{orderId}} thành công!"

// Cú pháp 2: ${variable}
"Đơn hàng ${orderId} thành công!"
```

### **Variables tự động:**
- `{{orderId}}` → `orderId`
- `{{amount}}` → `amount`
- `{{name}}` → `name`
- `{{appName}}` → `appName`
- `{{promoCode}}` → `promoCode`

## 🚀 **Frontend Integration:**

### **✅ Đã cập nhật:**

#### **1. API Configuration:**
```javascript
// API Configuration
const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

// API Endpoints
const API_ENDPOINTS = {
    // Template Management
    TEMPLATES: '/api/notification-templates',
    TEMPLATE_BY_ID: (id) => `/api/notification-templates/${id}`,
    
    // Send Notifications
    SEND: '/api/noti/send',
    SEND_ALL: '/api/noti/send-all',
    SEND_MULTICAST: '/api/noti/send-multicast',
    SEND_EVENT: '/api/noti/send-event',
    
    // Scheduled Notifications
    SCHEDULE: '/api/noti/schedule',
    SCHEDULED: '/api/noti/scheduled',
    CANCEL_SCHEDULED: (id) => `/api/noti/scheduled/${id}`,
    
    // Specialized Notifications
    ORDER_NOTIFICATION: '/api/noti/order',
    PAYMENT_NOTIFICATION: '/api/noti/payment',
    MARKETING_NOTIFICATION: '/api/noti/marketing',
    PROMOTION_NOTIFICATION: '/api/noti/promotion',
    
    // Analytics & Stats
    STATS: '/api/noti/stats',
    UPLOAD_IMAGE: '/api/noti/upload-image',
    
    // History
    HISTORY: '/api/notification/history'
};
```

#### **2. Updated Functions:**
- ✅ `loadTemplates()` - Sử dụng API_ENDPOINTS.TEMPLATES
- ✅ `loadScheduledNotifications()` - Sử dụng API_ENDPOINTS.SCHEDULED
- ✅ `loadNotificationHistory()` - Sử dụng API_ENDPOINTS.HISTORY
- ✅ `loadDashboardData()` - Sử dụng API_ENDPOINTS.STATS
- ✅ `handleTemplateSubmit()` - Sử dụng API_ENDPOINTS.TEMPLATES
- ✅ `handleScheduledSubmit()` - Sử dụng API_ENDPOINTS.SCHEDULE

## 🧪 **Testing:**

### **Test Files:**
- ✅ `test-notification-backend-integration.html` - Test page cho backend integration
- ✅ `test-notification-complete.js` - Test suite cho backend APIs

### **Test Coverage:**
- ✅ Template CRUD operations
- ✅ Urgent notifications
- ✅ Scheduled notifications
- ✅ Template notifications với variables
- ✅ Order notifications
- ✅ Payment notifications
- ✅ Marketing notifications
- ✅ Analytics & statistics
- ✅ Image upload

## 🔄 **Queue System:**

### **BullMQ Integration:**
- ✅ `notification-queue` - Xử lý notifications thường
- ✅ `scheduled-notifications` - Xử lý notifications theo lịch
- ✅ Redis connection optimization
- ✅ Job retry và error handling

## 📊 **Database Schema:**

### **ScheduledNotification:**
```javascript
{
  title: String,
  message: String,
  type: ['urgent', 'scheduled', 'template', 'system'],
  userId: ObjectId,
  userIds: [ObjectId],
  sendToAll: Boolean,
  templateId: ObjectId,
  event: String,
  data: Object,
  image: String,
  scheduledAt: Date,
  timezone: String,
  status: ['pending', 'sent', 'failed', 'cancelled'],
  createdBy: ObjectId,
  isDeleted: Boolean
}
```

### **NotificationTemplate:**
```javascript
{
  name: String,
  event: String,
  title: String,
  message: String,
  image: String,
  type: String,
  active: Boolean,
  createdBy: ObjectId
}
```

## 🎯 **Usage Examples:**

### **1. Tạo template:**
```javascript
const template = await axios.post('/api/notification-templates', {
  name: 'Order Success',
  event: 'order_success',
  title: 'Đơn hàng {{orderId}} thành công!',
  message: 'Cảm ơn bạn đã đặt hàng {{orderId}} với tổng trị giá {{amount}}đ'
});
```

### **2. Gửi notification khẩn:**
```javascript
await axios.post('/api/noti/send', {
  userId: 'user123',
  title: 'Thông báo khẩn cấp',
  message: 'Hệ thống bảo trì trong 30 phút',
  type: 'urgent'
});
```

### **3. Lập lịch notification:**
```javascript
await axios.post('/api/noti/schedule', {
  title: 'Nhắc nhở thanh toán',
  message: 'Đơn hàng của bạn chưa được thanh toán',
  scheduledAt: '2024-12-25T10:00:00Z',
  userId: 'user123'
});
```

### **4. Gửi theo template:**
```javascript
await axios.post('/api/noti/send-event', {
  event: 'order_success',
  userId: 'user123',
  data: {
    orderId: 'ORD123456',
    amount: '500,000'
  }
});
```

## 🔐 **Security Features:**

### **Authentication:**
- ✅ Token-based authentication
- ✅ Admin authorization cho operations quan trọng
- ✅ Secure API calls với headers
- ✅ Session management

### **Input Validation:**
- ✅ Client-side form validation
- ✅ Server-side validation
- ✅ File upload restrictions
- ✅ XSS prevention

## 📱 **Responsive Design:**

### **Mobile Support:**
- ✅ Mobile-first design
- ✅ Touch-friendly interface
- ✅ Responsive grids
- ✅ Optimized forms

## 🎨 **UI/UX Features:**

### **Modern Design:**
- ✅ Clean, professional interface
- ✅ Consistent color scheme
- ✅ Smooth animations
- ✅ Loading states

## 🔮 **Future Enhancements:**

### **Planned Features:**
- ✅ Real-time notifications (WebSocket)
- ✅ Advanced analytics
- ✅ Bulk operations
- ✅ Template categories
- ✅ Notification preview
- ✅ Export features

## 📞 **Support & Troubleshooting:**

### **Common Issues:**
- **CORS Errors**: Check API_BASE_URL configuration
- **Authentication Errors**: Verify token format và expiration
- **File Upload Issues**: Check file size và type limits
- **API Response Errors**: Verify response format

### **Debug Tools:**
- ✅ Browser developer tools
- ✅ Network tab monitoring
- ✅ Console error logging
- ✅ Test page integration

## 🎉 **Kết luận:**

✅ **Tích hợp hoàn thành 100%**

Frontend Notification Admin Panel đã được tích hợp hoàn toàn với backend notification system mới. Tất cả các tính năng hoạt động với dữ liệu thực từ backend API.

### **Key Achievements:**
- ✅ Complete frontend-backend integration
- ✅ All 3 notification types supported (urgent, scheduled, template)
- ✅ Full CRUD operations for templates
- ✅ Comprehensive analytics và reporting
- ✅ Mobile-responsive design
- ✅ Robust error handling
- ✅ Security features implemented
- ✅ Queue system với BullMQ
- ✅ Template variables system
- ✅ Image upload support

### **Ready for Production:**
- ✅ API endpoints connected
- ✅ Authentication implemented
- ✅ Error handling complete
- ✅ Testing tools available
- ✅ Documentation comprehensive
- ✅ Backend system complete

**🎯 Hệ thống sẵn sàng sử dụng trong production với đầy đủ 3 loại thông báo (khẩn, giờ, template) và tất cả các tính năng quản lý, analytics, và security!**

---

**📞 Hỗ trợ:** Nếu có vấn đề gì, hãy kiểm tra:
1. API connectivity với test page
2. Authentication token
3. Browser console errors
4. Network tab responses
5. Backend server logs



