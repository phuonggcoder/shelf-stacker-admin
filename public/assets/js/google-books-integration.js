class GoogleBooksIntegration {
  constructor() {
    // Google Books API configuration
    this.apiKeys = [
      'AIzaSyBxGQoJqXqXqXqXqXqXqXqXqXqXqXqXqXq', // Thay bằng API key thật
      'AIzaSyCxGQoJqXqXqXqXqXqXqXqXqXqXqXqXqXq', // Backup key 1
      'AIzaSyDxGQoJqXqXqXqXqXqXqXqXqXqXqXqXqXq'  // Backup key 2
    ];
    this.currentKeyIndex = 0;
    this.baseURL = 'https://www.googleapis.com/books/v1';
    
    this.searchResults = [];
    this.selectedBook = null;
    this.init();
  }

  init() {
    this.createSearchInterface();
    this.bindEvents();
  }

  // Lấy API key hiện tại
  getCurrentApiKey() {
    return this.apiKeys[this.currentKeyIndex];
  }

  // Chuyển sang API key khác khi gặp lỗi
  rotateApiKey() {
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    console.log(`Switched to API key ${this.currentKeyIndex + 1}`);
  }

  // Tạo giao diện tìm kiếm Google Books
  createSearchInterface() {
    const container = document.createElement('div');
    container.id = 'google-books-search';
    container.className = 'google-books-container';
    container.innerHTML = `
      <div class="search-section">
        <h3>🔍 Tìm kiếm sách từ Google Books</h3>
        <div class="search-input-group">
          <input type="text" id="google-search-input" placeholder="Nhập tên sách, tác giả..." class="form-control">
          <button id="google-search-btn" class="btn btn-primary">
            <i class="fa fa-search"></i> Tìm kiếm
          </button>
        </div>
        <div id="search-loading" class="loading-spinner" style="display: none;">
          <i class="fa fa-spinner fa-spin"></i> Đang tìm kiếm...
        </div>
      </div>
      
      <div id="search-results" class="search-results" style="display: none;">
        <h4>Kết quả tìm kiếm:</h4>
        <div id="results-list" class="results-grid"></div>
        <div id="pagination" class="pagination-controls"></div>
      </div>
      
      <div id="selected-book-info" class="selected-book-info" style="display: none;">
        <h4>📚 Sách đã chọn:</h4>
        <div id="selected-book-details"></div>
        <button id="fill-form-btn" class="btn btn-success">
          <i class="fa fa-magic"></i> Điền form tự động
        </button>
        <button id="clear-selection-btn" class="btn btn-secondary">
          <i class="fa fa-times"></i> Chọn lại
        </button>
      </div>
    `;

    // Thêm vào trang
    const existingForm = document.querySelector('form') || document.body;
    existingForm.parentNode.insertBefore(container, existingForm);

    // Thêm CSS
    this.addStyles();
  }

  // Thêm CSS styles
  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .google-books-container {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
      }
      
      .search-section {
        margin-bottom: 20px;
      }
      
      .search-input-group {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
      }
      
      .search-input-group input {
        flex: 1;
        padding: 10px;
        border: 1px solid #ced4da;
        border-radius: 4px;
      }
      
      .loading-spinner {
        text-align: center;
        color: #6c757d;
        padding: 20px;
      }
      
      .search-results {
        margin-top: 20px;
      }
      
      .results-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
      }
      
      .book-item {
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 15px;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .book-item:hover {
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        transform: translateY(-2px);
      }
      
      .book-item.selected {
        border-color: #007bff;
        background: #f8f9ff;
      }
      
      .book-thumbnail {
        width: 100%;
        height: 150px;
        object-fit: cover;
        border-radius: 4px;
        margin-bottom: 10px;
      }
      
      .book-title {
        font-weight: bold;
        font-size: 14px;
        margin-bottom: 5px;
        color: #333;
      }
      
      .book-author {
        font-size: 12px;
        color: #666;
        margin-bottom: 5px;
      }
      
      .book-publisher {
        font-size: 11px;
        color: #888;
      }
      
      .selected-book-info {
        background: #e8f5e8;
        border: 1px solid #28a745;
        border-radius: 8px;
        padding: 15px;
        margin-top: 20px;
      }
      
      .selected-book-details {
        display: flex;
        gap: 15px;
        margin-bottom: 15px;
      }
      
      .selected-book-image {
        width: 80px;
        height: 120px;
        object-fit: cover;
        border-radius: 4px;
      }
      
      .selected-book-text {
        flex: 1;
      }
      
      .pagination-controls {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-top: 20px;
      }
      
      .pagination-btn {
        padding: 8px 12px;
        border: 1px solid #dee2e6;
        background: white;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .pagination-btn:hover {
        background: #f8f9fa;
      }
      
      .pagination-btn.active {
        background: #007bff;
        color: white;
        border-color: #007bff;
      }
    `;
    document.head.appendChild(style);
  }

  // Bind events
  bindEvents() {
    // Tìm kiếm
    document.getElementById('google-search-btn').addEventListener('click', () => {
      this.searchBooks();
    });

    // Enter key để tìm kiếm
    document.getElementById('google-search-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.searchBooks();
      }
    });

    // Điền form tự động
    document.getElementById('fill-form-btn').addEventListener('click', () => {
      this.fillFormWithSelectedBook();
    });

    // Chọn lại
    document.getElementById('clear-selection-btn').addEventListener('click', () => {
      this.clearSelection();
    });
  }

  // Tìm kiếm sách từ Google Books API
  async searchBooks() {
    const query = document.getElementById('google-search-input').value.trim();
    if (!query) {
      this.showAlert('Vui lòng nhập từ khóa tìm kiếm', 'warning');
      return;
    }

    this.showLoading(true);
    
    try {
      const response = await fetch(`${this.baseURL}/volumes?q=${encodeURIComponent(query)}&maxResults=12&key=${this.getCurrentApiKey()}`);
      
      if (response.status === 403) {
        this.rotateApiKey();
        return this.searchBooks(); // Thử lại với API key khác
      }
      
      const data = await response.json();

      if (response.ok) {
        this.displaySearchResults(data);
      } else {
        this.showAlert(data.error?.message || 'Lỗi tìm kiếm', 'error');
      }
    } catch (error) {
      console.error('Search error:', error);
      this.showAlert('Lỗi kết nối mạng', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  // Hiển thị kết quả tìm kiếm
  displaySearchResults(data) {
    const resultsContainer = document.getElementById('search-results');
    const resultsList = document.getElementById('results-list');
    
    if (!data.items || data.items.length === 0) {
      resultsList.innerHTML = '<p>Không tìm thấy sách nào</p>';
      resultsContainer.style.display = 'block';
      return;
    }

    this.searchResults = data.items;
    
    resultsList.innerHTML = data.items.map((book, index) => {
      const volumeInfo = book.volumeInfo || {};
      const imageLinks = volumeInfo.imageLinks || {};
      
      return `
        <div class="book-item" data-index="${index}">
          <img src="${imageLinks.smallThumbnail || imageLinks.thumbnail || '/assets/images/default-book.png'}" 
               alt="${volumeInfo.title}" 
               class="book-thumbnail"
               onerror="this.src='/assets/images/default-book.png'">
          <div class="book-title">${volumeInfo.title || 'Không có tiêu đề'}</div>
          <div class="book-author">${Array.isArray(volumeInfo.authors) ? volumeInfo.authors.join(', ') : volumeInfo.authors || 'Không có tác giả'}</div>
          <div class="book-publisher">${volumeInfo.publisher || 'Không có thông tin'}</div>
        </div>
      `;
    }).join('');

    // Bind click events cho từng sách
    resultsList.querySelectorAll('.book-item').forEach(item => {
      item.addEventListener('click', () => {
        this.selectBook(parseInt(item.dataset.index));
      });
    });

    resultsContainer.style.display = 'block';
  }

  // Chọn sách
  async selectBook(index) {
    const book = this.searchResults[index];
    if (!book) return;

    // Highlight sách được chọn
    document.querySelectorAll('.book-item').forEach(item => {
      item.classList.remove('selected');
    });
    document.querySelector(`[data-index="${index}"]`).classList.add('selected');

    this.selectedBook = book;
    this.displaySelectedBook(book);
  }

  // Hiển thị sách đã chọn
  displaySelectedBook(book) {
    const container = document.getElementById('selected-book-info');
    const details = document.getElementById('selected-book-details');
    
    const volumeInfo = book.volumeInfo || {};
    const imageLinks = volumeInfo.imageLinks || {};
    
    details.innerHTML = `
      <img src="${imageLinks.smallThumbnail || imageLinks.thumbnail || '/assets/images/default-book.png'}" 
           alt="${volumeInfo.title}" 
           class="selected-book-image"
           onerror="this.src='/assets/images/default-book.png'">
      <div class="selected-book-text">
        <h5>${volumeInfo.title || 'Không có tiêu đề'}</h5>
        <p><strong>Tác giả:</strong> ${Array.isArray(volumeInfo.authors) ? volumeInfo.authors.join(', ') : volumeInfo.authors || 'Không có tác giả'}</p>
        <p><strong>Nhà xuất bản:</strong> ${volumeInfo.publisher || 'Không có thông tin'}</p>
        <p><strong>Số trang:</strong> ${volumeInfo.pageCount || 'Không có thông tin'}</p>
        <p><strong>Ngôn ngữ:</strong> ${volumeInfo.language || 'Không có thông tin'}</p>
        ${volumeInfo.description ? `<p><strong>Mô tả:</strong> ${volumeInfo.description.substring(0, 100)}...</p>` : ''}
      </div>
    `;
    
    container.style.display = 'block';
  }

  // Điền form tự động
  async fillFormWithSelectedBook() {
    if (!this.selectedBook) {
      this.showAlert('Vui lòng chọn một cuốn sách', 'warning');
      return;
    }

    try {
      // Chuyển đổi dữ liệu Google Books sang format form
      const formData = this.transformGoogleBookData(this.selectedBook);
      this.fillFormFields(formData);
      this.showAlert('Đã điền form thành công!', 'success');
    } catch (error) {
      console.error('Fill form error:', error);
      this.showAlert('Lỗi khi điền form', 'error');
    }
  }

  // Chuyển đổi dữ liệu Google Books sang format database
  transformGoogleBookData(googleBook) {
    const volumeInfo = googleBook.volumeInfo || {};
    const imageLinks = volumeInfo.imageLinks || {};

    return {
      title: volumeInfo.title || '',
      author: Array.isArray(volumeInfo.authors) ? volumeInfo.authors.join(', ') : volumeInfo.authors || '',
      description: volumeInfo.description || '',
      publisher: volumeInfo.publisher || '',
      page_count: volumeInfo.pageCount || 0,
      language: volumeInfo.language || 'vi',
      publication_date: volumeInfo.publishedDate ? new Date(volumeInfo.publishedDate).toISOString().split('T')[0] : '',
      thumbnail: imageLinks.smallThumbnail || imageLinks.thumbnail || '',
      cover_image: imageLinks.large || imageLinks.medium || imageLinks.thumbnail || '',
      googleBooksId: googleBook.id,
      googleCategories: volumeInfo.categories || [],
      averageRating: volumeInfo.averageRating || 0,
      ratingsCount: volumeInfo.ratingsCount || 0,
      previewLink: volumeInfo.previewLink || '',
      infoLink: volumeInfo.infoLink || ''
    };
  }

  // Điền các trường form
  fillFormFields(formData) {
    // Map các trường form với dữ liệu Google Books
    const fieldMappings = {
      'title': formData.title,
      'author': formData.author,
      'description': formData.description,
      'publisher': formData.publisher,
      'page_count': formData.page_count,
      'language': formData.language,
      'publication_date': formData.publication_date,
      'thumbnail': formData.thumbnail,
      'cover_image': formData.cover_image
    };

    // Điền từng trường
    Object.keys(fieldMappings).forEach(fieldName => {
      const field = document.querySelector(`[name="${fieldName}"], #${fieldName}, .${fieldName}`);
      if (field && fieldMappings[fieldName]) {
        if (field.type === 'file') {
          // Xử lý trường file upload
          console.log(`Field ${fieldName} is file type, cannot auto-fill`);
        } else {
          field.value = fieldMappings[fieldName];
          // Trigger change event
          field.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });

    // Hiển thị preview ảnh nếu có
    if (formData.thumbnail) {
      this.showImagePreview(formData.thumbnail, 'thumbnail-preview');
    }
    if (formData.cover_image) {
      this.showImagePreview(formData.cover_image, 'cover-preview');
    }
  }

  // Hiển thị preview ảnh
  showImagePreview(imageUrl, previewId) {
    let preview = document.getElementById(previewId);
    if (!preview) {
      preview = document.createElement('div');
      preview.id = previewId;
      preview.className = 'image-preview';
      preview.innerHTML = `
        <img src="${imageUrl}" alt="Preview" style="max-width: 100px; max-height: 100px; border-radius: 4px;">
        <small>Ảnh từ Google Books</small>
      `;
      
      // Tìm trường file tương ứng và thêm preview
      const fileField = document.querySelector(`[name="${previewId.replace('-preview', '')}"]`);
      if (fileField) {
        fileField.parentNode.appendChild(preview);
      }
    } else {
      preview.querySelector('img').src = imageUrl;
    }
  }

  // Xóa lựa chọn
  clearSelection() {
    this.selectedBook = null;
    document.getElementById('selected-book-info').style.display = 'none';
    document.querySelectorAll('.book-item').forEach(item => {
      item.classList.remove('selected');
    });
  }

  // Hiển thị loading
  showLoading(show) {
    document.getElementById('search-loading').style.display = show ? 'block' : 'none';
  }

  // Hiển thị thông báo
  showAlert(message, type = 'info') {
    // Tạo alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type === 'error' ? 'danger' : type}`;
    alert.innerHTML = `
      ${message}
      <button type="button" class="close" onclick="this.parentElement.remove()">
        <span>&times;</span>
      </button>
    `;
    
    // Thêm vào container
    const container = document.getElementById('google-books-search');
    container.insertBefore(alert, container.firstChild);
    
    // Tự động xóa sau 5 giây
    setTimeout(() => {
      if (alert.parentNode) {
        alert.remove();
      }
    }, 5000);
  }
}

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', () => {
  // Chỉ khởi tạo nếu đang ở trang thêm/sửa sách
  if (document.querySelector('form') || window.location.pathname.includes('book')) {
    new GoogleBooksIntegration();
  }
});

// Export để sử dụng ở file khác
window.GoogleBooksIntegration = GoogleBooksIntegration;
