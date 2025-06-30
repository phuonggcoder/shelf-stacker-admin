// /assets/js/khoiphucvoucher.js

const apiURL = 'https://server-shelf-stacker.onrender.com/api/vouchers';
const deletedAPI = 'https://server-shelf-stacker.onrender.com/api/vouchers/deleted';
const restoreAPI = id => `${apiURL}/restore/${id}`;
const trashVoucherGrid = document.getElementById('trashVoucherGrid');

// Gọi API để lấy danh sách voucher đã xóa gần đây
async function fetchDeletedVouchers() {
  try {
    const res = await fetch(deletedAPI);
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
      <button class="restore-btn" onclick="restoreVoucher('${v._id}')">Khôi phục</button>
    `;
    trashVoucherGrid.appendChild(div);
  });
}

// Gửi yêu cầu khôi phục voucher
function restoreVoucher(id) {
  if (!confirm('Khôi phục voucher này?')) return;

  fetch(restoreAPI(id), {
    method: 'PATCH'
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || 'Đã khôi phục');
      fetchDeletedVouchers();
    })
    .catch(err => {
      console.error(err);
      alert('Lỗi khôi phục');
    });
}

// Khởi động
fetchDeletedVouchers();