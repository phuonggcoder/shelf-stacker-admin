# Hệ thống Email Verification với URL - Shelf Stacker

## 📧 Tổng quan

Hệ thống email verification với URL cho phép user xác thực tài khoản bằng cách click vào link trong email thay vì nhập mã OTP. Điều này tăng tính tiện lợi và bảo mật cho người dùng.

## 🚀 Tính năng chính

### ✅ **URL Verification thay vì OTP**
- Tạo token ngẫu nhiên 64 ký tự
- URL có thời hạn 24 giờ
- Một lần sử dụng (single-use)
- Tự động xóa sau khi hết hạn

### ✅ **Các loại verification**
- **Registration**: Xác thực khi đăng ký tài khoản
- **Email Change**: Xác thực khi thay đổi email
- **Email Verification**: Xác thực email chung
- **Reminder**: Nhắc nhở xác thực

### ✅ **Email Templates đẹp**
- Design responsive
- Nút click trực tiếp
- Link copy thủ công
- Thông tin chi tiết

### ✅ **Admin Features**
- **Tự động xác thực**: Admin có thể xác thực email cho user
- **Bulk verification**: Xác thực nhiều user cùng lúc
- **Quản lý users**: Xem danh sách users chưa xác thực
- **Gửi email**: Admin có thể gửi email xác thực cho user

## 📁 Cấu trúc Files

### 1. Backend Files
```
services/
├── emailService.js          # Email service với nodemailer
├── emailVerification.js     # Email verification logic

models/
├── emailVerification.js     # MongoDB schema

routes/
├── emailVerification.js     # API endpoints

middleware/
├── auth.js                  # Authentication middleware
```

### 2. Frontend Files
```
public/assets/js/
├── email-verification.js    # Frontend logic
├── admin-email-verification.js # Admin functions

views/
├── email-verification.html  # User verification page
├── admin-email-verification.html # Admin dashboard
```

## 🔧 API Endpoints

### User Endpoints
```http
POST /api/email-verification/send-verification
POST /api/email-verification/verify
POST /api/email-verification/send-reminder
GET  /api/email-verification/status
POST /api/email-verification/resend
```

### Admin Endpoints
```http
POST /api/email-verification/admin/verify-user-email
POST /api/email-verification/admin/verify-multiple-users
GET  /api/email-verification/admin/unverified-users
POST /api/email-verification/admin/send-verification
```

## 📊 Database Schema

### EmailVerification Model
```javascript
{
  userId: ObjectId,        // ID của user
  email: String,           // Email cần xác thực
  token: String,           // Token ngẫu nhiên 64 ký tự
  type: String,            // Loại verification
  purpose: String,         // Mục đích verification
  isUsed: Boolean,         // Đã sử dụng chưa
  expiresAt: Date,         // Thời gian hết hạn
  createdAt: Date          // Thời gian tạo
}
```

### User Model Updates
```javascript
{
  // ... existing fields
  isEmailVerified: Boolean,    // Email đã xác thực chưa
  emailVerifiedAt: Date        // Thời gian xác thực email
}
```

## 🎨 Email Templates

### Registration Email
```html
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
  <h1>Shelf Stacker</h1>
  <p>Hoàn tất đăng ký tài khoản</p>
</div>
<div>
  <h2>Xin chào {username}!</h2>
  <p>Cảm ơn bạn đã đăng ký tài khoản Shelf Stacker! 
     Vui lòng nhấn vào nút bên dưới để xác thực email và hoàn tất quá trình đăng ký.</p>
  
  <a href="{verificationUrl}" style="background: #667eea; color: white; padding: 15px 40px;">
    Xác thực Email
  </a>
  
  <p><strong>Hoặc copy link này vào trình duyệt:</strong><br>
     <a href="{verificationUrl}">{verificationUrl}</a></p>
  
  <p>Link này sẽ hết hạn sau <strong>24 giờ</strong>.</p>
</div>
```

### Reminder Email
```html
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
  <h1>Shelf Stacker</h1>
  <p>Nhắc nhở xác thực</p>
</div>
<div>
  <h2>Xin chào {username}!</h2>
  <p>Chúng tôi nhận thấy bạn chưa xác thực email cho tài khoản Shelf Stacker. 
     Để có thể sử dụng đầy đủ các tính năng, vui lòng xác thực email của bạn.</p>
  
  <div style="background: #fff3cd;">
    <p><strong>Lợi ích khi xác thực email:</strong></p>
    <ul>
      <li>Bảo mật tài khoản tốt hơn</li>
      <li>Nhận thông báo quan trọng</li>
      <li>Khôi phục mật khẩu dễ dàng</li>
      <li>Sử dụng đầy đủ tính năng</li>
    </ul>
  </div>
  
  <a href="{verificationUrl}" style="background: #667eea; color: white; padding: 15px 40px;">
    Xác thực Email ngay
  </a>
</div>
```

## 🔐 Security Features

### Token Security
- **Random 64 bytes**: Sử dụng `crypto.randomBytes(32)`
- **Single-use**: Token chỉ sử dụng được 1 lần
- **Time-limited**: Hết hạn sau 24 giờ
- **Auto-cleanup**: Tự động xóa token hết hạn

### Admin Security
- **Role-based access**: Chỉ admin mới có quyền truy cập
- **Audit logging**: Log tất cả hành động của admin
- **Input validation**: Validate tất cả input từ admin
- **Rate limiting**: Giới hạn số request từ admin

## 🛠️ Implementation Steps

### 1. Backend Setup
```bash
# Install dependencies
npm install nodemailer crypto

# Create service files
touch services/emailService.js
touch services/emailVerification.js

# Create model files
touch models/emailVerification.js

# Create route files
touch routes/emailVerification.js
```

### 2. Frontend Setup
```bash
# Create frontend files
touch public/assets/js/email-verification.js
touch public/assets/js/admin-email-verification.js

# Create view files
touch views/email-verification.html
touch views/admin-email-verification.html
```

### 3. Environment Variables
```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Frontend URL
FRONTEND_URL=https://shelfstacker.com

# Database
MONGODB_URI=mongodb://localhost:27017/shelfstacker
```

## 📱 Frontend Integration

### User Verification Page
```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xác thực Email - Shelf Stacker</title>
    <link rel="stylesheet" href="/assets/css/styles.css">
</head>
<body>
    <div class="verification-container">
        <div class="verification-card">
            <h1>Xác thực Email</h1>
            <div id="verification-status">
                <p>Đang xác thực email...</p>
            </div>
        </div>
    </div>
    <script src="/assets/js/email-verification.js"></script>
</body>
</html>
```

### Admin Dashboard
```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quản lý Email Verification - Admin</title>
    <link rel="stylesheet" href="/assets/css/admin.css">
</head>
<body>
    <div class="admin-container">
        <div class="sidebar">
            <!-- Admin navigation -->
        </div>
        <div class="main-content">
            <div class="email-verification-dashboard">
                <h1>Quản lý Email Verification</h1>
                
                <!-- Unverified Users -->
                <div class="section">
                    <h2>Users chưa xác thực email</h2>
                    <div id="unverified-users-list"></div>
                </div>
                
                <!-- Bulk Actions -->
                <div class="section">
                    <h2>Thao tác hàng loạt</h2>
                    <div id="bulk-actions"></div>
                </div>
            </div>
        </div>
    </div>
    <script src="/assets/js/admin-email-verification.js"></script>
</body>
</html>
```

## 🔄 Workflow

### User Verification Flow
1. **User đăng ký** → Tạo verification token
2. **Gửi email** → User nhận email với verification URL
3. **User click link** → Frontend gọi API verify
4. **Backend verify** → Cập nhật user status
5. **Redirect** → User được chuyển đến dashboard

### Admin Verification Flow
1. **Admin login** → Truy cập admin dashboard
2. **View unverified users** → Xem danh sách users chưa xác thực
3. **Select users** → Chọn users cần xác thực
4. **Bulk verify** → Xác thực hàng loạt
5. **Send emails** → Gửi email xác thực cho users

## 📈 Statistics & Monitoring

### Key Metrics
- **Total users**: Tổng số users
- **Verified users**: Số users đã xác thực
- **Unverified users**: Số users chưa xác thực
- **Verification rate**: Tỷ lệ xác thực
- **Email delivery rate**: Tỷ lệ gửi email thành công

### Monitoring
- **Email delivery logs**: Log tất cả email gửi
- **Verification logs**: Log tất cả verification attempts
- **Admin action logs**: Log tất cả admin actions
- **Error logs**: Log tất cả errors

## 🚨 Error Handling

### Common Errors
- **Email not sent**: Kiểm tra email configuration
- **Token expired**: Tạo token mới
- **User not found**: Validate user exists
- **Already verified**: Check verification status
- **Admin permission denied**: Check admin role

### Error Responses
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "data": {
    "field": "Additional error info"
  }
}
```

## 🔧 Testing

### Unit Tests
```bash
# Test email service
npm test services/emailService.test.js

# Test verification logic
npm test services/emailVerification.test.js

# Test API endpoints
npm test routes/emailVerification.test.js
```

### Integration Tests
```bash
# Test complete verification flow
npm test integration/emailVerification.test.js

# Test admin functionality
npm test integration/adminEmailVerification.test.js
```

## 📋 Checklist

### Backend Implementation
- [ ] Email service với nodemailer
- [ ] Email verification model
- [ ] API endpoints cho user
- [ ] API endpoints cho admin
- [ ] Authentication middleware
- [ ] Rate limiting
- [ ] Error handling
- [ ] Logging

### Frontend Implementation
- [ ] User verification page
- [ ] Admin dashboard
- [ ] Email verification logic
- [ ] Admin functions
- [ ] Error handling
- [ ] Loading states
- [ ] Success/error messages

### Security
- [ ] Token generation
- [ ] Token validation
- [ ] Admin permissions
- [ ] Input validation
- [ ] Rate limiting
- [ ] Audit logging

### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] Security tests
- [ ] Performance tests

## 🚀 Deployment

### Production Setup
```bash
# Set environment variables
export EMAIL_USER=your-production-email
export EMAIL_PASSWORD=your-production-password
export FRONTEND_URL=https://your-domain.com

# Start server
npm start
```

### Cron Jobs
```bash
# Cleanup expired tokens (daily at 2 AM)
0 2 * * * curl -X POST https://your-api.com/api/email-verification/cleanup

# Send verification reminders (weekly)
0 9 * * 1 curl -X POST https://your-api.com/api/email-verification/send-reminders
```

## 📞 Support

### Documentation
- [API Documentation](./API_DOCUMENTATION.md)
- [Email Templates](./EMAIL_TEMPLATES.md)
- [Admin Guide](./ADMIN_GUIDE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

### Contact
- **Email**: support@shelfstacker.com
- **Documentation**: https://docs.shelfstacker.com
- **GitHub Issues**: https://github.com/shelfstacker/email-verification/issues

---

**Lưu ý**: 
- Token có thời hạn 24 giờ
- Mỗi token chỉ sử dụng được 1 lần
- Tự động xóa token hết hạn
- Admin cần có role 'admin' để truy cập
- Backup email templates trước khi deploy
