const apiURL = 'https://server-shelf-stacker.onrender.com/api/books/all';
  const apiPostURL = 'https://server-shelf-stacker.onrender.com/api/books';

  const productGrid = document.getElementById('productGrid');
  const searchBox = document.getElementById('searchBox');
  const addBookBtn = document.getElementById('addBookBtn');
  const dialogOverlay = document.getElementById('dialogOverlay');
  const closeDialogBtn = document.getElementById('closeDialogBtn');
  const addBookForm = document.getElementById('addBookForm');
  const dialogTitle = document.getElementById('dialogTitle');

  
  // CKEditor 5 setup
  let bookDescEditor = null;
  let ckeditorPromise = null;
  function initCKEditorIfNeeded() {
    if (!ckeditorPromise) {
      ckeditorPromise = ClassicEditor.create(document.querySelector('#bookDesc'))
        .then(editor => {
          bookDescEditor = editor;
          return editor;
        })
        .catch(error => {
          console.error(error);
        });
    }
    return ckeditorPromise;
  }
  // Khởi tạo CKEditor khi trang load
  initCKEditorIfNeeded();

  // Hiện dialog khi bấm Thêm truyện
  addBookBtn.addEventListener('click', () => {
    dialogTitle.textContent = 'Thêm truyện mới';
    addBookForm.reset();
    addBookForm.removeAttribute('data-edit-id');
    dialogOverlay.classList.add('active');
    setTimeout(() => {
      initCKEditorIfNeeded().then(() => {
        if (bookDescEditor) bookDescEditor.setData('');
      });
    }, 0);
    fetchCategoriesForSelect();
  });
  // Đóng dialog
  closeDialogBtn.addEventListener('click', () => {
    dialogOverlay.classList.remove('active');
    addBookForm.reset();
    addBookForm.removeAttribute('data-edit-id');
    if (bookDescEditor) bookDescEditor.setData('');
  });
  // Đóng dialog khi bấm ra ngoài
  dialogOverlay.addEventListener('click', (e) => {
    if (e.target === dialogOverlay) {
      dialogOverlay.classList.remove('active');
      addBookForm.reset();
      addBookForm.removeAttribute('data-edit-id');
      if (bookDescEditor) bookDescEditor.setData('');
    }
  });

  // Hàm render danh sách sản phẩm với mô tả có thể ẩn/hiện nếu quá dài
  function renderProducts(products) {
    productGrid.innerHTML = '';
    if(products.length === 0){
      productGrid.innerHTML = '<p>Không tìm thấy truyện phù hợp.</p>';
      return;
    }
    products.forEach((product, idx) => {
      const card = document.createElement('div');
      card.className = 'product-card';

      // Xử lý mô tả: nếu dài hơn 120 ký tự thì cắt và thêm nút Xem thêm
      let desc = product.description || '';
      let shortDesc = desc.replace(/(<([^>]+)>)/gi, ""); // bỏ tag html
      let isLong = shortDesc.length > 270;
      let descHtml = '';
      if (isLong) {
        descHtml = `
          <span class="desc-short" id="desc-short-${idx}">${shortDesc.slice(0, 270)}...</span>
<span class="desc-full" id="desc-full-${idx}" style="display:none">${shortDesc}</span>
          <a href="#" class="toggle-desc" data-idx="${idx}">Xem thêm</a>
        `;
      } else {
        descHtml = `<span>${shortDesc}</span>`;
      }

      // Thêm phần hiển thị ảnh sách
      let imagesHtml = '';
      if (product.cover_image && Array.isArray(product.cover_image) && product.cover_image.length) {
        imagesHtml = product.cover_image.map(img => `<img src="${img}" alt="Ảnh sách" style="max-width:80px; margin:2px;">`).join('');
      }

      card.innerHTML = `
        ${imagesHtml}
        <div class="info">
          <h3>${product.title || product.name}</h3>
          <p><b>Tác giả:</b> ${product.author || ''}</p>
          <p><b>Giá:</b> ${product.price ? product.price + '₫' : ''}</p>
          <div class="desc-wrap">${descHtml}</div>
          <span>
            <b>Danh mục:</b> ${(product.categories && product.categories.length > 0) ? product.categories.map(c=>c.name || c).join(', ') : ''}
          </span>
          <br>
          <span>
            <b>Số lượng:</b> ${product.stock || ''}
          </span>
          <br>
          <span>
            <b>Ngày xuất bản:</b> ${product.publication_date ? new Date(product.publication_date).toLocaleDateString() : ''}
          </span>
          <br>
          <span>
            <b>Nhà xuất bản:</b> ${product.publisher || ''}
          </span>
          <br>
          <span>
            <b>Ngôn ngữ:</b> ${product.language || ''}
          </span>
        </div>
        <div class="actions">
          <button class="edit-btn" data-id="${product._id}"><i class="fas fa-pen"></i></button>
          <button class="delete-btn" data-id="${product._id}"><i class="fas fa-trash"></i></button>
        </div>
      `;
      productGrid.appendChild(card);
    });

    // Sự kiện ẩn/hiện mô tả dài
    document.querySelectorAll('.toggle-desc').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const idx = this.getAttribute('data-idx');
        const shortSpan = document.getElementById('desc-short-' + idx);
        const fullSpan = document.getElementById('desc-full-' + idx);
        if (shortSpan.style.display !== 'none') {
          shortSpan.style.display = 'none';
          fullSpan.style.display = '';
          this.textContent = 'Ẩn bớt';
        } else {
          shortSpan.style.display = '';
          fullSpan.style.display = 'none';
          this.textContent = 'Xem thêm';
        }
      });
    });

    // Gán sự kiện XÓA
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const id = this.getAttribute('data-id');
        if (confirm('Bạn có chắc muốn xóa truyện này?')) {
          try {
            const res = await fetch(`https://server-shelf-stacker.onrender.com/api/books/${id}`, {
method: 'DELETE'
            });
            if (!res.ok) {
              const errText = await res.text();
              alert('Xóa thất bại!\n' + errText);
              return;
            }
            alert('Đã xóa truyện!');
            products = await fetchProducts();
            renderProductsWithPagination(products, currentPage);
          } catch (err) {
            alert('Có lỗi khi xóa truyện!\n' + err.message);
          }
        }
      });
    });

    // Gán sự kiện SỬA
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        const book = products.find(p => p._id === id);
        if (!book) return;
        dialogTitle.textContent = 'Cập nhật truyện';
        addBookForm.reset();
        document.getElementById('bookName').value = book.title || '';
        document.getElementById('bookAuthor').value = book.author || '';
        document.getElementById('bookPrice').value = book.price || '';
        setTimeout(() => {
          initCKEditorIfNeeded().then(() => {
            if (bookDescEditor) bookDescEditor.setData(book.description || '');
          });
        }, 0);
        document.getElementById('bookImages').value = book.cover_image || '';
        document.getElementById('bookStock').value = book.stock || '';
        document.getElementById('bookPubDate').value = book.publication_date ? book.publication_date.substr(0,10) : '';
        document.getElementById('bookPublisher').value = book.publisher || '';
        document.getElementById('bookLanguage').value = book.language || '';
        document.getElementById('bookCategory').value = (book.categories && book.categories.length > 0) ? book.categories.map(c=>c._id || c).join(',') : '';
        addBookForm.setAttribute('data-edit-id', id);
        dialogOverlay.classList.add('active');
        fetchCategoriesForSelect().then(() => {
          // Set selected options khi sửa
          const select = document.getElementById('bookCategory');
          const book = products.find(p => p._id === this.getAttribute('data-id'));
          if (book && book.categories) {
            const ids = book.categories.map(c => c._id || c);
            Array.from(select.options).forEach(opt => {
              opt.selected = ids.includes(opt.value);
            });
          }
        });
      });
    });
  }

  // Hàm lấy dữ liệu từ API
  async function fetchProducts() {
    try {
      const response = await fetch(apiURL);
      if (!response.ok) throw new Error('Lỗi kết nối API');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(error);
      productGrid.innerHTML = '<p>Không thể tải danh sách truyện tranh.</p>';
      return [];
    }
  }

  // Hàm lọc sản phẩm theo từ khóa (tìm trong tên, mô tả, tác giả)
  function filterProducts(products, keyword) {
const lower = keyword.toLowerCase();
    return products.filter(p =>
      (p.title || '').toLowerCase().includes(lower) ||
      (p.author || '').toLowerCase().includes(lower) ||
      (p.description || '').toLowerCase().includes(lower)
    );
  }

  // Hàm sắp xếp
  function sortByTitle(arr, order) {
    if (!order) return arr;
    return [...arr].sort((a, b) => {
      const tA = (a.title || a.name || '').toLowerCase();
      const tB = (b.title || b.name || '').toLowerCase();
      if (tA < tB) return order === 'asc' ? -1 : 1;
      if (tA > tB) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // PHÂN TRANG
  let products = [];
  let currentPage = 1;
  const pageSize = 6;

  // Thêm HTML cho phân trang vào sau productGrid
  const pagination = document.createElement('div');
  pagination.id = 'pagination';
  pagination.style = 'display:flex;justify-content:center;gap:10px;margin:20px 0;';
  document.getElementById('productGrid').parentNode.appendChild(pagination);

  function renderProductsWithPagination(productsArr, page = 1) {
    const totalPages = Math.ceil(productsArr.length / pageSize);
    if (productsArr.length === 0) {
      productGrid.innerHTML = '<p>Không tìm thấy truyện phù hợp.</p>';
      pagination.innerHTML = '';
      return;
    }
    if (page > totalPages && totalPages > 0) page = totalPages;
    if (page < 1) page = 1;
    currentPage = page;

    // Lấy sản phẩm cho trang hiện tại
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageProducts = productsArr.slice(start, end);

    renderProducts(pageProducts);

    // Render nút phân trang
    pagination.innerHTML = '';
    if (totalPages > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="#007bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
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
      prevBtn.onclick = () => renderFilteredAndSorted(page - 1);

      const nextBtn = document.createElement('button');
      nextBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="#007bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
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
      nextBtn.onclick = () => renderFilteredAndSorted(page + 1);

      const pageInfo = document.createElement('span');
      pageInfo.textContent = `Trang ${page} / ${totalPages}`;
      pageInfo.style = 'padding: 0 10px; font-weight:bold; font-size:16px; color:#007bff; display:flex; align-items:center;';

      pagination.appendChild(prevBtn);
      pagination.appendChild(pageInfo);
      pagination.appendChild(nextBtn);
    }
  }

  // Hàm kết hợp lọc, sắp xếp và phân trang
  function renderFilteredAndSorted(page = 1) {
    const keyword = searchBox.value.trim();
    const sortOrder = document.getElementById('sort-title').value;
    let filtered = filterProducts(products, keyword);
    filtered = sortByTitle(filtered, sortOrder);
    renderProductsWithPagination(filtered, page);
  }

  // Nút tìm kiếm
  document.getElementById('btn-search').addEventListener('click', () => renderFilteredAndSorted(1));

  // Vẫn giữ chức năng lọc realtime khi gõ vào ô "Tìm truyện"
  searchBox.addEventListener('input', () => renderFilteredAndSorted(1));
  document.getElementById('sort-title').addEventListener('change', () => renderFilteredAndSorted(1));

  // Main chạy khi load trang
  document.addEventListener('DOMContentLoaded', async () => {
    products = await fetchProducts();
    renderFilteredAndSorted(1);
  });

  // --- Choices.js cho lọc danh mục ngoài thanh tìm kiếm với nút ẩn/hiện và icon lên/xuống ---
  document.addEventListener('DOMContentLoaded', async () => {
    const filterCategorySelect = document.getElementById('filter-category');
    const toggleCategoryBtn = document.getElementById('toggle-category-btn');
    const filterChoicesWrap = document.getElementById('category-filter-choices-wrap');
    let filterCategoryChoices = null;
    let isOpen = false;

    async function fetchCategoriesForFilter() {
      try {
        const res = await fetch('https://server-shelf-stacker.onrender.com/api/categories');
        const data = await res.json();
        filterCategorySelect.innerHTML = '';
        data.forEach(cat => {
          const option = document.createElement('option');
          option.value = cat._id;
          option.textContent = cat.name;
          filterCategorySelect.appendChild(option);
        });
        // Khởi tạo Choices.js (chỉ 1 lần)
        if (!filterCategoryChoices) {
          filterCategoryChoices = new Choices(filterCategorySelect, {
            removeItemButton: true,
            searchResultLimit: 10,
            placeholder: true,
            placeholderValue: 'Chọn danh mục...',
            searchPlaceholderValue: 'Tìm danh mục...',
noResultsText: 'Không tìm thấy',
            itemSelectText: '',
            shouldSort: false
          });
        } else {
          filterCategoryChoices.setChoices(
            data.map(cat => ({ value: cat._id, label: cat.name, selected: false })),
            'value',
            'label',
            false
          );
        }
      } catch (err) {}
    }
    await fetchCategoriesForFilter();

    // Nút mở/ẩn dropdown (ẩn/hiện select nằm trong ô tìm kiếm) + đổi icon lên/xuống
    toggleCategoryBtn.addEventListener('click', function(e) {
      e.preventDefault();
      isOpen = !isOpen;
      if (isOpen) {
        filterChoicesWrap.style.display = 'block';
        toggleCategoryBtn.innerHTML = '<i class="fa fa-chevron-up"></i>';
        setTimeout(() => {
          const input = filterChoicesWrap.querySelector('.choices__input');
          if (input) input.focus();
        }, 100);
      } else {
        filterChoicesWrap.style.display = 'none';
        toggleCategoryBtn.innerHTML = '<i class="fa fa-chevron-down"></i>';
      }
    });

    // Khi chọn danh mục ở Choices, cũng lọc lại truyện
    filterCategorySelect.addEventListener('change', () => {
      renderFilteredAndSorted(1);
      // Nếu muốn tự động đóng dropdown sau khi chọn, bỏ comment dòng dưới:
      // filterChoicesWrap.style.display = 'none'; toggleCategoryBtn.innerHTML = '<i class="fa fa-chevron-down"></i>'; isOpen = false;
    });

    // Lọc theo danh mục + từ khóa, sản phẩm có thể có nhiều danh mục, nếu không có thì báo không có sản phẩm
    window.filterProducts = function(products, keyword) {
      const lower = keyword.toLowerCase();
      const selectedCats = filterCategoryChoices ? filterCategoryChoices.getValue(true) : [];
      return products.filter(p => {
        const matchText =
          (p.title || '').toLowerCase().includes(lower) ||
          (p.author || '').toLowerCase().includes(lower) ||
          (p.description || '').toLowerCase().includes(lower);

        let matchCategory = true;
        if (selectedCats.length > 0) {
          const prodCatIds = (p.categories || []).map(c => c._id || c);
          // Sản phẩm có ít nhất 1 danh mục trùng với lựa chọn
          matchCategory = selectedCats.some(catId => prodCatIds.includes(catId));
        }
        return matchText && matchCategory;
      });
    };

    // Ẩn dropdown khi click ra ngoài
    document.addEventListener('click', function(e) {
      if (!filterChoicesWrap.contains(e.target) && !toggleCategoryBtn.contains(e.target)) {
        filterChoicesWrap.style.display = 'none';
        toggleCategoryBtn.innerHTML = '<i class="fa fa-chevron-down"></i>';
        isOpen = false;
      }
    });
  });

  addBookForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = addBookForm.getAttribute('data-edit-id');
    const title = document.getElementById('bookName').value.trim();
const author = document.getElementById('bookAuthor').value.trim();
    const price = Number(document.getElementById('bookPrice').value);
    const image = document.getElementById('bookImages').value
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    const stock = Number(document.getElementById('bookStock').value);
    const publication_date = document.getElementById('bookPubDate').value;
    const publisher = document.getElementById('bookPublisher').value.trim();
    const language = document.getElementById('bookLanguage').value.trim();
    const select = document.getElementById('bookCategory');
    const categories = Array.from(select.selectedOptions).map(opt => opt.value);
    // LẤY DỮ LIỆU TỪ CKEDITOR
    const description = bookDescEditor ? bookDescEditor.getData() : document.getElementById('bookDesc').value;

    const payload = {
      title, author, price, cover_image: image, stock, publication_date, publisher, language, categories, description
    };

    try {
      let res;
      if (id) {
        res = await fetch(`${apiPostURL}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(apiPostURL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      if (!res.ok) {
        const err = await res.json();
        alert('Lưu thất bại: ' + (err.message || 'Lỗi không xác định!'));
        return;
      }
      alert('Lưu thành công!');
      dialogOverlay.classList.remove('active');
      products = await fetchProducts();
      renderFilteredAndSorted(1);
    } catch (err) {
      alert('Có lỗi khi lưu truyện!\n' + err.message);
    }
  });

  let bookCategoryChoices = null;
  async function fetchCategoriesForSelect() {
    try {
      const res = await fetch('https://server-shelf-stacker.onrender.com/api/categories');
      const data = await res.json();
      const select = document.getElementById('bookCategory');
      select.innerHTML = '';
      data.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat._id;
        option.textContent = cat.name;
        select.appendChild(option);
      });
      // Khởi tạo Choices.js cho select multi
      if (!bookCategoryChoices) {
        bookCategoryChoices = new Choices(select, {
          removeItemButton: true,
          searchResultLimit: 10,
          placeholder: true,
          placeholderValue: 'Chọn danh mục...',
          searchPlaceholderValue: 'Tìm danh mục...',
          noResultsText: 'Không tìm thấy',
          itemSelectText: '',
          shouldSort: false
        });
      } else {
        bookCategoryChoices.setChoices(
          data.map(cat => ({ value: cat._id, label: cat.name, selected: false })),
          'value',
          'label',
false
        );
      }
    } catch (err) {}
  }