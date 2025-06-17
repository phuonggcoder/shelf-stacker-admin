
  let allUsers = [];

  // Lấy danh sách người dùng từ API
  async function fetchUsers() {
    const tbody = document.getElementById('user-table-body');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Đang tải...</td></tr>';
    try {
      const res = await fetch('https://server-shelf-stacker.onrender.com/auth/users');
      const data = await res.json();
      allUsers = Array.isArray(data) ? data : [];
      renderUsers(allUsers);
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Lỗi tải dữ liệu</td></tr>';
    }
  }

  // Hiển thị danh sách người dùng
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

  // Khởi chạy khi DOM sẵn sàng
  document.addEventListener('DOMContentLoaded', () => {
    fetchUsers();

    document.querySelector('.search-filter .input').addEventListener('input', filterAndRenderUsers);
    document.querySelector('.search-filter .select').addEventListener('change', filterAndRenderUsers);

    document.getElementById('user-table-body').addEventListener('click', async function(e) {
      // Mở/ẩn chi tiết
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

      // Khóa / Mở khóa người dùng
      if (e.target.classList.contains('btn-lock-toggle')) {
        const id = e.target.getAttribute('data-id');
        const isActive = e.target.getAttribute('data-active') === 'true';
        if (confirm(`Bạn có chắc chắn muốn ${isActive ? 'khóa' : 'mở khóa'} người dùng này?`)) {
          try {
           const res = await fetch(`https://server-shelf-stacker.onrender.com/auth/users/${id}/lock`, {
       method: 'PATCH', // ✅ dùng đúng theo API backend

              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isActive: !isActive })
            });
            if (res.ok) {
              alert(`${isActive ? 'Khóa' : 'Mở khóa'} người dùng thành công!`);
              fetchUsers(); // Tải lại danh sách người dùng
            } else {
              const err = await res.json();
              alert('Thao tác thất bại: ' + (err.message || 'Lỗi không xác định!'));
            }
          } catch (err) {
            alert('Lỗi kết nối!');
          }
        }
      }
    });
  });

