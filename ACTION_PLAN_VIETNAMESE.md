# 🎯 KẾ HOẠCH HÀNH ĐỘNG - SHELF STACKER ADMIN

**Mục tiêu:** Đưa web lên production với 100% API integration

---

## ✅ ĐÃ XONG (Tự động)

Tôi đã kiểm tra và fix tự động:

1. ✅ **Tạo Global Error Handler** - `global-error-handler.js`
2. ✅ **Tạo Retry Logic** - `retry-helper.js`
3. ✅ **Thêm vào 20 pages** - Tất cả trang đã có helper scripts
4. ✅ **Kiểm tra toàn bộ APIs** - 67/67 APIs có sẵn trong AdminServices
5. ✅ **Tạo reports chi tiết** - 6 files documentation

---

## 📋 CẦN LÀM (3-4 giờ)

### 🔴 PRIORITY 1: Convert 3 Pages (2-3 giờ)

Cần update 3 files sau để dùng AdminServices thay vì fetch():

#### 1. `public/assets/js/quanlydanhmuc.js`

**Thay đổi cần thiết:**

```javascript
// BEFORE
function loadCategories() {
  fetch(BASE_URL + "/api/categories", {
    headers: { Authorization: "Bearer " + getToken() },
  })
    .then((res) => res.json())
    .then((data) => {
      categories = data;
      renderCategoriesWithPagination(categories, catCurrentPage);
    })
    .catch((err) => console.error("Lỗi:", err));
}

// AFTER
async function loadCategories() {
  try {
    categories = await AdminServices.getCategories();
    renderCategoriesWithPagination(categories, catCurrentPage);
  } catch (error) {
    console.error("Lỗi:", error);
    showToast("Không thể tải danh mục: " + error.message, "error");
  }
}
```

**Các functions cần update:**

- `loadCategories()` → Dùng `AdminServices.getCategories()`
- `createCategory()` → Dùng `AdminServices.createCategory(formData)`
- `updateCategory()` → Dùng `AdminServices.updateCategory(id, formData)`
- `deleteCategory()` → Dùng `AdminServices.deleteCategory(id)`

#### 2. `public/assets/js/campaigns.js`

**Thay đổi cần thiết:**

```javascript
// BEFORE
function loadCampaigns() {
  fetch(apiURL, {
    headers: { Authorization: token },
  })
    .then((res) => res.json())
    .then(renderCampaigns)
    .catch((err) => console.error("Lỗi:", err));
}

// AFTER
async function loadCampaigns() {
  try {
    const campaigns = await AdminServices.getCampaigns();
    renderCampaigns(campaigns);
  } catch (error) {
    console.error("Lỗi:", error);
    showToast("Không thể tải chiến dịch: " + error.message, "error");
  }
}
```

**Các functions cần update:**

- `loadCampaigns()` → Dùng `AdminServices.getCampaigns()`
- `createCampaign()` → Dùng `AdminServices.createCampaign(formData)`
- `editCampaign()` → Dùng `AdminServices.updateCampaign(id, formData)`
- `deleteCampaign()` → Dùng `AdminServices.deleteCampaign(id)`

#### 3. `public/assets/js/notification-admin.js`

**Thay đổi cần thiết:**

```javascript
// BEFORE
function loadTemplates() {
  fetch(BASE_URL + "/api/v1/admin/notification-templates", {
    headers: { Authorization: "Bearer " + getToken() },
  })
    .then((res) => res.json())
    .then((data) => renderTemplates(data))
    .catch((err) => console.error("Lỗi:", err));
}

// AFTER
async function loadTemplates() {
  try {
    const response = await AdminServices.getNotificationTemplates();
    renderTemplates(response.templates);
  } catch (error) {
    console.error("Lỗi:", error);
    showToast("Không thể tải templates: " + error.message, "error");
  }
}
```

**Các functions cần update:**

- `loadTemplates()` → Dùng `AdminServices.getNotificationTemplates()`
- `sendNotification()` → Dùng `AdminServices.sendInstantNotification(data)`
- `loadUsers()` → Dùng `AdminServices.getRecipientsUsers()`

---

### 🟡 PRIORITY 2: Add Missing API Calls (1-2 giờ)

Thêm các API calls còn thiếu vào pages đang hoạt động:

#### 1. Dashboard (`admin-dashboard.js`)

```javascript
// Thêm getOrderStats
async function loadOrderStats() {
  try {
    const stats = await AdminServices.getOrderStats();
    updateOrderStatsUI(stats);
  } catch (error) {
    console.error("Error loading order stats:", error);
  }
}
```

#### 2. Orders (`admin-orders.js`)

```javascript
// Thêm cancelOrder
async function handleCancelOrder(orderId, reason) {
  try {
    await AdminServices.cancelOrder(orderId, reason);
    showToast("Đã hủy đơn hàng", "success");
    loadOrders();
  } catch (error) {
    showToast("Không thể hủy: " + error.message, "error");
  }
}
```

#### 3. Users (`admin-users.js`)

```javascript
// Thêm deleteUser
async function handleDeleteUser(userId) {
  if (!confirm("Bạn có chắc muốn xóa user này?")) return;

  try {
    await AdminServices.deleteUser(userId);
    showToast("Đã xóa user", "success");
    loadUsers();
  } catch (error) {
    showToast("Không thể xóa: " + error.message, "error");
  }
}
```

#### 4. Vouchers (`voucherManagement.js`)

```javascript
// Thêm deleteVoucher
async function handleDeleteVoucher(voucherId) {
  if (!confirm("Bạn có chắc muốn xóa voucher này?")) return;

  try {
    await AdminServices.deleteVoucher(voucherId);
    showToast("Đã xóa voucher", "success");
    loadVouchers();
  } catch (error) {
    showToast("Không thể xóa: " + error.message, "error");
  }
}
```

#### 5. Settings (`admin-settings.js`)

```javascript
// Thêm updateSetting (single)
async function handleUpdateSetting(key, value) {
  try {
    await AdminServices.updateSetting(key, value);
    showToast("Đã cập nhật setting", "success");
  } catch (error) {
    showToast("Không thể cập nhật: " + error.message, "error");
  }
}
```

---

## 🛠️ CÁCH LÀM CHI TIẾT

### Step 1: Backup Files

```bash
# Backup 3 files trước khi edit
cp public/assets/js/quanlydanhmuc.js public/assets/js/quanlydanhmuc.js.backup
cp public/assets/js/campaigns.js public/assets/js/campaigns.js.backup
cp public/assets/js/notification-admin.js public/assets/js/notification-admin.js.backup
```

### Step 2: Update File 1 - quanlydanhmuc.js

Tôi đã tạo example file: `EXAMPLE_quanlydanhmuc_converted.js`

**Cách làm:**

1. Mở `public/assets/js/quanlydanhmuc.js`
2. Tìm function `loadCategories()`
3. Replace fetch() bằng AdminServices.getCategories()
4. Thêm try-catch và error handling
5. Repeat cho tất cả CRUD functions

**Pattern:**

```javascript
// OLD Pattern
fetch(url, { headers: {...}, method: 'POST', body: ... })
  .then(res => res.json())
  .then(data => { /* success */ })
  .catch(err => { /* error */ });

// NEW Pattern
try {
  const data = await AdminServices.methodName(params);
  // success handling
  showToast('Thành công!', 'success');
} catch (error) {
  console.error('Error:', error);
  showToast('Lỗi: ' + error.message, 'error');
}
```

### Step 3: Update File 2 - campaigns.js

Tương tự như quanlydanhmuc.js:

1. Replace `fetch(apiURL,...)` → `AdminServices.getCampaigns()`
2. Replace `fetch(apiURL, { method: 'POST',...})` → `AdminServices.createCampaign(formData)`
3. Replace `fetch(\`\${apiURL}/\${id}\`, { method: 'PUT',...})`→`AdminServices.updateCampaign(id, formData)`
4. Replace `fetch(\`\${apiURL}/\${id}\`, { method: 'DELETE',...})`→`AdminServices.deleteCampaign(id)`

### Step 4: Update File 3 - notification-admin.js

1. Replace fetch() với AdminServices methods
2. Add error handling
3. Add success messages

### Step 5: Test Tất Cả

```bash
# Start server
npm start

# Test từng trang:
# 1. http://localhost:3000/quanlydanhmuc.html
# 2. http://localhost:3000/campaigns.html
# 3. http://localhost:3000/notification-admin.html

# Kiểm tra:
# - Load data OK
# - Create OK
# - Update OK
# - Delete OK
# - Error messages hiển thị đúng
# - Success messages hiển thị đúng
```

---

## ✅ CHECKLIST

### Convert Pages

- [ ] `quanlydanhmuc.js` - Convert loadCategories
- [ ] `quanlydanhmuc.js` - Convert createCategory
- [ ] `quanlydanhmuc.js` - Convert updateCategory
- [ ] `quanlydanhmuc.js` - Convert deleteCategory
- [ ] `campaigns.js` - Convert loadCampaigns
- [ ] `campaigns.js` - Convert createCampaign
- [ ] `campaigns.js` - Convert updateCampaign
- [ ] `campaigns.js` - Convert deleteCampaign
- [ ] `notification-admin.js` - Convert loadTemplates
- [ ] `notification-admin.js` - Convert sendNotification
- [ ] `notification-admin.js` - Convert loadUsers

### Add Missing APIs

- [ ] Dashboard - Add getOrderStats
- [ ] Orders - Add cancelOrder
- [ ] Users - Add deleteUser
- [ ] Vouchers - Add deleteVoucher
- [ ] Settings - Add updateSetting

### Test

- [ ] Test quanlydanhmuc page
- [ ] Test campaigns page
- [ ] Test notification-admin page
- [ ] Test dashboard stats
- [ ] Test order cancel
- [ ] Test user delete
- [ ] Test voucher delete
- [ ] Test settings update

---

## 📞 SUPPORT

### Nếu gặp lỗi:

1. **Check browser console** - Xem error message
2. **Check Network tab** - Xem API calls
3. **Check AdminServices** - Verify methods exist
4. **Refer to examples** - EXAMPLE_quanlydanhmuc_converted.js

### Các lỗi thường gặp:

**"AdminServices is not defined"**

- ✅ Fix: Đảm bảo `<script src="/AdminServices.js">` được load trước

**"Cannot read property 'getCategories' of undefined"**

- ✅ Fix: Add wait for AdminServices:

```javascript
if (!window.AdminServices) {
  await new Promise((resolve) => {
    const interval = setInterval(() => {
      if (window.AdminServices) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
}
```

**"Unexpected token '<'"**

- ✅ Fix: Server trả về HTML thay vì JSON. Check API endpoint.

---

## 🎯 TIMELINE

| Task                          | Time          | Priority  |
| ----------------------------- | ------------- | --------- |
| Convert quanlydanhmuc.js      | 1 hour        | 🔴 HIGH   |
| Convert campaigns.js          | 1 hour        | 🔴 HIGH   |
| Convert notification-admin.js | 1 hour        | 🔴 HIGH   |
| Add missing APIs              | 1-2 hours     | 🟡 MEDIUM |
| Testing                       | 30 mins       | 🟢 LOW    |
| **TOTAL**                     | **3-4 hours** |           |

---

## 🚀 SAU KHI XONG

Chạy lại verification:

```bash
node verify-api-usage.js
```

**Expected result:**

- Overall coverage: 100% ✅
- All pages fully covered ✅
- No missing APIs ✅

---

**🎉 Good luck! Bạn gần xong rồi - chỉ còn 3-4 giờ nữa là 100%!**
