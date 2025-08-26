# 📱 Notification Templates Management System

## 🎯 Tổng quan

Hệ thống quản lý Notification Templates cho ứng dụng Shelf Stacker Admin, cho phép tạo, chỉnh sửa và quản lý các template thông báo cho các sự kiện khác nhau trong hệ thống.

## 🚀 Tính năng chính

### 1. **Quản lý Templates**
- ✅ Tạo template mới
- ✅ Chỉnh sửa template hiện có
- ✅ Xóa template
- ✅ Kích hoạt/vô hiệu hóa template
- ✅ Upload hình ảnh cho template

### 2. **Filtering & Search**
- 🔍 Tìm kiếm theo tên, event, type
- 🏷️ Lọc theo loại (User, Shipper, Both)
- 📊 Lọc theo trạng thái (Active, Inactive)

### 3. **Event Management**
- 📋 Xem tổng quan các events
- 🎯 Phân loại events theo User/Shipper/Both
- 📝 Quản lý variables cho từng event

### 4. **Testing & Preview**
- 🧪 Test template với dữ liệu mẫu
- 👀 Preview notification trước khi gửi
- 📤 Gửi test notification

### 5. **History Tracking**
- 📈 Xem lịch sử gửi notification
- 📅 Lọc theo ngày tháng
- 📊 Thống kê trạng thái gửi

## 🏗️ Cấu trúc Files

```
shelf-stacker-admin/
├── views/
│   └── notification-admin.html          # Giao diện chính
├── public/
│   ├── assets/
│   │   ├── css/
│   │   │   └── notification-admin.css   # Styling
│   │   └── js/
│   │       └── notification-admin.js    # JavaScript logic
└── NOTIFICATION_TEMPLATES_GUIDE.md      # Hướng dẫn này
```

## 🎨 Giao diện

### **Sidebar Navigation**
```
📱 Notification Management
├── 📋 Templates List
├── ➕ Create Template  
├── 📊 Events Overview
└── 📈 Notification History
```

### **Main Sections**

#### 1. **Templates List**
- Bảng hiển thị tất cả templates
- Filter và search
- Actions: Edit, Toggle, Delete

#### 2. **Events Overview**
- Grid layout với 3 loại events
- User Events, Shipper Events, Both Events
- Mô tả chi tiết từng event

#### 3. **Notification History**
- Lịch sử gửi notification
- Filter theo ngày và event type
- Chi tiết trạng thái gửi

## 🔧 API Endpoints

### **Templates Management**
```javascript
// Lấy danh sách templates
GET /api/notification-templates

// Tạo template mới
POST /api/notification-templates
Content-Type: multipart/form-data
{
  event: "login_success",
  type: "user", 
  title: "🎉 Chào mừng trở lại!",
  message: "Xin chào {{username}}...",
  imageFile: [file],
  active: true
}

// Cập nhật template
PUT /api/notification-templates/:id
{
  event: "login_success",
  type: "user",
  title: "🎉 Chào mừng trở lại!",
  message: "Xin chào {{username}}...",
  active: true
}

// Toggle active status
PATCH /api/notification-templates/:id
{
  active: false
}

// Xóa template
DELETE /api/notification-templates/:id
```

### **Test Notification**
```javascript
// Gửi test notification
POST /api/noti/send-event
{
  event: "login_success",
  userId: "test_user_123",
  data: {
    username: "Test User",
    login_time: "2024-01-15 14:30:00"
  }
}
```

## 📝 Event Types & Variables

### **User Events**
| Event | Variables | Description |
|-------|-----------|-------------|
| `login_success` | `username`, `login_time`, `device_info` | Đăng nhập thành công |
| `order_success` | `order_id`, `total_amount`, `username`, `delivery_address`, `order_date` | Đặt hàng thành công |
| `payment_success` | `order_id`, `payment_method`, `amount`, `username`, `payment_date` | Thanh toán thành công |
| `delivery_success` | `order_id`, `shipper_name`, `delivery_time`, `tracking_number` | Giao hàng thành công |
| `email_verified` | `username`, `email`, `verification_date` | Xác thực email |

### **Shipper Events**
| Event | Variables | Description |
|-------|-----------|-------------|
| `order_success` | `order_id`, `delivery_address`, `total_amount` | Đơn hàng mới chờ lấy |
| `delivery_success` | `order_id`, `delivery_time`, `tracking_number` | Giao hàng thành công |
| `rating_received` | `order_id`, `rating`, `comment`, `username` | Nhận đánh giá |

### **Both Events**
| Event | Variables | Description |
|-------|-----------|-------------|
| `order_status_change` | `order_id`, `old_status`, `new_status`, `username` | Thay đổi trạng thái đơn hàng |
| `payment_failed` | `order_id`, `payment_method`, `error_message`, `username` | Thanh toán thất bại |
| `delivery_failed` | `order_id`, `shipper_name`, `failure_reason`, `username` | Giao hàng thất bại |

## 🎯 Cách sử dụng

### **1. Tạo Template mới**
1. Click "➕ Add New Template"
2. Chọn Event và Type
3. Nhập Title và Message
4. Sử dụng variables với cú pháp `{{variable_name}}`
5. Upload hình ảnh (tùy chọn)
6. Click "💾 Save"

### **2. Chỉnh sửa Template**
1. Click nút "✏️ Edit" trên template
2. Thay đổi thông tin cần thiết
3. Click "💾 Save"

### **3. Test Template**
1. Mở template cần test
2. Click "🧪 Test Template"
3. Nhập User ID (tùy chọn)
4. Xem preview
5. Click "📤 Send Test"

### **4. Filter Templates**
- Sử dụng dropdown "Type" để lọc theo loại
- Sử dụng dropdown "Status" để lọc theo trạng thái
- Sử dụng ô "Search" để tìm kiếm

## 🎨 Styling & Responsive

### **Color Scheme**
- Primary: `#667eea` to `#764ba2` (gradient)
- Success: `#28a745`
- Warning: `#ffc107`
- Danger: `#dc3545`
- Info: `#17a2b8`

### **Responsive Breakpoints**
- Desktop: `> 768px`
- Tablet: `768px - 480px`
- Mobile: `< 480px`

### **Animations**
- Fade in/out cho sections
- Slide in cho modals
- Hover effects cho buttons và cards
- Loading spinners

## 🔒 Security & Validation

### **Form Validation**
- Required fields validation
- File size limit (5MB cho images)
- Character limits (100 cho title, 500 cho message)
- File type validation (images only)

### **Error Handling**
- Network error handling
- API error responses
- User-friendly error messages
- Loading states

## 📊 Performance

### **Optimizations**
- Lazy loading cho images
- Debounced search
- Efficient DOM manipulation
- Minimal API calls

### **Caching**
- Template data caching
- Event listeners optimization
- DOM query caching

## 🚀 Deployment

### **Requirements**
- Node.js server
- Static file serving
- API endpoints implementation
- Database connection

### **Setup Steps**
1. Copy files vào thư mục project
2. Cấu hình routes trong `app.js`
3. Implement API endpoints
4. Test functionality
5. Deploy to production

## 🐛 Troubleshooting

### **Common Issues**

#### **1. Templates không load**
- Kiểm tra API endpoint `/api/notification-templates`
- Kiểm tra network connection
- Xem console errors

#### **2. Modal không mở**
- Kiểm tra JavaScript errors
- Kiểm tra element IDs
- Kiểm tra CSS z-index

#### **3. Test notification không gửi**
- Kiểm tra API endpoint `/api/noti/send-event`
- Kiểm tra request payload
- Kiểm tra server logs

### **Debug Tips**
- Mở browser DevTools
- Kiểm tra Console tab
- Kiểm tra Network tab
- Kiểm tra Elements tab

## 📈 Future Enhancements

### **Planned Features**
- 📊 Analytics dashboard
- 📧 Email template support
- 🔔 Push notification templates
- 📱 Mobile app integration
- 🤖 AI-powered template suggestions
- 📋 Template categories
- 🔄 Template versioning
- 📤 Bulk operations

### **Technical Improvements**
- 🚀 Performance optimization
- 🔒 Enhanced security
- 📱 Better mobile experience
- 🎨 Theme customization
- 🌐 Multi-language support

## 📞 Support

Nếu gặp vấn đề hoặc cần hỗ trợ:
1. Kiểm tra documentation này
2. Xem console errors
3. Liên hệ development team
4. Tạo issue ticket

---

**🎉 Chúc bạn sử dụng hệ thống Notification Templates hiệu quả!**

