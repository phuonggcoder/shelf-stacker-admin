# 📧📱 Email & ESMS Service Improvements - Frontend

## ✅ Các Cải Tiến Đã Thực Hiện

### 1. **Enhanced Error Handling trong AdminServices.js**

**File:** `public/AdminServices.js`

#### **Email Service Error Handling:**

- ✅ **ETIMEDOUT** - Connection timeout
  - Error message: "Kết nối email service bị timeout. Vui lòng kiểm tra cấu hình EMAIL_USER và EMAIL_PASSWORD, hoặc thử lại sau."
  
- ✅ **EAUTH** - Authentication failed
  - Error message: "Lỗi xác thực email. Vui lòng kiểm tra EMAIL_USER và EMAIL_PASSWORD (phải là App Password từ Gmail)."
  
- ✅ **ECONNECTION** - Connection error
  - Error message: "Không thể kết nối đến email service. Vui lòng kiểm tra kết nối mạng và firewall."

#### **ESMS Service Error Handling:**

- ✅ **CodeResult 101** - Authentication failed
  - Error message: "Lỗi xác thực ESMS. Vui lòng kiểm tra ESMS_API_KEY và ESMS_SECRET_KEY trong environment variables."
  
- ✅ **CodeResult 102** - Insufficient balance
  - Error message: "Tài khoản ESMS không đủ số dư để gửi SMS. Vui lòng nạp tiền vào tài khoản ESMS."
  
- ✅ **CodeResult 103** - Invalid brandname
  - Error message: "Brandname ESMS không hợp lệ hoặc chưa được đăng ký. Vui lòng kiểm tra cấu hình ESMS_BRANDNAME."

#### **Methods Đã Được Cải Thiện:**

1. **`requestEmailChange()`**
   - Enhanced error handling với specific error messages
   - Logging chi tiết với timestamp
   - Validation input

2. **`verifyEmailChange()`**
   - Enhanced error handling
   - Auto-clean OTP
   - Specific error messages cho từng loại lỗi

3. **`requestSMSOTP()`**
   - Enhanced error handling cho ESMS errors
   - Phone number validation và cleaning
   - Specific error messages cho CodeResult errors

4. **Request Handler**
   - Enhanced error detection và message enhancement
   - Automatic error message improvement dựa trên error type

### 2. **Email & ESMS Service Test Utility**

**File:** `public/test-email-esms-service.js`

**Tính năng:**

- ✅ `testEmailConfig()` - Kiểm tra cấu hình email service
- ✅ `testRequestEmailChange()` - Test gửi request đổi email với error analysis
- ✅ `testRequestSMSOTP()` - Test gửi SMS OTP với error analysis
- ✅ `testServerHealth()` - Kiểm tra server health
- ✅ `runFullTest()` - Chạy full test suite
- ✅ `parseError()` - Parse error message để hiển thị hướng dẫn cụ thể

**Cách sử dụng:**

```javascript
// Load script vào browser console hoặc include vào HTML
// Sau đó sử dụng:

// Test email config
await emailESMSTester.testEmailConfig();

// Test email service
await emailESMSTester.testRequestEmailChange("new@email.com", "password");

// Test ESMS service
await emailESMSTester.testRequestSMSOTP("0123456789");

// Run full test suite
await emailESMSTester.runFullTest(
    { newEmail: "new@email.com", currentPassword: "password" },
    { phone: "0123456789" }
);
```

## 📋 Error Messages Mapping

### Email Service Errors

| Backend Error | Frontend Error Message | Solution |
|--------------|------------------------|----------|
| `ETIMEDOUT` | Kết nối email service bị timeout... | Check EMAIL_USER and EMAIL_PASSWORD |
| `EAUTH` | Lỗi xác thực email... | Check EMAIL_USER and EMAIL_PASSWORD (must be App Password) |
| `ECONNECTION` | Không thể kết nối đến email service... | Check network connection and firewall |

### ESMS Service Errors

| Backend Error | Frontend Error Message | Solution |
|--------------|------------------------|----------|
| `CodeResult: 101` | Lỗi xác thực ESMS... | Check ESMS_API_KEY and ESMS_SECRET_KEY |
| `CodeResult: 102` | Tài khoản ESMS không đủ số dư... | Top up ESMS account balance |
| `CodeResult: 103` | Brandname ESMS không hợp lệ... | Check ESMS_BRANDNAME configuration |

## 🔍 Debugging Guide

### Bước 1: Kiểm Tra Browser Console

Khi có lỗi, browser console sẽ hiển thị:

1. **Email Service Errors:**
   ```
   ❌ [AdminServices] requestEmailChange error: {
     message: "Kết nối email service bị timeout...",
     ...
   }
   ```

2. **ESMS Service Errors:**
   ```
   ❌ [AdminServices] requestSMSOTP error: {
     message: "Lỗi xác thực ESMS...",
     ...
   }
   ```

### Bước 2: Sử Dụng Test Utility

1. Load `test-email-esms-service.js` vào browser
2. Chạy test để xác định vấn đề:

```javascript
// Test email service
await emailESMSTester.testRequestEmailChange("test@example.com", "password");

// Test ESMS service
await emailESMSTester.testRequestSMSOTP("0123456789");
```

### Bước 3: Phân Tích Error Messages

Test utility sẽ tự động phân tích error và hiển thị:
- Loại lỗi (Email Service / ESMS Service)
- Solution cụ thể
- Details về lỗi

## 🛠️ Troubleshooting

### Email Service - Connection Timeout

**Vấn đề:** `ETIMEDOUT` error

**Frontend sẽ hiển thị:**
> "Kết nối email service bị timeout. Vui lòng kiểm tra cấu hình EMAIL_USER và EMAIL_PASSWORD, hoặc thử lại sau."

**Giải pháp:**
1. Kiểm tra backend logs (theo hướng dẫn trong document gốc)
2. Kiểm tra EMAIL_USER và EMAIL_PASSWORD có đúng không
3. Kiểm tra network connectivity
4. Kiểm tra firewall có chặn port 465/587 không

### Email Service - Authentication Failed

**Vấn đề:** `EAUTH` error

**Frontend sẽ hiển thị:**
> "Lỗi xác thực email. Vui lòng kiểm tra EMAIL_USER và EMAIL_PASSWORD (phải là App Password từ Gmail)."

**Giải pháp:**
1. Đảm bảo EMAIL_PASSWORD là App Password (không phải mật khẩu Gmail thông thường)
2. Tạo App Password mới từ: https://myaccount.google.com/apppasswords
3. Kiểm tra EMAIL_USER có đúng không

### ESMS Service - Authentication Failed

**Vấn đề:** `CodeResult: 101`

**Frontend sẽ hiển thị:**
> "Lỗi xác thực ESMS. Vui lòng kiểm tra ESMS_API_KEY và ESMS_SECRET_KEY trong environment variables."

**Giải pháp:**
1. Kiểm tra ESMS_API_KEY và ESMS_SECRET_KEY có đúng không
2. Đảm bảo API_KEY và SECRET_KEY khác nhau
3. Không sử dụng default credentials
4. Kiểm tra không có spaces hoặc ký tự đặc biệt

### ESMS Service - Insufficient Balance

**Vấn đề:** `CodeResult: 102`

**Frontend sẽ hiển thị:**
> "Tài khoản ESMS không đủ số dư để gửi SMS. Vui lòng nạp tiền vào tài khoản ESMS."

**Giải pháp:**
1. Đăng nhập vào tài khoản ESMS
2. Kiểm tra số dư
3. Nạp tiền nếu cần

### ESMS Service - Invalid Brandname

**Vấn đề:** `CodeResult: 103`

**Frontend sẽ hiển thị:**
> "Brandname ESMS không hợp lệ hoặc chưa được đăng ký. Vui lòng kiểm tra cấu hình ESMS_BRANDNAME."

**Giải pháp:**
1. Kiểm tra ESMS_BRANDNAME có đúng không
2. Đảm bảo brandname đã được đăng ký với ESMS
3. Kiểm tra brandname có active không

## 📊 Monitoring

### Logs Quan Trọng Cần Theo Dõi

#### Email Service:
- `📧 [AdminServices] requestEmailChange called with:` - Method được gọi
- `✅ [AdminServices] requestEmailChange response received:` - Thành công
- `❌ [AdminServices] requestEmailChange error:` - Lỗi với error message cụ thể

#### ESMS Service:
- `📱 [AdminServices] requestSMSOTP called with:` - Method được gọi
- `✅ [AdminServices] requestSMSOTP response received:` - Thành công
- `❌ [AdminServices] requestSMSOTP error:` - Lỗi với error message cụ thể

## ✅ Checklist

### Email Service:
- [ ] Error handling đã được cải thiện
- [ ] Error messages thân thiện với người dùng
- [ ] Test utility đã được tạo
- [ ] Logging chi tiết với timestamp

### ESMS Service:
- [ ] Error handling đã được cải thiện
- [ ] Error messages cho từng CodeResult
- [ ] Test utility đã được tạo
- [ ] Logging chi tiết với timestamp

## 🔗 Related Files

- `public/AdminServices.js` - Main service file với enhanced error handling
- `public/test-email-esms-service.js` - Test & debug utility
- Backend endpoint: `/api/users/change-email` (PUT)
- Backend endpoint: `/api/users/auth/request-otp` (POST)

## 📚 Notes

- Tất cả error messages đều thân thiện với người dùng và cung cấp solution cụ thể
- Test utility có thể được sử dụng độc lập hoặc tích hợp vào test suite
- Error handling tự động detect và enhance error messages dựa trên error type
- Logs format nhất quán với backend logs



