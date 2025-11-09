# 🔧 Troubleshooting Guide - Hướng Dẫn Xử Lý Lỗi

## 🚨 Tại Sao Chưa Thấy Thay Đổi?

Có nhiều lý do tại sao bạn chưa thấy thay đổi. Hướng dẫn này sẽ giúp bạn tìm và fix vấn đề.

---

## 📋 Checklist Nhanh

### ✅ Bước 1: Kiểm Tra Files Đã Được Tạo

```bash
# Kiểm tra file helper
ls public/assets/js/api-response-helpers.js

# Kiểm tra HTML đã thêm script tag
grep -r "api-response-helpers.js" views/
```

**Nếu file không tồn tại**: File chưa được tạo, cần tạo lại.

**Nếu HTML chưa có script tag**: Cần thêm script tag vào HTML.

---

### ✅ Bước 2: Restart Server

**QUAN TRỌNG**: Server cần được restart để load các file mới!

```bash
# 1. Dừng server hiện tại (nhấn Ctrl+C trong terminal)
# 2. Start lại server
npm start

# Hoặc nếu dùng nodemon
npm run dev
```

**Kiểm tra server đã chạy**:

- Xem terminal có hiển thị "Server is running at http://localhost:3000" không
- Mở browser và vào http://localhost:3000

---

### ✅ Bước 3: Clear Browser Cache

**QUAN TRỌNG**: Browser cache có thể giữ file cũ!

#### Cách 1: Hard Refresh

- **Windows/Linux**: `Ctrl + Shift + R` hoặc `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

#### Cách 2: Clear Cache trong DevTools

1. Mở DevTools (F12)
2. Right-click vào nút Refresh
3. Chọn "Empty Cache and Hard Reload"

#### Cách 3: Disable Cache

1. Mở DevTools (F12)
2. Vào tab Network
3. Check "Disable cache"
4. Giữ DevTools mở khi test

---

### ✅ Bước 4: Kiểm Tra Browser Console

Mở Browser Console (F12) và kiểm tra:

#### 1. Kiểm tra Helper Functions:

```javascript
// Trong console, gõ:
typeof window.extractData;
// Kết quả phải là: "function"

typeof window.extractPagination;
// Kết quả phải là: "function"
```

**Nếu kết quả là "undefined"**:

- File `api-response-helpers.js` chưa được load
- Kiểm tra Network tab xem file có load không
- Kiểm tra script tag trong HTML

#### 2. Kiểm tra AdminServices:

```javascript
// Trong console, gõ:
typeof window.AdminServices;
// Kết quả phải là: "object"

typeof window.AdminServices.getOrders;
// Kết quả phải là: "function"
```

**Nếu kết quả là "undefined"**:

- File `AdminServices.js` chưa được load
- Kiểm tra Network tab
- Kiểm tra script tag trong HTML

#### 3. Kiểm tra có lỗi JavaScript không:

- Xem tab Console trong DevTools
- Tìm các lỗi màu đỏ
- Copy và fix các lỗi

---

### ✅ Bước 5: Kiểm Tra Network Tab

Mở DevTools > Network tab:

#### 1. Kiểm tra file đã load:

1. Refresh page (F5)
2. Tìm file `api-response-helpers.js` trong Network tab
3. Kiểm tra:
   - **Status**: Phải là `200` (success)
   - **Type**: Phải là `script`
   - **Size**: Phải > 0

**Nếu Status là `404`**:

- File chưa được tạo hoặc path sai
- Kiểm tra file có tồn tại không
- Kiểm tra server có serve static files không

**Nếu Status là `304` (Not Modified)**:

- Browser đang dùng cache
- Hard refresh (Ctrl + Shift + R)
- Hoặc disable cache trong DevTools

#### 2. Kiểm tra API calls:

1. Filter bằng "XHR" hoặc "Fetch"
2. Tìm các API calls đến backend
3. Kiểm tra:
   - **Status code**: Phải là `200` (success)
   - **Response data**: Xem có data không
   - **Request headers**: Có `Authorization: Bearer <token>` không

**Nếu Status là `401` (Unauthorized)**:

- Token đã hết hạn hoặc sai
- Cần login lại

**Nếu Status là `404` (Not Found)**:

- API endpoint sai
- Kiểm tra API endpoint trong code

**Nếu Status là `500` (Server Error)**:

- Backend có lỗi
- Kiểm tra backend logs

---

### ✅ Bước 6: Test Manual

#### Test Helper Functions:

```javascript
// Mở Browser Console và chạy:

// Test extractData
const testResponse = { orders: [1, 2, 3] };
const result = extractData(testResponse, "orders");
console.log("Test result:", result); // Phải là [1, 2, 3]

// Test extractPagination
const testPagination = { page: 1, limit: 10, total: 100, pages: 10 };
const pagination = extractPagination(testPagination, 1, 10);
console.log("Pagination:", pagination); // Phải có page, limit, total, pages
```

#### Test API:

```javascript
// Mở Browser Console và chạy:
window.AdminServices.getOrders({ page: 1, limit: 10 })
  .then((response) => {
    console.log("✅ API Response:", response);

    // Test extractData
    const orders = extractData(response, "orders");
    console.log("✅ Extracted Orders:", orders);

    // Test extractPagination
    const pagination = extractPagination(response, 1, 10);
    console.log("✅ Extracted Pagination:", pagination);
  })
  .catch((error) => {
    console.error("❌ API Error:", error);
  });
```

---

## 🐛 Common Issues & Solutions

### Issue 1: File Not Found (404)

**Triệu chứng**:

- Network tab hiển thị Status `404` cho `api-response-helpers.js`
- Console hiển thị lỗi "Failed to load resource"

**Nguyên nhân**:

- File chưa được tạo
- File path sai
- Server chưa serve static files đúng

**Giải pháp**:

1. Kiểm tra file có tồn tại: `public/assets/js/api-response-helpers.js`
2. Kiểm tra server có serve từ `public/` folder không (xem `app.js`)
3. Kiểm tra file path trong HTML: phải là `/assets/js/api-response-helpers.js`
4. Restart server

---

### Issue 2: Helper Functions Not Defined

**Triệu chứng**:

- Console hiển thị lỗi "extractData is not defined"
- `typeof window.extractData === "undefined"`

**Nguyên nhân**:

- File chưa được load
- File load sau khi sử dụng
- Có lỗi JavaScript trong file

**Giải pháp**:

1. Kiểm tra script tag đã được thêm chưa
2. Kiểm tra thứ tự load (phải load trước các file khác)
3. Kiểm tra console có lỗi JavaScript không
4. Hard refresh browser
5. Kiểm tra file `api-response-helpers.js` có lỗi syntax không

---

### Issue 3: API Not Returning Data

**Triệu chứng**:

- Orders/Products không hiển thị
- Console hiển thị "No orders found"
- Network tab hiển thị API response rỗng

**Nguyên nhân**:

- API endpoint sai
- Authentication token sai
- Backend API chưa sẵn sàng
- Response format không đúng

**Giải pháp**:

1. Kiểm tra API endpoint trong Network tab
2. Kiểm tra Authorization header có token không
3. Test API trực tiếp bằng Postman/curl
4. Kiểm tra backend logs
5. Xem response format trong Network tab
6. Kiểm tra extractData có extract được data không

---

### Issue 4: Data Not Displaying

**Triệu chứng**:

- API trả về data nhưng UI không hiển thị
- Console không có lỗi
- Table body rỗng

**Nguyên nhân**:

- Response format không đúng
- extractData không extract được data
- renderOrders không render được
- UI elements không tồn tại

**Giải pháp**:

1. Kiểm tra console logs (phải có logs từ loadOrders)
2. Kiểm tra response format trong Network tab
3. Test extractData với response thực tế:
   ```javascript
   // Trong console
   const response = await window.AdminServices.getOrders({
     page: 1,
     limit: 10,
   });
   console.log("Response:", response);
   const orders = extractData(response, "orders");
   console.log("Extracted orders:", orders);
   ```
4. Kiểm tra UI elements có tồn tại không:
   ```javascript
   // Trong console
   const tbody = document.getElementById("ordersTableBody");
   console.log("Table body:", tbody);
   ```
5. Kiểm tra renderOrders function có được gọi không

---

### Issue 5: Settings Not Loading

**Triệu chứng**:

- Settings page không hiển thị data
- Console hiển thị lỗi khi load settings

**Nguyên nhân**:

- API endpoint `/api/admin/settings` chưa sẵn sàng
- Response format không đúng
- Setting keys không khớp

**Giải pháp**:

1. Kiểm tra API endpoint có hoạt động không:
   ```javascript
   // Trong console
   const response = await window.AdminServices.getSettings();
   console.log("Settings response:", response);
   ```
2. Kiểm tra response format
3. Kiểm tra setting keys có khớp không
4. Xem console logs để debug

---

## 🔍 Debug Steps

### Step 1: Verify Files

```bash
# 1. Kiểm tra file helper
ls -la public/assets/js/api-response-helpers.js

# 2. Kiểm tra HTML
grep -n "api-response-helpers.js" views/orders.html
```

### Step 2: Restart Server

```bash
# Dừng server (Ctrl+C)
npm start
```

### Step 3: Clear Cache & Hard Refresh

- Hard refresh: `Ctrl + Shift + R`
- Hoặc disable cache trong DevTools

### Step 4: Check Console

- Mở DevTools (F12)
- Vào tab Console
- Kiểm tra có lỗi không
- Test helper functions

### Step 5: Check Network

- Vào tab Network
- Refresh page
- Kiểm tra file `api-response-helpers.js`
- Kiểm tra API calls

### Step 6: Test Manual

- Test helper functions
- Test API calls
- Test load orders

---

## 🎯 Expected Console Output

### Khi Load Orders:

```
📦 Orders page - pathname: /orders
📦 Initializing orders page...
📦 AdminServices ready, initializing page...
📦 initOrdersPage called
📦 Event listeners setup, loading orders...
📦 Loading orders with params: {page: 1, limit: 10}
📦 Orders response received: {...}
📦 Response type: object
📦 Response keys: ['orders', 'page', 'limit', 'total', 'pages']
📦 Found data in response.orders, length: 10
📦 Extracted pagination from resp directly: {page: 1, limit: 10, total: 100, pages: 10, totalPages: 10}
📦 Extracted orders: 10
📦 Extracted pagination: {page: 1, limit: 10, total: 100, pages: 10, totalPages: 10}
📦 renderOrders called with 10 orders
```

### Khi Load Settings:

```
⚙️ Settings page - pathname: /settings
⚙️ Initializing settings page...
⚙️ AdminServices ready, initializing page...
⚙️ Loading settings...
⚙️ Settings response received: {...}
⚙️ Extracted settings: 15
⚙️ Rendering settings...
⚙️ Rendering general settings: 5
⚙️ Rendering security settings: 3
⚙️ Rendering notification settings: 3
```

---

## 🚀 Quick Fix

Nếu vẫn không hoạt động, thử các bước sau:

1. **Restart Server**:

   ```bash
   # Dừng server (Ctrl+C)
   npm start
   ```

2. **Clear Browser Cache**:

   - Hard refresh: `Ctrl + Shift + R`
   - Hoặc disable cache trong DevTools

3. **Check Console**:

   - Mở DevTools (F12)
   - Xem có lỗi không
   - Copy lỗi và báo lại

4. **Test Manual**:

   - Chạy `QUICK_TEST_SCRIPT.js` trong console
   - Xem kết quả test

5. **Check Network**:
   - Xem file `api-response-helpers.js` có load không
   - Xem API calls có thành công không

---

## 📞 Nếu Vẫn Không Hoạt Động

1. **Kiểm tra Server Logs**:

   - Xem server có chạy không
   - Xem có lỗi gì không

2. **Kiểm tra Browser Console**:

   - Copy tất cả lỗi
   - Copy console logs
   - Báo lại để được hỗ trợ

3. **Kiểm tra Network Tab**:

   - Copy request/response
   - Kiểm tra status codes
   - Kiểm tra headers

4. **Test API Trực Tiếp**:
   - Dùng Postman/curl test API
   - Kiểm tra response format
   - Kiểm tra authentication

---

**Cập nhật**: 2024-12-19
