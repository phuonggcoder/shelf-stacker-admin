// campaigns.js

const apiURL = 'https://server-shelf-stacker.onrender.com/api/campaigns';
const tableBody = document.getElementById('campaign-table-body');

const rawToken = localStorage.getItem('authToken');
if (!rawToken) {
  alert('Bạn chưa đăng nhập!');
  window.location.href = 'login.html';
}
const token = `Bearer ${rawToken}`;

let editingId = null;
let editorInstance = null;

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN');
}

function renderCampaigns(data) {
  if (!data.length) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Không có chiến dịch nào.</td></tr>`;
    return;
  }

  tableBody.innerHTML = '';
  data.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${c.name}</strong></td>
      <td>${formatDate(c.startDate)}</td>
      <td>${formatDate(c.endDate)}</td>
      <td>${c.type === 'promotion' ? 'Khuyến mãi' : 'Sự kiện'}</td>
      <td>${Array.isArray(c.books) ? c.books.length : 0} truyện</td>
      <td>
        <button onclick="editCampaign('${c._id}')" class="btn-action btn-edit">✏️ Sửa</button>
        <button onclick="deleteCampaign('${c._id}')" class="btn-action btn-delete">🗑️ Xóa</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

function loadCampaigns() {
  fetch(apiURL, {
    headers: { 'Authorization': token }
  })
    .then(res => res.json())
    .then(renderCampaigns)
    .catch(err => {
      console.error('❌ Lỗi tải dữ liệu:', err);
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Lỗi tải dữ liệu.</td></tr>`;
    });
}

document.getElementById('btn-add-campaign').addEventListener('click', () => {
  editingId = null;
  document.getElementById('campaign-form').reset();
  if (editorInstance) editorInstance.setData('');
  document.getElementById('campaign-books').value = '';
  document.getElementById('save-campaign-btn').style.display = 'block';
  document.getElementById('update-campaign-btn').style.display = 'none';
  document.getElementById('campaign-modal').style.display = 'flex';
});

document.getElementById('close-campaign-modal').addEventListener('click', () => {
  document.getElementById('campaign-modal').style.display = 'none';
  editingId = null;
});

document.getElementById('save-campaign-btn').addEventListener('click', function (e) {
  e.preventDefault();

  const name = document.getElementById('campaign-name').value.trim();
  const description = editorInstance.getData();
  const startDate = document.getElementById('campaign-start').value;
  const endDate = document.getElementById('campaign-end').value;
  const type = document.getElementById('campaign-type').value;
  const rawBooks = document.getElementById('campaign-books').value.trim();
  const books = rawBooks ? rawBooks.split(',').map(id => id.trim()) : [];

  if (!name || !startDate || !endDate) {
    alert('⚠️ Vui lòng nhập đầy đủ tên, ngày bắt đầu và ngày kết thúc');
    return;
  }

  fetch(apiURL, {
    method: 'POST',
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, description, startDate, endDate, type, books })
  })
    .then(res => {
      if (!res.ok) return res.json().then(data => {
        console.error('❌ Chi tiết lỗi:', data);
        throw new Error('Thêm chiến dịch thất bại');
      });
      return res.json();
    })
    .then(() => {
      alert('✅ Thêm thành công!');
      document.getElementById('campaign-modal').style.display = 'none';
      loadCampaigns();
    })
    .catch(err => {
      console.error('❌', err);
      alert('❌ Lỗi khi thêm chiến dịch');
    });
});

function editCampaign(id) {
  fetch(`${apiURL}/${id}`, {
    headers: { 'Authorization': token }
  })
    .then(res => res.json())
    .then(c => {
      editingId = id;
      document.getElementById('campaign-name').value = c.name;
      document.getElementById('campaign-start').value = c.startDate?.split('T')[0] || '';
      document.getElementById('campaign-end').value = c.endDate?.split('T')[0] || '';
      document.getElementById('campaign-type').value = c.type;
      editorInstance.setData(c.description || '');
      document.getElementById('campaign-books').value = Array.isArray(c.books) ? c.books.join(', ') : '';

      document.getElementById('save-campaign-btn').style.display = 'none';
      document.getElementById('update-campaign-btn').style.display = 'block';
      document.getElementById('campaign-modal').style.display = 'flex';
    })
    .catch(err => {
      console.error('❌ Không tải được dữ liệu chiến dịch:', err);
      alert('❌ Không thể chỉnh sửa chiến dịch này.');
    });
}

document.getElementById('update-campaign-btn').addEventListener('click', function (e) {
  e.preventDefault();

  const name = document.getElementById('campaign-name').value.trim();
  const description = editorInstance.getData();
  const startDate = document.getElementById('campaign-start').value;
  const endDate = document.getElementById('campaign-end').value;
  const type = document.getElementById('campaign-type').value;
  const rawBooks = document.getElementById('campaign-books').value.trim();
  const books = rawBooks ? rawBooks.split(',').map(id => id.trim()) : [];

  if (!name || !startDate || !endDate) {
    alert('⚠️ Vui lòng nhập đầy đủ thông tin');
    return;
  }

  fetch(`${apiURL}/${editingId}`, {
    method: 'PUT',
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, description, startDate, endDate, type, books })
  })
    .then(res => {
      if (!res.ok) throw new Error('Cập nhật thất bại');
      return res.json();
    })
    .then(() => {
      alert('✅ Đã cập nhật chiến dịch');
      document.getElementById('campaign-modal').style.display = 'none';
      loadCampaigns();
    })
    .catch(err => {
      console.error(err);
      alert('❌ Lỗi khi cập nhật chiến dịch');
    });
});

function deleteCampaign(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa chiến dịch này?')) return;

  fetch(`${apiURL}/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': token
    }
  })
    .then(res => {
      if (!res.ok) throw new Error('Xóa thất bại');
      return res.json();
    })
    .then(() => {
      alert('✅ Đã xóa chiến dịch');
      loadCampaigns();
    })
    .catch(err => {
      console.error(err);
      alert('❌ Lỗi khi xóa chiến dịch');
    });
}




// 🔍 Tìm kiếm theo tên
document.getElementById('btn-search').addEventListener('click', function () {
  const keyword = document.getElementById('search-campaign').value.trim().toLowerCase();

  fetch(apiURL, {
    headers: { 'Authorization': token }
  })
    .then(res => res.json())
    .then(data => {
      const filtered = data.filter(c => c.name.toLowerCase().includes(keyword));
      renderCampaigns(filtered);
    })
    .catch(err => {
      console.error('❌ Lỗi tìm kiếm:', err);
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Không thể tìm kiếm dữ liệu.</td></tr>`;
    });
});

// ⌨️ Enter để tìm
document.getElementById('search-campaign').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    document.getElementById('btn-search').click();
  }
});

// CKEditor + load initial
document.addEventListener('DOMContentLoaded', function () {
  ClassicEditor
    .create(document.querySelector('#campaign-desc'))
    .then(editor => {
      editorInstance = editor;
    })
    .catch(error => {
      console.error('CKEditor lỗi:', error);
    });

  loadCampaigns();
});
