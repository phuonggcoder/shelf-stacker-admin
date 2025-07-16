const apiURL = 'https://server-shelf-stacker.onrender.com/api/vouchers';
const deletedAPI = 'https://server-shelf-stacker.onrender.com/api/vouchers/deleted';
const restoreAPI = id => `${apiURL}/restore/${id}`;
const trashVoucherGrid = document.getElementById('trashVoucherGrid');

let currentRestoreVoucherId = null;

function getToken() {
  return localStorage.getItem('authToken') || '';
}

// Load dialog xác nhận khôi phục
async function loadRestoreDialogHTML() {
  const res = await fetch('components/dialogs/confirm-restore-dialog.html');
  const html = await res.text();
  document.body.insertAdjacentHTML('beforeend', html);

  document.querySelector('#confirm-restore-dialog .btn-cancel')
    .addEventListener('click', () => {
      document.getElementById('confirm-restore-dialog').style.display = 'none';
      currentRestoreVoucherId = null;
    });

  document.querySelector('#confirm-restore-dialog .btn-ok')
    .addEventListener('click', () => {
      if (currentRestoreVoucherId) {
        sendRestoreRequest(currentRestoreVoucherId);
        document.getElementById('confirm-restore-dialog').style.display = 'none';
        currentRestoreVoucherId = null;
      }
    });
}

// Load dialog thông báo thành công
async function loadSuccessDialogHTML() {
  const res = await fetch('components/dialogs/success-restore-dialog.html');
  const html = await res.text();
  document.body.insertAdjacentHTML('beforeend', html);

  document.getElementById('close-success-restore')
    .addEventListener('click', () => {
      document.getElementById('success-restore-dialog').style.display = 'none';
    });
}

function showSuccessDialog() {
  const dialog = document.getElementById('success-restore-dialog');
  if (dialog) {
    dialog.style.display = 'flex';
  }
}

// Gọi API để lấy danh sách voucher đã xóa gần đây
async function fetchDeletedVouchers() {
  try {
    const res = await fetch(deletedAPI, {
      headers: {
        'Authorization': 'Bearer ' + getToken()
      }
    });
    const data = await res.json();
    renderDeletedVouchers(data);
  } catch (err) {
    console.error('Lỗi khi tải voucher đã xóa:', err);
    trashVoucherGrid.innerHTML = '<p style="color:red;text-align:center;">Không tải được dữ liệu đã xóa.</p>';
  }
}

// Hiển thị danh sách voucher đã xóa
function renderDeletedVouchers(vouchers) {
  if (!vouchers.length) {
    trashVoucherGrid.innerHTML = '<p style="text-align:center;">Không có voucher đã xóa.</p>';
    return;
  }

  trashVoucherGrid.innerHTML = '';
  vouchers.forEach(v => {
    const div = document.createElement('div');
    div.className = 'voucher-card';
    div.innerHTML = `
      <div class="voucher-id">${v.voucher_id}</div>
      <div>Loại: ${v.voucher_type}</div>
      <div>Giảm: ${v.discount_value}</div>
      <div>Đơn tối thiểu: ${v.min_order_value}</div>
      <div>Lượt dùng: ${v.usage_limit}</div>
      <div>Dùng tối đa/1 người: ${v.max_per_user}</div>
      <button class="restore-btn" onclick="confirmRestoreVoucher('${v._id}')">Khôi phục</button>
    `;
    trashVoucherGrid.appendChild(div);
  });
}

// Hiển thị dialog xác nhận khôi phục
function confirmRestoreVoucher(id) {
  currentRestoreVoucherId = id;
  const dialog = document.getElementById('confirm-restore-dialog');
  if (dialog) {
    dialog.style.display = 'flex';
  }
}

// Gửi yêu cầu khôi phục voucher
function sendRestoreRequest(id) {
  fetch(restoreAPI(id), {
    method: 'PATCH',
    headers: {
      'Authorization': 'Bearer ' + getToken()
    }
  })
    .then(res => res.json())
    .then(data => {
      fetchDeletedVouchers();
      showSuccessDialog(); // ✅ dùng dialog UI đẹp thay alert
    })
    .catch(err => {
      console.error(err);
      alert('Lỗi khôi phục');
    });
}

// Khởi động
document.addEventListener('DOMContentLoaded', () => {
  loadRestoreDialogHTML();
  loadSuccessDialogHTML(); // ✅ load thêm dialog thành công
  fetchDeletedVouchers();
});
