# AdminServices.js - Debug và Fix Guide

## ✅ Đã Sửa

### 1. File Wrapper AdminServices.js
- **Vấn đề**: File wrapper load async nên AdminServices chưa sẵn sàng khi code khác chạy
- **Giải pháp**: Copy toàn bộ code từ `public/assets/js/admin-services.js` vào `public/AdminServices.js`
- **Kết quả**: AdminServices sẵn sàng ngay sau khi script load (synchronous)

### 2. Response Format - Orders
- **Vấn đề**: API `/api/orders` trả về `{ orders: [...], total, page, limit }` nhưng code dùng `response.data`
- **Đã sửa**:
  - `admin-dashboard.js`: `orders.data` → `orders.orders`
  - `admin-orders.js`: `response.data` → `response.orders`

### 3. Response Format - Books
- **Vấn đề**: API `/api/books` trả về `{ books: [...], pagination: {...} }` nhưng code dùng `response.data`
- **Đã sửa**: `admin-products.js`: `response.data` → `response.books`

### 4. Response Format - Categories
- **Vấn đề**: API `/api/categories` có thể trả về array trực tiếp hoặc object
- **Đã sửa**: Tất cả các file sử dụng categories đều xử lý cả 2 trường hợp:
  ```javascript
  const categoriesList = Array.isArray(response) 
    ? response 
    : (response.categories || response.data || []);
  ```

## 📋 Response Format Từ API

### GET /api/orders
```json
{
  "orders": [...],  // Array orders
  "total": 100,
  "page": 1,
  "limit": 20,
  "pages": 5
}
```

### GET /api/books
```json
{
  "books": [...],  // Array books
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```
Hoặc:
```json
{
  "books": [...],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

### GET /api/categories
```json
[...]  // Array trực tiếp
```
Hoặc:
```json
{
  "categories": [...]
}
```

## 🔧 Cách Sử Dụng Đúng

### Load Orders
```javascript
async function loadOrders() {
    try {
        const response = await AdminServices.getOrders({ page: 1, limit: 20 });
        // API trả về { orders: [...], total, page, limit }
        const orders = response.orders || response.data || (Array.isArray(response) ? response : []);
        
        if (Array.isArray(orders) && orders.length > 0) {
            orders.forEach(order => {
                // Process order
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
```

### Load Books
```javascript
async function loadBooks() {
    try {
        const response = await AdminServices.getBooks({ page: 1, limit: 20 });
        // API trả về { books: [...], pagination: {...} }
        const books = response.books || response.data || (Array.isArray(response) ? response : []);
        
        if (Array.isArray(books) && books.length > 0) {
            books.forEach(book => {
                // Process book
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
```

### Load Categories
```javascript
async function loadCategories() {
    try {
        const response = await AdminServices.getCategories();
        // API có thể trả về array trực tiếp hoặc { categories: [...] }
        const categories = Array.isArray(response) 
            ? response 
            : (response.categories || response.data || []);
        
        if (Array.isArray(categories) && categories.length > 0) {
            categories.forEach(category => {
                // Process category
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
```

## ✅ Kiểm Tra

Sau khi sửa, kiểm tra trong Console:

```javascript
// 1. Kiểm tra AdminServices đã load
console.log(typeof AdminServices); // Should be "object"

// 2. Kiểm tra các function
console.log(typeof AdminServices.getBooks); // Should be "function"
console.log(typeof AdminServices.getCategories); // Should be "function"
console.log(typeof AdminServices.getOrders); // Should be "function"

// 3. Test API call
AdminServices.getOrders({ limit: 5 }).then(result => {
    console.log('Orders response:', result);
    console.log('Orders array:', result.orders);
});
```

## 📝 Files Đã Sửa

1. `public/AdminServices.js` - Copy từ `admin-services.js` để load đồng bộ
2. `public/assets/js/admin-dashboard.js` - Sửa response format cho orders
3. `public/assets/js/admin-orders.js` - Sửa response format cho orders
4. `public/assets/js/admin-products.js` - Sửa response format cho books và categories
5. `public/assets/js/admin-categories.js` - Sửa response format cho categories

## 🚀 Sử Dụng

Thêm script tag vào HTML:

```html
<script src="/AdminServices.js"></script>
```

Sau đó có thể sử dụng ngay:

```javascript
// Không cần đợi event, AdminServices sẵn sàng ngay
const stats = await AdminServices.getDashboardStats();
const orders = await AdminServices.getOrders({ limit: 10 });
const books = await AdminServices.getBooks({ page: 1 });
const categories = await AdminServices.getCategories();
```

