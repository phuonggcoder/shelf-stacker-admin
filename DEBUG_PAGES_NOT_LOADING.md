# Debug - Các Trang Không Load Được Data

## ✅ Đã Sửa

### 1. Thêm Logging Chi Tiết

Đã thêm console.log vào tất cả các bước:
- Pathname check
- AdminServices ready check
- Page initialization
- Data loading
- DOM rendering

### 2. Sửa Pathname Check

Thay vì chỉ check `pathname === '/products'`, giờ check linh hoạt hơn:
```javascript
if (pathname === '/products' || pathname.includes('/products') || pathname.endsWith('products.html'))
```

### 3. Thêm Error Handling

Kiểm tra `typeof showToast === 'function'` trước khi gọi để tránh lỗi.

## 🔍 Cách Debug

### Bước 1: Mở Console và Kiểm Tra Logs

Khi mở trang `/products`, `/orders`, hoặc `/categories`, bạn sẽ thấy:

**Products Page:**
```
📚 Products page - pathname: /products
📚 Initializing products page...
📚 AdminServices ready, initializing page...
📚 initProductsPage called
📚 Loading categories first...
📁 Loading categories...
📁 Categories response received: [...]
📁 Categories array: 18 items
📚 Categories loaded, setting up event listeners...
📚 Event listeners setup, loading products...
📚 Loading books with params: {...}
📚 Books response received: {...}
📚 renderProducts called with X products
```

**Orders Page:**
```
📦 Orders page - pathname: /orders
📦 Initializing orders page...
📦 AdminServices ready, initializing page...
📦 initOrdersPage called
📦 Event listeners setup, loading orders...
📦 Loading orders with params: {...}
📦 Orders response received: {...}
📦 renderOrders called with X orders
```

**Categories Page:**
```
📁 Categories page - pathname: /categories
📁 Initializing categories page...
📁 AdminServices ready, initializing page...
📁 initCategoriesPage called
📁 Event listeners setup, loading categories...
📁 Loading categories...
📁 Categories response received: [...]
📁 Categories array: 18 items
📁 renderCategoriesTree called with 18 categories
📁 renderCategoriesTable called with 18 categories
```

### Bước 2: Nếu Không Thấy Logs

Nếu không thấy log "Initializing...", có nghĩa là:
- Pathname check không match
- Hoặc code không chạy

**Kiểm tra pathname:**
```javascript
console.log('Current pathname:', window.location.pathname);
console.log('Full URL:', window.location.href);
```

### Bước 3: Nếu Thấy "Not on X page"

Có nghĩa là pathname không match. Sửa pathname check hoặc kiểm tra URL thực tế.

### Bước 4: Nếu Thấy "Error waiting for AdminServices"

Có nghĩa là AdminServices không load được. Kiểm tra:
- Script tag có đúng không?
- File `admin-services.js` có load không?
- Có lỗi JavaScript nào không?

### Bước 5: Nếu Thấy "Loading..." nhưng không thấy "received"

Có nghĩa là API call bị lỗi. Kiểm tra:
- Network tab xem request có được gửi không?
- Response status code là gì?
- Có lỗi CORS không?
- Token có hợp lệ không?

## 🐛 Các Lỗi Thường Gặp

### 1. "Not on X page, skipping initialization"

**Nguyên nhân**: Pathname không match

**Giải pháp**: 
- Kiểm tra URL thực tế: `console.log(window.location.pathname)`
- Sửa pathname check nếu cần

### 2. "AdminServices không sẵn sàng sau 5000ms"

**Nguyên nhân**: 
- Script chưa load
- Hoặc có lỗi JavaScript

**Giải pháp**:
- Kiểm tra Network tab xem `admin-services.js` có load không
- Kiểm tra Console có lỗi JavaScript không
- Clear cache và reload

### 3. "Error loading X" trong try-catch

**Nguyên nhân**: 
- API call thất bại
- Response format không đúng
- Token không hợp lệ

**Giải pháp**:
- Xem error message chi tiết trong console
- Kiểm tra Network tab xem request/response
- Kiểm tra token

## 📋 Checklist Debug

Khi mở trang `/products`:
- [ ] Console có log "📚 Products page - pathname:"
- [ ] Console có log "📚 Initializing products page..."
- [ ] Console có log "📚 AdminServices ready"
- [ ] Console có log "📚 initProductsPage called"
- [ ] Console có log "📚 Loading categories first..."
- [ ] Console có log "📁 Categories response received:"
- [ ] Console có log "📚 Loading books with params:"
- [ ] Console có log "📚 Books response received:"
- [ ] Console có log "📚 renderProducts called"
- [ ] Data hiển thị trên trang

Khi mở trang `/orders`:
- [ ] Console có log "📦 Orders page - pathname:"
- [ ] Console có log "📦 Initializing orders page..."
- [ ] Console có log "📦 AdminServices ready"
- [ ] Console có log "📦 initOrdersPage called"
- [ ] Console có log "📦 Loading orders with params:"
- [ ] Console có log "📦 Orders response received:"
- [ ] Console có log "📦 renderOrders called"
- [ ] Data hiển thị trên trang

Khi mở trang `/categories`:
- [ ] Console có log "📁 Categories page - pathname:"
- [ ] Console có log "📁 Initializing categories page..."
- [ ] Console có log "📁 AdminServices ready"
- [ ] Console có log "📁 initCategoriesPage called"
- [ ] Console có log "📁 Loading categories..."
- [ ] Console có log "📁 Categories response received:"
- [ ] Console có log "📁 renderCategoriesTree called"
- [ ] Console có log "📁 renderCategoriesTable called"
- [ ] Data hiển thị trên trang

## 🔧 Files Đã Sửa

1. ✅ `public/assets/js/admin-orders.js` - Thêm logging, sửa pathname check
2. ✅ `public/assets/js/admin-products.js` - Thêm logging, sửa pathname check
3. ✅ `public/assets/js/admin-categories.js` - Thêm logging, sửa pathname check

## 🚀 Test Lại

1. **Clear cache**: Ctrl+Shift+R
2. **Mở Console**: F12 > Console
3. **Mở từng trang**:
   - `/products`
   - `/orders`
   - `/categories`
4. **Kiểm tra logs**: Xem có đầy đủ logs không
5. **Kiểm tra data**: Xem data có hiển thị không

## 💡 Tips

1. **Luôn mở Console** khi debug
2. **Kiểm tra pathname** nếu không thấy "Initializing..."
3. **Kiểm tra Network tab** nếu không thấy "received"
4. **Copy logs** và gửi nếu vẫn không hoạt động

