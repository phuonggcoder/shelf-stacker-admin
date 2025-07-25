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
let existingImages = [];
let newImageFiles = [];
let deletedImageUrls = [];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN');
}

function renderCampaigns(data) {
  if (!data.length) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Không có chiến dịch nào.</td></tr>`;
    return;
  }
  tableBody.innerHTML = '';
  data.forEach(c => {
    const imageUrl = Array.isArray(c.image) && c.image.length > 0 
      ? c.image[0] 
      : 'https://server-shelf-stacker.onrender.com/assets/images/default-thumbnail.png';
    const typeDisplay = {
      'promotion': 'Khuyến mãi',
      'event': 'Sự kiện',
      'advertisement': 'Quảng cáo',
      'special_offer': 'Ưu đãi đặc biệt',
      'community_event': 'Sự kiện cộng đồng'
    }[c.type] || c.type;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${imageUrl}" style="width: 50px; height: 50px; object-fit: cover;" alt="Campaign image"></td>
      <td><strong>${c.name}</strong></td>
      <td>${formatDate(c.startDate)}</td>
      <td>${formatDate(c.endDate)}</td>
      <td>${typeDisplay}</td>
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
  fetch(apiURL, { headers: { 'Authorization': token } })
    .then(res => res.json())
    .then(renderCampaigns)
    .catch(err => {
      console.error('❌ Lỗi tải dữ liệu:', err);
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Lỗi tải dữ liệu.</td></tr>`;
    });
}

function loadBooksForSearch(selectedIds = []) {
  fetch(bookAllAPI, { headers: { 'Authorization': token } })
    .then(res => res.json())
    .then(books => {
      window.allBooks = books;
      const select = document.getElementById('campaign-books');
      select.innerHTML = '';
      books.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b._id;
        opt.textContent = b.title || b.name || 'Không tên';
        if (selectedIds.includes(b._id)) opt.selected = true;
        select.appendChild(opt);
      });
      renderBookSearchList(books, selectedIds);
    })
    .catch(err => console.error('❌ Lỗi tải sách:', err));
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
      <div style="font-weight: bold; font-size: 14px; text-align: center;">${book.title || book.name || 'Không tên'}</div>
      <div style="color: #e53935; font-size: 13px;">${book.price ? Number(book.price).toLocaleString('vi-VN') + '₫' : ''}</div>
      <button class="btn-select-book" data-id="${book._id}" style="margin-top: 6px; background: #2196f3; color: #fff; border: none; border-radius: 4px; padding: 2px 8px; cursor: pointer;">
        ${isSelected ? 'Bỏ chọn' : 'Chọn'}
      </button>
    `;
    listDiv.appendChild(div);
  });

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
      renderBookSearchList(books, Array.from(select.options).filter(opt => opt.selected).map(opt => opt.value));
    };
  });
}

document.getElementById('book-search-input').addEventListener('input', function() {
  const keyword = this.value.trim().toLowerCase();
  const select = document.getElementById('campaign-books');
  const filtered = window.allBooks.filter(b =>
    (b.title || b.name || '').toLowerCase().includes(keyword)
  );
  renderBookSearchList(filtered, Array.from(select.options).filter(opt => opt.selected).map(opt => opt.value));
});

function loadBooks() {
  fetch(bookAllAPI, { headers: { 'Authorization': token } })
    .then(res => res.json())
    .then(books => {
      console.log('✅ Danh sách sách:', books);
      const select = document.getElementById('campaign-books');
      if (!select) {
        console.warn('Không tìm thấy thẻ select #campaign-books');
        return;
      }
      select.innerHTML = '';
      books.forEach(book => {
        const option = document.createElement('option');
        option.value = book._id;
        option.textContent = book.title || book.name || 'Không tên';
        select.appendChild(option);
      });
    })
    .catch(err => {
      console.error('❌ Không thể tải danh sách sách:', err);
      const select = document.getElementById('campaign-books');
      if (select) select.innerHTML = `<option disabled>Không tải được dữ liệu</option>`;
    });
}

function getSelectedBooks() {
  const options = document.getElementById('campaign-books').selectedOptions;
  return Array.from(options).map(opt => opt.value);
}

function renderImagePreviews() {
  const container = document.getElementById('image-preview-container');
  if (!container) {
    console.error('❌ Không tìm thấy container #image-preview-container');
    return;
  }
  container.innerHTML = '';

  existingImages.forEach((url, index) => {
    if (!deletedImageUrls.includes(url)) {
      const wrapper = document.createElement('div');
      wrapper.className = 'image-preview-wrapper';
      wrapper.innerHTML = `
        <img src="${url}" class="image-preview" style="display: block;" />
        <div class="image-actions">
          <button class="edit-image-btn" data-url="${url}" title="Xóa hình ảnh">🗑️</button>
          <button class="replace-image-btn" data-url="${url}" title="Sửa hình ảnh">✏️</button>
        </div>
      `;
      if (index === 0 && newImageFiles.length === 0) {
        wrapper.querySelector('.image-preview').classList.add('thumbnail');
      }
      container.appendChild(wrapper);
    }
  });

  newImageFiles.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const wrapper = document.createElement('div');
      wrapper.className = 'image-preview-wrapper';
      wrapper.innerHTML = `
        <img src="${e.target.result}" class="image-preview" style="display: block;" />
        <div class="image-actions">
          <button class="edit-image-btn" data-index="${index}" title="Xóa hình ảnh">🗑️</button>
          <button class="replace-image-btn" data-index="${index}" title="Sửa hình ảnh">✏️</button>
        </div>
      `;
      if (index === 0 && existingImages.filter(url => !deletedImageUrls.includes(url)).length === 0) {
        wrapper.querySelector('.image-preview').classList.add('thumbnail');
      }
      container.appendChild(wrapper);
      attachEditButtonListeners();
    };
    reader.readAsDataURL(file);
  });

  attachEditButtonListeners();
}

function attachEditButtonListeners() {
  document.querySelectorAll('.edit-image-btn').forEach(btn => {
    btn.onclick = function() {
      const url = this.getAttribute('data-url');
      const index = this.getAttribute('data-index');
      if (url) deletedImageUrls.push(url);
      else if (index !== null) newImageFiles.splice(parseInt(index), 1);
      renderImagePreviews();
    };
  });

  document.querySelectorAll('.replace-image-btn').forEach(btn => {
    btn.onclick = function() {
      const url = this.getAttribute('data-url');
      const index = this.getAttribute('data-index');
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
          if (url) {
            const existingIndex = existingImages.indexOf(url);
            if (existingIndex > -1 && !deletedImageUrls.includes(url)) {
              deletedImageUrls.push(url);
              newImageFiles.push(file);
            }
          } else if (index !== null) newImageFiles[parseInt(index)] = file;
          renderImagePreviews();
        } else alert('Vui lòng chọn một hình ảnh để thay thế!');
      };
      input.click();
    };
  });
}

document.getElementById('btn-add-campaign').addEventListener('click', () => {
  editingId = null;
  existingImages = [];
  newImageFiles = [];
  deletedImageUrls = [];
  document.getElementById('campaign-form').reset();
  if (editorInstance) editorInstance.setData('');
  document.getElementById('save-campaign-btn').style.display = 'block';
  document.getElementById('update-campaign-btn').style.display = 'none';
  document.getElementById('campaign-modal').style.display = 'flex';
  document.getElementById('image-preview-container').innerHTML = '';
  document.getElementById('campaign-image').value = '';
  const select = document.getElementById('campaign-books');
  Array.from(select.options).forEach(opt => (opt.selected = false));
  loadBooksForSearch();
});

document.getElementById('close-campaign-modal').addEventListener('click', () => {
  document.getElementById('campaign-modal').style.display = 'none';
  document.getElementById('image-preview-container').innerHTML = '';
  document.getElementById('campaign-image').value = '';
  existingImages = [];
  newImageFiles = [];
  deletedImageUrls = [];
  editingId = null;
});

document.getElementById('campaign-image').addEventListener('change', function(e) {
  const files = e.target.files;
  if (files.length > 0) {
    newImageFiles = newImageFiles.concat(Array.from(files));
    renderImagePreviews();
    document.getElementById('campaign-image').value = '';
  }
});

document.getElementById('save-campaign-btn').addEventListener('click', function(e) {
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

  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);
  formData.append('startDate', startDate);
  formData.append('endDate', endDate);
  formData.append('type', type);
  books.forEach(book => formData.append('books[]', book));
  newImageFiles.forEach(file => formData.append('imageFile', file));

  fetch(apiURL, {
    method: 'POST',
    headers: { 'Authorization': token },
    body: formData
  })
    .then(res => res.ok ? res.json() : res.json().then(err => { throw new Error(err.error || err.message || 'Lỗi khi tạo chiến dịch'); }))
    .then(campaign => Promise.all(books.map(bookId => fetch(`${bookAPI}/${bookId}`, {
      method: 'PUT',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaigns: [campaign._id] })
    }))).then(() => campaign))
    .then(() => {
      showSuccessAddCampaignDialog();
      document.getElementById('campaign-modal').style.display = 'none';
      document.getElementById('image-preview-container').innerHTML = '';
      document.getElementById('campaign-image').value = '';
      newImageFiles = [];
      loadCampaigns();
    })
    .catch(err => {
      console.error('❌ Lỗi khi thêm chiến dịch:', err);
      alert(`❌ Lỗi khi thêm chiến dịch: ${err.message}`);
    });
});

function editCampaign(id) {
  fetch(`${apiURL}/${id}`, { headers: { 'Authorization': token } })
    .then(res => res.ok ? res.json() : Promise.reject(new Error('Không tải được dữ liệu chiến dịch')))
    .then(c => {
      editingId = id;
      document.getElementById('campaign-name').value = c.name;
      document.getElementById('campaign-start').value = c.startDate?.split('T')[0] || '';
      document.getElementById('campaign-end').value = c.endDate?.split('T')[0] || '';
      document.getElementById('campaign-type').value = c.type;
      editorInstance.setData(c.description || '');
      const select = document.getElementById('campaign-books');
      const selectedBooks = Array.isArray(c.books) ? c.books.map(b => typeof b === 'object' ? b._id : b) : [];
      Array.from(select.options).forEach(opt => opt.selected = selectedBooks.includes(opt.value));
      existingImages = Array.isArray(c.image) ? c.image : [];
      newImageFiles = [];
      deletedImageUrls = [];
      renderImagePreviews();
      loadBooksForSearch(selectedBooks);
      document.getElementById('save-campaign-btn').style.display = 'none';
      document.getElementById('update-campaign-btn').style.display = 'block';
      document.getElementById('campaign-modal').style.display = 'flex';
    })
    .catch(err => {
      console.error('❌ Không tải được dữ liệu chiến dịch:', err);
      alert('❌ Không thể chỉnh sửa chiến dịch này: ' + err.message);
    });
}

document.getElementById('update-campaign-btn').addEventListener('click', function(e) {
  e.preventDefault();
  const name = document.getElementById('campaign-name').value.trim();
  const description = editorInstance.getData();
  const status = document.getElementById('campaign-status').value;
  const startDate = document.getElementById('campaign-start').value;
  const endDate = document.getElementById('campaign-end').value;
  const type = document.getElementById('campaign-type').value;
  const books = getSelectedBooks();

  if (!name || !startDate || !endDate) {
    alert('⚠️ Vui lòng nhập đầy đủ thông tin');
    return;
  }

  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);
  formData.append('status', status);
  formData.append('startDate', startDate);
  formData.append('endDate', endDate);
  formData.append('type', type);
  books.forEach(book => formData.append('books[]', book));

  // Only include images if there are changes (new images or deletions)
  if (newImageFiles.length > 0 || deletedImageUrls.length > 0) {
    newImageFiles.forEach(file => formData.append('imageFile', file));
    if (deletedImageUrls.length < existingImages.length) {
      existingImages
        .filter(url => !deletedImageUrls.includes(url))
        .forEach(url => formData.append('imageUrl', url));
    }
    deletedImageUrls.forEach(url => formData.append('deletedImageUrls[]', url));
  }

  fetch(`${apiURL}/${editingId}`, {
    method: 'PUT',
    headers: { 'Authorization': token },
    body: formData
  })
    .then(res => res.ok ? res.json() : res.json().then(err => { throw new Error(err.error || err.message || 'Lỗi khi cập nhật chiến dịch'); }))
    .then(() => Promise.all(books.map(bookId => fetch(`${bookAPI}/${bookId}`, {
      method: 'PUT',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaigns: [editingId] })
    }))))
    .then(() => {
      showSuccessUpdateCampaignDialog();
      document.getElementById('campaign-modal').style.display = 'none';
      document.getElementById('image-preview-container').innerHTML = '';
      document.getElementById('campaign-image').value = '';
      existingImages = [];
      newImageFiles = [];
      deletedImageUrls = [];
      loadCampaigns();
    })
    .catch(err => {
      console.error(err);
      alert('❌ Lỗi khi cập nhật chiến dịch: ' + err.message);
    });
});

function deleteCampaign(id) {
  fetch(`${apiURL}/${id}`, { headers: { 'Authorization': token } })
    .then(res => res.ok ? res.json() : Promise.reject(new Error('Không thể tải dữ liệu chiến dịch để xóa')))
    .then(campaign => {
      showConfirmDeleteCampaignDialog();
      const observer = new MutationObserver((mutations, obs) => {
        const dialog = document.getElementById('dialog-confirm-delete-campaign');
        const cancelBtn = document.getElementById('cancel-delete-campaign-btn');
        const confirmBtn = document.getElementById('confirm-delete-campaign-btn');
        if (dialog && cancelBtn && confirmBtn) {
          obs.disconnect();
          cancelBtn.addEventListener('click', () => dialog.remove());
          confirmBtn.addEventListener('click', () => {
            dialog.remove();
            const formData = new FormData();
            if (Array.isArray(campaign.image)) {
              campaign.image.forEach(url => formData.append('deletedImageUrls[]', url));
            }
            fetch(`${apiURL}/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': token },
              body: formData
            })
              .then(res => res.ok ? res.json() : Promise.reject(new Error('Xóa chiến dịch thất bại')))
              .then(() => {
                showSuccessDeleteCampaignDialog();
                loadCampaigns();
              })
              .catch(err => {
                console.error('❌ Lỗi khi xóa chiến dịch:', err);
                alert('❌ Lỗi khi xóa chiến dịch: ' + err.message);
              });
          });
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    })
    .catch(err => {
      console.error('❌ Lỗi khi tải dữ liệu để xóa:', err);
      alert('❌ Không thể xóa chiến dịch: ' + err.message);
    });
}

document.getElementById('btn-search').addEventListener('click', function() {
  const keyword = document.getElementById('search-campaign').value.trim().toLowerCase();
  fetch(apiURL, { headers: { 'Authorization': token } })
    .then(res => res.json())
    .then(data => {
      const filtered = data.filter(c => c.name.toLowerCase().includes(keyword));
      if (filtered.length === 0) {
        showNotFoundCampaignDialog();
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Không tìm thấy chiến dịch nào.</td></tr>`;
      } else {
        renderCampaigns(filtered);
      }
    })
    .catch(err => {
      console.error('❌ Lỗi tìm kiếm:', err);
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Không thể tìm kiếm dữ liệu.</td></tr>`;
    });
});

document.getElementById('search-campaign').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') document.getElementById('btn-search').click();
});

document.addEventListener('DOMContentLoaded', function() {
  ClassicEditor.create(document.querySelector('#campaign-desc'))
    .then(editor => {
      editorInstance = editor;
      loadBooks();
      loadCampaigns();
    })
    .catch(error => console.error('CKEditor lỗi:', error));
});

const toggleBtn = document.getElementById('toggle-book-list');
const bookSearchWrap = document.getElementById('book-search-wrap');
let isBookListOpen = false;

toggleBtn.addEventListener('click', function() {
  isBookListOpen = !isBookListOpen;
  bookSearchWrap.style.display = isBookListOpen ? 'block' : 'none';
  toggleBtn.innerHTML = isBookListOpen ? '<i class="fa fa-chevron-up"></i>' : '<i class="fa fa-chevron-down"></i>';
  if (isBookListOpen && (!window.allBooks || window.allBooks.length === 0)) loadBooksForSearch();
});

function showSuccessUpdateCampaignDialog() {
  fetch('/components/dialogs/success-update-campaign.html')
    .then(res => res.text())
    .then(html => document.body.insertAdjacentHTML('beforeend', html));
}

function showSuccessDeleteCampaignDialog() {
  fetch('/components/dialogs/success-delete-campaign.html')
    .then(res => res.text())
    .then(html => document.body.insertAdjacentHTML('beforeend', html));
}

function showNotFoundCampaignDialog() {
  fetch('/components/dialogs/not-found-campaign.html')
    .then(res => res.text())
    .then(html => document.body.insertAdjacentHTML('beforeend', html));
}

function showConfirmDeleteCampaignDialog() {
  fetch('/components/dialogs/confirm-delete-campaign.html')
    .then(res => res.text())
    .then(html => document.body.insertAdjacentHTML('beforeend', html));
}

function showSuccessAddCampaignDialog() {
  fetch('/components/dialogs/success-add-campaign.html')
    .then(res => res.text())
    .then(html => document.body.insertAdjacentHTML('beforeend', html));
}