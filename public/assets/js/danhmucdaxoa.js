const base_url = 'https://server-shelf-stacker-w1ds.onrender.com';
// Nếu test local, bạn chỉ cần đổi lại:
// const base_url = 'http://localhost:3000';

function getToken() {
  return localStorage.getItem('authToken') || '';
}

async function fetchTrashCategories() {
  const grid = document.getElementById('trashCategoryGrid');
  grid.innerHTML = '<p>Đang tải...</p>';
  try {
    const res = await fetch(`${base_url}/api/categories/trash/all`, {
      headers: {
        'Authorization': 'Bearer ' + getToken()
      }
    });
    if (!res.ok) {
      grid.innerHTML = '<p>Lỗi tải dữ liệu! Vui lòng thử lại sau.</p>';
      return;
    }
    const categories = await res.json();
    renderTrashCategories(categories);
  } catch (err) {
    grid.innerHTML = '<p>Lỗi kết nối server! Vui lòng kiểm tra kết nối internet.</p>';
  }
}

async function checkCategoryHasProducts(categoryId) {
  try {
    const res = await fetch(`${base_url}/api/books?category=${categoryId}`, {
      headers: {
        'Authorization': 'Bearer ' + getToken()
      }
    });
    if (!res.ok) {
      throw new Error('Lỗi khi kiểm tra sản phẩm trong danh mục.');
    }
    const data = await res.json();
    return data.books && data.books.length > 0;
  } catch (err) {
    console.error('Lỗi kiểm tra sản phẩm:', err);
    return false; // Giả định không có sản phẩm nếu API lỗi, để tránh chặn xóa không cần thiết
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
        ${cat.image ? `<p><b>Ảnh:</b> <img src="${cat.image.replace('https://server-shelf-stacker.onrender.com', 'https://server-shelf-stacker-w1ds.onrender.com')}" alt="Ảnh danh mục" style="max-width:60px;max-height:60px;border-radius:4px;border:1px solid #ccc;vertical-align:middle;" onerror="this.style.display='none'"></p>` : ''}
        <p><b>Hiển thị:</b> ${cat.isVisible ? 'Có' : 'Không'}</p>
        <p><b>Ngày tạo:</b> ${cat.createdAt ? new Date(cat.createdAt).toLocaleString() : ''}</p>
        <p><b>Ngày cập nhật:</b> ${cat.updatedAt ? new Date(cat.updatedAt).toLocaleString() : ''}</p>
        <p><b>Ngày xóa:</b> ${cat.deletedAt ? new Date(cat.deletedAt).toLocaleString() : ''}</p>
      </div>
      <div class="actions">
        <button class="restore-btn" data-id="${cat._id}"><i class="fa fa-undo"></i> Khôi phục</button>
        <button class="force-delete-btn" data-id="${cat._id}"><i class="fa fa-trash"></i> Xóa vĩnh viễn</button>
      </div>
    `;
    grid.appendChild(card);
  });

  // Sự kiện khôi phục
  document.querySelectorAll('.restore-btn').forEach(btn => {
    btn.onclick = async function() {
      const id = this.getAttribute('data-id');
      if (await showConfirmDeleteDialog('Bạn có chắc chắn muốn khôi phục danh mục này?')) {
        try {
          console.log('Bắt đầu yêu cầu khôi phục cho ID:', id);
          const res = await fetch(`${base_url}/api/categories/${id}/restore`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + getToken()
            }
          });
          if (!res.ok) {
            const error = await res.json();
            console.error('Lỗi từ server:', error);
            showErrorDialog('Khôi phục thất bại!', error.message || 'Vui lòng thử lại sau hoặc liên hệ admin.');
            return;
          }
          showUpdateBookSuccessDialog();
          fetchTrashCategories();
        } catch (err) {
          console.error('Lỗi kết nối:', err);
          showErrorDialog('Lỗi!', 'Lỗi kết nối! Vui lòng kiểm tra kết nối internet và thử lại.');
        }
      }
    };
  });

  // Sự kiện xóa cứng
  document.querySelectorAll('.force-delete-btn').forEach(btn => {
    btn.onclick = async function() {
      const id = this.getAttribute('data-id');
      if (await showConfirmDeleteDialog('Bạn có chắc chắn muốn xóa vĩnh viễn danh mục này? Hành động này không thể hoàn tác!')) {
        try {
          // Kiểm tra xem danh mục có sản phẩm hay không
          const hasProducts = await checkCategoryHasProducts(id);
          if (hasProducts) {
            showErrorDialog('Lỗi xóa danh mục!', 'Danh mục này vẫn còn chứa sản phẩm. Vui lòng xóa hoặc chuyển các sản phẩm trước khi xóa vĩnh viễn.');
            return;
          }

          console.log('Bắt đầu yêu cầu xóa vĩnh viễn cho ID:', id);
          const res = await fetch(`${base_url}/api/categories/${id}/force`, {
            method: 'DELETE',
            headers: {
              'Authorization': 'Bearer ' + getToken()
            }
          });
          if (!res.ok) {
            const error = await res.json();
            console.error('Lỗi từ server:', error);
            showErrorDialog('Xóa vĩnh viễn thất bại!', error.message || 'Vui lòng thử lại sau hoặc liên hệ admin.');
            return;
          }
          showSuccessDeletebook();
          fetchTrashCategories();
        } catch (err) {
          console.error('Lỗi kết nối:', err);
          showErrorDialog('Lỗi!', 'Lỗi kết nối! Vui lòng kiểm tra kết nối internet và thử lại.');
        }
      }
    };
  });
}

document.addEventListener('DOMContentLoaded', fetchTrashCategories);

// Dialog functions
function showSuccessDeletebook() {
  const dialog = document.createElement('div');
  dialog.id = 'dialog-success-delete-book';
  dialog.style.cssText = 'position: fixed; inset: 0; z-index: 9999; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-family: \'Segoe UI\', sans-serif;';
  dialog.innerHTML = `
    <div style="background: white; border-radius: 12px; padding: 24px 32px; max-width: 360px; width: 100%; text-align: center;">
      <img src="https://img.icons8.com/color/48/000000/ok--v1.png" alt="ok">
      <h3 style="margin-top: 12px; font-size: 18px;">Đã xóa vĩnh viễn danh mục thành công!</h3>
      <button onclick="closeDeleteDialog()" style="margin-top: 20px; padding: 8px 24px; background: #00cfff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">OK</button>
    </div>
  `;
  document.body.appendChild(dialog);
  setTimeout(() => dialog.style.display = 'flex', 0);
}

function showErrorDialog(title, message) {
  const dialog = document.createElement('div');
  dialog.id = 'dialog-error';
  dialog.style.cssText = 'position: fixed; inset: 0; z-index: 9999; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-family: \'Segoe UI\', sans-serif;';
  dialog.innerHTML = `
    <div style="background: white; border-radius: 12px; padding: 24px 32px; max-width: 360px; width: 100%; text-align: center;">
      <img src="https://img.icons8.com/color/48/000000/error.png" alt="error">
      <h3 style="margin-top: 12px; font-size: 18px;">${title}</h3>
      <p style="color: #d32f2f;">${message}</p>
      <button onclick="this.parentElement.parentElement.style.display='none'" style="margin-top: 20px; padding: 8px 24px; background: #ff4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">OK</button>
    </div>
  `;
  document.body.appendChild(dialog);
  setTimeout(() => dialog.style.display = 'flex', 0);
}

function showAddBookSuccessDialog() {
  const dialog = document.createElement('div');
  dialog.id = 'dialog-success-add-book';
  dialog.style.cssText = 'position: fixed; inset: 0; z-index: 9999; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-family: \'Segoe UI\', sans-serif;';
  dialog.innerHTML = `
    <div style="background: white; border-radius: 12px; padding: 24px 32px; max-width: 360px; width: 100%; text-align: center;">
      <img src="https://img.icons8.com/color/48/000000/ok--v1.png" alt="ok">
      <h3 style="font-size: 18px; margin-bottom: 24px;">Thêm danh mục thành công!</h3>
      <div style="display: flex; justify-content: space-around;">
        <button onclick="closeAddBookDialog()" style="padding: 8px 24px; background: #e0e0e0; color: #000; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Quay lại</button>
        <button onclick="closeAddBookDialog()" style="padding: 8px 24px; background: #00cfff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Xác nhận</button>
      </div>
    </div>
  `;
  document.body.appendChild(dialog);
  setTimeout(() => dialog.style.display = 'flex', 0);
}

function showUpdateBookSuccessDialog() {
  const dialog = document.createElement('div');
  dialog.id = 'dialog-success-update-book';
  dialog.style.cssText = 'position: fixed; inset: 0; z-index: 9999; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-family: \'Segoe UI\', sans-serif;';
  dialog.innerHTML = `
    <div style="background: white; border-radius: 12px; padding: 24px 32px; max-width: 360px; width: 100%; text-align: center;">
      <img src="https://img.icons8.com/color/48/000000/ok--v1.png" alt="ok">
      <h3 style="font-size: 18px; margin-bottom: 20px;">Khôi phục danh mục thành công!</h3>
      <button onclick="closeUpdateBookDialog()" style="padding: 8px 24px; background: #00cfff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">OK</button>
    </div>
  `;
  document.body.appendChild(dialog);
  setTimeout(() => dialog.style.display = 'flex', 0);
}

function showConfirmDeleteDialog(message = 'Bạn có chắc muốn thực hiện hành động này?') {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.id = 'confirm-delete-overlay';
    overlay.style.cssText = 'position: fixed; inset: 0; z-index: 9998; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-family: \'Segoe UI\', sans-serif;';
    overlay.innerHTML = `
      <div style="background: white; border-radius: 12px; padding: 16px 20px; max-width: 360px; width: 100%; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); text-align: left;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <img src="https://img.icons8.com/fluency/24/delete-sign.png" alt="delete-icon" />
          <span style="font-size: 15px;">${message}</span>
        </div>
        <div style="height: 2px; background-color: #00cfff; margin-bottom: 16px;"></div>
        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <button id="btn-cancel-delete" style="padding: 6px 16px; background: #ffecec; color: #f44336; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Hủy</button>
          <button id="btn-ok-delete" style="padding: 6px 16px; background: #00cfff; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#btn-cancel-delete').onclick = () => { document.body.removeChild(overlay); resolve(false); };
    overlay.querySelector('#btn-ok-delete').onclick = () => { document.body.removeChild(overlay); resolve(true); };
  });
}

function closeDeleteDialog() {
  const dialog = document.getElementById('dialog-success-delete-book');
  if (dialog) {
    dialog.style.display = 'none';
    document.body.removeChild(dialog);
    fetchTrashCategories();
  }
}

function closeAddBookDialog() {
  const dialog = document.getElementById('dialog-success-add-book');
  if (dialog) {
    dialog.style.display = 'none';
    document.body.removeChild(dialog);
  }
}

function closeUpdateBookDialog() {
  const dialog = document.getElementById('dialog-success-update-book');
  if (dialog) {
    dialog.style.display = 'none';
    document.body.removeChild(dialog);
    fetchTrashCategories();
  }
}