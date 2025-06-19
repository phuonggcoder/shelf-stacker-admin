// Lấy danh sách truyện tranh từ API
async function fetchBooks() {
  const grid = document.getElementById('bookGrid');
  grid.innerHTML = '<p>Đang tải...</p>';
  try {
    const res = await fetch('https://server-shelf-stacker.onrender.com/api/books');
    if (!res.ok) {
      grid.innerHTML = '<p>Lỗi tải dữ liệu!</p>';
      return;
    }
    const books = await res.json();
    renderBooks(books);
  } catch (err) {
    grid.innerHTML = '<p>Lỗi kết nối server!</p>';
  }
}

// Hiển thị danh sách truyện tranh
function renderBooks(books) {
  const grid = document.getElementById('bookGrid');
  if (!books || !Array.isArray(books) || books.length === 0) {
    grid.innerHTML = '<p>Không có truyện tranh nào.</p>';
    return;
  }
  grid.innerHTML = '';
  books.forEach(book => {
    grid.innerHTML += `
      <div class="product-card">
        <img src="${book.image || 'https://via.placeholder.com/150x200?text=No+Image'}" alt="${book.name || ''}" />
        <div class="info">
          <h3>${book.name || ''}</h3>
          <p><b>Tác giả:</b> ${book.author || ''}</p>
          <p><b>Thể loại:</b> ${(book.categories || []).join(', ')}</p>
          <p><b>Mô tả:</b> ${book.description || ''}</p>
          <p><b>Ngày tạo:</b> ${book.createdAt ? new Date(book.createdAt).toLocaleDateString('vi-VN') : ''}</p>
        </div>
        <div class="actions">
          <button class="edit-btn" data-id="${book._id}"><i class="fa fa-edit"></i></button>
          <button class="delete-btn" data-id="${book._id}"><i class="fa fa-trash"></i></button>
        </div>
      </div>
    `;
  });
}

// Tìm kiếm truyện tranh
document.getElementById('filterInput').addEventListener('input', function() {
  const keyword = this.value.trim().toLowerCase();
  const cards = document.querySelectorAll('.product-card');
  cards.forEach(card => {
    const name = card.querySelector('h3').textContent.toLowerCase();
    card.style.display = name.includes(keyword) ? '' : 'none';
  });
});

// Sự kiện thêm truyện (mở form, bạn tự xử lý)
document.getElementById('btnAddBook').addEventListener('click', function() {
  alert('Chức năng thêm truyện chưa được cài đặt!');
});

// Sự kiện xóa/sửa (bạn tự xử lý logic)
document.getElementById('bookGrid').addEventListener('click', function(e) {
  if (e.target.closest('.edit-btn')) {
    const id = e.target.closest('.edit-btn').getAttribute('data-id');
    alert('Chức năng sửa truyện chưa được cài đặt! ID: ' + id);
  }
  if (e.target.closest('.delete-btn')) {
    const id = e.target.closest('.delete-btn').getAttribute('data-id');
    if (confirm('Bạn có chắc chắn muốn xóa truyện này?')) {
      // Gọi API xóa ở đây nếu muốn
      alert('Chức năng xóa truyện chưa được cài đặt! ID: ' + id);
    }
  }
});

document.addEventListener('DOMContentLoaded', fetchBooks);