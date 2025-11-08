# 🚀 Notification System - Complete Guide

## 📋 **Tổng quan**

Hệ thống notification hoàn chỉnh với 3 loại thông báo chính:
- 🔴 **Thông báo khẩn (Urgent)** - Gửi ngay lập tức
- ⏰ **Thông báo giờ (Scheduled)** - Lập lịch và gửi theo thời gian
- 🎯 **Thông báo event bằng template** - Sử dụng template động với biến

## 🚀 **Quick Start**

### **1. Cài đặt dependencies:**
```bash
npm install axios bullmq mongoose express multer cloudinary
```

### **2. Cấu hình environment:**
```bash
# .env
MONGODB_URI=mongodb://localhost:27017/notification-system
REDIS_URL=redis://localhost:6379
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
JWT_SECRET=your-jwt-secret
```

### **3. Chạy test suite:**
```bash
node test-notification-complete.js
```

### **4. Khởi động server:**
```bash
node server.cjs
```

## 📝 **API Documentation**

### **Template Management**

#### **Tạo template mới:**
```javascript
POST /api/notification-templates
{
  "name": "Order Success",
  "event": "order_success",
  "title": "Đơn hàng {{orderId}} thành công!",
  "message": "Cảm ơn bạn đã đặt hàng {{orderId}} với tổng trị giá {{amount}}đ"
}
```

#### **Lấy danh sách template:**
```javascript
GET /api/notification-templates
```

#### **Cập nhật template:**
```javascript
PUT /api/notification-templates/:id
{
  "title": "Đơn hàng {{orderId}} đã hoàn thành!",
  "message": "Đơn hàng {{orderId}} của bạn đã được xử lý thành công"
}
```

#### **Preview template:**
```javascript
POST /api/notification-templates/:id/preview
{
  "data": {
    "orderId": "ORD123456",
    "amount": "500,000"
  }
}
```

### **Send Notifications**

#### **Gửi notification khẩn:**
```javascript
POST /api/noti/send
{
  "userId": "user123",
  "title": "Thông báo khẩn cấp",
  "message": "Hệ thống bảo trì trong 30 phút",
  "type": "urgent"
}
```

#### **Gửi cho tất cả user:**
```javascript
POST /api/noti/send-all
{
  "title": "Thông báo hệ thống",
  "message": "Hệ thống sẽ bảo trì trong 30 phút",
  "type": "urgent"
}
```

#### **Lập lịch gửi notification:**
```javascript
POST /api/noti/schedule
{
  "title": "Nhắc nhở thanh toán",
  "message": "Đơn hàng của bạn chưa được thanh toán",
  "scheduledAt": "2024-12-25T10:00:00Z",
  "sendToAll": true
}
```

#### **Gửi theo template:**
```javascript
POST /api/noti/send-event
{
  "event": "order_success",
  "userId": "user123",
  "data": {
    "orderId": "ORD123456",
    "amount": "500,000"
  }
}
```

### **Specialized Notifications**

#### **Order Notifications:**
```javascript
POST /api/noti/order
{
  "userId": "user123",
  "orderId": "ORD123456",
  "orderStatus": "Delivered",
  "amount": "750,000"
}
```

#### **Payment Notifications:**
```javascript
POST /api/noti/payment
{
  "userId": "user123",
  "orderId": "ORD123456",
  "paymentStatus": "Success",
  "amount": "750,000",
  "paymentMethod": "Credit Card"
}
```

#### **Marketing Notifications:**
```javascript
POST /api/noti/marketing
{
  "title": "Khuyến mãi đặc biệt!",
  "message": "Giảm giá 50% cho tất cả sản phẩm",
  "event": "promotion_created",
  "data": {
    "discount": "50%",
    "validUntil": "2024-12-31",
    "promoCode": "SALE50"
  }
}
```

### **Analytics & Stats**

#### **Lấy thống kê:**
```javascript
GET /api/noti/stats
```

#### **Upload hình ảnh:**
```javascript
POST /api/noti/upload-image
{
  "imageUrl": "https://example.com/image.jpg",
  "type": "notification"
}
```

## 🔧 **Template Variables System**

### **Hỗ trợ 2 cú pháp:**

#### **Cú pháp 1: {{variable}}**
```javascript
"Đơn hàng {{orderId}} thành công!"
"Chào mừng {{name}} đến với {{appName}}!"
```

#### **Cú pháp 2: ${variable}**
```javascript
"Đơn hàng ${orderId} thành công!"
"Chào mừng ${name} đến với ${appName}!"
```

### **Variables tự động:**
- `{{orderId}}` → `orderId`
- `{{amount}}` → `amount`
- `{{name}}` → `name`
- `{{appName}}` → `appName`
- `{{promoCode}}` → `promoCode`

## 🧪 **Testing**

### **Chạy test suite hoàn chỉnh:**
```bash
node test-notification-complete.js
```

### **Test individual functions:**
```javascript
const { testTemplateCRUD, testUrgentNotifications } = require('./test-notification-complete');

// Test template CRUD
await testTemplateCRUD();

// Test urgent notifications
await testUrgentNotifications();
```

### **Test coverage:**
- ✅ Template CRUD operations
- ✅ Urgent notifications
- ✅ Scheduled notifications
- ✅ Template notifications
- ✅ Order notifications
- ✅ Payment notifications
- ✅ Marketing notifications
- ✅ Statistics
- ✅ Image upload

## 🔄 **Queue System**

### **BullMQ Integration:**
- `notification-queue` - Xử lý notifications thường
- `scheduled-notifications` - Xử lý notifications theo lịch
- Redis connection optimization
- Job retry và error handling

### **Queue Configuration:**
```javascript
// services/notificationQueue.js
const { Queue } = require('bullmq');

const notificationQueue = new Queue('notification-queue', {
  connection: {
    host: 'localhost',
    port: 6379
  }
});

const scheduledQueue = new Queue('scheduled-notifications', {
  connection: {
    host: 'localhost',
    port: 6379
  }
});
```

## 📊 **Database Schema**

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

## 🔐 **Security**

### **Authentication:**
```javascript
// Middleware
const auth = require('./middleware/auth');
const adminAuth = require('./middleware/adminAuth');

// Routes
router.post('/api/notification-templates', adminAuth, createTemplate);
router.get('/api/notification-templates', auth, getTemplates);
```

### **Input Validation:**
```javascript
// Validation middleware
const validateTemplate = (req, res, next) => {
  const { name, event, title, message } = req.body;
  
  if (!name || !event || !title || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  next();
};
```

## 📱 **Frontend Integration**

### **API Configuration:**
```javascript
// public/assets/js/notification-admin.js
const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

const API_ENDPOINTS = {
  TEMPLATES: '/api/notification-templates',
  SEND: '/api/noti/send',
  SCHEDULE: '/api/noti/schedule',
  STATS: '/api/noti/stats'
};
```

### **Authentication Headers:**
```javascript
const headers = {
  'Authorization': `Bearer ${getAuthToken()}`,
  'Content-Type': 'application/json'
};
```

## 🎯 **Usage Examples**

### **1. Tạo và sử dụng template:**
```javascript
// Tạo template
const template = await axios.post('/api/notification-templates', {
  name: 'Order Success',
  event: 'order_success',
  title: 'Đơn hàng {{orderId}} thành công!',
  message: 'Cảm ơn bạn đã đặt hàng {{orderId}} với tổng trị giá {{amount}}đ'
});

// Sử dụng template
await axios.post('/api/noti/send-event', {
  event: 'order_success',
  userId: 'user123',
  data: {
    orderId: 'ORD123456',
    amount: '500,000'
  }
});
```

### **2. Lập lịch notification:**
```javascript
const scheduleDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

await axios.post('/api/noti/schedule', {
  title: 'Nhắc nhở thanh toán',
  message: 'Đơn hàng của bạn chưa được thanh toán',
  scheduledAt: scheduleDate.toISOString(),
  userId: 'user123'
});
```

### **3. Gửi notification khẩn:**
```javascript
await axios.post('/api/noti/send', {
  userId: 'user123',
  title: 'Thông báo khẩn cấp',
  message: 'Hệ thống bảo trì trong 30 phút',
  type: 'urgent'
});
```

## 📞 **Troubleshooting**

### **Common Issues:**

#### **1. CORS Errors:**
```javascript
// server.cjs
app.use(cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true
}));
```

#### **2. Authentication Errors:**
- Verify token format: `Bearer <token>`
- Check token expiration
- Ensure adminAuth middleware for admin operations

#### **3. File Upload Issues:**
- Check file size limits (5MB default)
- Verify file type (images only)
- Ensure Cloudinary configuration

#### **4. API Response Errors:**
- Check response format
- Verify error handling
- Monitor server logs

### **Debug Tools:**
- Browser developer tools
- Network tab monitoring
- Console error logging
- Test page integration

## 🎉 **Deployment**

### **Production Setup:**
1. **Environment Variables:**
   ```bash
   NODE_ENV=production
   MONGODB_URI=your-production-mongodb-uri
   REDIS_URL=your-production-redis-url
   JWT_SECRET=your-production-jwt-secret
   ```

2. **SSL Configuration:**
   ```javascript
   const https = require('https');
   const fs = require('fs');
   
   const options = {
     key: fs.readFileSync('path/to/key.pem'),
     cert: fs.readFileSync('path/to/cert.pem')
   };
   
   https.createServer(options, app).listen(443);
   ```

3. **Monitoring:**
   - Setup logging (Winston/Morgan)
   - Health checks
   - Performance monitoring
   - Error tracking

## 📚 **Additional Resources**

### **Documentation:**
- [API Documentation](./NOTIFICATION_SYSTEM_COMPLETE_SUMMARY.md)
- [Test Suite](./test-notification-complete.js)
- [Frontend Integration](./NOTIFICATION_BACKEND_INTEGRATION_COMPLETE.md)

### **Support:**
- Check test results
- Review error logs
- Verify API connectivity
- Monitor queue status

---

**🎯 Hệ thống notification hoàn chỉnh với đầy đủ 3 loại thông báo (khẩn, giờ, template) và tất cả các tính năng quản lý, analytics, và security!**



