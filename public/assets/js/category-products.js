async function fetchCategoriesWithBooks() {
  const res = await fetch('https://server-shelf-stacker-w1ds.onrender.com/api/categories');
  const categoriesData = await res.json();
  const categories = Array.isArray(categoriesData.categories) ? categoriesData.categories : categoriesData;
  const container = document.getElementById('category-list');
  container.innerHTML = '<div>Đang tải...</div>';

  let html = '';
  for (const cat of categories) {
    const booksRes = await fetch(`https://server-shelf-stacker-w1ds.onrender.com/api/books/category/${cat._id}`);
    let books = [];
    if (booksRes.ok) {
      books = await booksRes.json();
      if (books.books) books = books.books;
    }
    html += `
      <div class="category-card">
        <div class="category-header">
          <img src="${cat.image || '/assets/images/default-category.png'}" alt="Ảnh danh mục" />
          <div>
            <div class="category-title">${cat.name}</div>
            <div class="category-count">${books.length} sách</div>
          </div>
          <button class="btn-show-products" style="margin-left:auto;padding:6px 16px;border-radius:8px;background:#007bff;color:#fff;border:none;cursor:pointer;font-size:14px;">Xem chi tiết</button>
        </div>
        <div class="books-list" style="display:none;">
          ${books.map(book => `
            <div class="book-card">
              <img src="${book.thumbnail || '/assets/images/default-thumbnail.png'}" alt="Ảnh sách" />
              <div class="book-info">
                <div class="book-title">${book.title}</div>
                <div class="book-author">Tác giả: ${book.author || 'N/A'}</div>
                <div class="book-desc">${book.description ? book.description.replace(/<[^>]+>/g, '').slice(0, 80) + '...' : ''}</div>
                <div class="book-meta">Giá: ${book.price ? book.price.toLocaleString() + 'đ' : 'N/A'} | Kho: ${book.stock || 0}</div>
                <div class="book-pub">NXB: ${book.publisher || 'N/A'} | Ngôn ngữ: ${book.language || 'N/A'}</div>
                <div class="book-date">Ngày xuất bản: ${book.publication_date ? new Date(book.publication_date).toLocaleDateString() : 'N/A'}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  container.innerHTML = html;

  // Sự kiện cho nút "Xem chi tiết"
  document.querySelectorAll('.btn-show-products').forEach(btn => {
    btn.onclick = function() {
      const booksList = this.closest('.category-card').querySelector('.books-list');
      if (booksList) {
        const isHidden = booksList.style.display === 'none';
        booksList.style.display = isHidden ? 'grid' : 'none';
        this.textContent = isHidden ? 'Ẩn chi tiết' : 'Xem chi tiết';
      }
    };
  });
}

window.fetchCategoriesWithBooks = fetchCategoriesWithBooks;