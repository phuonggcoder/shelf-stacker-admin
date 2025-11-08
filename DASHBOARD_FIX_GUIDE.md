# Hướng Dẫn Sửa Lỗi Dashboard Không Load Được Dữ Liệu

## Vấn Đề

Dashboard báo lỗi:
- `AdminServices.getDashboardStats is not a function`
- `AdminServices.getOrders is not a function`
- `AdminServices.getRevenueByTime is not a function`
- `AdminServices.getOrderStatistics is not a function`
- `AdminServices.formatCurrency is not a function`

## Nguyên Nhân Có Thể

1. **File admin-services.js không được load đúng**
2. **Lỗi JavaScript trong admin-services.js ngăn AdminServices được khởi tạo**
3. **Thứ tự load script sai**
4. **BASE_URL không đúng**

## Giải Pháp Đã Áp Dụng

### 1. ✅ Sửa admin-dashboard.js

Đã cập nhật tất cả các lời gọi từ `AdminServices` sang `window.AdminServices` để đảm bảo truy cập đúng object.

### 2. ✅ Thêm Error Handling

Thêm kiểm tra `if (!window.AdminServices)` trước mỗi lời gọi để tránh lỗi.

### 3. ✅ Thêm Debug Script

Thêm script debug trong `home.html` để kiểm tra AdminServices có được load không.

## Các Bước Kiểm Tra

### Bước 1: Kiểm Tra Console

Mở Developer Tools (F12) và kiểm tra Console:

```javascript
// Kiểm tra AdminServices có tồn tại không
console.log(window.AdminServices);

// Kiểm tra các method
console.log(typeof window.AdminServices?.getDashboardStats);
console.log(typeof window.AdminServices?.getOrders);
console.log(typeof window.AdminServices?.formatCurrency);
```

### Bước 2: Kiểm Tra Network Tab

1. Mở Network tab trong DevTools
2. Reload trang
3. Kiểm tra xem `admin-services.js` có được load không (status 200)
4. Kiểm tra các API call có được gửi đi không

### Bước 3: Kiểm Tra Token

```javascript
// Trong Console
const token = window.AdminServices?.getToken();
console.log('Token:', token ? token.substring(0, 20) + '...' : 'Không có token');
```

Nếu không có token, cần login lại.

### Bước 4: Test API Trực Tiếp

```javascript
// Test getDashboardStats
window.AdminServices.getDashboardStats()
    .then(data => console.log('✅ Dashboard Stats:', data))
    .catch(err => console.error('❌ Error:', err));
```

## Các Lỗi Thường Gặp

### Lỗi 1: "AdminServices is not defined"

**Nguyên nhân**: File `admin-services.js` không được load hoặc có lỗi JavaScript.

**Giải pháp**:
1. Kiểm tra Network tab xem file có được load không
2. Kiểm tra Console có lỗi JavaScript không
3. Đảm bảo file tồn tại tại `public/assets/js/admin-services.js`

### Lỗi 2: "getDashboardStats is not a function"

**Nguyên nhân**: AdminServices được khởi tạo nhưng method không tồn tại.

**Giải pháp**:
1. Kiểm tra file `admin-services.js` có method `getDashboardStats` không
2. Đảm bảo method được định nghĩa trong class AdminServices
3. Kiểm tra có lỗi syntax trong file không

### Lỗi 3: "401 Unauthorized"

**Nguyên nhân**: Token không hợp lệ hoặc hết hạn.

**Giải pháp**:
1. Login lại để lấy token mới
2. Kiểm tra token có được lưu trong localStorage không:
   ```javascript
   localStorage.getItem('admin_token')
   ```

### Lỗi 4: "Failed to fetch" hoặc "NetworkError"

**Nguyên nhân**: Không thể kết nối đến backend.

**Giải pháp**:
1. Kiểm tra backend có đang chạy không
2. Kiểm tra BASE_URL trong `admin-services.js`:
   ```javascript
   const BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';
   ```
3. Kiểm tra CORS settings trong backend

## Debug Script

Đã tạo file `admin-services-debug.js` để tự động kiểm tra. Thêm vào `home.html` nếu cần:

```html
<script src="/assets/js/admin-services-debug.js"></script>
```

## Kiểm Tra Backend Endpoints

Đảm bảo các endpoint sau tồn tại và hoạt động:

1. ✅ `GET /api/admin/statistics/dashboard` - Đã có trong `router/statisticsRouter.js`
2. ✅ `GET /api/admin/statistics/orders` - Đã có trong `router/statisticsRouter.js`
3. ✅ `GET /api/admin/statistics/revenue/time` - Đã có trong `router/statisticsRouter.js`
4. ✅ `GET /api/orders` - Đã có trong `router/orderRouter.js`

## Test Endpoints Với Postman/curl

```bash
# 1. Test Dashboard Stats
curl -X GET "http://localhost:3000/api/admin/statistics/dashboard" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Test Orders
curl -X GET "http://localhost:3000/api/orders?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Test Revenue by Time
curl -X GET "http://localhost:3000/api/admin/statistics/revenue/time?group_by=day" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Checklist

- [ ] File `admin-services.js` tồn tại tại `public/assets/js/admin-services.js`
- [ ] File được load trong HTML (kiểm tra Network tab)
- [ ] Không có lỗi JavaScript trong Console
- [ ] `window.AdminServices` được định nghĩa (kiểm tra Console)
- [ ] Token được lưu trong localStorage
- [ ] Backend đang chạy và có thể truy cập
- [ ] CORS được cấu hình đúng
- [ ] Các endpoint statistics tồn tại trong backend

## Nếu Vẫn Không Hoạt Động

1. **Clear Cache**: Ctrl+Shift+R (hard reload)
2. **Kiểm tra lại file admin-services.js**: Đảm bảo không có lỗi syntax
3. **Kiểm tra BASE_URL**: Phải đúng với backend URL
4. **Test API trực tiếp**: Sử dụng Postman để test backend
5. **Kiểm tra logs**: Xem backend logs có nhận được request không

## Liên Hệ

Nếu vẫn gặp vấn đề, cung cấp:
1. Console errors (screenshot)
2. Network tab (screenshot)
3. Backend logs
4. Token (đã mask)


