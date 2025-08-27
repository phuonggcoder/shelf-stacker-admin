# 🚀 Hướng dẫn sửa lỗi hoàn chỉnh Voucher System

## 🚨 **Tóm tắt các lỗi cần sửa:**

1. **Lỗi xóa voucher** - Function deleteVoucher không hoạt động đúng
2. **Lỗi mapping form** - Form edit không populate dữ liệu
3. **Thiếu field HTML** - Thiếu editVoucherId trong form

## 🛠️ **Bước 1: Sửa HTML Form**

### **Mở file `views/voucher-new.html`**

Tìm đoạn code này (khoảng dòng 270-280):
```html
<form id="editVoucherForm" onsubmit="handleEditVoucher(event)">
```

**Thêm dòng này ngay sau thẻ `<form>`:**
```html
<input type="hidden" id="editVoucherId" name="_id">
```

**Kết quả:**
```html
<form id="editVoucherForm" onsubmit="handleEditVoucher(event)">
  <input type="hidden" id="editVoucherId" name="_id">
  <div class="form-section">
    <!-- ... rest of form -->
```

## 🛠️ **Bước 2: Sửa JavaScript**

### **Thay thế function deleteVoucher:**

Tìm function `deleteVoucher` trong `public/assets/js/voucher-new.js` và thay thế bằng:

```javascript
async function deleteVoucher(id) {
  console.log('Attempting to delete voucher:', id);
  
  if (!id) {
    showNotification('error', 'ID voucher không hợp lệ');
    return;
  }
  
  if (!confirm('Bạn có chắc chắn muốn xóa voucher này?')) {
    console.log('Delete cancelled by user');
    return;
  }

  try {
    showLoading(true);
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Không có token xác thực');
    }
    
    console.log('Sending delete request for voucher:', id);
    
    const response = await fetch(`${VOUCHER_API}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Delete response status:', response.status);

    if (response.ok) {
      const result = await response.json().catch(() => ({}));
      console.log('Delete successful:', result);
      showNotification('success', 'Xóa voucher thành công!');
      await loadVouchers(); // Reload danh sách
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('Delete failed:', errorData);
      throw new Error(errorData.message || errorData.error || `Lỗi ${response.status}: Không thể xóa voucher`);
    }
  } catch (error) {
    console.error('Error deleting voucher:', error);
    showNotification('error', error.message || 'Lỗi khi xóa voucher');
  } finally {
    showLoading(false);
  }
}
```

### **Thay thế function editVoucher:**

```javascript
async function editVoucher(id) {
  console.log('Editing voucher with ID:', id);
  
  if (!id) {
    showNotification('error', 'ID voucher không hợp lệ');
    return;
  }
  
  try {
    showLoading(true);
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Không có token xác thực');
    }
    
    console.log('Fetching voucher data from API...');
    
    const response = await fetch(`${VOUCHER_API}/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Edit voucher API response status:', response.status);

    if (response.ok) {
      const voucher = await response.json();
      console.log('Fetched voucher data:', voucher);
      
      // Store current editing voucher
      currentEditingVoucher = voucher;
      
      // Populate form
      populateEditForm(voucher);
      
      // Open modal
      openEditVoucherModal();
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('API error response:', errorData);
      throw new Error(errorData.message || errorData.error || `Lỗi ${response.status}: Không thể tải thông tin voucher`);
    }
  } catch (error) {
    console.error('Error loading voucher:', error);
    showNotification('error', error.message || 'Lỗi khi tải thông tin voucher');
  } finally {
    showLoading(false);
  }
}
```

### **Thay thế function populateEditForm:**

```javascript
function populateEditForm(voucher) {
  console.log('Populating edit form with voucher:', voucher);
  
  if (!voucher) {
    console.error('No voucher data provided');
    showNotification('error', 'Không có dữ liệu voucher');
    return;
  }
  
  try {
    // Map all form fields with detailed logging
    const fieldMappings = {
      'editVoucherId': voucher._id || voucher.id || '',
      'editVoucherIdField': voucher.voucher_id || voucher.code || '',
      'editVoucherType': voucher.voucher_type || 'discount',
      'editDescription': voucher.description || '',
      'editDiscountType': voucher.discount_type || 'fixed',
      'editDiscountValue': voucher.discount_value || voucher.discount || '',
      'editMaxDiscountValue': voucher.max_discount_value || voucher.max_discount || '',
      'editShippingDiscount': voucher.shipping_discount || voucher.shipping || '',
      'editMinOrderValue': voucher.min_order_value || voucher.min_order || '',
      'editUsageLimit': voucher.usage_limit || voucher.limit || '',
      'editMaxPerUser': voucher.max_per_user || voucher.max_user || '',
      'editStartDate': formatDateTimeForInput(voucher.start_date || voucher.start),
      'editEndDate': formatDateTimeForInput(voucher.end_date || voucher.end),
      'editIsActive': voucher.is_active !== undefined ? voucher.is_active : true
    };
    
    console.log('Field mappings:', fieldMappings);
    
    // Populate each field with error handling
    Object.entries(fieldMappings).forEach(([fieldId, value]) => {
      const element = document.getElementById(fieldId);
      if (element) {
        try {
          if (element.type === 'checkbox') {
            element.checked = Boolean(value);
          } else {
            element.value = value;
          }
          console.log(`Set field ${fieldId} to:`, value);
        } catch (fieldError) {
          console.error(`Error setting field ${fieldId}:`, fieldError);
        }
      } else {
        console.warn(`Field ${fieldId} not found in DOM`);
      }
    });

    // Update form visibility
    setTimeout(() => {
      handleEditVoucherTypeChange();
      handleEditDiscountTypeChange();
    }, 100);
    
    console.log('Edit form populated successfully');
  } catch (error) {
    console.error('Error populating edit form:', error);
    showNotification('error', 'Lỗi khi tải dữ liệu voucher');
  }
}
```

### **Cải thiện function formatDateTimeForInput:**

```javascript
function formatDateTimeForInput(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return '';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    const formatted = `${year}-${month}-${day}T${hours}:${minutes}`;
    console.log('Formatted date:', dateString, '->', formatted);
    return formatted;
  } catch (error) {
    console.error('Error formatting datetime:', dateString, error);
    return '';
  }
}
```

### **Cải thiện function showNotification:**

```javascript
function showNotification(type, message) {
  console.log('Showing notification:', { type, message });
  
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notification => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  });
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}
```

## 🧪 **Bước 3: Test ngay lập tức**

### **Mở Console và test:**

```javascript
// Test load vouchers
loadVouchers();

// Test edit (thay voucher_id bằng ID thực)
editVoucher('voucher_id_here');

// Test delete (thay voucher_id bằng ID thực)
deleteVoucher('voucher_id_here');

// Check console logs
console.log('Testing voucher functions...');
```

## 🎯 **Kết quả mong đợi:**

Sau khi áp dụng tất cả fixes:
- ✅ **Xóa voucher hoạt động chính xác**
- ✅ **Form mapping hoạt động đúng**
- ✅ **Edit voucher thành công**
- ✅ **Console logs chi tiết**
- ✅ **Error handling đầy đủ**
- ✅ **User feedback tốt hơn**

## 🚨 **Lưu ý quan trọng:**

1. **Backup files trước khi sửa**
2. **Test từng chức năng một**
3. **Kiểm tra console logs**
4. **Verify API endpoints**

## 🔧 **Commands để backup:**

```bash
# Backup files
cp public/assets/js/voucher-new.js public/assets/js/voucher-new.js.backup
cp views/voucher-new.html views/voucher-new.html.backup

# Apply fixes
# 1. Sửa HTML form
# 2. Sửa JavaScript functions
# 3. Test ngay lập tức
```

**Tất cả lỗi voucher sẽ được giải quyết hoàn toàn!** 🚀

