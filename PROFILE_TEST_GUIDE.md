# 🧪 Hướng Dẫn Test Trang Profile

## 📋 Tổng Quan

Trang Profile (`/profile`) cung cấp các chức năng:
1. ✅ Cập nhật thông tin cá nhân (CRUD)
2. ✅ Upload avatar
3. ✅ Xác thực email
4. ✅ Đổi email
5. ✅ Xác thực số điện thoại (SMS OTP)
6. ✅ Đổi mật khẩu
7. ✅ Validate token

---

## 🚀 Cách Test

### Bước 1: Truy cập trang Profile

1. Mở trình duyệt và đăng nhập vào admin panel
2. Click vào **avatar/user info** ở sidebar (phía dưới)
3. Hoặc truy cập trực tiếp: `http://localhost:3000/profile`

### Bước 2: Chạy Test Script Tự Động

Mở **Developer Console** (F12) và bạn sẽ thấy kết quả test tự động:

```
🧪 [Profile Test] Starting tests...
📋 Test 1: Checking required elements...
  ✅ Found: #fullName
  ✅ Found: #email
  ...
📊 Test Summary:
✅ PASS - elements
✅ PASS - adminServices
...
🎉 All tests passed!
```

---

## 📝 Test Manual Từng Chức Năng

### 1. Test Cập Nhật Thông Tin Cá Nhân

**Test Case 1.1: Cập nhật thành công**
1. Điền form:
   - **Tên đầy đủ**: "Nguyễn Văn A"
   - **Số điện thoại**: "0987654321"
   - **Giới tính**: Chọn "Nam"
   - **Ngày sinh**: Chọn một ngày
2. Click **"Lưu thông tin"**
3. **Kỳ vọng**: 
   - ✅ Hiển thị toast "Cập nhật thông tin thành công!"
   - ✅ Thông tin được cập nhật và hiển thị lại

**Test Case 1.2: Validation - Tên đầy đủ trống**
1. Xóa trường "Tên đầy đủ"
2. Click **"Lưu thông tin"**
3. **Kỳ vọng**: 
   - ✅ Hiển thị lỗi "Tên đầy đủ là bắt buộc" dưới trường input

**Test Case 1.3: Validation - Số điện thoại không hợp lệ**
1. Nhập số điện thoại không hợp lệ (ví dụ: "abc")
2. Click **"Lưu thông tin"**
3. **Kỳ vọng**: 
   - ✅ Hiển thị lỗi validation (nếu có)

---

### 2. Test Upload Avatar

**Test Case 2.1: Upload thành công**
1. Click **"Đổi ảnh đại diện"** hoặc click vào avatar
2. Chọn file ảnh (JPG, PNG, < 5MB)
3. **Kỳ vọng**: 
   - ✅ Avatar preview hiển thị ảnh mới
   - ✅ Hiển thị toast "Cập nhật ảnh đại diện thành công!"
   - ✅ Avatar được cập nhật trong database

**Test Case 2.2: File không phải ảnh**
1. Chọn file không phải ảnh (ví dụ: .txt, .pdf)
2. **Kỳ vọng**: 
   - ✅ Hiển thị lỗi "Vui lòng chọn file ảnh"

**Test Case 2.3: File quá lớn**
1. Chọn file ảnh > 5MB
2. **Kỳ vọng**: 
   - ✅ Hiển thị lỗi "Kích thước ảnh không được vượt quá 5MB"

---

### 3. Test Xác Thực Email

**Test Case 3.1: Kiểm tra trạng thái**
1. Trang load tự động kiểm tra trạng thái
2. **Kỳ vọng**: 
   - ✅ Hiển thị "Email đã được xác thực" hoặc "Email chưa được xác thực"

**Test Case 3.2: Gửi email xác thực**
1. Nếu email chưa xác thực, click **"Gửi email xác thực"**
2. **Kỳ vọng**: 
   - ✅ Hiển thị toast "Email xác thực đã được gửi..."
   - ✅ Form nhập token xuất hiện
   - ✅ Nút "Gửi lại" xuất hiện

**Test Case 3.3: Xác thực email bằng token**
1. Kiểm tra email và copy token
2. Nhập token vào form
3. Click **"Xác thực"**
4. **Kỳ vọng**: 
   - ✅ Hiển thị toast "Email đã được xác thực thành công!"
   - ✅ Trạng thái cập nhật thành "Đã xác thực"

**Test Case 3.4: Token không hợp lệ**
1. Nhập token sai hoặc đã hết hạn
2. Click **"Xác thực"**
3. **Kỳ vọng**: 
   - ✅ Hiển thị lỗi "Token không hợp lệ hoặc đã hết hạn"

---

### 4. Test Đổi Email

**Test Case 4.1: Yêu cầu đổi email**
1. Nhập:
   - **Email mới**: "newemail@example.com"
   - **Mật khẩu hiện tại**: Nhập mật khẩu
2. Click **"Gửi yêu cầu đổi email"**
3. **Kỳ vọng**: 
   - ✅ Hiển thị toast "Mã OTP đã được gửi đến cả email cũ và email mới..."
   - ✅ Form nhập OTP xuất hiện

**Test Case 4.2: Xác thực đổi email**
1. Kiểm tra cả 2 email (cũ và mới) để lấy OTP
2. Nhập:
   - **OTP từ email cũ**: "123456"
   - **OTP từ email mới**: "789012"
3. Click **"Xác thực và đổi email"**
4. **Kỳ vọng**: 
   - ✅ Hiển thị toast "Đổi email thành công!"
   - ✅ Email mới được cập nhật
   - ✅ Form reset

**Test Case 4.3: OTP sai**
1. Nhập OTP sai
2. Click **"Xác thực và đổi email"**
3. **Kỳ vọng**: 
   - ✅ Hiển thị lỗi "Mã OTP email hiện tại không đúng" hoặc tương tự

**Test Case 4.4: Mật khẩu sai**
1. Nhập mật khẩu hiện tại sai
2. Click **"Gửi yêu cầu đổi email"**
3. **Kỳ vọng**: 
   - ✅ Hiển thị lỗi "Mật khẩu hiện tại không đúng"

---

### 5. Test Xác Thực Số Điện Thoại (SMS OTP)

**Test Case 5.1: Gửi OTP SMS**
1. Nhập số điện thoại: "0987654321"
2. Click **"Gửi mã OTP"**
3. **Kỳ vọng**: 
   - ✅ Hiển thị toast "Mã OTP đã được gửi đến số điện thoại..."
   - ✅ Form nhập OTP xuất hiện
   - ✅ OTP là 4 số

**Test Case 5.2: Xác thực OTP SMS**
1. Kiểm tra SMS để lấy OTP 4 số
2. Nhập OTP vào form
3. Click **"Xác thực"**
4. **Kỳ vọng**: 
   - ✅ Hiển thị toast "Xác thực số điện thoại thành công!"
   - ✅ Số điện thoại được cập nhật

**Test Case 5.3: OTP sai hoặc hết hạn**
1. Nhập OTP sai hoặc đã hết hạn (sau 3 phút)
2. Click **"Xác thực"**
3. **Kỳ vọng**: 
   - ✅ Hiển thị lỗi "OTP sai hoặc hết hạn"

**Test Case 5.4: Gửi lại OTP**
1. Click **"Gửi lại"**
2. **Kỳ vọng**: 
   - ✅ OTP mới được gửi
   - ✅ Hiển thị toast thông báo

---

### 6. Test Đổi Mật Khẩu

**Test Case 6.1: Đổi mật khẩu thành công**
1. Nhập:
   - **Mật khẩu hiện tại**: "oldpassword"
   - **Mật khẩu mới**: "newpassword123"
   - **Xác nhận mật khẩu mới**: "newpassword123"
2. Click **"Đổi mật khẩu"**
3. **Kỳ vọng**: 
   - ✅ Hiển thị toast "Đổi mật khẩu thành công!"
   - ✅ Form reset

**Test Case 6.2: Mật khẩu hiện tại sai**
1. Nhập mật khẩu hiện tại sai
2. Click **"Đổi mật khẩu"**
3. **Kỳ vọng**: 
   - ✅ Hiển thị lỗi "Current password is incorrect"

**Test Case 6.3: Mật khẩu mới quá ngắn**
1. Nhập mật khẩu mới < 6 ký tự
2. Click **"Đổi mật khẩu"**
3. **Kỳ vọng**: 
   - ✅ Hiển thị lỗi "Mật khẩu phải có ít nhất 6 ký tự"

**Test Case 6.4: Mật khẩu xác nhận không khớp**
1. Nhập mật khẩu mới và xác nhận khác nhau
2. Click **"Đổi mật khẩu"**
3. **Kỳ vọng**: 
   - ✅ Hiển thị lỗi "Mật khẩu xác nhận không khớp"

---

### 7. Test Validate Token

**Test Case 7.1: Validate token thành công**
1. Click **"Kiểm tra token"**
2. **Kỳ vọng**: 
   - ✅ Hiển thị "Token hợp lệ"
   - ✅ Hiển thị thời gian hết hạn

**Test Case 7.2: Token hết hạn**
1. Đợi token hết hạn (hoặc xóa token trong localStorage)
2. Click **"Kiểm tra token"**
3. **Kỳ vọng**: 
   - ✅ Hiển thị "Token không hợp lệ" hoặc redirect về login

---

## 🔍 Test API Endpoints

### Kiểm tra API có hoạt động:

Mở **Network tab** trong Developer Tools và kiểm tra các request:

1. **GET /api/users/me** - Lấy thông tin cá nhân
2. **PUT /api/users/update** - Cập nhật thông tin
3. **PUT /api/users/change-password** - Đổi mật khẩu
4. **PUT /api/users/change-email** - Yêu cầu đổi email
5. **POST /api/users/verify-email-change** - Xác thực đổi email
6. **POST /api/email-verification/send-verification** - Gửi email xác thực
7. **POST /api/email-verification/verify** - Xác thực email
8. **GET /api/email-verification/status** - Kiểm tra trạng thái
9. **POST /api/users/auth/request-otp** - Gửi OTP SMS
10. **POST /api/users/auth/verify-otp** - Xác thực OTP SMS
11. **GET /api/users/validate-token** - Validate token

---

## 🐛 Debugging

### Nếu có lỗi:

1. **Mở Developer Console** (F12)
2. Kiểm tra **Console tab** để xem lỗi JavaScript
3. Kiểm tra **Network tab** để xem lỗi API
4. Kiểm tra **Application tab > Local Storage** để xem token

### Common Issues:

**Issue 1: "AdminServices not loaded"**
- ✅ Kiểm tra `/AdminServices.js` đã được load chưa
- ✅ Kiểm tra thứ tự load script trong HTML

**Issue 2: "401 Unauthorized"**
- ✅ Kiểm tra token trong localStorage
- ✅ Đăng nhập lại nếu token hết hạn

**Issue 3: "Failed to fetch"**
- ✅ Kiểm tra kết nối mạng
- ✅ Kiểm tra API endpoint có đúng không

**Issue 4: Toast không hiển thị**
- ✅ Kiểm tra `toastContainer` có tồn tại không
- ✅ Kiểm tra CSS cho toast

---

## ✅ Checklist Test

- [ ] Trang profile load được
- [ ] Thông tin user hiển thị đúng
- [ ] Cập nhật thông tin thành công
- [ ] Upload avatar thành công
- [ ] Validation form hoạt động
- [ ] Gửi email xác thực thành công
- [ ] Xác thực email bằng token thành công
- [ ] Yêu cầu đổi email thành công
- [ ] Xác thực đổi email bằng OTP thành công
- [ ] Gửi OTP SMS thành công
- [ ] Xác thực OTP SMS thành công
- [ ] Đổi mật khẩu thành công
- [ ] Validate token thành công
- [ ] Error handling hoạt động đúng
- [ ] Loading states hiển thị đúng
- [ ] Toast notifications hiển thị đúng

---

## 📞 Support

Nếu gặp vấn đề, kiểm tra:
1. Browser console để xem lỗi
2. Network tab để xem API response
3. Đảm bảo backend API đang chạy
4. Đảm bảo token hợp lệ

---

**Last Updated**: 2024-01-01




