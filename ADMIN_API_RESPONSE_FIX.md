# Fix Admin API Response Format

## ✅ Đã Sửa

### 1. Tự động extract `data` từ response

**Vấn đề**: API `/api/admin/statistics/dashboard` trả về format:
```json
{
  "success": true,
  "data": {
    "totalOrders": 100,
    "totalRevenue": 1000000,
    ...
  }
}
```

Nhưng frontend expect format trực tiếp:
```json
{
  "totalOrders": 100,
  "totalRevenue": 1000000,
  ...
}
```

**Giải pháp**: Đã sửa method `request()` trong `AdminServices.js` để tự động extract `data` nếu response có format `{ success: true, data: {...} }`.

### 2. Code đã sửa

**File**: `public/AdminServices.js` và `public/assets/js/admin-services.js`

**Method `request()`**:
```javascript
const data = await response.json().catch(() => ({}));

if (!response.ok) {
    throw new Error(data.message || data.msg || `HTTP ${response.status}: ${response.statusText}`);
}

// Tự động extract data nếu response có format { success: true, data: {...} }
// Hoặc { success: true, data: [...] }
if (data && typeof data === 'object' && data.success === true && 'data' in data) {
    return data.data;
}

return data;
```

## 📋 Format Response Từ Các API

### GET /api/admin/statistics/dashboard

**Backend trả về:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 100,
    "totalRevenue": 1000000,
    "activeUsers": 50,
    "totalUsers": 200,
    "pendingOrders": 5,
    "recentOrders": [...],
    "topSellingBooks": [...],
    "statusStats": {...}
  }
}
```

**AdminServices trả về (sau khi extract):**
```json
{
  "totalOrders": 100,
  "totalRevenue": 1000000,
  "activeUsers": 50,
  "totalUsers": 200,
  "pendingOrders": 5,
  "recentOrders": [...],
  "topSellingBooks": [...],
  "statusStats": {...}
}
```

### GET /api/orders

**Backend trả về:**
```json
{
  "orders": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "pages": 5
}
```

**AdminServices trả về (giữ nguyên):**
```json
{
  "orders": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "pages": 5
}
```

### GET /api/books/admin

**Backend trả về:**
```json
{
  "books": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

**AdminServices trả về (giữ nguyên):**
```json
{
  "books": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### GET /api/categories

**Backend trả về:**
```json
[...]  // Array trực tiếp
```

**AdminServices trả về (giữ nguyên):**
```json
[...]  // Array trực tiếp
```

## 🎯 Cách Sử Dụng

Bây giờ frontend có thể sử dụng trực tiếp:

```javascript
// ✅ ĐÚNG - AdminServices tự động extract data
const stats = await AdminServices.getDashboardStats();
console.log(stats.totalOrders); // Trực tiếp, không cần stats.data.totalOrders
console.log(stats.totalRevenue);
console.log(stats.recentOrders); // Array trực tiếp
```

## 📝 Frontend Code Template

### Dashboard Stats

```javascript
async function loadDashboardStats() {
    try {
        const stats = await AdminServices.getDashboardStats();
        
        // ✅ Trực tiếp sử dụng, không cần stats.data
        document.getElementById('totalOrders').textContent = stats.totalOrders || 0;
        document.getElementById('totalRevenue').textContent = AdminServices.formatCurrency(stats.totalRevenue || 0);
        document.getElementById('activeUsers').textContent = stats.activeUsers || 0;
        document.getElementById('pendingOrders').textContent = stats.pendingOrders || 0;
        
        // Recent orders
        const recentOrders = stats.recentOrders || [];
        if (Array.isArray(recentOrders)) {
            recentOrders.forEach(order => {
                // Render order
            });
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}
```

### Orders

```javascript
async function loadOrders() {
    try {
        const result = await AdminServices.getOrders({ page: 1, limit: 20 });
        const orders = result.orders || [];
        
        if (Array.isArray(orders)) {
            orders.forEach(order => {
                // Render order
            });
        }
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}
```

### Books

```javascript
async function loadBooks() {
    try {
        const result = await AdminServices.getBooks({ page: 1, limit: 20 });
        const books = result.books || [];
        
        if (Array.isArray(books)) {
            books.forEach(book => {
                // Render book
            });
        }
    } catch (error) {
        console.error('Error loading books:', error);
    }
}
```

### Categories

```javascript
async function loadCategories() {
    try {
        const categories = await AdminServices.getCategories();
        const categoriesList = Array.isArray(categories) ? categories : [];
        
        if (Array.isArray(categoriesList)) {
            categoriesList.forEach(category => {
                // Render category
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}
```

## 🧪 Test

### 1. Sử dụng Test Page

Mở `http://localhost:3000/test-admin-api.html` trong browser:
- Click các button để test từng API
- Kiểm tra format response trong console và kết quả hiển thị
- Response sẽ tự động extract `data` nếu có format `{ success: true, data: {...} }`

### 2. Test trong Console

```javascript
// Test dashboard stats
AdminServices.getDashboardStats().then(stats => {
    console.log('Stats:', stats);
    console.log('Total Orders:', stats.totalOrders);
    console.log('Total Revenue:', stats.totalRevenue);
    console.log('Recent Orders:', stats.recentOrders);
});

// Test orders
AdminServices.getOrders({ limit: 5 }).then(result => {
    console.log('Orders:', result.orders);
    console.log('Total:', result.total);
});

// Test books
AdminServices.getBooks({ limit: 5 }).then(result => {
    console.log('Books:', result.books);
    console.log('Pagination:', result.pagination);
});

// Test categories
AdminServices.getCategories().then(categories => {
    console.log('Categories:', categories);
    console.log('Is Array:', Array.isArray(categories));
});
```

## 🔍 Debug

Nếu vẫn không hiển thị dữ liệu:

### 1. Kiểm tra trong Console

```javascript
// Kiểm tra AdminServices
console.log(typeof AdminServices); // Should be "object"
console.log(typeof AdminServices.getDashboardStats); // Should be "function"

// Test API call
AdminServices.getDashboardStats().then(stats => {
    console.log('Stats:', stats);
    console.log('Has totalOrders:', stats.totalOrders !== undefined);
});
```

### 2. Kiểm tra Network Tab trong DevTools

- Mở DevTools > Network
- Reload dashboard
- Kiểm tra request đến `/api/admin/statistics/dashboard`
- Xem response có đúng format không:
  - Nếu có `{ success: true, data: {...} }` → AdminServices sẽ tự động extract
  - Nếu trực tiếp `{ totalOrders: ... }` → AdminServices giữ nguyên

### 3. Kiểm tra Token

```javascript
const token = localStorage.getItem('admin_token') || localStorage.getItem('access_token');
console.log('Token:', token ? 'Found' : 'Not found');
```

### 4. Kiểm tra Lỗi

- Có lỗi CORS không?
- Có lỗi 401/403 không?
- Có lỗi network không?
- Response có đúng format không?

## 📁 Files Đã Sửa

1. ✅ `public/AdminServices.js` - Thêm auto-extract `data` từ response
2. ✅ `public/assets/js/admin-services.js` - Thêm auto-extract `data` từ response
3. ✅ `public/test-admin-api.html` - Tạo file test để debug

## ✅ Kết Quả

- ✅ API có format `{ success: true, data: {...} }` → AdminServices tự động extract `data`
- ✅ API có format trực tiếp → AdminServices giữ nguyên
- ✅ Frontend có thể sử dụng trực tiếp mà không cần `.data`
- ✅ Tương thích với cả 2 format response

