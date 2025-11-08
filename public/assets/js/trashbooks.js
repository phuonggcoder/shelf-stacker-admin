// Trash Books Management

// API Configuration
const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';
const API_ENDPOINTS = {
  deletedBooks: {
    list: `${API_BASE_URL}/api/books/trash`,
    restore: (id) => `${API_BASE_URL}/api/books/${id}/restore`,
    delete: (id) => `${API_BASE_URL}/api/books/${id}/permanent`
  }
};

// Auth Header
const getAuthHeader = () => ({
  'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
  'Content-Type': 'application/json'
});

// Toast Notification
const showToast = (message, type = 'info') => {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};

// Error Handler
const handleError = (error) => {
  console.error('API Error:', error);
  showToast(error.message || 'Có lỗi xảy ra, vui lòng thử lại', 'error');
};

// Load Deleted Books
let currentPage = 1;
const loadDeletedBooks = async (page = 1) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.deletedBooks.list}?page=${page}`, {
      headers: getAuthHeader()
    });

    if (!response.ok) throw new Error('Không thể tải danh sách sách đã xóa');

    const data = await response.json();
    renderBooks(data.books);
    updatePagination(data.pagination);
  } catch (error) {
    handleError(error);
  }
};

// Render Books
const renderBooks = (books) => {
  const container = document.querySelector('.deleted-books-grid');
  container.innerHTML = books.map(book => `
    <div class="book-card" data-id="${book.id}">
      <div class="book-image">
        <img src="${book.coverImage || '/assets/img/default-book.jpg'}" alt="${book.title}">
      </div>
      <div class="book-info">
        <h3>${book.title}</h3>
        <p class="author">Tác giả: ${book.author}</p>
        <p class="date">Ngày xuất bản: ${new Date(book.publishDate).toLocaleDateString('vi-VN')}</p>
        <p class="delete-date">Ngày xóa: ${new Date(book.deletedAt).toLocaleDateString('vi-VN')}</p>
      </div>
      <div class="book-actions">
        <button onclick="restoreBook('${book.id}')" class="btn-restore">
          <i class="fas fa-undo"></i> Khôi phục
        </button>
        <button onclick="confirmDelete('${book.id}')" class="btn-delete">
          <i class="fas fa-trash"></i> Xóa vĩnh viễn
        </button>
      </div>
    </div>
  `).join('') || '<p class="no-data">Không có sách nào trong thùng rác</p>';
};

// Update Pagination
const updatePagination = ({ currentPage, totalPages }) => {
  const pagination = document.querySelector('.pagination');
  if (totalPages <= 1) {
    pagination.style.display = 'none';
    return;
  }

  pagination.style.display = 'flex';
  pagination.innerHTML = `
    <button 
      ${currentPage === 1 ? 'disabled' : ''} 
      onclick="loadDeletedBooks(${currentPage - 1})"
    >
      <i class="fas fa-chevron-left"></i>
    </button>
    <span>Trang ${currentPage} / ${totalPages}</span>
    <button 
      ${currentPage === totalPages ? 'disabled' : ''} 
      onclick="loadDeletedBooks(${currentPage + 1})"
    >
      <i class="fas fa-chevron-right"></i>
    </button>
  `;
};

// Restore Book
const restoreBook = async (id) => {
  try {
    const response = await fetch(API_ENDPOINTS.deletedBooks.restore(id), {
      method: 'POST',
      headers: getAuthHeader()
    });

    if (!response.ok) throw new Error('Không thể khôi phục sách');

    showToast('Khôi phục sách thành công', 'success');
    loadDeletedBooks(currentPage);
  } catch (error) {
    handleError(error);
  }
};

// Confirm Delete
const confirmDelete = (id) => {
  if (confirm('Bạn có chắc chắn muốn xóa vĩnh viễn sách này? Hành động này không thể hoàn tác.')) {
    permanentDelete(id);
  }
};

// Permanent Delete
const permanentDelete = async (id) => {
  try {
    const response = await fetch(API_ENDPOINTS.deletedBooks.delete(id), {
      method: 'DELETE',
      headers: getAuthHeader()
    });

    if (!response.ok) throw new Error('Không thể xóa vĩnh viễn sách');

    showToast('Đã xóa vĩnh viễn sách', 'success');
    loadDeletedBooks(currentPage);
  } catch (error) {
    handleError(error);
  }
};

// Search Handler
const searchInput = document.querySelector('#searchBooks');
let searchTimeout;

searchInput?.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const query = e.target.value.trim();
    if (query) {
      searchBooks(query);
    } else {
      loadDeletedBooks(1);
    }
  }, 500);
});

// Search Books
const searchBooks = async (query) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.deletedBooks.list}?search=${query}`, {
      headers: getAuthHeader()
    });

    if (!response.ok) throw new Error('Không thể tìm kiếm sách');

    const data = await response.json();
    renderBooks(data.books);
    updatePagination(data.pagination);
  } catch (error) {
    handleError(error);
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadDeletedBooks(1);
});