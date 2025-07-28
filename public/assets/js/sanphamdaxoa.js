let pendingRestoreId = null;

// Hàm cắt mô tả dài và có nút Xem thêm
function renderDesc(desc, idx) {
  let shortDesc = (desc || '').replace(/(<([^>]+)>)/gi, "");
  let isLong = shortDesc.length > 270;
  if (isLong) {
    return `
      <span class="desc-short" id="desc-short-${idx}">${shortDesc.slice(0, 270)}...</span>
      <span class="desc-full" id="desc-full-${idx}" style="display:none">${shortDesc}</span>
      <a href="#" class="toggle-desc" data-idx="${idx}">Xem thêm</a>
    `;
  } else {
    return `<span>${shortDesc}</span>`;
  }
}

function getToken() {
  return localStorage.getItem('authToken') || '';
}

async function fetchTrashBooks() {
  const trashGrid = document.getElementById('trashGrid');
  trashGrid.innerHTML = '<p style="text-align: center; color: #666; font-size: 16px;">Đang tải...</p>';
  try {
    const res = await fetch('https://server-shelf-stacker-w1ds.onrender.com/api/books/trash/all', {
      headers: {
        'Authorization': 'Bearer ' + getToken()
      }
    });
    if (!res.ok) {
      const error = await res.json();
      trashGrid.innerHTML = `<p style="text-align: center; color: #dc3545; font-size: 16px;">Lỗi tải dữ liệu! ${error.message || 'Vui lòng thử lại sau.'}</p>`;
      return;
    }
    const books = await res.json();
    renderTrashBooks(books);
  } catch (err) {
    trashGrid.innerHTML = '<p style="text-align: center; color: #dc3545; font-size: 16px;">Lỗi kết nối server! Vui lòng kiểm tra internet.</p>';
  }
}

function renderTrashBooks(books) {
  const trashGrid = document.getElementById('trashGrid');
  trashGrid.innerHTML = '';
  if (!books || !Array.isArray(books) || books.length === 0) {
    trashGrid.innerHTML = '<p style="text-align: center; color: #666; font-size: 16px;">Không có sách đã xóa gần đây.</p>';
    return;
  }

  books.forEach((book, idx) => {
    let imagesHtml = '';
    if (book.thumbnail) {
      if (Array.isArray(book.thumbnail)) {
        imagesHtml = book.thumbnail.map(img => `<img src="${img}" alt="Ảnh đại diện" style="max-width: 80px; margin: 5px; border-radius: 4px;">`).join('');
      } else {
        imagesHtml = `<img src="${book.thumbnail}" alt="Ảnh đại diện" style="max-width: 80px; margin: 5px; border-radius: 4px;">`;
      }
    }

    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="card-content">
        <div class="card-images">${imagesHtml}</div>
        <div class="card-info">
          <h3 style="margin: 0 0 10px; font-size: 18px; color: #333;">${book.title || 'Chưa có tiêu đề'}</h3>
          <p><b>Tác giả:</b> ${book.author || 'Chưa có'}</p>
          <p><b>Giá:</b> ${book.price ? `${book.price}₫` : 'Chưa có'}</p>
          <div class="desc-wrap">${renderDesc(book.description, idx)}</div>
          <p><b>Danh mục:</b> ${(book.categories || []).map(c => c.name || c).join(', ') || 'Chưa có'}</p>
          <p><b>Số lượng:</b> ${book.stock || 'Chưa có'}</p>
          <p><b>Ngày xuất bản:</b> ${book.publication_date ? new Date(book.publication_date).toLocaleDateString() : 'Chưa có'}</p>
          <p><b>Nhà xuất bản:</b> ${book.publisher || 'Chưa có'}</p>
          <p><b>Ngôn ngữ:</b> ${book.language || 'Chưa có'}</p>
        </div>
        <div class="card-actions">
          <button class="action-btn restore-btn" data-id="${book._id}">
            <i class="fa fa-undo"></i> Khôi phục
          </button>
          <button class="action-btn force-delete-btn" data-id="${book._id}">
            <i class="fa fa-trash"></i> Xóa vĩnh viễn
          </button>
        </div>
      </div>
    `;
    trashGrid.appendChild(card);
  });

  document.querySelectorAll('.toggle-desc').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const idx = this.getAttribute('data-idx');
      const shortSpan = document.getElementById(`desc-short-${idx}`);
      const fullSpan = document.getElementById(`desc-full-${idx}`);
      if (shortSpan.style.display !== 'none') {
        shortSpan.style.display = 'none';
        fullSpan.style.display = 'inline';
        this.textContent = 'Ẩn bớt';
      } else {
        shortSpan.style.display = 'inline';
        fullSpan.style.display = 'none';
        this.textContent = 'Xem thêm';
      }
    });
  });

  document.querySelectorAll('.restore-btn').forEach(btn => {
    btn.onclick = function() {
      pendingRestoreId = this.getAttribute('data-id');
      const dialog = document.getElementById('confirm-restore-dialog');
      if (dialog) {
        dialog.style.display = 'flex';
      }
    };
  });

  document.querySelectorAll('.force-delete-btn').forEach(btn => {
    btn.onclick = async function() {
      const id = this.getAttribute('data-id');
      if (await showConfirmDeleteDialog()) {
        try {
          const res = await fetch(`https://server-shelf-stacker-w1ds.onrender.com/api/books/${id}/force`, {
            method: 'DELETE',
            headers: {
              'Authorization': 'Bearer ' + getToken()
            }
          });
          if (!res.ok) {
            const error = await res.json();
            showNotification('error', `Xóa vĩnh viễn thất bại! ${error.message || 'Vui lòng thử lại sau.'}`);
            return;
          }
          showNotification('success', 'Xóa vĩnh viễn sách thành công!');
          fetchTrashBooks();
        } catch (err) {
          showNotification('error', 'Lỗi kết nối! Vui lòng kiểm tra internet.');
        }
      }
    };
  });
}

// Load dialog xác nhận khôi phục
async function loadConfirmRestoreDialog() {
  try {
    const res = await fetch('components/dialogs/khoiphuc.html');
    if (!res.ok) throw new Error('Không thể tải dialog');
    const html = await res.text();
    document.body.insertAdjacentHTML('beforeend', html);

    const dialog = document.getElementById('confirm-restore-dialog');
    if (dialog) {
      dialog.querySelector('.btn-cancel').addEventListener('click', () => {
        dialog.style.display = 'none';
        pendingRestoreId = null;
      });

      dialog.querySelector('.btn-ok').addEventListener('click', async () => {
        if (!pendingRestoreId) return;
        try {
          const res = await fetch(`https://server-shelf-stacker-w1ds.onrender.com/api/books/${pendingRestoreId}/restore`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + getToken()
            }
          });
          if (!res.ok) {
            const error = await res.json();
            showNotification('error', `Khôi phục thất bại! ${error.message || 'Vui lòng thử lại sau.'}`);
          } else {
            showNotification('success', 'Khôi phục sách thành công!');
            fetchTrashBooks();
          }
        } catch (err) {
          showNotification('error', 'Lỗi kết nối! Vui lòng kiểm tra internet.');
        } finally {
          dialog.style.display = 'none';
          pendingRestoreId = null;
        }
      });
    }
  } catch (err) {
    console.error('Lỗi khi tải dialog:', err);
    showNotification('error', 'Lỗi tải dialog xác nhận! Vui lòng thử lại.');
  }
}

// Hàm hiển thị thông báo
function showNotification(type, message) {
  const notification = document.createElement('div');
  notification.id = `notification-${Date.now()}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#28a745' : '#dc3545'};
    color: white;
    padding: 15px 25px;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Segoe UI', sans-serif;
    animation: slideIn 0.3s ease, fadeOut 0.5s ease 2.5s forwards;
  `;

  const icon = document.createElement('span');
  icon.innerHTML = type === 'success' 
    ? '<i class="fa fa-check-circle" style="font-size: 18px;"></i>' 
    : '<i class="fa fa-exclamation-circle" style="font-size: 18px;"></i>';
  notification.appendChild(icon);

  const text = document.createElement('span');
  text.textContent = message;
  notification.appendChild(text);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: white;
    font-size: 16px;
    cursor: pointer;
    margin-left: 15px;
    padding: 0 5px;
  `;
  closeBtn.onclick = () => {
    notification.style.display = 'none';
    document.body.removeChild(notification);
  };
  notification.appendChild(closeBtn);

  document.body.appendChild(notification);

  // Animation keyframes
  const styleSheet = document.styleSheets[0];
  styleSheet.insertRule(`
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `, styleSheet.cssRules.length);
  styleSheet.insertRule(`
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `, styleSheet.cssRules.length);

  // Tự động ẩn sau 3 giây
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 500);
  }, 2500);
}

// Hàm xác nhận xóa
function showConfirmDeleteDialog(message = 'Bạn có chắc muốn xóa vĩnh viễn sách này? Hành động này không thể hoàn tác!') {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.id = 'confirm-delete-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 9998;
      background-color: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: 'Segoe UI', sans-serif;
    `;
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

// Tải danh sách khi vào trang
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfirmRestoreDialog();
  fetchTrashBooks();
});

// CSS cơ bản cho layout
const style = document.createElement('style');
style.textContent = `
  .product-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    margin: 10px 0;
    background: #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: box-shadow 0.3s ease;
  }
  .product-card:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
  .card-content {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
  }
  .card-images {
    flex: 0 0 auto;
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .card-info {
    flex: 1;
    min-width: 200px;
  }
  .card-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 16px;
    min-width: 120px;
    border: none;
    border-radius: 5px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.2s ease;
  }
  .restore-btn {
    background-color: #28a745;
    color: #fff;
  }
  .restore-btn:hover {
    background-color: #218838;
    transform: translateY(-1px);
  }
  .force-delete-btn {
    background-color: #dc3545;
    color: #fff;
  }
  .force-delete-btn:hover {
    background-color: #c82333;
    transform: translateY(-1px);
  }
  .desc-wrap {
    margin: 10px 0;
    line-height: 1.5;
  }
  .toggle-desc {
    color: #007bff;
    text-decoration: underline;
    cursor: pointer;
  }
  #trashGrid {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
`;
document.head.appendChild(style);