const apiURL = 'https://server-shelf-stacker.onrender.com/api/vouchers';
const voucherTableBody = document.getElementById('voucher-table-body');
const addVoucherBtn = document.getElementById('btnAddVoucher');
const searchInput = document.getElementById('searchVoucher');
const statusFilter = document.getElementById('voucherStatusFilter');

let allVouchers = [];

// Lấy token từ localStorage
const token = localStorage.getItem('authToken');

// Gọi API để lấy danh sách voucher
async function fetchVouchers() {
  try {
    const res = await fetch(apiURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    });
    const data = await res.json();
    allVouchers = data;
    renderVouchers(data);
  } catch (err) {
    console.error('Lỗi khi tải voucher:', err);
    voucherTableBody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:red">Không tải được dữ liệu.</td></tr>';
  }
}

// Hiển thị danh sách voucher ra bảng
function renderVouchers(vouchers) {
  if (!vouchers.length) {
    voucherTableBody.innerHTML = '<tr><td colspan="10" style="text-align:center;">Không có voucher nào.</td></tr>';
    return;
  }

  voucherTableBody.innerHTML = '';
  vouchers.forEach(voucher => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${voucher.voucher_id}</td>
      <td>${voucher.voucher_type}</td>
      <td>${voucher.discount_value}</td>
      <td>${voucher.min_order_value}</td>
      <td>${voucher.usage_limit}</td>
      <td>${voucher.max_per_user}</td>
      <td>${voucher.is_active ? 'Đang hoạt động' : 'Ngưng hoạt động'}</td>
      <td class="actions">
        <button class="btn btn-edit" onclick="editVoucher('${voucher._id}')">Sửa</button>
        <button class="btn btn-delete" onclick="deleteVoucher('${voucher._id}')">Xóa</button>
      </td>
    `;
    voucherTableBody.appendChild(row);
  });
}

// Xóa voucher
function deleteVoucher(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa voucher này?')) return;

  fetch(`${apiURL}/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
    .then(response => {
      if (!response.ok) throw new Error('Xóa thất bại');
      return response.json();
    })
    .then(() => {
      alert('Đã xóa voucher thành công');
      fetchVouchers();
    })
    .catch(err => {
      console.error(err);
      alert('Lỗi khi xóa voucher.');
    });
}

// Tìm kiếm và lọc trạng thái
searchInput.addEventListener('input', filterVouchers);
statusFilter.addEventListener('change', filterVouchers);

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

// Giao diện form sửa và thêm voucher
const dialogHTML = `
  <div id="voucherEditDialog" class="dialog-overlay" style="display:none; overflow-y:auto; max-height:100vh;">
    <div class="dialog-box">
      <h2>Cập nhật voucher</h2>
      <label>Mã voucher:</label><input type="text" id="edit-voucher-id" disabled />
      <label>Loại:</label>
      <select id="edit-voucher-type">
        <option value="percent">Phần trăm</option>
        <option value="fixed">Giảm cố định</option>
      </select>
      <label>Giá trị giảm:</label><input type="number" id="edit-discount-value" />
      <label>Giá trị đơn hàng tối thiểu:</label><input type="number" id="edit-min-order" />
      <label>Số lần sử dụng:</label><input type="number" id="edit-usage-limit" />
      <label>Số lần tối đa mỗi người:</label><input type="number" id="edit-max-per-user" />
      <label>Trạng thái:</label>
      <select id="edit-is-active">
        <option value="true">Đang hoạt động</option>
        <option value="false">Ngưng hoạt động</option>
      </select>
      <div class="dialog-actions">
        <button onclick="submitEditVoucher()">Cập nhật</button>
        <button onclick="closeEditDialog()">Hủy</button>
      </div>
    </div>
  </div>
  <div id="voucherAddDialog" class="dialog-overlay" style="display:none; overflow-y:auto; max-height:100vh;">
    <div class="dialog-box">
      <h2>Thêm voucher mới</h2>
      <label>Mã voucher:</label><input type="text" id="add-voucher-id" />
      <label>Loại:</label>
      <select id="add-voucher-type">
        <option value="percent">Phần trăm</option>
        <option value="fixed">Giảm cố định</option>
      </select>
      <label>Giá trị giảm:</label><input type="number" id="add-discount-value" />
      <label>Giá trị đơn hàng tối thiểu:</label><input type="number" id="add-min-order" />
      <label>Số lần sử dụng:</label><input type="number" id="add-usage-limit" />
      <label>Số lần tối đa mỗi người:</label><input type="number" id="add-max-per-user" />
      <label>Ngày bắt đầu:</label><input type="datetime-local" id="add-start-date" />
      <label>Ngày kết thúc:</label><input type="datetime-local" id="add-end-date" />
      <label>Trạng thái:</label>
      <select id="add-is-active">
        <option value="true">Đang hoạt động</option>
        <option value="false">Ngưng hoạt động</option>
      </select>
      <div class="dialog-actions">
        <button onclick="submitAddVoucher()">Thêm mới</button>
        <button onclick="closeAddDialog()">Hủy</button>
      </div>
    </div>
  </div>
`;
document.body.insertAdjacentHTML('beforeend', dialogHTML);

let editingVoucherId = null;

function editVoucher(id) {
  fetch(`${apiURL}/${id}`, {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
    .then(res => res.json())
    .then(data => {
      editingVoucherId = id;
      document.getElementById('edit-voucher-id').value = data.voucher_id || '';
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
  const updated = {
    voucher_type: document.getElementById('edit-voucher-type').value,
    discount_value: parseInt(document.getElementById('edit-discount-value').value),
    min_order_value: parseInt(document.getElementById('edit-min-order').value),
    usage_limit: parseInt(document.getElementById('edit-usage-limit').value),
    max_per_user: parseInt(document.getElementById('edit-max-per-user').value),
    is_active: document.getElementById('edit-is-active').value === 'true'
  };

  fetch(`${apiURL}/${editingVoucherId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify(updated)
  })
    .then(res => {
      if (!res.ok) throw new Error('Sửa thất bại');
      return res.json();
    })
    .then(() => {
      alert('Cập nhật thành công');
      closeEditDialog();
      fetchVouchers();
    })
    .catch(err => {
      console.error(err);
      alert('Lỗi khi cập nhật');
    });
}

function closeEditDialog() {
  document.getElementById('voucherEditDialog').style.display = 'none';
}

function openAddDialog() {
  document.getElementById('voucherAddDialog').style.display = 'flex';
}

function closeAddDialog() {
  document.getElementById('voucherAddDialog').style.display = 'none';
}

function submitAddVoucher() {
  const newVoucher = {
    voucher_id: document.getElementById('add-voucher-id').value,
    voucher_type: document.getElementById('add-voucher-type').value,
    discount_value: parseInt(document.getElementById('add-discount-value').value),
    min_order_value: parseInt(document.getElementById('add-min-order').value),
    usage_limit: parseInt(document.getElementById('add-usage-limit').value),
    max_per_user: parseInt(document.getElementById('add-max-per-user').value),
    is_active: document.getElementById('add-is-active').value === 'true',
    start_date: new Date(document.getElementById('add-start-date').value).toISOString(),
    end_date: new Date(document.getElementById('add-end-date').value).toISOString()
  };

  fetch(apiURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify(newVoucher)
  })
    .then(res => {
      if (!res.ok) throw new Error('Thêm voucher thất bại');
      return res.json();
    })
    .then(() => {
      alert('Thêm voucher thành công');
      closeAddDialog();
      fetchVouchers();
    })
    .catch(err => {
      console.error(err);
      alert('Lỗi khi thêm voucher');
    });
}

addVoucherBtn.addEventListener('click', openAddDialog);

// Gọi API lần đầu khi mở trang
fetchVouchers();
