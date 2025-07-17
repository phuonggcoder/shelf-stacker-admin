let categories = [];
let catCurrentPage = 1;
const catPageSize = 6;
let editingCategoryId = null;

function getToken() {
  return localStorage.getItem('authToken') || '';
}

// Hàm render danh mục với phân trang
function renderCategoriesWithPagination(categoriesArr, page = 1) {
  const tbody = document.getElementById('category-table-body');
  const totalPages = Math.ceil(categoriesArr.length / catPageSize);
  if (page > totalPages && totalPages > 0) page = totalPages;
  if (page < 1) page = 1;
  catCurrentPage = page;

  const start = (page - 1) * catPageSize;
  const end = start + catPageSize;
  const pageCategories = categoriesArr.slice(start, end);

  tbody.innerHTML = '';
  if (pageCategories.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Không có dữ liệu</td></tr>';
    return;
  }

  pageCategories.forEach(cat => {
    tbody.innerHTML += `
      <tr>
        <td><img src="${cat.image || '../img/default.jpg'}" alt="thumb" class="thumb" /></td>
        <td>${cat.name || ''}</td>
        <td>${cat.description || ''}</td>
        <td>${cat.isVisible === false ? 'Ẩn' : 'Hiển thị'}</td>
        <td>${cat.totalBooks || 0}</td>
        <td class="actions">
          <button class="action-btn btn-update"
            data-id="${cat._id}"
            data-name="${cat.name || ''}"
            data-slug="${cat.slug || ''}"
            data-image="${cat.image || ''}"
            data-description="${cat.description || ''}"
            data-status="${cat.isVisible === false ? 'false' : 'true'}"
          >Sửa</button>
          <button class="action-btn btn-return" data-id="${cat._id}">Xóa</button>
          <button class="action-btn btn-confirm">${cat.isVisible === false ? 'Hiển thị' : 'Ẩn'}</button>
        </td>
      </tr>
    `;
  });

  // Render nút phân trang
  const paginationDiv = document.querySelector('.pagination');
  paginationDiv.innerHTML = '';
  if (totalPages > 1) {
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="#007bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    prevBtn.className = 'pagination-btn';
    prevBtn.disabled = page === 1;
    prevBtn.style.cssText = "background: #fff; border: 1px solid #007bff; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin: 0 6px;";
    prevBtn.onclick = () => renderCategoriesWithPagination(categoriesArr, page - 1);

    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="#007bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    nextBtn.className = 'pagination-btn';
    nextBtn.disabled = page === totalPages;
    nextBtn.style.cssText = "background: #fff; border: 1px solid #007bff; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin: 0 6px;";
    nextBtn.onclick = () => renderCategoriesWithPagination(categoriesArr, page + 1);

    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Trang ${page} / ${totalPages}`;
    pageInfo.style.cssText = 'padding: 0 10px; font-weight: bold; font-size: 16px; color: #007bff; display: flex; align-items: center;';

    paginationDiv.appendChild(prevBtn);
    paginationDiv.appendChild(pageInfo);
    paginationDiv.appendChild(nextBtn);
  }
}

// Fetch categories
async function fetchCategories() {
  const tbody = document.getElementById('category-table-body'); 
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Đang tải...</td></tr>';
  try {
    const res = await fetch('https://server-shelf-stacker.onrender.com/api/categories');
    const data = await res.json();
    categories = Array.isArray(data) ? data : [];
    renderCategoriesWithPagination(categories, 1);
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Lỗi tải dữ liệu</td></tr>';
  }
}

// Event listeners for category actions
document.addEventListener('click', async function(e) {
  // Xóa danh mục
  if (e.target.classList.contains('btn-return')) {
    const id = e.target.getAttribute('data-id');
    if (confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      try {
        await fetch(`https://server-shelf-stacker.onrender.com/api/categories/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer ' + getToken()
          }
        });
        alert('Xóa danh mục thành công!');
        fetchCategories();
      } catch (err) {
        alert('Lỗi kết nối!');
      }
    }
  }

  // Sửa danh mục
  if (e.target.classList.contains('btn-update')) {
    editingCategoryId = e.target.getAttribute('data-id');
    document.getElementById('cat-name').value = e.target.getAttribute('data-name') || '';
    document.getElementById('cat-slug').value = e.target.getAttribute('data-slug') || '';
    document.getElementById('cat-image').value = e.target.getAttribute('data-image') || '';

    updateImageSelection(e.target.getAttribute('data-image') || '');

    setTimeout(() => {
      initCatDescEditorIfNeeded().then(() => {
        if (catDescEditor) catDescEditor.setData(e.target.getAttribute('data-description') || '');
      });
    }, 0);

    document.getElementById('cat-status').value = e.target.getAttribute('data-status') === 'false' ? 'false' : 'true';
    document.getElementById('add-category-modal').style.display = 'flex';
    document.getElementById('save-category-btn').style.display = 'none';
    document.getElementById('update-category-btn').style.display = 'block';
  }

  // Ẩn/Hiển thị danh mục
  if (e.target.classList.contains('btn-confirm')) {
    const row = e.target.closest('tr');
    const id = row.querySelector('.btn-update').getAttribute('data-id');
    const currentVisible = e.target.textContent.trim() === 'Ẩn' ? true : false;
    const newVisible = !currentVisible;
    
    if (!id) return;
    
    try {
      const res = await fetch(`https://server-shelf-stacker.onrender.com/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: newVisible })
      });
      
      if (res.ok) {
        alert(newVisible ? 'Đã hiển thị danh mục!' : 'Đã ẩn danh mục!');
        fetchCategories();
      } else {
        const err = await res.json();
        alert('Cập nhật trạng thái thất bại: ' + (err.message || 'Lỗi không xác định!'));
      }
    } catch (err) {
      alert('Lỗi kết nối!');
    }
  }
});

// Hàm lọc danh mục
function filterCategories(categories, keyword, status) {
  const lower = keyword.toLowerCase();
  return categories.filter(c =>
    ((c.name || '').toLowerCase().includes(lower) ||
    (c.slug || '').toLowerCase().includes(lower) ||
    (c.description || '').toLowerCase().includes(lower))
    && (
      status === '' ||
      (status === 'active' && c.isVisible !== false) ||
      (status === 'inactive' && c.isVisible === false)
    )
  );
}

// Search functionality
document.getElementById('btn-search').addEventListener('click', function() {
  const keyword = document.getElementById('search-slug').value.trim();
  const status = document.getElementById('filter-status').value;
  const filtered = filterCategories(categories, keyword, status);
  renderCategoriesWithPagination(filtered, 1);
});

document.getElementById('search-slug').addEventListener('input', function() {
  const keyword = this.value;
  const status = document.getElementById('filter-status').value;
  const filtered = filterCategories(categories, keyword, status);
  renderCategoriesWithPagination(filtered, 1);
});

document.getElementById('filter-status').addEventListener('change', function() {
  const keyword = document.getElementById('search-slug').value.trim();
  const status = this.value;
  const filtered = filterCategories(categories, keyword, status);
  renderCategoriesWithPagination(filtered, 1);
});

// Mở modal thêm danh mục
document.querySelector('.btn-export').addEventListener('click', function() {
  document.getElementById('add-category-modal').style.display = 'flex';
  document.getElementById('save-category-btn').style.display = 'block';
  document.getElementById('update-category-btn').style.display = 'none';
  editingCategoryId = null;
  document.getElementById('add-category-form').reset();
  setTimeout(() => {
    initCatDescEditorIfNeeded().then(() => {
      if (catDescEditor) catDescEditor.setData('');
    });
  }, 0);
});

// Đóng modal
document.getElementById('close-modal').onclick = function() {
  document.getElementById('add-category-modal').style.display = 'none';
  document.getElementById('save-category-btn').style.display = 'block';
  document.getElementById('update-category-btn').style.display = 'none';
  editingCategoryId = null;
  document.getElementById('add-category-form').reset();
};

// Thêm danh mục mới - SỬA ĐỔI API UPLOAD
document.getElementById('add-category-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  if (editingCategoryId) {
    alert('Đang ở chế độ sửa. Bấm nút cập nhật!');
    return;
  }

  const name = document.getElementById('cat-name').value.trim();
  const slug = document.getElementById('cat-slug').value.trim();
  await initCatDescEditorIfNeeded();
  const description = catDescEditor ? catDescEditor.getData() : '';
  const isVisible = document.getElementById('cat-status').value === 'true';

  if (!name || !slug) {
    alert('Vui lòng nhập tên danh mục và slug!');
    return;
  }

  try {
    const file = document.getElementById('cat-upload').files[0];
    const formData = new FormData();
    formData.append('name', name);
    formData.append('slug', slug);
    formData.append('description', description);
    formData.append('isVisible', isVisible.toString()); // 'true' hoặc 'false'
    // In ra toàn bộ dữ liệu trong formData để kiểm tra
for (let [key, value] of formData.entries()) {
  console.log(`${key}:`, value);
}


    
    // Thêm file ảnh vào FormData nếu có
    if (file) {
      formData.append('image', file);
    }

    const res = await fetch('https://server-shelf-stacker.onrender.com/api/categories', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + getToken()
      },
      body: formData
    });

    const result = await res.json();
    if (res.ok) {
      alert('✅ Thêm danh mục thành công!');
      document.getElementById('add-category-modal').style.display = 'none';
      this.reset();
      document.getElementById('preview-image').style.display = 'none';
      fetchCategories();
    } else {
      alert('❌ Thêm thất bại: ' + (result.message || 'Lỗi không xác định!'));
    }
  } catch (err) {
    alert('Lỗi kết nối hoặc server không phản hồi');
  }
});

// Cập nhật danh mục - SỬA ĐỔI API UPLOAD
document.getElementById('update-category-btn').addEventListener('click', async function (e) {
  e.preventDefault();
  if (!editingCategoryId) return;

  const name = document.getElementById('cat-name').value.trim();
  const slug = document.getElementById('cat-slug').value.trim();
  await initCatDescEditorIfNeeded();
  const description = catDescEditor ? catDescEditor.getData() : '';
  const isVisible = document.getElementById('cat-status').value === 'true';

  if (!name || !slug) {
    alert('Vui lòng nhập tên danh mục và slug!');
    return;
  }

  try {
    const file = document.getElementById('cat-upload').files[0];
    const formData = new FormData();
    formData.append('name', name);
    formData.append('slug', slug);
    formData.append('description', description);
    formData.append('isVisible', isVisible);
    
    // Thêm file ảnh vào FormData nếu có
    if (file) {
      formData.append('image', file);
    }

    const res = await fetch(`https://server-shelf-stacker.onrender.com/api/categories/${editingCategoryId}`, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + getToken()
      },
      body: formData
    });

    if (res.ok) {
      const result = await res.json();
      alert('Cập nhật danh mục thành công!');
      
      // Cập nhật dữ liệu local
      const idx = categories.findIndex(cat => cat._id === editingCategoryId);
      if (idx !== -1) {
        categories[idx] = { ...categories[idx], ...result };
      }
      
      renderCategoriesWithPagination(categories, catCurrentPage);
      resetCategoryForm();
    } else {
      const err = await res.json();
      alert('Cập nhật thất bại: ' + (err.message || 'Lỗi không xác định!'));
    }
  } catch (err) {
    alert('Lỗi kết nối!');
  }
});

// CKEditor initialization
let catDescEditor = null;
let catDescEditorPromise = null;

function initCatDescEditorIfNeeded() {
  if (!catDescEditorPromise) {
    catDescEditorPromise = ClassicEditor.create(document.querySelector('#cat-desc'))
      .then(editor => {
        catDescEditor = editor;
        return editor;
      })
      .catch(error => {
        console.error(error);
      });
  }
  return catDescEditorPromise;
}

// Upload image functionality - BỎ CÁC PHẦN UPLOAD CŨ
const inputFile = document.getElementById('cat-upload');

document.getElementById('btn-select-image').addEventListener('click', function() {
  inputFile.click();
});

inputFile.onchange = function(event) {
  const file = event.target.files[0];
  if (file) {
    // Tạo preview cho ảnh đã chọn
    const reader = new FileReader();
    reader.onload = function(e) {
      const preview = document.getElementById('preview-image');
      preview.src = e.target.result;
      preview.style.display = 'block';
      showDeleteImageButton(preview);
    };
    reader.readAsDataURL(file);
  }
};

function updateImageSelection(url) {
  const preview = document.getElementById('preview-image');
  
  if (url) {
    preview.src = url;
    preview.style.display = 'block';
    showDeleteImageButton(preview);
  } else {
    preview.src = '';
    preview.style.display = 'none';
    const btn = document.getElementById('delete-image-btn');
    if (btn) btn.style.display = 'none';
  }
}

function showDeleteImageButton(preview) {
  let btn = document.getElementById('delete-image-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'delete-image-btn';
    btn.textContent = '×';
    btn.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      background: red;
      color: white;
      border: none;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      font-size: 14px;
      cursor: pointer;
    `;
    btn.onclick = () => {
      document.getElementById('cat-upload').value = '';
      preview.src = '';
      preview.style.display = 'none';
      btn.style.display = 'none';
    };

    const wrapper = ensurePreviewWrapper(preview);
    wrapper.appendChild(btn);
  }
  btn.style.display = 'block';
}

function ensurePreviewWrapper(preview) {
  let wrapper = document.getElementById('preview-wrapper');
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.id = 'preview-wrapper';
    wrapper.style.cssText = 'position: relative; display: inline-block;';
    preview.parentNode.insertBefore(wrapper, preview);
    wrapper.appendChild(preview);
  }
  return wrapper;
}

function resetCategoryForm() {
  document.getElementById('add-category-form').reset();
  
  if (catDescEditor) catDescEditor.setData('');
  
  const preview = document.getElementById('preview-image');
  preview.src = '';
  preview.style.display = 'none';
  
  const deleteBtn = document.getElementById('delete-image-btn');
  if (deleteBtn) deleteBtn.style.display = 'none';
  
  document.getElementById('add-category-modal').style.display = 'none';
  document.getElementById('save-category-btn').style.display = 'block';
  document.getElementById('update-category-btn').style.display = 'none';
  
  editingCategoryId = null;
}

// Initialize
fetchCategories();
console.log('Token:', getToken());
console.log('editingCategoryId:', editingCategoryId);