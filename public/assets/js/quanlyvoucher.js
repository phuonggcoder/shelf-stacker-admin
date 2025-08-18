const apiURL = 'https://server-shelf-stacker-w1ds.onrender.com/api/vouchers';
const voucherTableBody = document.getElementById('voucher-table-body');
const addVoucherBtn = document.getElementById('btnAddVoucher');
const searchInput = document.getElementById('searchVoucher');
const statusFilter = document.getElementById('voucherStatusFilter');

let allVouchers = [];
let editingVoucherId = null;
let pendingDeleteVoucherId = null;

async function fetchVouchers() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Vui lòng đăng nhập.');
      window.location.href = 'login.html';
      return;
    }

    const res = await fetch(apiURL, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error(`Lỗi khi gọi API: ${res.status}`);

    const data = await res.json();
    allVouchers = data.vouchers;
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
    const row = document.createElement('tr');
    const discountTypeLabel = voucher.discount_type === 'order' ? 'Mã giảm giá' :
                             voucher.discount_type === 'shipping' ? 'Mã freeship' : 'Mã vận chuyển';
    row.innerHTML = `
      <td>${voucher.voucher_id}</td>
      <td>${discountTypeLabel}</td>
      <td>${voucher.voucher_type}</td>
      <td>${voucher.discount_value}</td>
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
      alert('Lỗi khi xóa voucher.');
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
    })
    .catch(err => {
      console.error('Không thể lấy thông tin voucher:', err);
      alert('Không thể mở form sửa.');
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
    alert('Mã voucher đã tồn tại. Vui lòng chọn mã khác.');
    return;
  }

  // Kiểm tra các giá trị số không nhỏ hơn 1
  if (isNaN(updated.discount_value) || updated.discount_value < 1) {
    alert('Giá trị giảm giá phải lớn hơn hoặc bằng 1.');
    return;
  }
  if (isNaN(updated.min_order_value) || updated.min_order_value < 1) {
    alert('Giá trị đơn hàng tối thiểu phải lớn hơn hoặc bằng 1.');
    return;
  }
  if (isNaN(updated.usage_limit) || updated.usage_limit < 1) {
    alert('Số lần sử dụng phải lớn hơn hoặc bằng 1.');
    return;
  }
  if (isNaN(updated.max_per_user) || updated.max_per_user < 1) {
    alert('Số lần tối đa mỗi người phải lớn hơn hoặc bằng 1.');
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
      alert('Lỗi khi cập nhật');
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
    alert('Vui lòng nhập đầy đủ thông tin hợp lệ.');
    return;
  }

  // Kiểm tra trùng voucher_id
  const existingVoucher = allVouchers.find(v => v.voucher_id.toLowerCase() === voucher_id.toLowerCase());
  if (existingVoucher) {
    alert('Mã voucher đã tồn tại. Vui lòng chọn mã khác.');
    return;
  }

  // Kiểm tra các giá trị số không nhỏ hơn 1
  if (discount_value < 1) {
    alert('Giá trị giảm giá phải lớn hơn hoặc bằng 1.');
    return;
  }
  if (min_order_value < 1) {
    alert('Giá trị đơn hàng tối thiểu phải lớn hơn hoặc bằng 1.');
    return;
  }
  if (usage_limit < 1) {
    alert('Số lần sử dụng phải lớn hơn hoặc bằng 1.');
    return;
  }
  if (max_per_user < 1) {
    alert('Số lần tối đa mỗi người phải lớn hơn hoặc bằng 1.');
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
      alert('Lỗi khi thêm voucher');
    });
}

function openAddDialog() {
  document.getElementById('voucherAddDialog').style.display = 'flex';
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

fetchVouchers();