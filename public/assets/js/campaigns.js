const apiURL = 'https://server-shelf-stacker.onrender.com/api/campaigns';
const bookAPI = 'https://server-shelf-stacker.onrender.com/api/books';
const bookAllAPI = `${bookAPI}/all`;
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

function loadBooks() {
  fetch(bookAllAPI, {
    headers: { 'Authorization': token }
  })
    .then(res => res.json())
    .then(books => {
      console.log('✅ Danh sách sách:', books);
      const select = document.getElementById('campaign-books');
      if (!select) {
        console.warn('Không tìm thấy thẻ select #campaign-books');
        return;
      }
      select.innerHTML = '';

      if (!Array.isArray(books)) {
        console.error('❌ Dữ liệu sách không đúng định dạng:', books);
        return;
      }

      books.forEach(book => {
        const option = document.createElement('option');
        option.value = book._id;

        const title = book.title || book.name || book.slug || 'Không tên';
        option.textContent = `${title}`;
        select.appendChild(option);
      });
    })
    .catch(err => {
      console.error('❌ Không thể tải danh sách sách:', err);
      const select = document.getElementById('campaign-books');
      if (select) {
        select.innerHTML = `<option disabled>Không tải được dữ liệu</option>`;
      }
    });
}

function getSelectedBooks() {
  const options = document.getElementById('campaign-books').selectedOptions;
  return Array.from(options).map(opt => opt.value);
}

document.getElementById('btn-add-campaign').addEventListener('click', () => {
  editingId = null;
  document.getElementById('campaign-form').reset();
  if (editorInstance) editorInstance.setData('');
  document.getElementById('save-campaign-btn').style.display = 'block';
  document.getElementById('update-campaign-btn').style.display = 'none';
  document.getElementById('campaign-modal').style.display = 'flex';

  const select = document.getElementById('campaign-books');
  Array.from(select.options).forEach(opt => (opt.selected = false));
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
  const books = getSelectedBooks();

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
    .then(res => res.json())
    .then(campaign => {
      const updatePromises = books.map(bookId => {
        return fetch(`${bookAPI}/${bookId}`, {
          method: 'PUT',
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ campaigns: [campaign._id] })
        });
      });
      return Promise.all(updatePromises);
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

      const select = document.getElementById('campaign-books');
      const selectedBooks = Array.isArray(c.books) ? c.books : [];
      Array.from(select.options).forEach(opt => {
        opt.selected = selectedBooks.includes(opt.value);
      });

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
  const books = getSelectedBooks();

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
    .then(res => res.json())
    .then(() => {
      const updatePromises = books.map(bookId => {
        return fetch(`${bookAPI}/${bookId}`, {
          method: 'PUT',
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ campaigns: [editingId] })
        });
      });
      return Promise.all(updatePromises);
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
    headers: { 'Authorization': token }
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

document.getElementById('search-campaign').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    document.getElementById('btn-search').click();
  }
});

document.addEventListener('DOMContentLoaded', function () {
  ClassicEditor
    .create(document.querySelector('#campaign-desc'))
    .then(editor => {
      editorInstance = editor;
      loadBooks();
      loadCampaigns();
    })
    .catch(error => {
      console.error('CKEditor lỗi:', error);
    });
});
