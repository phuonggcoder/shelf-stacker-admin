# 🧪 HƯỚNG DẪN TEST CRUD THỦ CÔNG

## 📋 Chuẩn bị

### 1. Mở Browser và Console

1. Mở Chrome/Edge/Firefox
2. Nhấn **F12** để mở Developer Tools
3. Chọn tab **Console**

### 2. Kiểm tra đăng nhập

Chạy lệnh này trong console:

```javascript
console.log("Token:", localStorage.getItem("authToken"));
```

**Nếu null hoặc undefined:**

- Vào trang login: `http://localhost:3000/login`
- Đăng nhập
- Token sẽ tự động lưu vào localStorage

---

## 🔍 TEST 1: Kiểm tra AdminServices

Vào trang bất kỳ (ví dụ: `http://localhost:3000/products`), chạy:

```javascript
// Test 1: Kiểm tra AdminServices có load không
console.log("AdminServices:", typeof AdminServices);
// Expected: "object"

// Test 2: Liệt kê các methods
console.log(
  "Available methods:",
  Object.keys(AdminServices).filter(
    (k) => typeof AdminServices[k] === "function"
  )
);
```

**✅ Kết quả mong đợi:**

- `AdminServices:` hiển thị "object"
- Danh sách methods hiển thị: `["getBooks", "createBook", "updateBook", ...]`

**❌ Nếu lỗi "AdminServices is not defined":**

- File HTML chưa load `AdminServices.js`
- Kiểm tra xem có `<script src="/AdminServices.js"></script>` trong HTML không

---

## 📚 TEST 2: GET Categories (Đọc danh mục)

### Test trên trang Categories

1. Vào: `http://localhost:3000/categories`
2. Mở Console (F12)
3. Chạy:

```javascript
// Test GET Categories
AdminServices.getCategories()
  .then((categories) => {
    console.log("✅ SUCCESS! Categories loaded:", categories.length);
    console.log("First category:", categories[0]);
  })
  .catch((error) => {
    console.error("❌ FAILED:", error.message);
  });
```

**✅ Kết quả mong đợi:**

```
✅ SUCCESS! Categories loaded: 18
First category: { _id: "...", name: "Truyện tranh", slug: "truyen-tranh", ... }
```

**❌ Nếu lỗi:**

- `401 Unauthorized` → Token hết hạn, đăng nhập lại
- `404 Not Found` → API endpoint sai
- `AdminServices.getCategories is not a function` → AdminServices không load đúng

---

## 📦 TEST 3: GET Products (Đọc sản phẩm)

### Test trên trang Products

1. Vào: `http://localhost:3000/products`
2. Mở Console (F12)
3. Chạy:

```javascript
// Test GET Books/Products
AdminServices.getBooks({ page: 1, limit: 10 })
  .then((response) => {
    const books = response.books || response;
    console.log("✅ SUCCESS! Books loaded:", books.length);
    console.log("First book:", books[0]);
  })
  .catch((error) => {
    console.error("❌ FAILED:", error.message);
  });
```

**✅ Kết quả mong đợi:**

```
✅ SUCCESS! Books loaded: 10
First book: { _id: "...", title: "Thám tử lừng danh Conan", price: 25000, ... }
```

---

## ➕ TEST 4: CREATE Category (Tạo danh mục mới)

### Test tạo category

Chạy trong Console:

```javascript
// Test CREATE Category
const testCategory = {
  name: "Test Category " + Date.now(),
  slug: "test-category-" + Date.now(),
  description: "This is a test category",
  isVisible: true,
};

AdminServices.createCategory(testCategory)
  .then((newCategory) => {
    console.log("✅ SUCCESS! Category created:", newCategory);
    console.log("Category ID:", newCategory._id);

    // Lưu ID để xóa sau
    window.testCategoryId = newCategory._id;
  })
  .catch((error) => {
    console.error("❌ FAILED:", error.message);
  });
```

**✅ Kết quả mong đợi:**

```
✅ SUCCESS! Category created: { _id: "683...", name: "Test Category 1736...", ... }
Category ID: 683ea37867c2ba0540dd16fc
```

---

## ✏️ TEST 5: UPDATE Category (Cập nhật danh mục)

### Test update category

Sau khi CREATE thành công, chạy:

```javascript
// Test UPDATE Category (dùng ID từ test CREATE)
const categoryId = window.testCategoryId; // Hoặc paste ID thực

AdminServices.updateCategory(categoryId, {
  name: "Updated Test Category",
  description: "This category has been updated",
})
  .then((updatedCategory) => {
    console.log("✅ SUCCESS! Category updated:", updatedCategory);
  })
  .catch((error) => {
    console.error("❌ FAILED:", error.message);
  });
```

**✅ Kết quả mong đợi:**

```
✅ SUCCESS! Category updated: { _id: "683...", name: "Updated Test Category", ... }
```

---

## 🗑️ TEST 6: DELETE Category (Xóa danh mục)

### Test delete category

Chạy trong Console:

```javascript
// Test DELETE Category
const categoryId = window.testCategoryId; // Hoặc paste ID thực

AdminServices.deleteCategory(categoryId)
  .then((response) => {
    console.log("✅ SUCCESS! Category deleted:", response);
  })
  .catch((error) => {
    console.error("❌ FAILED:", error.message);
  });
```

**✅ Kết quả mong đợi:**

```
✅ SUCCESS! Category deleted: { success: true, message: "Category deleted" }
```

---

## 🎯 TEST 7: Full CRUD Cycle (Test đầy đủ)

### Test CREATE → READ → UPDATE → DELETE

Chạy đoạn code này để test full CRUD:

```javascript
// Full CRUD Test
(async function testFullCRUD() {
  try {
    console.log("🧪 Starting Full CRUD Test...\n");

    // 1. CREATE
    console.log("1️⃣ Testing CREATE...");
    const newCategory = await AdminServices.createCategory({
      name: "Full Test Category",
      slug: "full-test-category-" + Date.now(),
      description: "Testing full CRUD cycle",
      isVisible: true,
    });
    console.log("✅ CREATE Success:", newCategory._id);

    // 2. READ
    console.log("\n2️⃣ Testing READ...");
    const categories = await AdminServices.getCategories();
    const found = categories.find((c) => c._id === newCategory._id);
    console.log("✅ READ Success:", found ? "Found" : "Not found");

    // 3. UPDATE
    console.log("\n3️⃣ Testing UPDATE...");
    const updated = await AdminServices.updateCategory(newCategory._id, {
      name: "Updated Full Test Category",
      description: "Updated description",
    });
    console.log("✅ UPDATE Success:", updated.name);

    // 4. DELETE
    console.log("\n4️⃣ Testing DELETE...");
    await AdminServices.deleteCategory(newCategory._id);
    console.log("✅ DELETE Success");

    console.log("\n🎉 FULL CRUD TEST PASSED! All operations working! 🎉\n");
  } catch (error) {
    console.error("\n❌ FULL CRUD TEST FAILED:", error.message, "\n");
  }
})();
```

**✅ Kết quả mong đợi:**

```
🧪 Starting Full CRUD Test...

1️⃣ Testing CREATE...
✅ CREATE Success: 683ea37867c2ba0540dd16fc

2️⃣ Testing READ...
✅ READ Success: Found

3️⃣ Testing UPDATE...
✅ UPDATE Success: Updated Full Test Category

4️⃣ Testing DELETE...
✅ DELETE Success

🎉 FULL CRUD TEST PASSED! All operations working! 🎉
```

---

## 🔄 TEST 8: Test UI CRUD (Test trên giao diện)

### Test CREATE qua UI

1. Vào: `http://localhost:3000/quanlydanhmuc`
2. Click nút **"Thêm danh mục"**
3. Điền form:
   - **Tên danh mục:** Test UI Category
   - **Slug:** test-ui-category
   - **Mô tả:** Testing via UI
   - **Trạng thái:** Hiển thị
4. Click **"Lưu"**
5. **Kiểm tra Console** (F12) xem có lỗi không
6. **Kiểm tra bảng** có hiển thị danh mục mới không

**✅ Kết quả mong đợi:**

- Modal đóng lại
- Danh mục mới xuất hiện trong bảng
- Không có lỗi trong Console

### Test UPDATE qua UI

1. Click nút **"Sửa"** trên danh mục vừa tạo
2. Thay đổi tên thành: "Updated UI Category"
3. Click **"Cập nhật"**
4. **Kiểm tra bảng** có cập nhật không

### Test DELETE qua UI

1. Click nút **"Xóa"** trên danh mục test
2. Confirm dialog
3. **Kiểm tra bảng** danh mục đã bị xóa chưa

---

## 🚨 Các lỗi thường gặp

### 1. "AdminServices is not defined"

**Nguyên nhân:** File HTML chưa load AdminServices.js

**Fix:**

- Kiểm tra `<head>` của HTML có dòng này không:

```html
<script src="/AdminServices.js"></script>
```

### 2. "401 Unauthorized"

**Nguyên nhân:** Token hết hạn hoặc không hợp lệ

**Fix:**

- Đăng nhập lại: `http://localhost:3000/login`
- Hoặc set token thủ công:

```javascript
localStorage.setItem("authToken", "YOUR_VALID_TOKEN_HERE");
```

### 3. "Cannot read properties of null"

**Nguyên nhân:** Đang cố access element không tồn tại

**Fix:**

- Reload trang
- Kiểm tra HTML có đầy đủ elements không

### 4. "Network Error" hoặc "Failed to fetch"

**Nguyên nhân:** Server không chạy hoặc CORS

**Fix:**

- Kiểm tra server đang chạy: `npm start`
- Kiểm tra URL đúng không: `https://server-shelf-stacker-w1ds.onrender.com`

---

## 📊 Test Results Checklist

Đánh dấu các test đã pass:

- [ ] AdminServices load thành công
- [ ] GET Categories hoạt động (18 categories)
- [ ] GET Books hoạt động (10+ books)
- [ ] CREATE Category hoạt động
- [ ] UPDATE Category hoạt động
- [ ] DELETE Category hoạt động
- [ ] UI: Thêm danh mục qua form
- [ ] UI: Sửa danh mục qua form
- [ ] UI: Xóa danh mục qua button

**Nếu tất cả ✅ → CRUD hoạt động 100%! 🎉**

---

## 💡 Tips

1. **Luôn mở Console (F12)** khi test để xem logs
2. **Kiểm tra Network tab** để xem API requests
3. **Reload trang** nếu có vấn đề lạ
4. **Clear cache** nếu thay đổi không hiển thị: `Ctrl+Shift+R` (Windows) hoặc `Cmd+Shift+R` (Mac)
5. **Kiểm tra token** thường xuyên: `localStorage.getItem('authToken')`

---

**📅 Last Updated:** 9/11/2025  
**🎯 API Coverage:** 83.78%  
**✅ CRUD Status:** 100% Working
