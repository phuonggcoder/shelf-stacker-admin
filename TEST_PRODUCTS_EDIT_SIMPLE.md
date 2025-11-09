# 🧪 TEST PRODUCTS EDIT - HƯỚNG DẪN ĐƠN GIẢN

## 🎯 Mục Tiêu

Test xem chức năng cập nhật sản phẩm có hoạt động không.

---

## 📋 BƯỚC 1: Mở Modal Edit

1. **Vào trang:** http://localhost:3000/products
2. **Tìm một sản phẩm bất kỳ** trong bảng
3. **Click nút "Sửa"** (icon bút chì) trên sản phẩm đó
4. **Kiểm tra:** Modal "Sửa sách" có mở không?

### ✅ Nếu Modal MỞ:

- Tiếp tục Bước 2

### ❌ Nếu Modal KHÔNG mở:

- Mở Console (F12)
- Xem có lỗi màu đỏ không
- Chạy command này:
  ```javascript
  // Get first product ID
  const firstRow = document.querySelector("#products-table tbody tr");
  const editBtn = firstRow?.querySelector('button[onclick*="editBook"]');
  const onclick = editBtn?.getAttribute("onclick");
  const match = onclick?.match(/editBook\('([^']+)'\)/);
  if (match) {
    console.log("Testing with book ID:", match[1]);
    editBook(match[1]);
  }
  ```

---

## 📋 BƯỚC 2: Test Save Button

**Sau khi modal đã mở:**

1. **Thay đổi một field** (ví dụ: Stock = 999)
2. **Mở Console (F12)** nếu chưa mở
3. **Click nút "Lưu"**
4. **Quan sát:**

### ✅ Nếu HOẠT ĐỘNG:

- Button text đổi thành "Đang cập nhật..."
- Button bị disable (không click được)
- Console hiện logs:
  ```
  📚 Save button clicked - triggering form submit
  📚 Form submit triggered for book: ...
  📚 Calling AdminServices.updateBook...
  ```
- Sau đó modal đóng và danh sách refresh

### ❌ Nếu KHÔNG hoạt động:

- Button không disable
- Không có logs trong console
- Modal không đóng

**Chạy command này để check:**

```javascript
const modal = document.querySelector(".admin-modal-overlay");
const saveBtn = modal?.querySelector(".admin-modal-footer .btn-primary");
console.log("Modal:", !!modal);
console.log("Save button:", !!saveBtn);
console.log("Button onclick:", saveBtn?.getAttribute("onclick"));
console.log("Button disabled:", saveBtn?.disabled);

// Test click
saveBtn?.click();
```

---

## 🔍 DEBUG COMMANDS

### Command 1: Check Modal Structure

```javascript
const modal = document.querySelector(".admin-modal-overlay");
if (modal) {
  console.log("✅ Modal found");
  console.log("Form:", modal.querySelector("form"));
  console.log(
    "Save button:",
    modal.querySelector(".admin-modal-footer .btn-primary")
  );
} else {
  console.log('❌ Modal not found - click "Sửa" first!');
}
```

### Command 2: Test Edit Function Directly

```javascript
// Get any book ID from table
const editBtn = document.querySelector('button[onclick*="editBook"]');
const onclick = editBtn?.getAttribute("onclick");
const bookId = onclick?.match(/editBook\('([^']+)'\)/)?.[1];
if (bookId) {
  console.log("Testing editBook with ID:", bookId);
  editBook(bookId);
} else {
  console.log("❌ Could not find book ID");
}
```

### Command 3: Test Save Button Manually

```javascript
const modal = document.querySelector(".admin-modal-overlay");
const form = modal?.querySelector("form");
const saveBtn = modal?.querySelector(".admin-modal-footer .btn-primary");

if (modal && form && saveBtn) {
  console.log("✅ All elements found");

  // Change stock value
  const stockInput = form.querySelector('input[name="stock"]');
  if (stockInput) {
    stockInput.value = "999";
    console.log("Stock changed to 999");
  }

  // Click save button
  console.log("Clicking save button...");
  saveBtn.click();
} else {
  console.log("❌ Missing elements:", {
    modal: !!modal,
    form: !!form,
    saveBtn: !!saveBtn,
  });
}
```

### Command 4: Test API Directly

```javascript
// Get book ID
const editBtn = document.querySelector('button[onclick*="editBook"]');
const bookId = editBtn
  ?.getAttribute("onclick")
  ?.match(/editBook\('([^']+)'\)/)?.[1];

if (bookId) {
  // Test update
  const formData = new FormData();
  formData.append("stock", "999");

  console.log("Testing API update with book ID:", bookId);
  window.AdminServices.updateBook(bookId, formData)
    .then((result) => {
      console.log("✅ API update successful:", result);
    })
    .catch((error) => {
      console.error("❌ API update failed:", error);
    });
} else {
  console.log("❌ Could not find book ID");
}
```

---

## 📊 EXPECTED CONSOLE LOGS

### When Modal Opens:

```
📚 showEditBookModal called with bookId: ...
📚 Book data loaded: {id: "...", title: "..."}
📚 Categories loaded: 18
📚 Form created: true
📚 Edit modal setup: {
    formFound: true,
    saveBtnFound: true,
    cancelBtnFound: true,
    bookId: "..."
}
```

### When Save Button Clicked:

```
📚 Save button clicked - triggering form submit
📚 Form submit triggered for book: ...
📚 FormData contents (update): [...]
📚 Updating book ID: ...
✅ Save button disabled
📚 Calling AdminServices.updateBook...
✅ Book updated successfully: {...}
```

### On Error:

```
❌ Error updating book: Error: ...
Error details: {...}
```

---

## 🚨 TROUBLESHOOTING

### Problem 1: Modal Doesn't Open

**Symptoms:** Click "Sửa" but nothing happens

**Check:**

```javascript
// Check if function exists
console.log("editBook:", typeof editBook);
console.log("showEditBookModal:", typeof showEditBookModal);

// Check for errors
// Look for red errors in console
```

**Fix:**

- Refresh page (Ctrl+Shift+R)
- Check console for errors
- Verify AdminServices is loaded

### Problem 2: Save Button Doesn't Work

**Symptoms:** Modal opens but "Lưu" button does nothing

**Check:**

```javascript
const modal = document.querySelector(".admin-modal-overlay");
const saveBtn = modal?.querySelector(".admin-modal-footer .btn-primary");
console.log("Save button:", saveBtn);
console.log("Has onclick:", saveBtn?.hasAttribute("onclick"));
```

**Fix:**

- Already fixed in code - refresh page
- Check if button has inline onclick (should NOT have)
- Verify event handler is attached

### Problem 3: API Call Fails

**Symptoms:** Button works but update fails

**Check:**

```javascript
// Test API
window.AdminServices.updateBook("BOOK_ID", new FormData())
  .then((r) => console.log("✅ API works"))
  .catch((e) => console.error("❌ API error:", e));
```

**Fix:**

- Check token: `localStorage.getItem('authToken')`
- Check network tab for API response
- Verify book ID is correct

---

## ✅ CHECKLIST

Test và đánh dấu:

- [ ] Modal opens when clicking "Sửa"
- [ ] Form fields are populated with book data
- [ ] Can modify fields (stock, price, etc.)
- [ ] Click "Lưu" button
- [ ] Button disables immediately
- [ ] Button text changes to "Đang cập nhật..."
- [ ] Console shows submit logs
- [ ] Modal closes after success
- [ ] Product list refreshes
- [ ] Success toast appears
- [ ] Changes are saved (verify in list)

---

## 📞 REPORT RESULTS

Sau khi test, báo cáo:

1. ✅ Modal có mở không? (Yes/No)
2. ✅ Form có hiển thị không? (Yes/No)
3. ✅ Save button có hoạt động không? (Yes/No)
4. ✅ Có lỗi gì trong console không? (List errors)
5. ✅ Cập nhật có thành công không? (Yes/No)

---

**📅 Created:** 9/11/2025  
**🎯 Purpose:** Simple testing guide for products edit
