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
window.allBooks = [];

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

function loadBooksForSearch(selectedIds = []) {
  fetch('https://server-shelf-stacker.onrender.com/api/books/all', {
    headers: { 'Authorization': token }
  })
    .then(res => res.json())
    .then(books => {
      window.allBooks = books;
      // Đổ option vào select ẩn (nếu chưa có)
      const select = document.getElementById('campaign-books');
      select.innerHTML = '';
      books.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b._id;
        opt.textContent = b.title || b.name;
        if (selectedIds.includes(b._id)) opt.selected = true;
        select.appendChild(opt);
      });
      renderBookSearchList(books, selectedIds);
    });
}

function renderBookSearchList(books, selectedIds = []) {
  const listDiv = document.getElementById('book-search-list');
  listDiv.innerHTML = '';
  books.forEach(book => {
    const isSelected = selectedIds.includes(book._id);
    const div = document.createElement('div');
    div.style = `
      width: 180px; border: 1px solid #ddd; border-radius: 6px; padding: 8px; 
      display: flex; flex-direction: column; align-items: center; background: ${isSelected ? '#e0f7fa' : '#fff'};
    `;
    div.innerHTML = `
      <img src="${book.thumbnail && book.thumbnail !== 'undefined' ? book.thumbnail : 'https://server-shelf-stacker.onrender.com/assets/images/default-thumbnail.png'}" 
           style="width: 60px; height: 80px; object-fit: cover; margin-bottom: 6px;">
      <div style="font-weight: bold; font-size: 14px; text-align: center;">${book.title || book.name}</div>
      <div style="color: #e53935; font-size: 13px;">${book.price ? Number(book.price).toLocaleString('vi-VN') + '₫' : ''}</div>
      <button class="btn-select-book" data-id="${book._id}" style="margin-top: 6px; background: #2196f3; color: #fff; border: none; border-radius: 4px; padding: 2px 8px; cursor: pointer;">
        ${isSelected ? 'Bỏ chọn' : 'Chọn'}
      </button>
    `;
    listDiv.appendChild(div);
  });

  // Sự kiện chọn/bỏ chọn
  listDiv.querySelectorAll('.btn-select-book').forEach(btn => {
    btn.onclick = function() {
      const id = this.getAttribute('data-id');
      const select = document.getElementById('campaign-books');
      let selected = Array.from(select.options).filter(opt => opt.selected).map(opt => opt.value);
      if (selected.includes(id)) {
        Array.from(select.options).find(opt => opt.value === id).selected = false;
      } else {
        Array.from(select.options).find(opt => opt.value === id).selected = true;
      }
      renderBookSearchList(window.allBooks, Array.from(select.options).filter(opt => opt.selected).map(opt => opt.value));
    };
  });
}

// Load sách khi mở modal
function loadBooksForSearch(selectedIds = []) {
  fetch('https://server-shelf-stacker.onrender.com/api/books/all', { headers: { 'Authorization': token } })
    .then(res => res.json())
    .then(books => {
      window.allBooks = books;
      // Đổ option vào select ẩn (nếu chưa có)
      const select = document.getElementById('campaign-books');
      select.innerHTML = '';
      books.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b._id;
        opt.textContent = b.title || b.name;
        if (selectedIds.includes(b._id)) opt.selected = true;
        select.appendChild(opt);
      });
      renderBookSearchList(books, selectedIds);
    });
}

// Tìm kiếm realtime
document.getElementById('book-search-input').addEventListener('input', function() {
  const keyword = this.value.trim().toLowerCase();
  const select = document.getElementById('campaign-books');
  const filtered = window.allBooks.filter(b =>
    (b.title || b.name || '').toLowerCase().includes(keyword)
  );
  renderBookSearchList(filtered, Array.from(select.options).filter(opt => opt.selected).map(opt => opt.value));
});

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
  loadBooksForSearch();
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

  // 1. Tạo campaign
  fetch(apiURL, {
    method: 'POST',
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, description, startDate, endDate, type })
  })
    .then(res => res.json())
    .then(campaign => {
      // 2. Gán books cho campaign (vì POST không tự lưu books)
      return fetch(`${apiURL}/${campaign._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ books })
      }).then(() => campaign); // Trả lại campaign sau khi PUT
    })
    .then(campaign => {
      // 3. Gán campaign ID vào các book (2 chiều)
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
      showSuccessAddCampaignDialog();
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
     const selectedBooks = Array.isArray(c.books) 
  ? c.books.map(b => typeof b === 'object' ? b._id : b) 
  : [];

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

const toggleBtn = document.getElementById('toggle-book-list');
const bookSearchWrap = document.getElementById('book-search-wrap');
let isBookListOpen = false;

toggleBtn.addEventListener('click', function() {
  isBookListOpen = !isBookListOpen;
  bookSearchWrap.style.display = isBookListOpen ? 'block' : 'none';
  toggleBtn.innerHTML = isBookListOpen
    ? '<i class="fa fa-chevron-up"></i>'
    : '<i class="fa fa-chevron-down"></i>';
  if (isBookListOpen && (!window.allBooks || window.allBooks.length === 0)) {
    loadBooksForSearch();
  }
});
