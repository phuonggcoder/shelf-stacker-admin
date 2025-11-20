# 🔧 Email Service Render.com Fix - Complete Guide

## 📋 Tổng Quan

Tài liệu này mô tả các cải tiến đã được áp dụng để fix vấn đề **Connection Timeout (ETIMEDOUT)** khi gửi email qua Gmail SMTP trên Render.com.

## 🚨 Vấn Đề Ban Đầu

- **Lỗi:** `Connection timeout (ETIMEDOUT)` khi gửi email
- **Nguyên nhân:**
  - Render.com có thể chặn port 465 (SSL)
  - Network/firewall issues trên Render.com
  - Connection pooling gây vấn đề
  - Timeout quá ngắn

## ✅ Các Cải Tiến Đã Áp Dụng

### 1. **Chuyển từ Port 465 (SSL) sang Port 587 (TLS)**

#### **Trước:**
```javascript
port: 465,
secure: true
```

#### **Sau:**
```javascript
port: 587,
secure: false,
requireTLS: true
```

**Lợi ích:**
- ✅ Port 587 (TLS) ít bị chặn hơn port 465 (SSL)
- ✅ Port 587 thường được allow trên hầu hết hosting providers
- ✅ TLS (STARTTLS) hoạt động tốt hơn trên Render.com

**Cấu hình:**
```env
EMAIL_USE_PORT_587=true  # Default: true
```

### 2. **Tăng Timeout**

#### **Trước:**
```javascript
connectionTimeout: 60000,  // 60 seconds
greetingTimeout: 30000,     // 30 seconds
socketTimeout: 60000,       // 60 seconds
```

#### **Sau:**
```javascript
connectionTimeout: 100000, // 100 seconds
greetingTimeout: 60000,    // 60 seconds
socketTimeout: 100000,     // 100 seconds
```

**Lợi ích:**
- ✅ Đủ thời gian cho connection trên Render.com
- ✅ Giảm thiểu timeout errors
- ✅ Phù hợp với network latency trên cloud hosting

### 3. **Disable Connection Pooling**

#### **Trước:**
```javascript
pool: true,
maxConnections: 1,
maxMessages: 3
```

#### **Sau:**
```javascript
pool: false
```

**Lợi ích:**
- ✅ Tránh vấn đề với connection pooling trên Render.com
- ✅ Mỗi request tạo connection mới sẽ đáng tin cậy hơn
- ✅ Tránh connection reuse issues

### 4. **Thêm Retry Logic**

#### **Trước:**
```javascript
const result = await this.transporter.sendMail(mailOptions);
```

#### **Sau:**
```javascript
const maxRetries = 3;
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    const result = await Promise.race([
      this.transporter.sendMail(mailOptions),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email send timeout after 90 seconds')), 90000)
      )
    ]);
    return result;
  } catch (error) {
    if (attempt < maxRetries) {
      const delay = attempt * 3000; // 3s, 6s, 9s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

**Lợi ích:**
- ✅ Tự động retry khi connection timeout
- ✅ Retry với delay tăng dần (3s, 6s, 9s)
- ✅ Logs chi tiết về mỗi lần retry
- ✅ Timeout 90 giây cho mỗi attempt

### 5. **Skip Verification khi Production**

#### **Trước:**
```javascript
this.transporter.verify((error, success) => {
  // Always verify
});
```

#### **Sau:**
```javascript
const skipVerification = 
  process.env.SKIP_EMAIL_VERIFICATION === 'true' || 
  process.env.NODE_ENV === 'production';

if (!skipVerification) {
  this.transporter.verify((error, success) => {
    // Verify only in development
  });
}
```

**Lợi ích:**
- ✅ Tránh timeout khi khởi động server trên Render.com
- ✅ Verification sẽ được thực hiện khi gửi email thực tế
- ✅ Không ảnh hưởng đến chức năng gửi email

## 📋 Cấu Hình Environment Variables

### **Render.com Environment Variables:**

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Email Port Configuration (optional, default: true)
EMAIL_USE_PORT_587=true

# Skip Email Verification (optional, recommended for production)
SKIP_EMAIL_VERIFICATION=true

# Frontend URL (for verification links)
FRONTEND_URL=https://shelfstacker.com

# Node Environment
NODE_ENV=production
```

### **Giải Thích:**

- **`EMAIL_USE_PORT_587`**: 
  - `true` (default): Sử dụng port 587 (TLS) - **Khuyến nghị**
  - `false`: Sử dụng port 465 (SSL) - Không khuyến nghị trên Render.com

- **`SKIP_EMAIL_VERIFICATION`**: 
  - `true`: Skip verification khi khởi động - **Khuyến nghị cho production**
  - `false`: Verify khi khởi động - Có thể timeout trên Render.com

- **`FRONTEND_URL`**: 
  - URL của frontend application
  - Dùng để tạo verification links trong email

## 🧪 Testing

### **1. Test Local:**

```bash
# Test với port 587 (TLS)
EMAIL_USE_PORT_587=true node test-email-service.js your-email@example.com

# Test với port 465 (SSL)
EMAIL_USE_PORT_587=false node test-email-service.js your-email@example.com
```

### **2. Test trên Render.com:**

1. **Deploy code mới**
2. **Kiểm tra logs khi server khởi động:**

```
📧 [EmailService] Email transporter config: {
  port: 587,
  secure: false,
  useTLS: true,
  host: 'smtp.gmail.com'
}
⚠️ [EmailService] Skipping transporter verification (SKIP_EMAIL_VERIFICATION=true or production mode)
📧 [EmailService] Transporter will be verified on first email send
```

3. **Test gửi email và kiểm tra logs:**

```
📧 [EmailService] Attempting to send email (attempt 1/3)...
📧 [EmailService] Mail options: {
  from: '...',
  to: '...',
  subject: '...',
  hasHtml: true,
  port: 587,
  secure: false
}
✅ [EmailService] OTP email sent successfully: {
  messageId: '...',
  response: '...',
  accepted: [...],
  rejected: [],
  attempt: 1
}
```

### **3. Test Retry Logic:**

Nếu có lỗi timeout, bạn sẽ thấy:

```
❌ [EmailService] Error sending OTP email (attempt 1/3): {
  message: 'Connection timeout',
  code: 'ETIMEDOUT'
}
⏳ [EmailService] Retrying in 3000ms...
📧 [EmailService] Attempting to send email (attempt 2/3)...
```

## 🔍 Troubleshooting

### **Vấn đề 1: Vẫn bị timeout với port 587**

**Triệu chứng:**
```
❌ [EmailService] Error sending OTP email: {
  code: 'ETIMEDOUT',
  message: 'Connection timeout'
}
```

**Giải pháp:**
1. Kiểm tra firewall trên Render.com
2. Kiểm tra network connectivity
3. Thử tăng timeout lên 120 giây
4. Kiểm tra Gmail account không bị khóa
5. Kiểm tra App Password có đúng không

### **Vấn đề 2: Connection refused**

**Triệu chứng:**
```
❌ [EmailService] Error sending OTP email: {
  code: 'ECONNECTION',
  message: 'Connection refused'
}
```

**Giải pháp:**
1. Kiểm tra `EMAIL_USER` và `EMAIL_PASSWORD` có đúng không
2. Kiểm tra App Password có đúng không
3. Kiểm tra Gmail account có bật "Less secure app access" không
4. Thử tạo App Password mới từ: https://myaccount.google.com/apppasswords

### **Vấn đề 3: Authentication failed**

**Triệu chứng:**
```
❌ [EmailService] Error sending OTP email: {
  code: 'EAUTH',
  message: 'Authentication failed'
}
```

**Giải pháp:**
1. Kiểm tra `EMAIL_PASSWORD` là App Password (không phải mật khẩu Gmail)
2. Kiểm tra App Password có đúng không
3. Tạo App Password mới từ: https://myaccount.google.com/apppasswords
4. Đảm bảo App Password không có spaces

### **Vấn đề 4: Retry vẫn fail**

**Triệu chứng:**
```
❌ [EmailService] All retry attempts failed. Last error: {
  code: 'ETIMEDOUT',
  message: 'Connection timeout'
}
```

**Giải pháp:**
1. Kiểm tra network connectivity trên Render.com
2. Kiểm tra Gmail SMTP server có hoạt động không
3. Thử tăng số lần retry lên 5
4. Kiểm tra firewall có chặn port 587 không
5. Contact Render.com support nếu vấn đề vẫn tiếp tục

## 📊 Monitoring

### **Logs Quan Trọng Cần Theo Dõi**

#### **Khi Server Khởi Động:**

```
✅ [EmailService] Email configuration found
✅ [EmailService] EMAIL_USER: your-email@gmail.com
✅ [EmailService] EMAIL_PASSWORD length: 16 characters
📧 [EmailService] Email transporter config: {
  port: 587,
  secure: false,
  useTLS: true,
  host: 'smtp.gmail.com'
}
⚠️ [EmailService] Skipping transporter verification (SKIP_EMAIL_VERIFICATION=true or production mode)
📧 [EmailService] Transporter will be verified on first email send
```

#### **Khi Gửi Email Thành Công:**

```
📧 [EmailService] sendOTPEmail called: {
  email: '...',
  otp: '...',
  purpose: '...',
  hasEmailUser: true,
  hasEmailPassword: true
}
📧 [EmailService] Attempting to send email (attempt 1/3)...
📧 [EmailService] Mail options: {
  from: '...',
  to: '...',
  subject: '...',
  hasHtml: true,
  port: 587,
  secure: false
}
✅ [EmailService] OTP email sent successfully: {
  messageId: '...',
  response: '...',
  accepted: [...],
  rejected: [],
  attempt: 1
}
```

#### **Khi Có Lỗi và Retry:**

```
❌ [EmailService] Error sending OTP email (attempt 1/3): {
  message: 'Connection timeout',
  code: 'ETIMEDOUT',
  command: 'CONN',
  response: undefined,
  responseCode: undefined
}
⏳ [EmailService] Retrying in 3000ms...
📧 [EmailService] Attempting to send email (attempt 2/3)...
✅ [EmailService] OTP email sent successfully: {
  messageId: '...',
  attempt: 2
}
```

#### **Khi Tất Cả Retries Đều Fail:**

```
❌ [EmailService] All retry attempts failed. Last error: {
  message: 'Connection timeout',
  code: 'ETIMEDOUT',
  command: 'CONN',
  response: undefined,
  responseCode: undefined,
  stack: '...'
}
```

## ✅ Checklist

### **Code Changes:**

- [x] Chuyển sang port 587 (TLS)
- [x] Tăng timeout lên 100 giây
- [x] Disable connection pooling
- [x] Thêm retry logic (3 lần)
- [x] Skip verification khi production
- [x] Thêm timeout cho sendMail operation (90 giây)
- [x] Logging chi tiết cho mỗi attempt

### **Environment Variables:**

- [ ] `EMAIL_USER` được set
- [ ] `EMAIL_PASSWORD` được set (không có spaces)
- [ ] `EMAIL_USE_PORT_587=true` (optional, default: true)
- [ ] `SKIP_EMAIL_VERIFICATION=true` (optional, khuyến nghị)
- [ ] `FRONTEND_URL` được set (optional)
- [ ] `NODE_ENV=production` (optional)

### **Testing:**

- [ ] Test trên local với port 587
- [ ] Test trên Render.com
- [ ] Verify email được gửi thành công
- [ ] Test retry logic khi có timeout
- [ ] Monitor logs không có lỗi

### **Deployment:**

- [ ] Deploy code mới lên Render.com
- [ ] Set environment variables
- [ ] Restart server
- [ ] Verify logs khi khởi động
- [ ] Test gửi email
- [ ] Monitor logs trong 24 giờ

## 🚀 Next Steps

1. **Deploy Code Mới:**
   - Code đã được cập nhật với tất cả cải tiến
   - Deploy lên Render.com

2. **Set Environment Variables:**
   - Set `EMAIL_USE_PORT_587=true` (optional)
   - Set `SKIP_EMAIL_VERIFICATION=true` (optional)
   - Set `FRONTEND_URL` (optional)

3. **Test Email Service:**
   - Test gửi email trên Render.com
   - Kiểm tra logs không có timeout
   - Verify email được gửi thành công

4. **Monitor Logs:**
   - Theo dõi logs khi gửi email
   - Kiểm tra retry logic hoạt động
   - Verify không có lỗi timeout

## 💡 Best Practices

1. **Port Selection:**
   - ✅ Sử dụng port 587 (TLS) trên Render.com
   - ❌ Tránh port 465 (SSL) trên Render.com

2. **Timeout Configuration:**
   - ✅ Timeout 100 giây cho connection
   - ✅ Timeout 90 giây cho sendMail operation
   - ✅ Đủ thời gian cho network latency

3. **Retry Logic:**
   - ✅ Retry 3 lần với delay tăng dần
   - ✅ Logs chi tiết cho mỗi attempt
   - ✅ Timeout riêng cho mỗi attempt

4. **Verification:**
   - ✅ Skip verification khi production
   - ✅ Verification sẽ được thực hiện khi gửi email
   - ✅ Không ảnh hưởng đến chức năng

5. **Connection Pooling:**
   - ✅ Disable pooling trên Render.com
   - ✅ Tạo connection mới cho mỗi request
   - ✅ Đáng tin cậy hơn trên cloud hosting

## 🔗 Related Files

- Backend: `services/emailService.js` - EmailService class với tất cả cải tiến
- Documentation: `FRONTEND_URL_CONFIGURATION.md` - Cấu hình FRONTEND_URL
- Test Utility: `test-email-esms-service.js` - Test email service

## 📝 Notes

- Tất cả cải tiến đều backward compatible
- Có thể rollback bằng cách set `EMAIL_USE_PORT_587=false`
- Retry logic tự động, không cần cấu hình thêm
- Logs chi tiết giúp debug dễ dàng



