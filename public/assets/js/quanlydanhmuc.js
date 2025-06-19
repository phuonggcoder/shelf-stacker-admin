

    let categories = [];
let catCurrentPage = 1;
const catPageSize = 6;

// Hàm render danh mục với phân trang
function renderCategoriesWithPagination(categoriesArr, page = 1) {
  const tbody = document.getElementById('category-table-body');
  const totalPages = Math.ceil(categoriesArr.length / catPageSize);
  if (page > totalPages && totalPages > 0) page = totalPages;
  if (page < 1) page = 1;
  catCurrentPage = page;

  // Lấy danh mục cho trang hiện tại
  const start = (page - 1) * catPageSize;
  const end = start + catPageSize;
  const pageCategories = categoriesArr.slice(start, end);

  tbody.innerHTML = '';
  if (pageCategories.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Không có dữ liệu</td></tr>';
    return;
  }
  // Khi render bảng, dùng isVisible để hiển thị trạng thái
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

  // Render nút phân trang với hình ảnh SVG đẹp
  const paginationDiv = document.querySelector('.pagination');
  paginationDiv.innerHTML = '';
  if (totalPages > 1) {
    // Nút trang trước với icon
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="#007bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    prevBtn.className = 'pagination-btn';
    prevBtn.disabled = page === 1;
    prevBtn.style.background = "#fff";
    prevBtn.style.border = "1px solid #007bff";
    prevBtn.style.borderRadius = "50%";
    prevBtn.style.width = "40px";
    prevBtn.style.height = "40px";
    prevBtn.style.display = "flex";
    prevBtn.style.alignItems = "center";
    prevBtn.style.justifyContent = "center";
    prevBtn.style.margin = "0 6px";
    prevBtn.onclick = () => renderCategoriesWithPagination(categoriesArr, page - 1);

    // Nút trang sau với icon
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="#007bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    nextBtn.className = 'pagination-btn';
    nextBtn.disabled = page === totalPages;
    nextBtn.style.background = "#fff";
    nextBtn.style.border = "1px solid #007bff";
    nextBtn.style.borderRadius = "50%";
    nextBtn.style.width = "40px";
    nextBtn.style.height = "40px";
    nextBtn.style.display = "flex";
    nextBtn.style.alignItems = "center";
    nextBtn.style.justifyContent = "center";
    nextBtn.style.margin = "0 6px";
    nextBtn.onclick = () => renderCategoriesWithPagination(categoriesArr, page + 1);

    // Hiển thị số trang
    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Trang ${page} / ${totalPages}`;
    pageInfo.style = 'padding: 0 10px; font-weight:bold; font-size:16px; color:#007bff; display:flex; align-items:center;';

    paginationDiv.appendChild(prevBtn);
    paginationDiv.appendChild(pageInfo);
    paginationDiv.appendChild(nextBtn);
  }
}

// Sửa lại fetchCategories để lưu categories và gọi renderCategoriesWithPagination
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
fetchCategories();

    // Thêm chức năng ẨN/HIỂN THỊ cho nút btn-confirm
document.addEventListener('click', async function(e) {
  // Xóa
  if (e.target.classList.contains('btn-return')) {
    const id = e.target.getAttribute('data-id');
    if (confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      try {
        await fetch(`https://server-shelf-stacker.onrender.com/api/categories/${id}`, {
          method: 'DELETE'
        });
        alert('Xóa danh mục thành công!');
        fetchCategories();
      } catch (err) {
        alert('Lỗi kết nối!');
      }
    }
  }
  // Sửa
  if (e.target.classList.contains('btn-update')) {
    editingCategoryId = e.target.getAttribute('data-id');
    document.getElementById('cat-name').value = e.target.getAttribute('data-name') || '';
    document.getElementById('cat-slug').value = e.target.getAttribute('data-slug') || '';
    document.getElementById('cat-image').value = e.target.getAttribute('data-image') || '';
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

  // Ẩn/Hiển thị
  if (e.target.classList.contains('btn-confirm')) {
    const row = e.target.closest('tr');
    const id = row.querySelector('.btn-update').getAttribute('data-id');
    // Lấy trạng thái hiện tại
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

    // Hàm lọc danh mục theo từ khóa và trạng thái (dùng isVisible)
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

// Nút tìm kiếm
document.getElementById('btn-search').addEventListener('click', function() {
  const keyword = document.getElementById('search-slug').value.trim();
  const status = document.getElementById('filter-status').value;
  const filtered = filterCategories(categories, keyword, status);
  renderCategoriesWithPagination(filtered, 1);
});

// Lọc realtime khi gõ vào ô tìm kiếm hoặc đổi trạng thái
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

    // Thêm danh mục mới
    document.getElementById('add-category-form').addEventListener('submit', async function(e) {
      if (editingCategoryId) return; // Nếu đang sửa thì không cho thêm mới
      e.preventDefault();
      const name = document.getElementById('cat-name').value.trim();
      const slug = document.getElementById('cat-slug').value.trim();
      const image = document.getElementById('cat-image').value.trim();
      await initCatDescEditorIfNeeded();
      const description = catDescEditor ? catDescEditor.getData() : document.getElementById('cat-desc').value.trim();
      const isVisible = document.getElementById('cat-status').value === 'true';
      if (!name || !slug) {
        alert('Vui lòng nhập tên danh mục và slug!');
        return;
      }
      try {
        const res = await fetch('https://server-shelf-stacker.onrender.com/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, slug, description, image, isVisible })
        });
        if (res.ok) {
          alert('Thêm danh mục thành công!');
          document.getElementById('add-category-modal').style.display = 'none';
          fetchCategories();
          this.reset();
        } else {
          const err = await res.json();
          alert('Thêm thất bại: ' + (err.message || 'Lỗi không xác định!'));
        }
      } catch (err) {
        alert('Lỗi kết nối!');
      }
    });

    // Xử lý xóa và sửa danh mục
    document.addEventListener('click', async function(e) {
      // Xóa
      if (e.target.classList.contains('btn-return')) {
        const id = e.target.getAttribute('data-id');
        if (confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
          try {
            await fetch(`https://server-shelf-stacker.onrender.com/api/categories/${id}`, {
              method: 'DELETE'
            });
            alert('Xóa danh mục thành công!');
            fetchCategories();
          } catch (err) {
            alert('Lỗi kết nối!');
          }
        }
      }
      // Sửa
      if (e.target.classList.contains('btn-update')) {
        editingCategoryId = e.target.getAttribute('data-id');
        document.getElementById('cat-name').value = e.target.getAttribute('data-name') || '';
        document.getElementById('cat-slug').value = e.target.getAttribute('data-slug') || '';
        document.getElementById('cat-image').value = e.target.getAttribute('data-image') || '';
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
    });

    // Cập nhật danh mục
    document.getElementById('update-category-btn').addEventListener('click', async function(e) {
      e.preventDefault();
      if (!editingCategoryId) return;
      const name = document.getElementById('cat-name').value.trim();
      const slug = document.getElementById('cat-slug').value.trim();
      const image = document.getElementById('cat-image').value.trim();
      await initCatDescEditorIfNeeded();
      const description = catDescEditor ? catDescEditor.getData() : document.getElementById('cat-desc').value.trim();
      const isVisible = document.getElementById('cat-status').value === 'true';
      if (!name || !slug) {
        alert('Vui lòng nhập tên danh mục và slug!');
        return;
      }
      try {
        const res = await fetch(`https://server-shelf-stacker.onrender.com/api/categories/${editingCategoryId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, slug, description, image, isVisible })
        });
        if (res.ok) {
          alert('Cập nhật danh mục thành công!');
          document.getElementById('add-category-modal').style.display = 'none';
          fetchCategories();
          document.getElementById('add-category-form').reset();
          document.getElementById('save-category-btn').style.display = 'block';
          document.getElementById('update-category-btn').style.display = 'none';
          editingCategoryId = null;
        } else {
          const err = await res.json();
          alert('Cập nhật thất bại: ' + (err.message || 'Lỗi không xác định!'));
        }
      } catch (err) {
        alert('Lỗi kết nối!');
      }
    });

    // Khởi tạo CKEditor 5 cho mô tả danh mục
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

