# 📱 ESMS Integration Guide - Complete Documentation

## 📋 Tổng Quan

Tài liệu này mô tả cách tích hợp ESMS (E-SMS) service vào backend để gửi SMS OTP và các thông báo SMS khác.

## ✅ Đã Tích Hợp

### **1. ESMS Service (`services/esms.service.js`)**

#### **Credentials Mặc Định:**
- **API Key**: `BB19D3EA87F3AD9BFF23EC9BA621C6`
- **Secret Key**: `48D7E8E22AF7339A37881204EE6679`
- **Brandname**: `Baotrixemay` (test)
- **SmsType**: `2` (Tin hiển thị thương hiệu)

#### **Các Tính Năng:**
- ✅ Hỗ trợ cả POST và GET method
- ✅ Auto fallback từ POST sang GET nếu POST fail
- ✅ Normalize phone number (loại bỏ spaces, dashes)
- ✅ Validate phone number format (10-11 chữ số, bắt đầu bằng 0)
- ✅ Format SMS content theo yêu cầu ESMS
- ✅ Error handling chi tiết với CodeResult
- ✅ Logging chi tiết cho debugging
- ✅ Retry logic (fallback GET nếu POST fail)

## 📋 Cấu Hình Environment Variables

### **Render.com Environment Variables:**

```env
# ESMS API Configuration
ESMS_API_KEY=BB19D3EA87F3AD9BFF23EC9BA621C6
ESMS_SECRET_KEY=48D7E8E22AF7339A37881204EE6679
ESMS_API_URL=http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/
ESMS_BRANDNAME=Baotrixemay
ESMS_SMS_TYPE=2
ESMS_USE_GET=false  # Optional: true để dùng GET method
```

### **Lưu ý:**
- `ESMS_API_KEY` và `ESMS_SECRET_KEY`: Đã được set mặc định trong code
- `ESMS_BRANDNAME`: Mặc định là `Baotrixemay` (brandname test)
- `ESMS_SMS_TYPE`: Mặc định là `2` (tin hiển thị thương hiệu)
- `ESMS_USE_GET`: Optional, set `true` để dùng GET method thay vì POST
- `ESMS_API_URL`: Optional, mặc định là POST URL

## 🔧 Các Thay Đổi Đã Thực Hiện

### **1. Cập Nhật Credentials**

**Trước:**
```javascript
const ESMS_SECRET_KEY = process.env.ESMS_SECRET_KEY || 'BB19D3EA87F3AD9BFF23EC9BA621C6';
```

**Sau:**
```javascript
const ESMS_API_KEY = process.env.ESMS_API_KEY || 'BB19D3EA87F3AD9BFF23EC9BA621C6';
const ESMS_SECRET_KEY = process.env.ESMS_SECRET_KEY || '48D7E8E22AF7339A37881204EE6679';
```

### **2. Hỗ Trợ GET Method**

**Thêm:**
```javascript
const ESMS_USE_GET = process.env.ESMS_USE_GET === 'true';

if (ESMS_USE_GET) {
  // Use GET method
  const params = new URLSearchParams({
    ApiKey: ESMS_API_KEY,
    SecretKey: ESMS_SECRET_KEY,
    Content: smsContent,
    Phone: normalizedPhone,
    Brandname: ESMS_BRANDNAME,
    SmsType: ESMS_SMS_TYPE
  });
  const getUrl = 'http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_get?' + params.toString();
  res = await axios.get(getUrl);
} else {
  // Use POST method (default)
  res = await axios.post(ESMS_API_URL, payload);
}
```

### **3. Auto Fallback GET nếu POST Fail**

**Thêm:**
```javascript
catch (axiosError) {
  // Nếu POST fail, thử GET method
  if (!ESMS_USE_GET && (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ETIMEDOUT' || axiosError.response?.status === 404)) {
    console.log('🔄 [ESMS] POST method failed. Trying GET method as fallback...');
    try {
      const getUrl = 'http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_get?' + params.toString();
      const getRes = await axios.get(getUrl);
      return handleESMSResponse(getRes.data);
    } catch (getError) {
      // GET also failed
    }
  }
}
```

### **4. Normalize và Validate Phone Number**

**Thêm:**
```javascript
// Normalize phone number (remove spaces, dashes, parentheses)
const normalizedPhone = phone.replace(/\s+/g, '').replace(/[-()]/g, '').trim();

// Validate phone number format (should start with 0 and have 10-11 digits)
if (!/^0\d{9,10}$/.test(normalizedPhone)) {
  return { 
    CodeResult: 'INVALID_PHONE_FORMAT',
    ErrorMessage: 'Số điện thoại không đúng định dạng. Phải bắt đầu bằng 0 và có 10-11 chữ số.',
    success: false 
  };
}
```

### **5. Format SMS Content theo Yêu Cầu ESMS**

**Format:**
```javascript
// Format test: "XXXX la ma xac minh dang ky Baotrixemay cua ban"
const smsContent = `${otp} la ma xac minh dang ky ${ESMS_BRANDNAME} cua ban`;
```

### **6. Cải Thiện Error Handling**

**Thêm:**
```javascript
function handleESMSResponse(data) {
  if (data && data.CodeResult) {
    if (data.CodeResult === '100') {
      // Success
      return { ...data, success: true };
    } else {
      // Error with specific messages
      let errorMessage = data.ErrorMessage || 'Lỗi không xác định';
      
      if (data.CodeResult === '101') {
        errorMessage = 'Lỗi xác thực API. Vui lòng kiểm tra ESMS_API_KEY và ESMS_SECRET_KEY.';
      } else if (data.CodeResult === '102') {
        errorMessage = 'Tài khoản ESMS không đủ số dư để gửi SMS.';
      } else if (data.CodeResult === '103') {
        errorMessage = 'Brandname không hợp lệ hoặc chưa được đăng ký.';
      }
      
      return { ...data, ErrorMessage: errorMessage, success: false };
    }
  }
  return { ...data, success: true };
}
```

## 📱 ESMS API Documentation

### **1. API Endpoints**

#### **POST Method:**
```
POST http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/
Content-Type: application/json

{
  "ApiKey": "BB19D3EA87F3AD9BFF23EC9BA621C6",
  "SecretKey": "48D7E8E22AF7339A37881204EE6679",
  "Content": "123456 la ma xac minh dang ky Baotrixemay cua ban",
  "Phone": "0559018408",
  "Brandname": "Baotrixemay",
  "SmsType": "2"
}
```

#### **GET Method:**
```
GET http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_get?ApiKey=BB19D3EA87F3AD9BFF23EC9BA621C6&SecretKey=48D7E8E22AF7339A37881204EE6679&Content=123456%20la%20ma%20xac%20minh%20dang%20ky%20Baotrixemay%20cua%20ban&Phone=0559018408&Brandname=Baotrixemay&SmsType=2
```

### **2. Response Codes**

- **CodeResult: '100'**: Thành công ✅
- **CodeResult: '101'**: Lỗi xác thực API (Authorize Failed) ❌
- **CodeResult: '102'**: Không đủ số dư ❌
- **CodeResult: '103'**: Brandname không hợp lệ ❌

### **3. SMS Type**

- **SmsType: '2'**: Tin hiển thị thương hiệu (Brandname) - Chăm sóc khách hàng
  - Có thể gửi 1 lần 1 số tin đi ngay
  - Phải đăng ký Brandname trước mới gửi được
  - Brandname test: `Baotrixemay`

### **4. Format SMS Content**

**Test Brandname Format:**
```
XXXX la ma xac minh dang ky Baotrixemay cua ban
Cam on quy khach da su dung dich vu cua chung toi. Chuc quy khach mot ngay tot lanh!
```

**Production Format (khi đã đăng ký Brandname):**
```
[Your Brandname] Your custom message here
```

## 🧪 Testing

### **1. Test Local:**

```bash
# Test với credentials mặc định
node -e "const { sendOtpSms } = require('./services/esms.service'); sendOtpSms('0559018408', '1234').then(console.log).catch(console.error);"
```

### **2. Test trên Render.com:**

1. Deploy code mới
2. Kiểm tra logs khi gửi SMS:
   ```
   ✅ [ESMS] Using default/test credentials from code.
   📱 [ESMS] API Key: BB19D3EA... (default)
   📱 [ESMS] Secret Key: 48D7E8E2... (default)
   📱 [ESMS] Brandname: Baotrixemay (test)
   📱 [ESMS] Using POST method
   📱 [ESMS] POST URL: http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/
   📱 [ESMS] Payload: { ... }
   📱 [ESMS] Response: { CodeResult: '100', ... }
   ✅ [ESMS] SMS sent successfully
   ```

### **3. Test từ Frontend:**

Sử dụng test utility trong browser console:

```javascript
// Load test-email-esms-service.js vào browser
await emailESMSTester.testRequestSMSOTP("0559018408");
```

## 🔍 Troubleshooting

### **Vấn đề 1: CodeResult '101' - Authorize Failed**

**Triệu chứng:**
```
❌ [ESMS] SMS failed: { CodeResult: '101', ErrorMessage: 'Authorize Failed' }
```

**Nguyên nhân:**
- API Key hoặc Secret Key không đúng
- Credentials chưa được cấu hình đúng

**Giải pháp:**
1. Kiểm tra `ESMS_API_KEY` và `ESMS_SECRET_KEY` có đúng không
2. Đảm bảo API Key và Secret Key **khác nhau**
3. Kiểm tra không có spaces hoặc ký tự đặc biệt
4. Kiểm tra tài khoản ESMS còn hoạt động không
5. Sử dụng credentials mặc định trong code nếu chưa có

### **Vấn đề 2: CodeResult '102' - Insufficient Balance**

**Triệu chứng:**
```
❌ [ESMS] SMS failed: { CodeResult: '102', ErrorMessage: 'Insufficient balance' }
```

**Nguyên nhân:**
- Tài khoản ESMS không đủ số dư

**Giải pháp:**
1. Đăng nhập vào tài khoản ESMS
2. Kiểm tra số dư
3. Nạp tiền vào tài khoản nếu cần
4. Liên hệ ESMS: 0901.888.484

### **Vấn đề 3: CodeResult '103' - Invalid Brandname**

**Triệu chứng:**
```
❌ [ESMS] SMS failed: { CodeResult: '103', ErrorMessage: 'Invalid brandname' }
```

**Nguyên nhân:**
- Brandname chưa được đăng ký
- Brandname không đúng

**Giải pháp:**
1. Kiểm tra Brandname có đúng không
2. Sử dụng Brandname test: `Baotrixemay` (chỉ để test)
3. Đăng ký Brandname với ESMS cho production (liên hệ: 0901.888.484)

### **Vấn đề 4: POST Method Fail, GET Method Success**

**Triệu chứng:**
```
❌ [ESMS] Axios error: { code: 'ETIMEDOUT', ... }
🔄 [ESMS] POST method failed. Trying GET method as fallback...
✅ [ESMS] GET method succeeded
```

**Nguyên nhân:**
- POST URL có thể không hoạt động
- Network/firewall issues

**Giải pháp:**
1. Code đã tự động fallback sang GET method ✅
2. Set `ESMS_USE_GET=true` để dùng GET method mặc định
3. Kiểm tra URL có đúng không

### **Vấn đề 5: Invalid Phone Format**

**Triệu chứng:**
```
❌ [ESMS] SMS failed: { CodeResult: 'INVALID_PHONE_FORMAT', ErrorMessage: 'Số điện thoại không đúng định dạng...' }
```

**Nguyên nhân:**
- Phone number không đúng format
- Không bắt đầu bằng 0
- Không có 10-11 chữ số

**Giải pháp:**
1. Phone number phải bắt đầu bằng 0
2. Phone number phải có 10-11 chữ số
3. Code sẽ tự động normalize (loại bỏ spaces, dashes)

## 📊 Monitoring

### **Logs Quan Trọng:**

#### **Khi Gửi SMS Thành Công:**

```
📱 [ESMS] Sending OTP to phone: 0559018408
✅ [ESMS] Using default/test credentials from code.
📱 [ESMS] Config: { smsType: '2', apiUrl: '...', method: 'POST' }
📱 [ESMS] Payload: { ApiKey: 'BB19D3EA...', SecretKey: '***', Content: '...', Phone: '0559018408', Brandname: 'Baotrixemay', SmsType: '2' }
📱 [ESMS] Using POST method
📱 [ESMS] POST URL: http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/
📱 [ESMS] Response: { CodeResult: '100', ... }
✅ [ESMS] SMS sent successfully
```

#### **Nếu Có Lỗi:**

```
❌ [ESMS] SMS failed: { CodeResult: '101', ErrorMessage: 'Authorize Failed' }
❌ [ESMS] Authorize Failed - Check API credentials
```

#### **Nếu POST Fail và Fallback GET:**

```
❌ [ESMS] Axios error: { code: 'ETIMEDOUT', ... }
🔄 [ESMS] POST method failed. Trying GET method as fallback...
📱 [ESMS] Fallback: Using GET method
📱 [ESMS] GET URL: http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_get?...
✅ [ESMS] GET method succeeded
✅ [ESMS] SMS sent successfully
```

## ✅ Checklist

### **ESMS Service:**

- [x] Cập nhật credentials mặc định (API Key và Secret Key)
- [x] Hỗ trợ cả POST và GET method
- [x] Auto fallback từ POST sang GET
- [x] Normalize phone number
- [x] Validate phone number format
- [x] Format SMS content theo yêu cầu ESMS
- [x] Error handling chi tiết
- [x] Logging chi tiết
- [ ] Test trên Render.com
- [ ] Verify SMS được gửi thành công

### **Environment Variables:**

- [x] `ESMS_API_KEY` được set mặc định
- [x] `ESMS_SECRET_KEY` được set mặc định
- [x] `ESMS_BRANDNAME` được set mặc định (`Baotrixemay`)
- [x] `ESMS_SMS_TYPE` được set mặc định (`2`)
- [ ] `ESMS_USE_GET` (optional, default: false)

## 🚀 Next Steps

1. **Deploy Code Mới:**
   - Code đã được cập nhật với credentials mới
   - Hỗ trợ cả POST và GET method
   - Auto fallback từ POST sang GET

2. **Test ESMS Service:**
   - Test gửi SMS trên Render.com
   - Kiểm tra logs không có lỗi Authorize Failed
   - Verify SMS được gửi thành công (CodeResult: '100')

3. **Monitor Logs:**
   - Theo dõi logs khi gửi SMS
   - Kiểm tra CodeResult trong response
   - Verify không có lỗi

## 💡 Tips

1. **Credentials:**
   - API Key và Secret Key đã được set mặc định trong code
   - Có thể override bằng environment variables
   - Đảm bảo API Key và Secret Key **khác nhau**

2. **POST vs GET:**
   - Mặc định sử dụng POST method
   - Tự động fallback sang GET nếu POST fail
   - Set `ESMS_USE_GET=true` để dùng GET method mặc định

3. **Brandname:**
   - Sử dụng Brandname test: `Baotrixemay` (chỉ để test)
   - Đăng ký Brandname với ESMS cho production
   - Liên hệ: 0901.888.484

4. **SMS Content:**
   - Format: `${otp} la ma xac minh dang ky ${ESMS_BRANDNAME} cua ban`
   - Phải theo đúng format yêu cầu của ESMS
   - Không thay đổi format khi dùng Brandname test

5. **Phone Number:**
   - Phải bắt đầu bằng 0
   - Phải có 10-11 chữ số
   - Code sẽ tự động normalize (loại bỏ spaces, dashes)

## 📝 API Usage

### **Backend (Node.js):**

```javascript
const { sendOtpSms } = require('./services/esms.service');

// Gửi OTP SMS
const result = await sendOtpSms('0559018408', '1234');

if (result.success && result.CodeResult === '100') {
  console.log('SMS sent successfully');
} else {
  console.error('SMS failed:', result.ErrorMessage);
}
```

### **Response Format:**

```javascript
// Success
{
  CodeResult: '100',
  ErrorMessage: '',
  success: true,
  // ... other fields
}

// Error
{
  CodeResult: '101',
  ErrorMessage: 'Lỗi xác thực API. Vui lòng kiểm tra ESMS_API_KEY và ESMS_SECRET_KEY.',
  success: false
}
```

## 🆘 Support

Nếu vẫn gặp vấn đề:

1. Kiểm tra logs chi tiết
2. Kiểm tra credentials có đúng không
3. Kiểm tra tài khoản ESMS có đủ số dư không
4. Kiểm tra Brandname đã được đăng ký chưa
5. Liên hệ ESMS: 0901.888.484

## 🔗 Related Files

- Backend: `services/esms.service.js` - ESMS Service implementation
- Frontend: `public/test-email-esms-service.js` - Test utility
- Frontend: `public/AdminServices.js` - Error handling cho ESMS errors



