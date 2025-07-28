let allUsers = [];

function getToken() {
  return localStorage.getItem('authToken') || '';
}

let currentUserId = null;
let currentUserIsActive = true;

// Load dialog khóa người dùng
async function loadLockUserDialogHTML() {
  const res = await fetch('components/dialogs/dialog-lock-user.html');
  const html = await res.text();
  document.body.insertAdjacentHTML('beforeend', html);

  document.querySelector('#dialog-lock-user .cancel-btn')
    .addEventListener('click', cancelLockUser);
  document.querySelector('#dialog-lock-user .confirm-btn')
    .addEventListener('click', confirmLockUser);
}

// Load dialog thông báo thành công
async function loadSuccessDialogHTML() {
  const res = await fetch('components/dialogs/success-dialog.html');
  const html = await res.text();
  document.body.insertAdjacentHTML('beforeend', html);

  document.querySelector('#success-dialog .btn-ok')
    .addEventListener('click', () => {
      document.getElementById('success-dialog').style.display = 'none';
    });
}

// Hiển thị dialog thành công
function showSuccessDialog(message = 'Thao tác thành công!') {
  const dialog = document.getElementById('success-dialog');
  if (!dialog) return;

  dialog.querySelector('.success-message').textContent = message;
  dialog.style.display = 'flex';
}

// Mở dialog xác nhận khóa/mở khóa
function showLockUserDialog(userId, isActive) {
  currentUserId = userId;
  currentUserIsActive = isActive;

  const dialog = document.getElementById('dialog-lock-user');
  if (!dialog) return;

  document.getElementById('lock-user-message').textContent =
    isActive ? 'Bạn có chắc muốn khóa người dùng này?' : 'Bạn có chắc muốn mở khóa người dùng này?';

  dialog.style.display = 'flex';
}

function cancelLockUser() {
  document.getElementById('dialog-lock-user').style.display = 'none';
  currentUserId = null;
}

// Xác nhận khóa/mở khóa người dùng
async function confirmLockUser() {
  const res = await fetch(`https://server-shelf-stacker-w1ds.onrender.com/auth/users/${currentUserId}/lock`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + getToken()
    },
    body: JSON.stringify({ isActive: !currentUserIsActive })
  });

  if (res.ok) {
    showSuccessDialog(`${currentUserIsActive ? 'Khóa' : 'Mở khóa'} người dùng thành công!`);
    fetchUsers();
  } else {
    const err = await res.json();
    alert('Thất bại: ' + (err.message || 'Lỗi không xác định!'));
  }

  document.getElementById('dialog-lock-user').style.display = 'none';
  currentUserId = null;
}

// Lấy danh sách người dùng
async function fetchUsers() {
  const tbody = document.getElementById('user-table-body');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Đang tải...</td></tr>';
  try {
    const res = await fetch('https://server-shelf-stacker-w1ds.onrender.com/auth/users', {
      headers: {
        'Authorization': 'Bearer ' + getToken()
      }
    });
    const data = await res.json();
    allUsers = Array.isArray(data) ? data : [];
    renderUsers(allUsers);
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Lỗi tải dữ liệu</td></tr>';
  }
}

// Render danh sách người dùng
function renderUsers(users) {
  const tbody = document.getElementById('user-table-body');
  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Không có dữ liệu</td></tr>';
    return;
  }
  tbody.innerHTML = '';
  users.forEach((user, idx) => {
    const address = user.address
      ? `<div><b>Địa chỉ:</b> ${user.address.street || ''}, ${user.address.ward || ''}, ${user.address.district || ''}, ${user.address.city || ''}, ${user.address.country || ''}</div>`
      : '<div><b>Địa chỉ:</b> Không có</div>';

    tbody.innerHTML += `
      <tr>
        <td>${user.full_name || user.username || ''}</td>
        <td>${user.email || ''}</td>
        <td>${user.phone_number || ''}</td>
        <td>
          <span style="color: ${user.isActive ? '#28a745' : '#FF0000'};">
            ${user.isActive ? 'Đang hoạt động' : 'Đã khóa'}
          </span>
        </td>
        <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : ''}</td>
        <td class="actions">
          <button class="btn btn-detail" data-idx="${idx}">Chi tiết</button>
          <button class="btn btn-lock-toggle" data-id="${user._id}" data-active="${user.isActive}">
            ${user.isActive ? 'Khóa' : 'Mở khóa'}
          </button>
        </td>
      </tr>
      <tr class="user-detail-row" id="detail-row-${idx}" style="display:none; background:#f8f9fa;">
        <td colspan="6" style="padding:12px 24px;">
          ${address}
          <div><b>Giới tính:</b> ${user.gender || 'Không rõ'}</div>
          <div><b>Đã xác thực email:</b> ${user.is_verified ? 'Có' : 'Chưa'}</div>
          <div><b>Quyền:</b> ${(user.roles || []).join(', ')}</div>
        </td>
      </tr>
    `;
  });
}

// Tìm kiếm người dùng
function filterAndRenderUsers() {
  const keyword = document.querySelector('.search-filter .input').value.trim().toLowerCase();
  const status = document.querySelector('.search-filter .select').value;
  let filtered = allUsers.filter(u =>
    (u.full_name || u.username || '').toLowerCase().includes(keyword) ||
    (u.email || '').toLowerCase().includes(keyword) ||
    (u.phone_number || '').toLowerCase().includes(keyword)
  );
  if (status === 'active') filtered = filtered.filter(u => u.isActive);
  if (status === 'locked') filtered = filtered.filter(u => !u.isActive);
  renderUsers(filtered);
}

// DOM ready
document.addEventListener('DOMContentLoaded', () => {
  loadLockUserDialogHTML();
  loadSuccessDialogHTML(); // Tải dialog thành công
  fetchUsers();

  document.querySelector('.search-filter .input').addEventListener('input', filterAndRenderUsers);
  document.querySelector('.search-filter .select').addEventListener('change', filterAndRenderUsers);

  document.getElementById('user-table-body').addEventListener('click', function (e) {
    if (e.target.classList.contains('btn-detail')) {
      const idx = e.target.getAttribute('data-idx');
      const detailRow = document.getElementById('detail-row-' + idx);
      if (detailRow.style.display === 'none') {
        detailRow.style.display = '';
        e.target.textContent = 'Ẩn chi tiết';
      } else {
        detailRow.style.display = 'none';
        e.target.textContent = 'Chi tiết';
      }
    }

    if (e.target.classList.contains('btn-lock-toggle')) {
      const id = e.target.getAttribute('data-id');
      const isActive = e.target.getAttribute('data-active') === 'true';
      showLockUserDialog(id, isActive);
    }
  });
});