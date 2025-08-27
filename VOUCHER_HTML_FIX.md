# 🔧 Sửa lỗi HTML Form Voucher

## 🚨 **Vấn đề đã phát hiện:**

Form edit voucher thiếu field `editVoucherId` cần thiết để lưu ID của voucher đang chỉnh sửa.

## 🛠️ **Giải pháp sửa lỗi:**

### **Thêm hidden field vào form edit:**

```html
<!-- Thêm vào đầu form editVoucherForm trong views/voucher-new.html -->
<form id="editVoucherForm" onsubmit="handleEditVoucher(event)">
  <!-- THÊM DÒNG NÀY: -->
  <input type="hidden" id="editVoucherId" name="_id">
  
  <div class="form-section">
    <h3>Thông tin cơ bản</h3>
    <div class="form-row">
      <div class="form-group">
        <label for="editVoucherIdField">Mã voucher *</label>
        <input type="text" id="editVoucherIdField" name="voucher_id" required readonly>
      </div>
      <div class="form-group">
        <label for="editVoucherType">Loại voucher *</label>
        <select id="editVoucherType" name="voucher_type" required>
          <option value="discount">Giảm giá sản phẩm</option>
          <option value="shipping">Giảm phí vận chuyển</option>
        </select>
      </div>
    </div>
    <!-- ... rest of form -->
  </div>
</form>
```

### **Vị trí chính xác trong file:**

Tìm đoạn code này trong `views/voucher-new.html` (khoảng dòng 270-280):

```html
<!-- Edit Voucher Modal -->
<div id="editVoucherModal" class="modal">
  <div class="modal-content large">
    <div class="modal-header">
      <h2>Chỉnh sửa voucher</h2>
      <button class="close-btn" onclick="closeEditVoucherModal()">&times;</button>
    </div>
    <form id="editVoucherForm" onsubmit="handleEditVoucher(event)">
      <!-- THÊM DÒNG NÀY NGAY SAU THẺ FORM: -->
      <input type="hidden" id="editVoucherId" name="_id">
      
      <div class="form-section">
        <h3>Thông tin cơ bản</h3>
        <!-- ... rest of form -->
```

## 🔧 **Cách áp dụng:**

### 1. **Mở file `views/voucher-new.html`**

### 2. **Tìm form edit voucher**
Tìm đoạn code có `id="editVoucherForm"`

### 3. **Thêm hidden field**
Thêm dòng này ngay sau thẻ `<form>`:
```html
<input type="hidden" id="editVoucherId" name="_id">
```

### 4. **Lưu file và test**

## 🎯 **Kết quả mong đợi:**

Sau khi thêm field này:
- ✅ **Form mapping sẽ hoạt động đúng**
- ✅ **ID voucher sẽ được lưu khi edit**
- ✅ **Không còn lỗi "Field not found"**

## 🚨 **Lưu ý quan trọng:**

1. **Field này phải có ID chính xác:** `editVoucherId`
2. **Name phải là:** `_id`
3. **Phải đặt ngay sau thẻ `<form>`**

Đây là fix quan trọng để form edit voucher hoạt động đúng! 🚀

