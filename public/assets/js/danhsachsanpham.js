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
    ckeditorPromise = ClassicEditor
      .create(document.querySelector('#bookDesc'), {
        extraPlugins: [CustomUploadAdapterPlugin]
      })
      .then(editor => {
        bookDescEditor = editor;
        return editor;
      })
      .catch(error => {
        console.error('CKEditor init error:', error);
      });
  }
  return ckeditorPromise;
}



// Khởi tạo CKEditor khi trang load
initCKEditorIfNeeded();

// Hiện dialog khi bấm Thêm truyện
addBookBtn.addEventListener('click', function () {
  dialogTitle.textContent = 'Thêm truyện mới';
  addBookForm.reset();
  uploadedImageUrls = [];
  previewDiv.innerHTML = '';
  document.getElementById('bookImages').value = '';

  // Xóa CKEditor nội dung
  setTimeout(() => {
    initCKEditorIfNeeded().then(() => {
      if (bookDescEditor) bookDescEditor.setData('');
    });
  }, 0);

  addBookForm.removeAttribute('data-edit-id');
  dialogOverlay.classList.add('active');

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

function renderProducts(products) {
  productGrid.innerHTML = '';
  if (products.length === 0) {
    productGrid.innerHTML = '<p>Không tìm thấy truyện phù hợp.</p>';
    return;
  }

  products.forEach((product, idx) => {
    const card = document.createElement('div');
    card.className = 'product-card';

    // Xử lý mô tả
    // Xử lý mô tả
let desc = product.description || '';

// Tạo thẻ ảo để lấy nội dung thuần văn bản
let temp = document.createElement('div');
temp.innerHTML = desc;
let plainText = temp.textContent || temp.innerText || '';
let isLong = plainText.length > 270;
let shortDesc = plainText.slice(0, 270) + '...';

let descHtml = '';
if (isLong) {
  descHtml = `
    <div class="desc-short" id="desc-short-${idx}">${shortDesc}</div>
    <div class="desc-full" id="desc-full-${idx}" style="display:none">${desc}</div>
    <a href="#" class="toggle-desc" data-idx="${idx}">Xem thêm</a>
  `;
} else {
  descHtml = `<div>${desc}</div>`;
}


    // Hình ảnh
   // Hiển thị ảnh thumbnail thay vì cover_image
let thumbUrl = product.thumbnail || '';
if (thumbUrl && thumbUrl.startsWith('/')) {
  thumbUrl = 'https://server-shelf-stacker.onrender.com' + thumbUrl;
}
if (thumbUrl.startsWith('http://localhost:3000')) {
  thumbUrl = thumbUrl.replace('http://localhost:3000', 'https://server-shelf-stacker.onrender.com');
}

let imagesHtml = thumbUrl
  ? `<img src="${thumbUrl}" alt="Thumbnail" onerror="this.src='/assets/default-thumbnail.png'" style="max-width:80px; margin:2px;">`
  : `<img src="/assets/default-thumbnail.png" alt="No thumbnail" style="max-width:80px; margin:2px;">`;



    card.innerHTML = `
      ${imagesHtml}
      <div class="info">
        <h3>${product.title || product.name}</h3>
        <p><b>Tác giả:</b> ${product.author || ''}</p>
        <p><b>Giá:</b> ${product.price ? Number(product.price).toLocaleString('vi-VN') + '₫' : ''}</p>
        <div class="desc-wrap">${descHtml}</div>
        <span><b>Danh mục:</b> ${(product.categories || []).map(c => c.name || c).join(', ')}</span><br>
        <span><b>Số lượng:</b> ${product.stock || ''}</span><br>
        <span><b>Ngày xuất bản:</b> ${product.publication_date ? new Date(product.publication_date).toLocaleDateString() : ''}</span><br>
        <span><b>Nhà xuất bản:</b> ${product.publisher || ''}</span><br>
        <span><b>Ngôn ngữ:</b> ${product.language || ''}</span>
      </div>
      <div class="actions">
        <button class="edit-btn" data-id="${product._id}"><i class="fas fa-pen"></i></button>
        <button class="delete-btn" data-id="${product._id}"><i class="fas fa-trash"></i></button>
      </div>
    `;
    productGrid.appendChild(card);
  });

  // Toggle mô tả
  document.querySelectorAll('.toggle-desc').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const idx = this.getAttribute('data-idx');
      const shortSpan = document.getElementById(`desc-short-${idx}`);
      const fullSpan = document.getElementById(`desc-full-${idx}`);
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

  // XÓA
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async function () {
      const id = this.getAttribute('data-id');
      if (confirm('Bạn có chắc muốn xóa truyện này?')) {
        try {
          const res = await fetch(`https://server-shelf-stacker.onrender.com/api/books/${id}`, { method: 'DELETE' });
          if (!res.ok) {
            const errText = await res.text();
            alert('Xóa thất bại!\n' + errText);
            return;
          }
          alert('Đã xóa truyện!');
          const products = await fetchProducts();
          renderProductsWithPagination(products, currentPage);
        } catch (err) {
          alert('Có lỗi khi xóa truyện!\n' + err.message);
        }
      }
    });
  });

  // SỬA
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const id = this.getAttribute('data-id');
      const book = products.find(p => p._id === id);
      if (!book) return;

      dialogTitle.textContent = 'Cập nhật truyện';
      addBookForm.reset();

      document.getElementById('bookName').value = book.title || '';
      document.getElementById('bookAuthor').value = book.author || '';
      document.getElementById('bookPrice').value = book.price || '';
      document.getElementById('bookStock').value = book.stock || '';
      document.getElementById('bookPubDate').value = book.publication_date ? book.publication_date.substr(0, 10) : '';
      document.getElementById('bookPublisher').value = book.publisher || '';
      document.getElementById('bookLanguage').value = book.language || '';
const thumb = book.thumbnail || '';
const fullThumb = thumb.startsWith('/') 
  ? 'https://server-shelf-stacker.onrender.com' + thumb 
  : thumb;

document.getElementById('bookThumbnail').value = fullThumb;
thumbnailPreview.innerHTML = fullThumb
  ? `<img src="${fullThumb}" style="max-width:100px;">`
  : `<img src="/assets/default-thumbnail.png" style="max-width:100px;">`;

      initCKEditorIfNeeded().then(() => {
        if (bookDescEditor) bookDescEditor.setData(book.description || '');
      });

      uploadedImageUrls = book.cover_image || [];
      document.getElementById('bookImages').value = uploadedImageUrls.join('\n');
      renderUploadedImages(); // Cập nhật hiển thị ảnh

      addBookForm.setAttribute('data-edit-id', id);
      dialogOverlay.classList.add('active');

      fetchCategoriesForSelect().then(() => {
        const select = document.getElementById('bookCategory');
        const ids = (book.categories || []).map(c => c._id || c);

        // Nếu đã có Choices.js thì set lại các mục đã chọn
        if (select.choicesInstance) {
          // Xóa chọn cũ
          select.choicesInstance.removeActiveItems();
          // Chọn lại các mục đã chọn trước đó
          ids.forEach(val => select.choicesInstance.setChoiceByValue(val));
        } else {
          // Nếu chưa có Choices thì set selected cho option (trường hợp fallback)
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
      filterChoicesWrap.style.display =      'none';
      toggleCategoryBtn.innerHTML = '<i class="fa fa-chevron-down"></i>';
      isOpen = false;
    }
  });
});

// Upload ảnh
const uploadInput = document.getElementById('bookImageUpload');
const previewDiv = document.getElementById('uploadedImagesPreview');
const bookImagesInput = document.getElementById('bookImages');
let uploadedImageUrls = [];

// Mở file picker khi bấm nút
document.getElementById('btn-select-image').addEventListener('click', () => {
  uploadInput.click();
});

// Khi chọn file
uploadInput.addEventListener('change', async () => {
  const file = uploadInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('upload', file);

  try {
    const res = await fetch('https://server-shelf-stacker.onrender.com/api/upload/upload-image', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }

    const data = await res.json();
    uploadedImageUrls.push(data.url); // ✅ thêm ảnh mới vào mảng
    bookImagesInput.value = uploadedImageUrls.join('\n');
    renderUploadedImages();

    alert('Upload thành công!');
  } catch (err) {
    console.error('Upload lỗi:', err);
    alert('Upload thất bại: ' + err.message);
  }
});

// Hàm render ảnh với nút xóa và thay ảnh
function renderUploadedImages() {
  previewDiv.innerHTML = uploadedImageUrls.map((url, index) => `
    <div style="display:inline-block; position:relative; margin:5px;">
      <img src="${url.startsWith('http') ? url : 'https://server-shelf-stacker.onrender.com' + url}" 
           style="max-width:100px;">
      <button class="remove-image-btn" data-idx="${index}"
        style="position:absolute;top:0;right:0;background:red;color:white;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;">×</button>
      <button class="replace-image-btn" data-idx="${index}"
        style="position:absolute;top:0;left:0;background:blue;color:white;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;">✎</button>
    </div>
  `).join('');

  // Gắn sự kiện cho nút xóa
  previewDiv.querySelectorAll('.remove-image-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      uploadedImageUrls = []; // Xóa tất cả ảnh
      bookImagesInput.value = uploadedImageUrls.join('\n');
      renderUploadedImages(); // Cập nhật hiển thị ảnh
    });
  });

  // Gắn sự kiện cho nút thay ảnh
  previewDiv.querySelectorAll('.replace-image-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      uploadInput.click(); // Mở file picker
      uploadInput.onchange = async () => {
        const file = uploadInput.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('upload', file);

        try {
          const res = await fetch('https://server-shelf-stacker.onrender.com/api/upload/upload-image', {
            method: 'POST',
            body: formData
          });

          if (!res.ok) {
            const text = await res.text();
            throw new Error(text);
          }

          const data = await res.json();
          uploadedImageUrls = [data.url]; // Chỉ giữ lại ảnh mới
          bookImagesInput.value = uploadedImageUrls.join('\n');
          renderUploadedImages(); // Cập nhật hiển thị ảnh

          alert('Upload thành công!');
        } catch (err) {
          console.error('Upload lỗi:', err);
          alert('Upload thất bại: ' + err.message);
        }
      };
    });
  });
}

// Khi click Sửa
document.addEventListener('click', function (e) {
  if (e.target.closest('.edit-btn')) {
    const btn = e.target.closest('.edit-btn');
    const id = btn.getAttribute('data-id');
    const book = products.find(p => p._id === id);
    if (!book) return;

    uploadedImageUrls = book.cover_image || []; // Lấy ảnh từ sách
    bookImagesInput.value = uploadedImageUrls.join('\n');
    renderUploadedImages(); // Hiển thị ảnh
  }
});

// Lưu thông tin sách
addBookForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const thumbnail = document.getElementById('bookThumbnail').value;
  const id = addBookForm.getAttribute('data-edit-id');
  const title = document.getElementById('bookName').value.trim();
  const author = document.getElementById('bookAuthor').value.trim();
  const price = Number(document.getElementById('bookPrice').value);
  const stock = Number(document.getElementById('bookStock').value);
  const publication_date = document.getElementById('bookPubDate').value;
  const publisher = document.getElementById('bookPublisher').value.trim();
  const language = document.getElementById('bookLanguage').value.trim();
  const select = document.getElementById('bookCategory');
  // --- SỬA ĐOẠN NÀY ---
  let categories = [];
  if (select.choicesInstance) {
    categories = select.choicesInstance.getValue(true); // Lấy array value đã chọn
  } else {
    categories = Array.from(select.selectedOptions).map(opt => opt.value);
  }
  // --- HẾT SỬA ---
  const description = bookDescEditor ? bookDescEditor.getData() : document.getElementById('bookDesc').value;

  const payload = {
    title, author, price, cover_image: uploadedImageUrls, stock, publication_date, publisher, language, categories, description, thumbnail
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
    renderFilteredAndSorted(currentPage); // <-- Dùng trang hiện tại ✅
  } catch (err) {
    alert('Có lỗi khi lưu truyện!\n' + err.message);
  }
});

// Lấy danh sách ảnh đã upload
fetch('https://server-shelf-stacker.onrender.com/api/upload/list-images')
  .then(res => res.json())
  .then(data => {
    const previewDiv = document.getElementById('uploadedImagesPreview');
    previewDiv.innerHTML = '';
    data.files.forEach(path => {
      const img = document.createElement('img');
      img.src = `https://server-shelf-stacker.onrender.com${path}`;  // ✅ Đảm bảo đầy đủ URL
      img.style = 'max-width:50px; margin:5px;';
      previewDiv.appendChild(img);
    });
  })
  .catch(err => {
    console.error('Lỗi lấy danh sách ảnh:', err);
    alert('Không thể tải danh sách ảnh');
  });
function CustomUploadAdapterPlugin(editor) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
    return new MyUploadAdapter(loader);
  };
}
class MyUploadAdapter {
  constructor(loader) {
    this.loader = loader;
  }

 upload() {
  return this.loader.file.then(file => new Promise((resolve, reject) => {
    const data = new FormData();
    data.append('upload', file);

    fetch('https://server-shelf-stacker.onrender.com/api/upload/upload-image', {
      method: 'POST',
      body: data
    })
      .then(response => response.json())
      .then(result => {
        if (result.url) {
          const fullUrl = result.url.startsWith('/')
            ? 'https://server-shelf-stacker.onrender.com' + result.url
            : result.url;

          resolve({
            default: fullUrl  // ✅ CHỈ URL thôi, KHÔNG phải <img>
          });
        } else {
          reject('Không có đường dẫn ảnh!');
        }
      })
      .catch(err => {
        reject('Upload thất bại: ' + err.message);
      });
  }));
}


  abort() {
    // Có thể bỏ trống hoặc xử lý nếu muốn
  }
}
// --- Upload ảnh thumbnail ---
const thumbnailInput = document.getElementById('bookThumbnailUpload');
const thumbnailPreview = document.getElementById('thumbnailPreview');
const thumbnailHiddenInput = document.getElementById('bookThumbnail');
const btnSelectThumbnail = document.getElementById('btn-select-thumbnail');

btnSelectThumbnail.addEventListener('click', () => {
  thumbnailInput.click();
});

thumbnailInput.addEventListener('change', async () => {
  const file = thumbnailInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('upload', file);

  try {
    const res = await fetch('https://server-shelf-stacker.onrender.com/api/upload/upload-image', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }

    const data = await res.json();
    const fullUrl = data.url.startsWith('/')
      ? 'https://server-shelf-stacker.onrender.com' + data.url
      : data.url;

    thumbnailHiddenInput.value = fullUrl;

    // Hiển thị preview
    thumbnailPreview.innerHTML = `
      <img src="${fullUrl}" style="max-width:100px; margin-top:5px;">
    `;

    alert('Upload thumbnail thành công!');
  } catch (err) {
    console.error('Upload thumbnail lỗi:', err);
    alert('Upload thumbnail thất bại: ' + err.message);
  }
});
async function fetchCategoriesForSelect() {
  try {
    const res = await fetch('https://server-shelf-stacker.onrender.com/api/categories');
    const data = await res.json();

    const select = document.getElementById('bookCategory');
    select.innerHTML = ''; // clear cũ

    data.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat._id;
      option.textContent = cat.name;
      select.appendChild(option);
    });

    // Khởi tạo Choices.js cho select nhiều danh mục (chỉ 1 lần)
    if (!select.choicesInstance) {
      select.choicesInstance = new Choices(select, {
        removeItemButton: true,
        placeholder: true,
        placeholderValue: 'Chọn danh mục...',
        searchPlaceholderValue: 'Tìm danh mục...',
        noResultsText: 'Không tìm thấy',
        itemSelectText: '',
        shouldSort: false
      });
    }
  } catch (error) {
    console.error('Lỗi lấy danh mục:', error);
    alert('Không thể tải danh sách danh mục');
  }
}
