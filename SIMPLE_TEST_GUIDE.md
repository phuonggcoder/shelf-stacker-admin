# 🎯 HƯỚNG DẪN TEST ĐƠN GIẢN

## Vấn đề đã phát hiện

Script test cũ có lỗi: Nó dùng `Object.keys(AdminServices)` để kiểm tra methods.  
❌ **SAI** vì: Methods của JavaScript class nằm trong **prototype**, không phải trong `Object.keys()`!

## ✅ Cách test ĐÚNG

### Bước 1: Mở Console
1. Vào http://localhost:3000/products
2. Nhấn **F12**
3. Chọn tab **Console**

### Bước 2: Test nhanh

Copy và paste từng lệnh sau:

```javascript
// Test 1: Kiểm tra AdminServices (ĐÚNG CÁCH)
console.log('AdminServices exists:', typeof window.AdminServices);
console.log('getCategories is a function:', typeof window.AdminServices.getCategories === 'function');
console.log('getBooks is a function:', typeof window.AdminServices.getBooks === 'function');
```

**Kết quả mong đợi:**
```
AdminServices exists: object
getCategories is a function: true
getBooks is a function: true
```

**Nếu kết quả là `false` hoặc `undefined`**, chạy:

```javascript
// Kiểm tra file AdminServices.js có load không
console.log('All loaded scripts:', 
    Array.from(document.scripts).map(s => s.src).filter(src => src.includes('Admin'))
);
```

### Bước 3: Test CRUD đơn giản

```javascript
// Test GET Categories
window.AdminServices.getCategories()
    .then(categories => {
        console.log('✅ SUCCESS! Categories:', categories.length);
        console.log('First category:', categories[0]);
    })
    .catch(error => {
        console.error('❌ FAILED:', error.message);
    });
```

**Kết quả mong đợi:**
```
✅ SUCCESS! Categories: 18
First category: { _id: "...", name: "Truyện tranh", ... }
```

### Bước 4: Test CREATE (tạo mới)

```javascript
// Test CREATE Category
window.AdminServices.createCategory({
    name: 'Test ' + Date.now(),
    slug: 'test-' + Date.now(),
    description: 'Test',
    isVisible: true
})
.then(newCat => {
    console.log('✅ CREATED:', newCat._id);
    // Xóa ngay để cleanup
    return window.AdminServices.deleteCategory(newCat._id);
})
.then(() => console.log('✅ DELETED (cleanup done)'))
.catch(err => console.error('❌ FAILED:', err.message));
```

**Kết quả mong đợi:**
```
✅ CREATED: 683ea37867c2ba0540dd16fc
✅ DELETED (cleanup done)
```

---

## 🚀 Script Test Tự Động (Phiên bản Fixed)

### Cách dùng:
1. Vào http://localhost:3000/products
2. Nhấn F12 → Console
3. Copy **TOÀN BỘ** file `test-crud-fixed.js`
4. Paste vào Console
5. Nhấn Enter

Script sẽ tự động test:
- ✅ AdminServices có tồn tại không
- ✅ Các methods có đúng không (kiểm tra ĐÚNG CÁCH qua prototype)
- ✅ GET Categories
- ✅ GET Books
- ✅ GET Orders
- ✅ CREATE Category (và tự động xóa sau khi test)

---

## 🔴 Nếu vẫn lỗi "is not a function"

### Kiểm tra 1: File có load không?

```javascript
// Kiểm tra tất cả script tags
Array.from(document.scripts).forEach(script => {
    console.log(script.src || script.textContent.substring(0, 50));
});
```

Phải có dòng chứa `/AdminServices.js` hoặc `public/AdminServices.js`

### Kiểm tra 2: File có lỗi runtime không?

```javascript
// Xem console có báo lỗi khi load AdminServices không
// Scroll lên đầu console log xem có errors màu đỏ không
```

### Kiểm tra 3: AdminServices có bị ghi đè không?

```javascript
// Kiểm tra constructor
console.log('Constructor:', window.AdminServices?.constructor?.name);
// Phải là: "AdminServices"

// Kiểm tra prototype
console.log('Has prototype methods:', 
    Object.getOwnPropertyNames(Object.getPrototypeOf(window.AdminServices))
        .filter(m => m !== 'constructor').length > 0
);
// Phải là: true
```

---

## 🎯 Test UI (Test trên giao diện)

### Test Categories Page
1. Vào: http://localhost:3000/quanlydanhmuc
2. Mở Console (F12)
3. Click "Thêm danh mục"
4. Điền form và click "Lưu"
5. **Xem Console** có lỗi không

**Lỗi thường gặp:**
- `AdminServices is not defined` → HTML chưa load AdminServices.js
- `401 Unauthorized` → Token hết hạn, đăng nhập lại
- `Cannot read properties of null` → JavaScript chạy trước khi DOM load xong

---

## 📞 Debug Commands

Nếu bạn báo lỗi cho tôi, hãy chạy commands sau và gửi kết quả:

```javascript
// 1. Kiểm tra AdminServices
console.log({
    exists: typeof window.AdminServices,
    constructor: window.AdminServices?.constructor?.name,
    getCategoriesType: typeof window.AdminServices?.getCategories,
    getBooksType: typeof window.AdminServices?.getBooks,
    token: !!localStorage.getItem('authToken')
});

// 2. Thử gọi API
window.AdminServices.getCategories()
    .then(data => console.log('API works! Data:', data))
    .catch(err => console.error('API failed:', err.message));
```

Copy kết quả và gửi cho tôi!

---

**📅 Last Updated:** 9/11/2025  
**🔧 Version:** 2.0 (Fixed)

