const base_url = 'https://server-shelf-stacker.onrender.com';
// Nếu test local, bạn chỉ cần đổi lại:
// const base_url = 'http://localhost:3000';

async function fetchTrashCategories() {
  const grid = document.getElementById('trashCategoryGrid');
  grid.innerHTML = '<p>Đang tải...</p>';
  try {
    const res = await fetch(`${base_url}/api/categories/trash/all`);
    if (!res.ok) {
      grid.innerHTML = '<p>Lỗi tải dữ liệu!</p>';
      return;
    }
    const categories = await res.json();
    renderTrashCategories(categories);
  } catch (err) {
    grid.innerHTML = '<p>Lỗi kết nối server!</p>';
  }
}

function renderTrashCategories(categories) {
  const grid = document.getElementById('trashCategoryGrid');
  grid.innerHTML = '';
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    grid.innerHTML = '<p>Không có danh mục đã xóa gần đây.</p>';
    return;
  }
  categories.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'category-card product-card';
    card.innerHTML = `
      <div class="category-info info">
        <p><b>ID:</b> ${cat._id || ''}</p>
        <h3>${cat.name || ''}</h3>
        <p><b>Slug:</b> ${cat.slug || ''}</p>
        <p><b>Mô tả:</b> <span>${cat.description || ''}</span></p>
        ${cat.image ? `<p><b>Ảnh:</b> <img src="${cat.image}" alt="Ảnh danh mục" style="max-width:60px;max-height:60px;border-radius:4px;border:1px solid #ccc;vertical-align:middle;" onerror="this.style.display='none'"></p>` : ''}
        <p><b>Hiển thị:</b> ${cat.isVisible ? 'Có' : 'Không'}</p>
        <p><b>Ngày tạo:</b> ${cat.createdAt ? new Date(cat.createdAt).toLocaleString() : ''}</p>
        <p><b>Ngày cập nhật:</b> ${cat.updatedAt ? new Date(cat.updatedAt).toLocaleString() : ''}</p>
        <p><b>Ngày xóa:</b> ${cat.deletedAt ? new Date(cat.deletedAt).toLocaleString() : ''}</p>
      </div>
      <div class="actions">
        <button class="restore-btn" data-id="${cat._id}"><i class="fa fa-undo"></i> Khôi phục</button>
        <button class="force-delete-btn" data-id="${cat._id}"><i class="fa fa-trash"></i> xóa vĩnh viễn</button>
      </div>
    `;
    grid.appendChild(card);
  });

  // Sự kiện khôi phục
  document.querySelectorAll('.restore-btn').forEach(btn => {
    btn.onclick = async function() {
      const id = this.getAttribute('data-id');
      if (!confirm('Khôi phục danh mục này?')) return;
      try {
        const res = await fetch(`${base_url}/api/categories/${id}/restore`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) {
          alert('Khôi phục thất bại!');
          return;
        }
        alert('Đã khôi phục!');
        fetchTrashCategories();
      } catch (err) {
        alert('Lỗi kết nối!');
      }
    };
  });

  // Sự kiện xóa cứng
  document.querySelectorAll('.force-delete-btn').forEach(btn => {
    btn.onclick = async function() {
      const id = this.getAttribute('data-id');
      if (!confirm('Xóa vĩnh viễn danh mục này?')) return;
      try {
        const res = await fetch(`${base_url}/api/categories/${id}/force`, {
          method: 'DELETE'
        });
        if (!res.ok) {
          alert('Xóa vĩnh viễn danh mục thất bại!');
          return;
        }
        alert('Đã xóa vĩnh viễn!');
        fetchTrashCategories();
      } catch (err) {
        alert('Lỗi kết nối!');
      }
    };
  });
}

document.addEventListener('DOMContentLoaded', fetchTrashCategories);
