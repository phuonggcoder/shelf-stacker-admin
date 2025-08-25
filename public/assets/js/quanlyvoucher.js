const apiURL = 'https://server-shelf-stacker-w1ds.onrender.com/api/vouchers';
const orderApiURL = 'https://server-shelf-stacker-w1ds.onrender.com/api/orders';
const voucherTableBody = document.getElementById('voucher-table-body');
const addVoucherBtn = document.getElementById('btnAddVoucher');
const searchInput = document.getElementById('searchVoucher');
const statusFilter = document.getElementById('voucherStatusFilter');

let allVouchers = [];
let editingVoucherId = null;
let pendingDeleteVoucherId = null;
let lastNotifiedOrderId = null;

async function fetchVouchers() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      showNotification('error', 'Vui lòng đăng nhập.');
      window.location.href = 'login.html';
      return;
    }

    const res = await fetch(apiURL, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error(`Lỗi khi gọi API: ${res.status}`);

    const data = await res.json();
    allVouchers = data.vouchers || [];
    renderVouchers(allVouchers);
  } catch (err) {
    console.error('Lỗi khi tải voucher:', err);
    voucherTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:red">Không tải được dữ liệu.</td></tr>';
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN');
}

function renderVouchers(vouchers) {
  if (!vouchers.length) {
    voucherTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Không có voucher nào.</td></tr>';
    return;
  }

  voucherTableBody.innerHTML = '';
  vouchers.forEach(voucher => {
    const discountTypeLabel = voucher.discount_type === 'order' ? 'Mã giảm giá' : 'Mã vận chuyển';
    const voucherTypeLabel = voucher.voucher_type === 'percentage' ? 'Phần trăm' : 'Giảm cố định';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${voucher.voucher_id}</td>
      <td>${discountTypeLabel}</td>
      <td>${voucherTypeLabel}</td>
      <td>${voucher.voucher_type === 'percentage' ? voucher.discount_value + '%' : voucher.discount_value.toLocaleString('vi-VN') + ' VNĐ'}</td>
      <td>${formatDate(voucher.start_date)}</td>
      <td>${formatDate(voucher.end_date)}</td>
      <td>${voucher.is_active ? 'Đang hoạt động' : 'Ngưng hoạt động'}</td>
      <td class="actions">
        <button class="btn btn-edit" onclick="editVoucher('${voucher._id}')">Sửa</button>
        <button class="btn btn-delete" onclick="deleteVoucher('${voucher._id}')">Xóa</button>
      </td>
    `;
    voucherTableBody.appendChild(row);
  });
}

// Fetch orders for notifications
async function fetchOrders() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    showNotification('error', 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
    return [];
  }

  try {
    const response = await fetch(orderApiURL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Không thể lấy dữ liệu đơn hàng');
    }

    const ordersData = await response.json();
    return ordersData.orders || [];
  } catch (error) {
    showNotification('error', 'Lỗi khi tải đơn hàng: ' + error.message);
    return [];
  }
}

// Render notifications
function renderNotifications(orders) {
  const dropdown = document.getElementById('notificationDropdown');
  const badge = document.getElementById('notificationBadge');
  if (!dropdown || !badge) return;

  const filteredOrders = orders.filter(order =>
    order.order_status === 'Pending' || order.order_status === 'Processing'
  );

  badge.textContent = filteredOrders.length;
  badge.style.display = filteredOrders.length > 0 ? 'inline-block' : 'none';

  if (!filteredOrders.length) {
    dropdown.innerHTML = '<div style="padding: 16px; text-align: center; color: #888;">Không có đơn hàng mới cần xác nhận.</div>';
  } else {
    dropdown.innerHTML = filteredOrders.map(order => {
      const code = order.order_id || order._id || 'Không rõ';
      const statusKey = order.order_status;
      const status = statusKey === 'Pending'
        ? 'Đang chờ xác nhận'
        : statusKey === 'Processing'
          ? 'Đang xử lý'
          : 'Chưa rõ';
      const createdAt = order.order_date || order.createdAt || '';
      const formattedDate = createdAt
        ? new Date(createdAt).toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        : 'Chưa rõ';

      return `
        <div class="notification-item" data-id="${order._id}" data-status="${statusKey}">
          <div>
            <i class="fas fa-box-open" style="margin-right:6px;"></i>
            Đơn hàng có mã <b>${code}</b>, thời gian <b>${formattedDate}</b>, trạng thái <b>${status}</b> cần được xác nhận!
          </div>
        </div>
      `;
    }).join('');

    // Add click event for notification items
    setTimeout(() => {
      document.querySelectorAll('.notification-item').forEach(item => {
        item.onclick = function() {
          const orderId = this.getAttribute('data-id');
          goToOrderDetails(orderId);
          dropdown.classList.remove('active');
        };
      });
    }, 0);
  }
}

// Handle new order notifications
async function handleOrderNotifications() {
  const orders = await fetchOrders();
  const pendingOrders = orders.filter(order =>
    order.order_status === 'Pending' || order.order_status === 'Processing'
  );

  if (pendingOrders.length > 0) {
    pendingOrders.sort((a, b) => new Date(b.order_date || b.createdAt) - new Date(a.order_date || a.createdAt));
    const newestOrder = pendingOrders[0];
    if (lastNotifiedOrderId !== newestOrder._id) {
      lastNotifiedOrderId = newestOrder._id;
      const code = newestOrder.order_id || newestOrder._id || 'Không rõ';
      const status = newestOrder.order_status === 'Pending'
        ? 'Đang chờ xác nhận'
        : newestOrder.order_status === 'Processing'
          ? 'Đang xử lý'
          : 'Chưa rõ';
      const createdAt = newestOrder.order_date || newestOrder.createdAt || '';
      const formattedDate = createdAt
        ? new Date(createdAt).toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        : 'Chưa rõ';

      showNotification(
        'success',
        `<span style="display:flex;align-items:center;gap:8px;">
          <i class="fas fa-box-open" style="font-size:22px;color:#fff;"></i>
          <span>
            Đơn hàng mới!<br>
            Mã đơn <b>${code}</b>, thời gian <b>${formattedDate}</b>, trạng thái <b>${status}</b> cần được xác nhận!
          </span>
        </span>`
      );
    }
  }

  renderNotifications(orders);
}

// Notification system
function showNotification(type, message) {
  const notification = document.createElement('div');
  notification.id = `notification-${Date.now()}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#28a745' : '#dc3545'};
    color: white;
    padding: 15px 25px;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Segoe UI', sans-serif;
    animation: slideIn 0.3s ease, fadeOut 0.5s ease 2.5s forwards;
  `;

  const icon = document.createElement('span');
  icon.innerHTML = type === 'success'
    ? '<i class="fa fa-check-circle" style="font-size: 18px;"></i>'
    : '<i class="fa fa-exclamation-circle" style="font-size: 18px;"></i>';
  notification.appendChild(icon);

  const text = document.createElement('span');
  text.innerHTML = message;
  notification.appendChild(text);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: white;
    font-size: 16px;
    cursor: pointer;
    margin-left: 15px;
    padding: 0 5px;
  `;
  closeBtn.onclick = () => {
    notification.style.display = 'none';
    document.body.removeChild(notification);
  };
  notification.appendChild(closeBtn);

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 500);
  }, 2500);
}

// Toggle notification dropdown
function toggleNotificationDropdown() {
  const dropdown = document.getElementById('notificationDropdown');
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
}

function goToOrderDetails(orderId) {
  window.location.href = 'danhmucdonhang';
}

function deleteVoucher(id) {
  pendingDeleteVoucherId = id;

  fetch('/components/dialogs/confirm-delete-voucher.html')
    .then(res => res.text())
    .then(html => {
      const div = document.createElement('div');
      div.innerHTML = html;
      document.body.appendChild(div);
    })
    .catch(err => {
      console.error('Không thể hiển thị hộp thoại xác nhận:', err);
      showNotification('error', 'Không thể hiển thị hộp thoại xác nhận.');
    });
}

function cancelDeleteVoucher() {
  const dialog = document.getElementById('dialog-confirm-delete-voucher');
  if (dialog) dialog.remove();
  pendingDeleteVoucherId = null;
}

function confirmDeleteVoucher() {
  const token = localStorage.getItem('authToken');
  const id = pendingDeleteVoucherId;
  if (!id) return;

  fetch(`${apiURL}/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(response => {
      if (!response.ok) throw new Error('Xóa thất bại');
      return response.json();
    })
    .then(() => {
      closeConfirmDeleteVoucherDialog();
      showDeleteVoucherSuccessDialog();
      fetchVouchers();
    })
    .catch(err => {
      console.error(err);
      showNotification('error', 'Lỗi khi xóa voucher.');
    });
}

function closeConfirmDeleteVoucherDialog() {
  const dialog = document.getElementById('dialog-confirm-delete-voucher');
  if (dialog) dialog.remove();
  pendingDeleteVoucherId = null;
}

function editVoucher(id) {
  const token = localStorage.getItem('authToken');
  fetch(`${apiURL}/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      editingVoucherId = id;
      document.getElementById('edit-voucher-id').value = data.voucher_id || '';
      document.getElementById('edit-discount-type').value = data.discount_type || 'order';
      document.getElementById('edit-voucher-type').value = data.voucher_type || 'fixed';
      document.getElementById('edit-discount-value').value = data.discount_value || 0;
      document.getElementById('edit-min-order').value = data.min_order_value || 0;
      document.getElementById('edit-usage-limit').value = data.usage_limit || 1;
      document.getElementById('edit-max-per-user').value = data.max_per_user || 1;
      document.getElementById('edit-is-active').value = data.is_active ? 'true' : 'false';
      document.getElementById('voucherEditDialog').style.display = 'flex';
      updateDiscountValueInput('edit');
    })
    .catch(err => {
      console.error('Không thể lấy thông tin voucher:', err);
      showNotification('error', 'Không thể mở form sửa.');
    });
}

function submitEditVoucher() {
  const token = localStorage.getItem('authToken');
  const updated = {
    voucher_id: document.getElementById('edit-voucher-id').value.trim(),
    discount_type: document.getElementById('edit-discount-type').value,
    voucher_type: document.getElementById('edit-voucher-type').value,
    discount_value: parseFloat(document.getElementById('edit-discount-value').value),
    min_order_value: parseFloat(document.getElementById('edit-min-order').value),
    usage_limit: parseInt(document.getElementById('edit-usage-limit').value),
    max_per_user: parseInt(document.getElementById('edit-max-per-user').value),
    is_active: document.getElementById('edit-is-active').value === 'true'
  };

  // Kiểm tra trùng voucher_id khi sửa
  const existingVoucher = allVouchers.find(v => v.voucher_id.toLowerCase() === updated.voucher_id.toLowerCase() && v._id !== editingVoucherId);
  if (existingVoucher) {
    showNotification('error', 'Mã voucher đã tồn tại. Vui lòng chọn mã khác.');
    return;
  }

  // Kiểm tra giá trị giảm giá từ 1 đến 100 (chỉ cho phần trăm)
  if (updated.voucher_type === 'percentage') {
    if (isNaN(updated.discount_value) || updated.discount_value < 1 || updated.discount_value > 100) {
      showNotification('error', 'Giá trị giảm phần trăm phải từ 1% đến 100%.');
      return;
    }
  } else if (updated.voucher_type === 'fixed') {
    if (isNaN(updated.discount_value) || updated.discount_value < 1) {
      showNotification('error', 'Giá trị giảm cố định phải lớn hơn hoặc bằng 1 VNĐ.');
      return;
    }
  } else {
    showNotification('error', 'Loại voucher không hợp lệ.');
    return;
  }

  // Kiểm tra các giá trị số không nhỏ hơn 1
  if (isNaN(updated.min_order_value) || updated.min_order_value < 1) {
    showNotification('error', 'Giá trị đơn hàng tối thiểu phải lớn hơn hoặc bằng 1.');
    return;
  }
  if (isNaN(updated.usage_limit) || updated.usage_limit < 1) {
    showNotification('error', 'Số lần sử dụng phải lớn hơn hoặc bằng 1.');
    return;
  }
  if (isNaN(updated.max_per_user) || updated.max_per_user < 1) {
    showNotification('error', 'Số lần tối đa mỗi người phải lớn hơn hoặc bằng 1.');
    return;
  }

  fetch(`${apiURL}/${editingVoucherId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updated)
  })
    .then(res => {
      if (!res.ok) throw new Error('Sửa thất bại');
      return res.json();
    })
    .then(() => {
      showUpdateVoucherSuccessDialog();
      closeEditDialog();
      fetchVouchers();
    })
    .catch(err => {
      console.error(err);
      showNotification('error', 'Lỗi khi cập nhật voucher.');
    });
}

function resetAddVoucherForm() {
  document.getElementById('add-voucher-id').value = '';
  document.getElementById('add-discount-type').value = 'order';
  document.getElementById('add-voucher-type').value = 'fixed';
  document.getElementById('add-discount-value').value = '';
  document.getElementById('add-min-order').value = '';
  document.getElementById('add-usage-limit').value = '';
  document.getElementById('add-max-per-user').value = '';
  document.getElementById('add-start-date').value = '';
  document.getElementById('add-end-date').value = '';
  document.getElementById('add-is-active').value = 'true';
}

function submitAddVoucher() {
  const token = localStorage.getItem('authToken');

  const voucher_id = document.getElementById('add-voucher-id').value.trim();
  const discount_type = document.getElementById('add-discount-type').value;
  const voucher_type = document.getElementById('add-voucher-type').value;
  const discount_value = parseFloat(document.getElementById('add-discount-value').value);
  const min_order_value = parseFloat(document.getElementById('add-min-order').value);
  const usage_limit = parseInt(document.getElementById('add-usage-limit').value);
  const max_per_user = parseInt(document.getElementById('add-max-per-user').value);
  const start_date = document.getElementById('add-start-date').value;
  const end_date = document.getElementById('add-end-date').value;
  const is_active = document.getElementById('add-is-active').value === 'true';

  // Kiểm tra đầy đủ thông tin
  if (!voucher_id || !discount_type || !voucher_type || isNaN(discount_value) || isNaN(min_order_value) || isNaN(usage_limit) || isNaN(max_per_user) || !start_date || !end_date) {
    showNotification('error', 'Vui lòng nhập đầy đủ thông tin hợp lệ.');
    return;
  }

  // Kiểm tra trùng voucher_id
  const existingVoucher = allVouchers.find(v => v.voucher_id.toLowerCase() === voucher_id.toLowerCase());
  if (existingVoucher) {
    showNotification('error', 'Mã voucher đã tồn tại. Vui lòng chọn mã khác.');
    return;
  }

  // Kiểm tra giá trị giảm giá đúng loại
  if (voucher_type === 'percentage') {
    if (isNaN(discount_value) || discount_value < 1 || discount_value > 100) {
      showNotification('error', 'Giá trị giảm phần trăm phải từ 1% đến 100%.');
      return;
    }
  } else if (voucher_type === 'fixed') {
    if (isNaN(discount_value) || discount_value < 1) {
      showNotification('error', 'Giá trị giảm cố định phải lớn hơn hoặc bằng 1 VNĐ.');
      return;
    }
  } else {
    showNotification('error', 'Loại voucher không hợp lệ.');
    return;
  }

  // Kiểm tra các giá trị số không nhỏ hơn 1
  if (min_order_value < 1) {
    showNotification('error', 'Giá trị đơn hàng tối thiểu phải lớn hơn hoặc bằng 1.');
    return;
  }
  if (usage_limit < 1) {
    showNotification('error', 'Số lần sử dụng phải lớn hơn hoặc bằng 1.');
    return;
  }
  if (max_per_user < 1) {
    showNotification('error', 'Số lần tối đa mỗi người phải lớn hơn hoặc bằng 1.');
    return;
  }

  const newVoucher = {
    voucher_id,
    discount_type,
    voucher_type,
    discount_value,
    min_order_value,
    usage_limit,
    max_per_user,
    start_date: new Date(start_date).toISOString(),
    end_date: new Date(end_date).toISOString(),
    is_active
  };

  fetch(apiURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(newVoucher)
  })
    .then(res => {
      if (!res.ok) throw new Error('Thêm voucher thất bại');
      return res.json();
    })
    .then(() => {
      showAddVoucherSuccessDialog();
      resetAddVoucherForm();
      closeAddDialog();
      fetchVouchers();
    })
    .catch(err => {
      console.error(err);
      showNotification('error', 'Lỗi khi thêm voucher.');
    });
}

// Thêm sự kiện thay đổi cho loại voucher (add và edit)
document.getElementById('add-voucher-type').addEventListener('change', function () {
  updateDiscountValueInput('add');
});
document.getElementById('edit-voucher-type').addEventListener('change', function () {
  updateDiscountValueInput('edit');
});

function updateDiscountValueInput(mode) {
  const type = document.getElementById(`${mode}-voucher-type`).value;
  const discountInput = document.getElementById(`${mode}-discount-value`);
  const label = discountInput.previousElementSibling;
  if (type === 'percentage') {
    discountInput.setAttribute('type', 'number');
    discountInput.setAttribute('min', '1');
    discountInput.setAttribute('max', '100');
    discountInput.setAttribute('step', '1');
    discountInput.setAttribute('placeholder', 'Nhập % giảm (1-100)');
    label.textContent = 'Giá trị giảm (%):';
  } else if (type === 'fixed') {
    discountInput.setAttribute('type', 'number');
    discountInput.setAttribute('min', '1');
    discountInput.removeAttribute('max');
    discountInput.setAttribute('step', '1000');
    discountInput.setAttribute('placeholder', 'Nhập số tiền giảm (VNĐ, >=1)');
    label.textContent = 'Giá trị giảm (VNĐ):';
  }
}

function openAddDialog() {
  document.getElementById('voucherAddDialog').style.display = 'flex';
  updateDiscountValueInput('add');
}

function closeAddDialog() {
  document.getElementById('voucherAddDialog').style.display = 'none';
}

function closeEditDialog() {
  document.getElementById('voucherEditDialog').style.display = 'none';
}

function showAddVoucherSuccessDialog() {
  fetch('/components/dialogs/add-Voucher.html')
    .then(res => res.text())
    .then(html => {
      const div = document.createElement('div');
      div.innerHTML = html;
      document.body.appendChild(div);
    })
    .catch(err => {
      console.error('Không thể hiển thị dialog thêm:', err);
      showNotification('error', 'Không thể hiển thị dialog thêm.');
    });
}

function closeAddVoucherSuccessDialog() {
  const dialog = document.getElementById('addVoucherSuccessDialog');
  if (dialog) dialog.remove();
}

function showUpdateVoucherSuccessDialog() {
  fetch('/components/dialogs/update-Voucher.html')
    .then(res => res.text())
    .then(html => {
      const div = document.createElement('div');
      div.innerHTML = html;
      document.body.appendChild(div);
    })
    .catch(err => {
      console.error('Không thể hiển thị dialog sửa:', err);
      showNotification('error', 'Không thể hiển thị dialog sửa.');
    });
}

function showDeleteVoucherSuccessDialog() {
  fetch('/components/dialogs/delete-voucher.html')
    .then(res => res.text())
    .then(html => {
      const div = document.createElement('div');
      div.innerHTML = html;
      document.body.appendChild(div);
    })
    .catch(err => {
      console.error('Không thể hiển thị dialog xóa:', err);
      showNotification('error', 'Không thể hiển thị dialog xóa.');
    });
}

function closeDeleteVoucherSuccessDialog() {
  const dialog = document.getElementById('deleteVoucherSuccessDialog');
  if (dialog) dialog.remove();
}

searchInput.addEventListener('input', filterVouchers);
statusFilter.addEventListener('change', filterVouchers);
addVoucherBtn.addEventListener('click', openAddDialog);

function filterVouchers() {
  const keyword = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;

  const filtered = allVouchers.filter(v => {
    const matchesKeyword = v.voucher_id.toLowerCase().includes(keyword);
    const matchesStatus =
      !status ||
      (status === 'active' && v.is_active) ||
      (status === 'inactive' && !v.is_active);
    return matchesKeyword && matchesStatus;
  });

  renderVouchers(filtered);
}

// Initialize notification system
window.onload = () => {
  const savedAvatar = localStorage.getItem('userAvatar');
  if (savedAvatar) {
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    const headerAvatar = document.getElementById('headerAvatar');
    if (sidebarAvatar) sidebarAvatar.src = savedAvatar.replace('https://server-shelf-stacker.onrender.com', 'https://server-shelf-stacker-w1ds.onrender.com');
    if (headerAvatar) headerAvatar.src = savedAvatar.replace('https://server-shelf-stacker.onrender.com', 'https://server-shelf-stacker-w1ds.onrender.com');
  }

  const uploadDialog = document.getElementById('uploadDialog');
  uploadDialog.removeAttribute('open');

  fetchVouchers();
  handleOrderNotifications();

  const notificationBell = document.querySelector('.notification-bell');
  if (notificationBell) {
    notificationBell.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleNotificationDropdown();
    });
  }

  document.addEventListener('click', function (event) {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown && dropdown.classList.contains('active')) {
      if (!event.target.closest('.notification-bell')) {
        dropdown.classList.remove('active');
      }
    }
  });

  const settingsLink = document.getElementById('settingsLink');
  if (settingsLink) {
    settingsLink.addEventListener('click', () => {
      document.getElementById('mainSidebar').classList.add('hidden');
      document.getElementById('settingsSidebar').classList.remove('hidden');
    });
  }

  const backButton = document.getElementById('backButton');
  if (backButton) {
    backButton.addEventListener('click', () => {
      document.getElementById('settingsSidebar').classList.add('hidden');
      document.getElementById('mainSidebar').classList.remove('hidden');
    });
  }

  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userAvatar');
      localStorage.removeItem('userId');
      localStorage.removeItem('userData');
      window.location.href = '/login';
    });
  }

  const sidebarAvatar = document.getElementById('sidebarAvatar');
  if (sidebarAvatar) {
    sidebarAvatar.onclick = () => {
      uploadDialog.showModal();
      resetUploadDialog();
    };
  }

  const cancelButton = document.getElementById('cancelButton');
  if (cancelButton) {
    cancelButton.onclick = () => {
      uploadDialog.close();
      resetUploadDialog();
    };
  }

  uploadDialog.addEventListener('close', () => {
    resetUploadDialog();
  });

  const uploadButton = document.getElementById('uploadButton');
  if (uploadButton) {
    uploadButton.onclick = async () => {
      const fileInput = document.getElementById('avatarUpload');
      const file = fileInput.files[0];

      if (!file) {
        showNotification('error', 'Vui lòng chọn một ảnh.');
        return;
      }

      if (!file.type.startsWith('image/')) {
        showNotification('error', 'Vui lòng chọn một file ảnh hợp lệ.');
        return;
      }

      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');

      if (!token) {
        showNotification('error', 'Bạn chưa đăng nhập hoặc token không hợp lệ. Vui lòng đăng nhập lại.');
        return;
      }

      if (!userId) {
        showNotification('error', 'Thiếu userId. Vui lòng đăng nhập lại.');
        return;
      }

      uploadButton.disabled = true;
      uploadButton.textContent = 'Đang tải...';

      try {
        const formData = new FormData();
        formData.append('avatar', file);
        formData.append('userId', userId);

        const response = await fetch('https://server-shelf-stacker-w1ds.onrender.com/api/user-upload/avatar', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) {
          let errorMsg = 'Lỗi khi tải ảnh lên';
          try {
            const errData = await response.json();
            if (errData.message) errorMsg = errData.message;
          } catch {}
          throw new Error(errorMsg);
        }

        const data = await response.json();
        const imageUrl = data.avatar || URL.createObjectURL(file);

        document.getElementById('sidebarAvatar').src = imageUrl;
        document.getElementById('headerAvatar').src = imageUrl;

        localStorage.setItem('userAvatar', imageUrl);

        showNotification('success', 'Đã cập nhật ảnh đại diện thành công!');

        setTimeout(() => {
          uploadDialog.close();
          resetUploadDialog();
        }, 2000);
      } catch (error) {
        showNotification('error', 'Lỗi: ' + error.message);
        uploadButton.disabled = false;
        uploadButton.textContent = 'Tải lên';
      }
    };
  }

  function resetUploadDialog() {
    document.getElementById('avatarUpload').value = '';
    const uploadMessage = document.getElementById('uploadMessage');
    uploadMessage.style.display = 'none';
    uploadMessage.textContent = '';
    uploadMessage.className = 'notification';
    uploadButton.disabled = false;
    uploadButton.textContent = 'Tải lên';
  }
};

function toggleMenu(id) {
  const el = document.getElementById(id);
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}