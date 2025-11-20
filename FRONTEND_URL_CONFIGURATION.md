# 🔧 Hướng Dẫn Cấu Hình FRONTEND_URL

## 🚨 Vấn Đề

Backend EmailService đang sử dụng `FRONTEND_URL` để tạo verification URL, nhưng biến này chưa được cấu hình.

## 📋 Giải Pháp

### 1. **Cấu Hình FRONTEND_URL trong Backend**

Thêm biến môi trường `FRONTEND_URL` vào file `.env` của backend:

```env
# Frontend URL (dùng để tạo verification links)
FRONTEND_URL=https://your-frontend-domain.com

# Hoặc nếu đang development:
# FRONTEND_URL=http://localhost:3000
```

### 2. **Các Giá Trị FRONTEND_URL Có Thể Dùng**

#### **Production:**
```env
FRONTEND_URL=https://shelfstacker.com
# hoặc
FRONTEND_URL=https://www.shelfstacker.com
# hoặc
FRONTEND_URL=https://app.shelfstacker.com
```

#### **Development:**
```env
FRONTEND_URL=http://localhost:3000
# hoặc
FRONTEND_URL=http://localhost:5173
# hoặc
FRONTEND_URL=http://127.0.0.1:3000
```

#### **Staging:**
```env
FRONTEND_URL=https://staging.shelfstacker.com
# hoặc
FRONTEND_URL=https://dev.shelfstacker.com
```

### 3. **Cải Thiện Backend Code (Đề Xuất)**

Nếu chưa có FRONTEND_URL, backend nên:

1. **Sử dụng default URL tạm thời:**
   ```javascript
   const baseUrl = process.env.FRONTEND_URL || 'https://shelfstacker.com';
   ```

2. **Log warning khi không có FRONTEND_URL:**
   ```javascript
   if (!process.env.FRONTEND_URL) {
     console.warn('⚠️ [EmailService] FRONTEND_URL not set. Using default URL.');
   }
   ```

3. **Sử dụng relative URL hoặc deep link:**
   ```javascript
   // Thay vì full URL, có thể dùng deep link hoặc relative path
   const verificationUrl = process.env.FRONTEND_URL 
     ? `${process.env.FRONTEND_URL}/verify/email/${token}`
     : `shelfstacker://verify/email/${token}`; // Deep link cho mobile app
   ```

## 🔍 Kiểm Tra Cấu Hình

### **Backend Logs:**

Khi backend khởi động, bạn sẽ thấy:

**Nếu FRONTEND_URL được set:**
```
✅ [EmailService] FRONTEND_URL: https://shelfstacker.com
```

**Nếu FRONTEND_URL không được set:**
```
⚠️ [EmailService] FRONTEND_URL not set. Using default: https://shelfstacker.com
⚠️ [EmailService] Please set FRONTEND_URL in environment variables for production.
```

### **Test Verification URL:**

1. Yêu cầu đổi email hoặc đăng ký
2. Kiểm tra email nhận được
3. Xem verification URL trong email
4. Đảm bảo URL đúng với frontend domain của bạn

## 🛠️ Các Bước Cấu Hình

### **Bước 1: Xác Định Frontend URL**

Xác định URL của frontend application:
- Production: `https://shelfstacker.com`
- Development: `http://localhost:3000`
- Staging: `https://staging.shelfstacker.com`

### **Bước 2: Thêm vào Environment Variables**

Thêm vào file `.env` của backend:

```env
FRONTEND_URL=https://shelfstacker.com
```

### **Bước 3: Restart Backend Server**

Sau khi thêm biến môi trường, restart backend server để áp dụng thay đổi.

### **Bước 4: Test Verification Email**

1. Gửi verification email (đăng ký hoặc đổi email)
2. Kiểm tra email nhận được
3. Click vào verification link
4. Đảm bảo link redirect đúng đến frontend

## 📝 Lưu Ý

### **1. Security:**
- Không commit `.env` file vào git
- Sử dụng HTTPS cho production
- Validate FRONTEND_URL trong backend

### **2. Multiple Environments:**
Nếu có nhiều môi trường (dev, staging, production), sử dụng:

```env
# Development
FRONTEND_URL=http://localhost:3000

# Staging
FRONTEND_URL=https://staging.shelfstacker.com

# Production
FRONTEND_URL=https://shelfstacker.com
```

### **3. Deep Links (Mobile App):**
Nếu có mobile app, có thể sử dụng deep links:

```javascript
// Web
const webUrl = `${process.env.FRONTEND_URL}/verify/email/${token}`;

// Mobile App
const deepLink = `shelfstacker://verify/email/${token}`;

// Sử dụng cả hai
const verificationUrl = process.env.IS_MOBILE 
  ? deepLink 
  : webUrl;
```

## 🔗 Related Files

- Backend: `services/emailService.js` - EmailService class
- Backend: `.env` - Environment variables
- Frontend: Verification page - `/verify/email/:token`

## ✅ Checklist

- [ ] Xác định frontend URL (production, staging, dev)
- [ ] Thêm FRONTEND_URL vào `.env` file
- [ ] Restart backend server
- [ ] Test verification email
- [ ] Kiểm tra verification link hoạt động đúng
- [ ] Update documentation nếu cần

## 🆘 Troubleshooting

### **Vấn đề 1: Verification link không hoạt động**

**Nguyên nhân:**
- FRONTEND_URL không đúng
- Frontend chưa có route `/verify/email/:token`

**Giải pháp:**
1. Kiểm tra FRONTEND_URL trong `.env`
2. Kiểm tra frontend có route `/verify/email/:token` không
3. Test link trực tiếp trong browser

### **Vấn đề 2: Link redirect sai domain**

**Nguyên nhân:**
- FRONTEND_URL có trailing slash hoặc không đúng format

**Giải pháp:**
```env
# Đúng
FRONTEND_URL=https://shelfstacker.com

# Sai (có trailing slash)
FRONTEND_URL=https://shelfstacker.com/
```

### **Vấn đề 3: Link không hoạt động trên mobile**

**Nguyên nhân:**
- Cần deep link cho mobile app

**Giải pháp:**
- Implement deep link handling trong mobile app
- Hoặc sử dụng universal link (iOS) / app link (Android)



