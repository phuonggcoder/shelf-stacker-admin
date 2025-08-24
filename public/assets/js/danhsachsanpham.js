let filterCategoryChoices = null;
let googleBookCoverUrl = ''; // Thêm biến này ở đầu file

const apiURL = 'https://server-shelf-stacker-w1ds.onrender.com/api/books/all';
const apiPostURL = 'https://server-shelf-stacker-w1ds.onrender.com/api/books';
const uploadURL = 'https://server-shelf-stacker-w1ds.onrender.com/api/upload/smart';
const categoriesURL = 'https://server-shelf-stacker-w1ds.onrender.com/api/categories';

const productGrid = document.getElementById('productGrid');
const searchBox = document.getElementById('searchBox');
const addBookBtn = document.getElementById('addBookBtn');
const dialogOverlay = document.getElementById('dialogOverlay');
const closeDialogBtn = document.getElementById('closeDialogBtn');
const addBookForm = document.getElementById('addBookForm');
const dialogTitle = document.getElementById('dialogTitle');
const exportExcelBtn = document.getElementById('exportExcelBtn');
const importGoogleBookBtn = document.getElementById('importGoogleBookBtn');
const googleBookDialogOverlay = document.getElementById('googleBookDialogOverlay');
const closeGoogleBookDialogBtn = document.getElementById('closeGoogleBookDialogBtn');
const googleBookSearchInput = document.getElementById('googleBookSearchInput');
const googleBookSearchBtn = document.getElementById('googleBookSearchBtn');
const googleBookResults = document.getElementById('googleBookResults');

// Thiết lập CKEditor 5
let bookDescEditor = null;
let ckeditorPromise = null;

function initCKEditorIfNeeded() {
  if (!window.ClassicEditor) {
    console.error('ClassicEditor không được định nghĩa. Vui lòng kiểm tra việc tải file CKEditor.');
    showErrorDialog('Lỗi CKEditor', 'Không thể khởi tạo trình soạn thảo. Vui lòng kiểm tra kết nối hoặc tải lại trang.');
    return Promise.reject(new Error('CKEditor không được tải thành công.'));
  }
  if (!ckeditorPromise) {
    ckeditorPromise = ClassicEditor
      .create(document.querySelector('#bookDesc'), {
        toolbar: [
          'heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|',
          'outdent', 'indent', '|', 'imageUpload', 'blockQuote', 'insertTable', 'mediaEmbed', 'undo', 'redo'
        ],
        image: {
          toolbar: ['imageTextAlternative', 'imageStyle:full', 'imageStyle:side']
        }
      })
      .then(editor => {
        console.log('CKEditor initialized successfully:', editor);
        bookDescEditor = editor;
        editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
          return new CKEditorUploadAdapter(loader, editor);
        };
        return editor;
      })
      .catch(error => {
        console.error('Lỗi khởi tạo CKEditor:', error);
        showErrorDialog('Lỗi CKEditor', 'Không thể khởi tạo trình soạn thảo. Vui lòng thử lại.');
        return Promise.reject(error);
      });
  }
  return ckeditorPromise;
}

// Adapter upload tùy chỉnh cho CKEditor
class CKEditorUploadAdapter {
  constructor(loader, editor) {
    this.loader = loader;
    this.editor = editor;
    if (!this.editor) {
      console.error('CKEditor instance not found in adapter constructor');
    }
  }

  async upload() {
    try {
      const file = await this.loader.file;
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      const formData = new FormData();
      formData.append('imageFile', file);
      formData.append('folder', 'admin_ckeditor5_Uploads');
      formData.append('type', 'book');

      const response = await fetch(uploadURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Lỗi server: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.url) {
        throw new Error(data.message || 'Phản hồi từ server không chứa URL ảnh.');
      }

      return { default: data.url };
    } catch (error) {
      console.error('Lỗi upload CKEditor:', error);
      showErrorDialog('Lỗi Upload Ảnh', `Không thể upload ảnh: ${error.message}`);
      return Promise.reject(error.message);
    }
  }

  abort() {
    console.log('Đã hủy upload');
  }
}

// Theo dõi ảnh đã xóa tạm thời
let deletedImageIndices = [];
let existingCoverImages = [];

function showTemporaryDeleteDialog(index) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.id = 'temp-delete-overlay';
    overlay.style.cssText = 'position: fixed; inset: 0; z-index: 9999; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-family: \'Segoe UI\', sans-serif;';
    overlay.innerHTML = `
      <div style="background: #fff; border-radius: 12px; padding: 16px 20px; max-width: 360px; width: 100%; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); text-align: left;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <img src="https://img.icons8.com/fluency/24/delete-sign.png" alt="delete-icon" />
          <span style="font-size: 15px;">Bạn có chắc muốn xóa ảnh này tạm thời? (Sẽ không lưu cho đến khi bạn nhấn Lưu)</span>
        </div>
        <div style="height: 2px; background-color: #00cfff; margin-bottom: 16px;"></div>
        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <button id="btn-cancel-delete-temp" style="padding: 6px 16px; background: #ffecec; color: #f44336; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.3s;">Hủy</button>
          <button id="btn-ok-delete-temp" style="padding: 6px 16px; background: #00cfff; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.3s;">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#btn-cancel-delete-temp').onclick = () => {
      overlay.remove();
      resolve(false);
    };
    overlay.querySelector('#btn-ok-delete-temp').onclick = () => {
      overlay.remove();
      resolve(true);
    };
  });
}

// Hiện dialog khi bấm Thêm truyện
addBookBtn.addEventListener('click', async () => {
  googleBookCoverUrl = '';
  dialogTitle.textContent = 'Thêm truyện mới';
  addBookForm.reset();
  
  document.getElementById('bookImageUpload').value = '';
  document.getElementById('bookThumbnailUpload').value = '';
  deletedImageIndices = [];
  existingCoverImages = [];
  
  document.getElementById('uploadedImagesPreview').innerHTML = '';
  document.getElementById('thumbnailPreview').innerHTML = '';

  await initCKEditorIfNeeded().then(() => {
    if (bookDescEditor) bookDescEditor.setData('');
  }).catch(() => {});

  addBookForm.removeAttribute('data-edit-id');
  dialogOverlay.classList.add('active');

  await fetchCategoriesForSelect();
});

// Đóng dialog
closeDialogBtn.addEventListener('click', () => {
  dialogOverlay.classList.remove('active');
  addBookForm.reset();
  addBookForm.removeAttribute('data-edit-id');
  if (bookDescEditor) bookDescEditor.setData('');
  deletedImageIndices = [];
  existingCoverImages = [];
});

// Đóng dialog khi bấm ra ngoài
dialogOverlay.addEventListener('click', (e) => {
  if (e.target === dialogOverlay) {
    dialogOverlay.classList.remove('active');
    addBookForm.reset();
    addBookForm.removeAttribute('data-edit-id');
    if (bookDescEditor) bookDescEditor.setData('');
    deletedImageIndices = [];
    existingCoverImages = [];
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

    let desc = product.description || '';
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

    let thumbUrl = product.thumbnail && product.thumbnail !== 'undefined' ? product.thumbnail : '';
    let fallbackThumb = 'https://server-shelf-stacker-w1ds.onrender.com/assets/images/default-thumbnail.png';
    let imagesHtml = thumbUrl
      ? `<img src="${thumbUrl}" alt="Thumbnail" onerror="this.onerror=null;this.src='${fallbackThumb}'" style="max-width:80px; margin:2px;">`
      : `<img src="${fallbackThumb}" alt="No thumbnail" style="max-width:80px; margin:2px;">`;

    card.innerHTML = `
      ${imagesHtml}
      <div class="info">
        <h3>${product.title || product.name}</h3>
        <p><b>Tác giả:</b> ${product.author || ''}</p>
        <p><b>Giá:</b> ${product.price ? Number(product.price).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : ''}</p>
        <div class="desc-wrap">${descHtml}</div>
        <span><b>Danh mục:</b> ${(product.categories || []).map(c => c.name || c).join(', ')}</span><br>
        <span><b>Số lượng:</b> ${product.stock || ''}</span><br>
        <span><b>Ngày xuất bản:</b> ${product.publication_date ? new Date(product.publication_date).toLocaleDateString('vi-VN') : ''}</span><br>
        <span><b>Nhà xuất bản:</b> ${product.publisher || ''}</span><br>
        <span><b>Ngôn ngữ:</b> ${product.language || ''}</span>
        <span><b>Nổi bật:</b> ${product.featured ? 'Có' : 'Không'}</span>
      </div>
      <div class="actions">
        <button class="edit-btn" data-id="${product._id}"><i class="fas fa-pen" style="font-size: 20px;"></i></button>
        <button class="delete-btn" data-id="${product._id}"><i class="fas fa-trash" style="font-size: 20px;"></i></button>
        <button class="toggle-featured-btn" data-id="${product._id}" title="${product.featured ? 'Bỏ nổi bật' : 'Đặt làm nổi bật'}">
          <i class="fas ${product.featured ? 'fa-star' : 'fa-star-half-alt'}" style="font-size: 20px;"></i>
        </button>
      </div>
    `;

    productGrid.appendChild(card);
  });

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

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async function () {
      const id = this.getAttribute('data-id');
      if (await showConfirmDeleteDialog()) {
        try {
          const token = localStorage.getItem('authToken');
          if (!token) {
            showErrorDialog('Lỗi xác thực', 'Vui lòng đăng nhập để thực hiện thao tác này.');
            return;
          }

          const res = await fetch(`${apiPostURL}/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!res.ok) {
            const contentType = res.headers.get('content-type');
            let errText = await (contentType && contentType.includes('application/json') ? res.json() : res.text()).then(data => data.message || data).catch(() => res.statusText);
            showErrorDialog('Xóa thất bại!', errText);
            return;
          }
          showSuccessDeletebook();
        } catch (err) {
          showErrorDialog('Có lỗi khi xóa truyện!', err.message);
        }
      }
    });
  });

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

      const thumbnailPreview = document.getElementById('thumbnailPreview');
      const thumb = book.thumbnail && book.thumbnail !== 'undefined' ? book.thumbnail : '';
      const fallbackThumb = 'https://server-shelf-stacker-w1ds.onrender.com/assets/images/default-thumbnail.png';
      thumbnailPreview.innerHTML = thumb
        ? `<div style="position: relative; display: inline-block;"><img src="${thumb}" style="max-width:100px; border:1px solid #ddd;" onerror="this.onerror=null;this.src='${fallbackThumb}'"><button class="delete-thumbnail-btn" style="position: absolute; top: 2px; right: 2px; background: #ff4444; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer;"><i class="fas fa-times"></i></button><button class="edit-thumbnail-btn" style="position: absolute; top: 25px; right: 2px; background: #007bff; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer;"><i class="fas fa-edit"></i></button></div>`
        : `<div style="position: relative; display: inline-block;"><img src="${fallbackThumb}" style="max-width:100px; border:1px solid #ddd;"></div>`;

      existingCoverImages = book.cover_image || [];

      const coverPreview = document.getElementById('uploadedImagesPreview');
      coverPreview.innerHTML = existingCoverImages.map((url, index) => `
        <div style="position: relative; display: inline-block; margin: 2px;" data-existing="true" data-url="${url}">
          <img src="${url}" style="max-width:100px; border:1px solid #ddd;" onerror="this.onerror=null;this.src='${fallbackThumb}'">
          <button class="delete-image-btn" data-index="${index}" style="position: absolute; top: 2px; right: 2px; background: #ff4444; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer;"><i class="fas fa-times"></i></button>
          <button class="edit-image-btn" data-index="${index}" style="position: absolute; top: 25px; right: 2px; background: #007bff; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer;"><i class="fas fa-edit"></i></button>
        </div>
      `).join('');

      initCKEditorIfNeeded().then(() => {
        if (bookDescEditor) bookDescEditor.setData(book.description || '');
      }).catch(() => {});

      addBookForm.setAttribute('data-edit-id', id);
      dialogOverlay.classList.add('active');
      deletedImageIndices = [];

      fetchCategoriesForSelect().then(() => {
        const select = document.getElementById('bookCategory');
        const ids = (book.categories || []).map(c => c._id || c);
        if (select.choicesInstance) {
          select.choicesInstance.removeActiveItems();
          ids.forEach(val => select.choicesInstance.setChoiceByValue(val));
        } else {
          Array.from(select.options).forEach(opt => {
            opt.selected = ids.includes(opt.value);
          });
        }
      });
    });
  });

  document.querySelectorAll('.toggle-featured-btn').forEach(btn => {
    btn.addEventListener('click', async function () {
      const id = this.getAttribute('data-id');
      const book = products.find(p => p._id === id);
      if (!book) return;

      const newFeaturedStatus = !book.featured;
      const message = newFeaturedStatus
        ? 'Bạn có chắc muốn đặt truyện này làm nổi bật?'
        : 'Bạn có chắc muốn bỏ trạng thái nổi bật của truyện này?';

      if (await showConfirmToggleFeaturedDialog(message)) {
        try {
          const token = localStorage.getItem('authToken');
          if (!token) {
            showErrorDialog('Lỗi xác thực', 'Vui lòng đăng nhập để thực hiện thao tác này.');
            return;
          }

          const res = await fetch(`${apiPostURL}/${id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ...book, featured: newFeaturedStatus })
          });

          if (!res.ok) {
            const contentType = res.headers.get('content-type');
            let errText = await (contentType && contentType.includes('application/json') ? res.json() : res.text()).then(data => data.message || data).catch(() => res.statusText);
            showErrorDialog('Cập nhật thất bại!', errText, res.url, res.status);
            return;
          }

          showSuccessToggleFeatured(newFeaturedStatus);
        } catch (err) {
          showErrorDialog('Có lỗi khi cập nhật trạng thái nổi bật!', err.message);
        }
      }
    });
  });
}

async function fetchProducts() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
    }

    const response = await fetch(apiURL, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      const errorText = await response.text().then(text => {
        try {
          const json = JSON.parse(text);
          return json.message || text;
        } catch {
          return text;
        }
      });
      throw new Error(errorText || 'Lỗi kết nối API');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Lỗi tải sản phẩm:', error);
    productGrid.innerHTML = '<p>Không thể tải danh sách truyện tranh. Vui lòng kiểm tra kết nối hoặc đăng nhập lại.</p>';
    showErrorDialog('Lỗi Tải Dữ Liệu', error.message);
    return [];
  }
}

function filterProducts(products, keyword, isFeaturedTab = false) {
  const lower = keyword.toLowerCase();
  const selectedCats = filterCategoryChoices && typeof filterCategoryChoices.getValue === 'function'
    ? filterCategoryChoices.getValue(true)
    : [];
  const minPrice = parseFloat(document.getElementById('minPrice')?.value) || 0;
  const maxPrice = parseFloat(document.getElementById('maxPrice')?.value) || Infinity;

  console.log('Filtering products with selected categories:', selectedCats);

  return products.filter(p => {
    if (isFeaturedTab && !p.featured) return false;
    const price = parseFloat(p.price) || 0;
    const matchPrice = price >= minPrice && price <= maxPrice;
    const matchText =
      (p.title || '').toLowerCase().includes(lower) ||
      (p.author || '').toLowerCase().includes(lower) ||
      (p.description || '').toLowerCase().includes(lower);

    let matchCategory = true;
    if (selectedCats.length > 0) {
      const prodCatIds = (p.categories || []).map(c => {
        return typeof c === 'object' && c._id ? c._id : c;
      });
      matchCategory = selectedCats.some(catId => prodCatIds.includes(catId));
    }

    return matchText && matchCategory && matchPrice;
  });
}

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

let products = [];
let currentPage = 1;
const pageSize = 6;
let activeTab = 'all';
let activeChildTab = 'all';

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

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pageProducts = productsArr.slice(start, end);

  renderProducts(pageProducts);

  pagination.innerHTML = '';
  if (totalPages > 1) {
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="#007bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    prevBtn.className = 'pagination-btn';
    prevBtn.disabled = page === 1;
    prevBtn.onclick = () => renderFilteredAndSorted(page - 1);

    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="#007bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    nextBtn.className = 'pagination-btn';
    nextBtn.disabled = page === totalPages;
    nextBtn.onclick = () => renderFilteredAndSorted(page + 1);

    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Trang ${page} / ${totalPages}`;
    pageInfo.style = 'padding: 0 10px; font-weight:bold; font-size:16px; color:#007bff; display:flex; align-items:center;';

    pagination.appendChild(prevBtn);
    pagination.appendChild(pageInfo);
    pagination.appendChild(nextBtn);
  }
}

function renderFilteredAndSorted(page = 1) {
  const keyword = searchBox.value.trim();
  const sortTitleOrder = document.getElementById('sort-title').value;

  let filtered = filterProducts(products, keyword, activeTab === 'featured' && activeChildTab === 'featured');

  if (sortTitleOrder) {
    filtered = sortByTitle(filtered, sortTitleOrder);
  }

  if (activeChildTab === 'popular') {
    filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
  } else if (activeChildTab === 'new') {
    filtered.sort((a, b) => new Date(b.publication_date) - new Date(a.publication_date));
  }

  renderProductsWithPagination(filtered, page);
}

document.getElementById('btn-search').addEventListener('click', () => {
  console.log('Search button clicked');
  renderFilteredAndSorted(1);
});
searchBox.addEventListener('input', () => {
  console.log('Search input changed:', searchBox.value);
  renderFilteredAndSorted(1);
});
document.getElementById('sort-title').addEventListener('change', () => {
  console.log('Sort order changed:', document.getElementById('sort-title').value);
  renderFilteredAndSorted(1);
});
document.getElementById('btn-filter-price').addEventListener('click', () => {
  console.log('Price filter applied:', {
    minPrice: document.getElementById('minPrice').value,
    maxPrice: document.getElementById('maxPrice').value
  });
  renderFilteredAndSorted(1);
});
document.getElementById('minPrice').addEventListener('input', () => {
  console.log('Min price changed:', document.getElementById('minPrice').value);
  renderFilteredAndSorted(1);
});
document.getElementById('maxPrice').addEventListener('input', () => {
  console.log('Max price changed:', document.getElementById('maxPrice').value);
  renderFilteredAndSorted(1);
});

document.getElementById('btn-select-image').addEventListener('click', () => {
  document.getElementById('bookImageUpload').click();
});

document.getElementById('btn-select-thumbnail').addEventListener('click', () => {
  document.getElementById('bookThumbnailUpload').click();
});

document.getElementById('bookImageUpload').addEventListener('change', function() {
  const files = this.files;
  const preview = document.getElementById('uploadedImagesPreview');
  if (preview && files.length > 0) {
    renderImagePreviews(preview, files, existingCoverImages.filter(url => !deletedImageIndices.includes(url)));
  }
});

document.getElementById('bookThumbnailUpload').addEventListener('change', function() {
  const file = this.files[0];
  const preview = document.getElementById('thumbnailPreview');
  preview.innerHTML = '';

  if (preview && file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const div = document.createElement('div');
      div.style.cssText = 'position: relative; display: inline-block;';
      div.innerHTML = `
        <img src="${e.target.result}" style="max-width:100px; border:1px solid #ddd; border-radius: 4px;">
        <button class="delete-thumbnail-btn" style="position: absolute; top: 2px; right: 2px; background: #ff4444; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer;"><i class="fas fa-times"></i></button>
        <button class="edit-thumbnail-btn" style="position: absolute; top: 25px; right: 2px; background: #007bff; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer;"><i class="fas fa-edit"></i></button>
      `;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  }
});

document.getElementById('uploadedImagesPreview').addEventListener('click', function(e) {
  const preview = this;
  const targetDiv = e.target.closest('div');
  if (!targetDiv) return;

  const index = parseInt(targetDiv.querySelector('.delete-image-btn')?.getAttribute('data-index') || targetDiv.querySelector('.edit-image-btn')?.getAttribute('data-index'));
  const isExisting = targetDiv.hasAttribute('data-existing');

  if (e.target.classList.contains('delete-image-btn') || e.target.closest('.delete-image-btn')) {
    showTemporaryDeleteDialog(index).then(async (confirm) => {
      if (confirm) {
        if (isExisting) {
          const url = targetDiv.getAttribute('data-url');
          deletedImageIndices.push(url);
          targetDiv.remove();
        } else {
          const input = document.getElementById('bookImageUpload');
          const dataTransfer = new DataTransfer();
          const files = Array.from(input.files);
          files.forEach((file, i) => {
            if (i !== index - existingCoverImages.length) dataTransfer.items.add(file);
          });
          input.files = dataTransfer.files;
          targetDiv.remove();
        }
        updateImageIndices(preview);
      }
    });
  } else if (e.target.classList.contains('edit-image-btn') || e.target.closest('.edit-image-btn')) {
    const input = document.getElementById('bookImageUpload');
    input.click();
    input.addEventListener('change', function replaceImage(e) {
      const newFiles = e.target.files;
      if (newFiles.length > 0) {
        const dataTransfer = new DataTransfer();
        const currentFiles = Array.from(input.files);

        if (isExisting) {
          const url = targetDiv.getAttribute('data-url');
          deletedImageIndices.push(url);
          currentFiles.forEach(file => dataTransfer.items.add(file));
        } else {
          currentFiles.forEach((file, i) => {
            if (i !== index - existingCoverImages.length) dataTransfer.items.add(file);
          });
        }
        Array.from(newFiles).forEach(file => dataTransfer.items.add(file));
        input.files = dataTransfer.files;

        renderImagePreviews(preview, input.files, existingCoverImages.filter(url => !deletedImageIndices.includes(url)));
      }
      input.removeEventListener('change', replaceImage);
    }, { once: true });
  }
});

document.getElementById('thumbnailPreview').addEventListener('click', function(e) {
  const preview = this;
  if (e.target.classList.contains('delete-thumbnail-btn') || e.target.closest('.delete-thumbnail-btn')) {
    document.getElementById('bookThumbnailUpload').value = '';
    preview.innerHTML = '';
  } else if (e.target.classList.contains('edit-thumbnail-btn') || e.target.closest('.edit-thumbnail-btn')) {
    document.getElementById('bookThumbnailUpload').click();
    document.getElementById('bookThumbnailUpload').addEventListener('change', function replaceThumbnail(e) {
      const newFile = e.target.files[0];
      if (newFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
          preview.innerHTML = `
            <div style="position: relative; display: inline-block;">
              <img src="${e.target.result}" style="max-width:100px; border:1px solid #ddd; border-radius: 4px;">
              <button class="delete-thumbnail-btn" style="position: absolute; top: 2px; right: 2px; background: #ff4444; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer;"><i class="fas fa-times"></i></button>
              <button class="edit-thumbnail-btn" style="position: absolute; top: 25px; right: 2px; background: #007bff; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer;"><i class="fas fa-edit"></i></button>
            </div>
          `;
        };
        reader.readAsDataURL(newFile);
      }
      this.removeEventListener('change', replaceThumbnail);
    }, { once: true });
  }
});

addBookForm.addEventListener('submit', async function(e) {
  e.preventDefault();

  await new Promise(resolve => setTimeout(resolve, 0));

  const price = parseFloat(document.getElementById('bookPrice').value);
  const stock = parseInt(document.getElementById('bookStock').value);
  const title = document.getElementById('bookName').value.trim();
  const id = addBookForm.getAttribute('data-edit-id');

  // Kiểm tra trùng tên truyện
  const existingBook = products.find(p => p.title.toLowerCase() === title.toLowerCase() && (!id || p._id !== id));
  if (existingBook && !id) {
    showErrorDialog('Lỗi nhập liệu', 'Tên truyện đã tồn tại. Vui lòng chọn tên khác.');
    return;
  }

  if (isNaN(price) || price < 1) {
    showErrorDialog('Lỗi nhập liệu', 'Giá tiền phải lớn hơn hoặc bằng 1.');
    return;
  }

  if (isNaN(stock) || stock < 1) {
    showErrorDialog('Lỗi nhập liệu', 'Số lượng phải lớn hơn hoặc bằng 1.');
    return;
  }

  const formData = new FormData();

  formData.append('title', title);
  formData.append('author', document.getElementById('bookAuthor').value.trim());
  formData.append('price', price);
  formData.append('stock', stock);
  formData.append('publication_date', document.getElementById('bookPubDate').value);
  formData.append('publisher', document.getElementById('bookPublisher').value.trim());
  formData.append('language', document.getElementById('bookLanguage').value.trim());

  const description = bookDescEditor ? bookDescEditor.getData() : document.getElementById('bookDesc').value;
  formData.append('description', description);

  const select = document.getElementById('bookCategory');
  let categories = [];
  if (select.choicesInstance) {
    categories = select.choicesInstance.getValue(true);
  } else {
    categories = Array.from(select.selectedOptions).map(opt => opt.value);
  }
  categories.forEach(cat => formData.append('categories[]', cat));

  const coverFiles = document.getElementById('bookImageUpload').files;
  if (coverFiles.length > 0) {
    for (let i = 0; i < coverFiles.length; i++) {
      formData.append('cover_images', coverFiles[i]);
    }
  } else if (googleBookCoverUrl) {
    // Tải ảnh Google Books về dạng file và append vào FormData
    try {
      const file = await fetchImageAsFile(googleBookCoverUrl, 'googlebook_cover');
      formData.append('cover_images', file);
    } catch (err) {
      console.error('Không thể tải ảnh Google Books:', err);
    }
  }

  if (id && deletedImageIndices.length > 0) {
    deletedImageIndices.forEach(url => formData.append('delete_images[]', url));
  }

  const thumbnailFile = document.getElementById('bookThumbnailUpload').files[0];
  if (thumbnailFile) {
    formData.append('thumbnail', thumbnailFile);
  }

  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      showErrorDialog('Lỗi xác thực', 'Vui lòng đăng nhập để thực hiện thao tác này.');
      return;
    }

    let res;
    if (id) {
      res = await fetch(`${apiPostURL}/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
    } else {
      res = await fetch(apiPostURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
    }

    if (!res.ok) {
      const errorText = await res.text().then(text => {
        try {
          const json = JSON.parse(text);
          return json.message || text;
        } catch {
          return text;
        }
      });
      throw new Error(errorText || 'Lỗi không xác định');
    }

    showAddBookSuccessDialog(id ? 'update' : 'add', 'Dữ liệu đã được lưu thành công!');
    dialogOverlay.classList.remove('active');
    deletedImageIndices = [];
    existingCoverImages = [];
    products = await fetchProducts(); // Cập nhật lại danh sách sản phẩm sau khi thêm/sửa
    renderFilteredAndSorted(1);
  } catch (err) {
    showErrorDialog('Có lỗi khi lưu truyện!', err.message);
  }
  googleBookCoverUrl = '';
});

async function fetchCategoriesForSelect() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
    }

    const res = await fetch(categoriesURL, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) {
      const errorText = await res.text().then(text => {
        try {
          const json = JSON.parse(text);
          return json.message || text;
        } catch {
          return text;
        }
      });
      throw new Error(errorText || 'Lỗi lấy danh mục');
    }
    const data = await res.json();

    const select = document.getElementById('bookCategory');
    select.innerHTML = '';

    data.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat._id;
      option.textContent = cat.name;
      select.appendChild(option);
    });

    if (!select.choicesInstance && typeof Choices !== 'undefined') {
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
    showErrorDialog('Lỗi Danh Mục', 'Không thể tải danh mục: ' + error.message);
  }
}

function renderImagePreviews(preview, files, existingImages) {
  preview.innerHTML = '';
  const fallbackThumb = 'https://server-shelf-stacker-w1ds.onrender.com/assets/images/default-thumbnail.png';

  existingImages.forEach((url, index) => {
    if (!deletedImageIndices.includes(url)) {
      const div = document.createElement('div');
      div.style.cssText = 'position: relative; display: inline-block; margin: 2px;';
      div.setAttribute('data-existing', 'true');
      div.setAttribute('data-url', url);
      div.innerHTML = `
        <img src="${url}" style="max-width:100px; border:1px solid #ddd;" onerror="this.onerror=null;this.src='${fallbackThumb}'">
        <button class="delete-image-btn" data-index="${index}" style="position: absolute; top: 2px; right: 2px; background: #ff4444; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer;"><i class="fas fa-times"></i></button>
        <button class="edit-image-btn" data-index="${index}" style="position: absolute; top: 25px; right: 2px; background: #007bff; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer;"><i class="fas fa-edit"></i></button>
      `;
      preview.appendChild(div);
    }
  });

  Array.from(files).forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const div = document.createElement('div');
      div.style.cssText = 'position: relative; display: inline-block; margin: 2px;';
      div.innerHTML = `
        <img src="${e.target.result}" style="max-width:100px; border:1px solid #ddd;">
        <button class="delete-image-btn" data-index="${index + existingImages.length}" style="position: absolute; top: 2px; right: 2px; background: #ff4444; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer;"><i class="fas fa-times"></i></button>
        <button class="edit-image-btn" data-index="${index + existingImages.length}" style="position: absolute; top: 25px; right: 2px; background: #007bff; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer;"><i class="fas fa-edit"></i></button>
      `;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}

function updateImageIndices(preview) {
  const deleteButtons = preview.querySelectorAll('.delete-image-btn');
  const editButtons = preview.querySelectorAll('.edit-image-btn');
  deleteButtons.forEach((btn, idx) => btn.setAttribute('data-index', idx));
  editButtons.forEach((btn, idx) => btn.setAttribute('data-index', idx));
}

function showConfirmDeleteDialog(message = 'Bạn có chắc muốn xóa truyện này?') {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.id = 'confirm-delete-overlay';
    overlay.style.cssText = 'position: fixed; inset: 0; z-index: 9998; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-family: \'Segoe UI\', sans-serif;';
    overlay.innerHTML = `
      <div style="background: #fff; border-radius: 12px; padding: 16px 20px; max-width: 360px; width: 100%; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); text-align: left;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <img src="https://img.icons8.com/fluency/24/delete-sign.png" alt="delete-icon" />
          <span style="font-size: 15px;">${message}</span>
        </div>
        <div style="height: 2px; background-color: #00cfff; margin-bottom: 16px;"></div>
        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <button id="btn-cancel-delete" style="padding: 6px 16px; background: #ffecec; color: #f44336; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.3s;">Hủy</button>
          <button id="btn-ok-delete" style="padding: 6px 16px; background: #00cfff; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.3s;">Xác nhận</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#btn-cancel-delete').onclick = () => {
      overlay.remove();
      resolve(false);
    };
    overlay.querySelector('#btn-ok-delete').onclick = () => {
      overlay.remove();
      resolve(true);
    };
  });
}

function showConfirmToggleFeaturedDialog(message = 'Bạn có chắc muốn thay đổi trạng thái nổi bật?') {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.id = 'confirm-toggle-featured-overlay';
    overlay.style.cssText = 'position: fixed; inset: 0; z-index: 9998; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-family: \'Segoe UI\', sans-serif;';
    overlay.innerHTML = `
      <div style="background: #fff; border-radius: 12px; padding: 16px 20px; max-width: 360px; width: 100%; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); text-align: left;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <img src="https://img.icons8.com/fluency/24/star.png" alt="star-icon" />
          <span style="font-size: 15px;">${message}</span>
        </div>
        <div style="height: 2px; background-color: #00cfff; margin-bottom: 16px;"></div>
        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <button id="btn-cancel-toggle" style="padding: 6px 16px; background: #ffecec; color: #f44336; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.3s;">Hủy</button>
          <button id="btn-ok-toggle" style="padding: 6px 16px; background: #00cfff; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.3s;">Xác nhận</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#btn-cancel-toggle').onclick = () => {
      overlay.remove();
      resolve(false);
    };
    overlay.querySelector('#btn-ok-toggle').onclick = () => {
      overlay.remove();
      resolve(true);
    };
  });
}

function showAddBookSuccessDialog(action, message = 'Dữ liệu đã được lưu thành công!') {
  const overlay = document.createElement('div');
  overlay.id = 'success-overlay';
  overlay.style.cssText = 'position: fixed; inset: 0; z-index: 9998; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-family: \'Segoe UI\', sans-serif;';
  overlay.innerHTML = `
    <div style="background: #fff; border-radius: 12px; padding: 16px 20px; max-width: 360px; width: 100%; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); text-align: left;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <img src="https://img.icons8.com/fluency/24/checked.png" alt="success-icon" />
        <span style="font-size: 15px;">${action === 'update' ? 'Cập nhật' : 'Thêm'} truyện thành công!</span>
      </div>
      <div style="height: 2px; background-color: #00cfff; margin-bottom: 16px;"></div>
      <p style="font-size: 14px; color: #333;">${message}</p>
      <div style="display: flex; justify-content: flex-end; gap: 12px;">
        <button id="btn-ok-success" style="padding: 6px 16px; background: #00cfff; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.3s;">OK</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#btn-ok-success').onclick = () => {
    overlay.remove();
    window.location.reload(); // Reload page after dialog is closed
  };
}

function showSuccessDeletebook() {
  const overlay = document.createElement('div');
  overlay.id = 'success-delete-overlay';
  overlay.style.cssText = 'position: fixed; inset: 0; z-index: 9998; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-family: \'Segoe UI\', sans-serif;';
  overlay.innerHTML = `
    <div style="background: #fff; border-radius: 12px; padding: 16px 20px; max-width: 360px; width: 100%; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); text-align: left;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <img src="https://img.icons8.com/fluency/24/checked.png" alt="success-icon" />
        <span style="font-size: 15px;">Xóa truyện thành công!</span>
      </div>
      <div style="height: 2px; background-color: #00cfff; margin-bottom: 16px;"></div>
      <div style="display: flex; justify-content: flex-end; gap: 12px;">
        <button id="btn-ok-delete-success" style="padding: 6px 16px; background: #00cfff; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.3s;">OK</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#btn-ok-delete-success').onclick = () => {
    overlay.remove();
    window.location.reload(); // Reload page after dialog is closed
  };
}

function showSuccessToggleFeatured(isFeatured) {
  const overlay = document.createElement('div');
  overlay.id = 'success-toggle-overlay';
  overlay.style.cssText = 'position: fixed; inset: 0; z-index: 9998; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-family: \'Segoe UI\', sans-serif;';
  overlay.innerHTML = `
    <div style="background: #fff; border-radius: 12px; padding: 16px 20px; max-width: 360px; width: 100%; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); text-align: left;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <img src="https://img.icons8.com/fluency/24/checked.png" alt="success-icon" />
        <span style="font-size: 15px;">Đã ${isFeatured ? 'đặt làm' : 'bỏ'} nổi bật thành công!</span>
      </div>
      <div style="height: 2px; background-color: #00cfff; margin-bottom: 16px;"></div>
      <div style="display: flex; justify-content: flex-end; gap: 12px;">
        <button id="btn-ok-toggle-success" style="padding: 6px 16px; background: #00cfff; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.3s;">OK</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#btn-ok-toggle-success').onclick = () => {
    overlay.remove();
    window.location.reload(); // Reload page after dialog is closed
  };
}

function showErrorDialog(title, message, url = '', status = '') {
  const overlay = document.createElement('div');
  overlay.id = 'error-overlay';
  overlay.style.cssText = 'position: fixed; inset: 0; z-index: 9999; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-family: \'Segoe UI\', sans-serif;';
  overlay.innerHTML = `
    <div style="background: #fff; border-radius: 12px; padding: 16px 20px; max-width: 360px; width: 100%; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); text-align: left;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <img src="https://img.icons8.com/fluency/24/error.png" alt="error-icon" />
        <span style="font-size: 15px;">${title}</span>
      </div>
      <div style="height: 2px; background-color: #ff4444; margin-bottom: 16px;"></div>
      <p style="font-size: 14px; color: #333;">${message}${url ? `<br>URL: ${url}` : ''}${status ? `<br>Mã lỗi: ${status}` : ''}</p>
      <div style="display: flex; justify-content: flex-end; gap: 12px;">
        <button id="btn-ok-error" style="padding: 6px 16px; background: #ff4444; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.3s;">OK</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#btn-ok-error').onclick = () => {
    overlay.remove();
  };
}

// Khởi tạo tab
document.querySelectorAll('.tab-parent').forEach(tab => {
  tab.addEventListener('click', function () {
    const parent = this.getAttribute('data-tab-parent');
    document.querySelectorAll('.tab-parent').forEach(t => t.classList.remove('active'));
    this.classList.add('active');

    activeTab = parent;
    activeChildTab = this.querySelector('.tab-child div') ? this.querySelector('.tab-child div').getAttribute('data-tab-child') : parent;
    renderFilteredAndSorted(1);
  });
});

document.querySelectorAll('.tab-child div').forEach(child => {
  child.addEventListener('click', function (e) {
    e.stopPropagation();
    const parent = this.parentElement.parentElement;
    const childTab = this.getAttribute('data-tab-child');
    parent.querySelectorAll('.tab-child div').forEach(c => c.classList.remove('active'));
    this.classList.add('active');

    activeChildTab = childTab;
    renderFilteredAndSorted(1);
  });
});

// Khởi tạo bộ lọc danh mục
const categoryFilterWrap = document.getElementById('category-filter-choices-wrap');
const toggleCategoryBtn = document.getElementById('toggle-category-btn');
const filterCategory = document.getElementById('filter-category');

toggleCategoryBtn.addEventListener('click', () => {
  categoryFilterWrap.style.display = categoryFilterWrap.style.display === 'none' ? 'block' : 'none';
});

fetch(categoriesURL, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }
})
  .then(res => {
    if (!res.ok) {
      throw new Error(`Lỗi tải danh mục: ${res.statusText}`);
    }
    return res.json();
  })
  .then(data => {
    filterCategory.innerHTML = data.map(cat => `<option value="${cat._id}">${cat.name}</option>`).join('');
    if (typeof Choices !== 'undefined') {
      filterCategoryChoices = new Choices(filterCategory, {
        removeItemButton: true,
        placeholder: true,
        placeholderValue: 'Lọc theo danh mục...',
        searchPlaceholderValue: 'Tìm danh mục...',
        noResultsText: 'Không tìm thấy',
        itemSelectText: '',
        shouldSort: false
      });
      filterCategoryChoices.passedElement.element.addEventListener('change', () => {
        console.log('Category filter changed:', filterCategoryChoices.getValue(true));
        renderFilteredAndSorted(1);
      });
    } else {
      console.error('Choices.js không được tải.');
      showErrorDialog('Lỗi Khởi Tạo', 'Không thể tải Choices.js để khởi tạo bộ lọc danh mục.');
    }
  })
  .catch(err => {
    console.error('Lỗi tải danh mục:', err);
    showErrorDialog('Lỗi Lọc Danh Mục', 'Không thể tải danh mục để lọc: ' + err.message);
  });

// Xuất file Excel
exportExcelBtn.addEventListener('click', async () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    showErrorDialog('Lỗi xác thực', 'Vui lòng đăng nhập để thực hiện thao tác này.');
    return;
  }

  try {
    const keyword = searchBox.value.trim();
    const selectedCats = filterCategoryChoices ? filterCategoryChoices.getValue(true) : [];
    const minPrice = parseFloat(document.getElementById('minPrice').value) || 0;
    const maxPrice = parseFloat(document.getElementById('maxPrice').value) || Infinity;
    const sortTitleOrder = document.getElementById('sort-title').value;

    const response = await fetch(apiURL, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Không thể tải danh sách truyện');

    const data = await response.json();
    let filteredData = filterProducts(data, keyword, activeTab === 'featured' && activeChildTab === 'featured');

    if (sortTitleOrder) {
      filteredData = sortByTitle(filteredData, sortTitleOrder);
    }

    const wsData = [
      ['Tên truyện', 'Tác giả', 'Giá (VND)', 'Số lượng', 'Ngày xuất bản', 'Nhà xuất bản', 'Ngôn ngữ', 'Danh mục', 'Nổi bật'],
      ...filteredData.map(p => [
        p.title || p.name || '',
        p.author || '',
        p.price ? Number(p.price).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '',
        p.stock || '',
        p.publication_date ? new Date(p.publication_date).toLocaleDateString('vi-VN') : '',
        p.publisher || '',
        p.language || '',
        (p.categories || []).map(c => c.name || c).join(', '),
        p.featured ? 'Có' : 'Không'
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSachTruyen');
    XLSX.writeFile(wb, 'DanhSachTruyen_' + new Date().toLocaleDateString('vi-VN').replace(/\//g, '-') + '.xlsx');
  } catch (err) {
    showErrorDialog('Lỗi Xuất Excel', err.message);
  }
});

// Khởi động ứng dụng
(async () => {
  products = await fetchProducts();
  renderFilteredAndSorted(1);
  await fetchCategoriesForSelect();
})();

closeGoogleBookDialogBtn.addEventListener('click', () => {
  googleBookDialogOverlay.style.display = 'none';
});

googleBookDialogOverlay.addEventListener('click', (e) => {
  if (e.target === googleBookDialogOverlay) {
    googleBookDialogOverlay.style.display = 'none';
  }
});

// Tìm kiếm Google Books API
googleBookSearchBtn.addEventListener('click', async () => {
  const query = googleBookSearchInput.value.trim();
  if (!query) {
    googleBookResults.innerHTML = '<p>Vui lòng nhập tên sách để tìm kiếm.</p>';
    return;
  }
  googleBookResults.innerHTML = '<p>Đang tìm kiếm...</p>';
  try {
    // KHÔNG dùng key
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!data.items || data.items.length === 0) {
      googleBookResults.innerHTML = '<p>Không tìm thấy sách phù hợp.</p>';
      return;
    }
    googleBookResults.innerHTML = data.items.map(item => {
      const info = item.volumeInfo;
      return `
        <div style="display:flex;gap:10px;align-items:center;margin-bottom:10px;border-bottom:1px solid #eee;padding-bottom:10px;">
          <img src="${info.imageLinks?.thumbnail || ''}" style="width:60px;height:80px;object-fit:cover;border-radius:4px;" alt="cover"/>
          <div style="flex:1;">
            <b>${info.title}</b><br>
            <span>Tác giả: ${info.authors ? info.authors.join(', ') : 'Không rõ'}</span><br>
            <span>Nhà xuất bản: ${info.publisher || 'Không rõ'}</span><br>
            <span>Ngày xuất bản: ${info.publishedDate || ''}</span><br>
            <button class="btn-primary" data-bookid="${item.id}" style="margin-top:6px;">Thêm vào sản phẩm</button>
          </div>
        </div>
      `;
    }).join('');
    // Gắn sự kiện cho nút Thêm vào sản phẩm
    googleBookResults.querySelectorAll('button[data-bookid]').forEach(btn => {
      btn.onclick = async function() {
        const bookId = this.getAttribute('data-bookid');
        btn.disabled = true;
        btn.textContent = 'Đang lấy dữ liệu...';
        try {
          // Lấy chi tiết sách từ Google Books API
          const res = await fetch(`https://www.googleapis.com/books/v1/volumes/${bookId}`);
          const data = await res.json();
          const info = data.volumeInfo || {};

          // Map dữ liệu sang form thêm truyện
          dialogTitle.textContent = 'Thêm truyện từ Google Books';
          addBookForm.reset();

          document.getElementById('bookName').value = info.title || '';
          document.getElementById('bookAuthor').value = info.authors ? info.authors.join(', ') : '';
          document.getElementById('bookPrice').value = 10000;
          document.getElementById('bookStock').value = 10;
          document.getElementById('bookPubDate').value = info.publishedDate ? info.publishedDate.substr(0, 10) : '';
          document.getElementById('bookPublisher').value = info.publisher || '';
          document.getElementById('bookLanguage').value = info.language || 'vi';

          await initCKEditorIfNeeded();
          if (bookDescEditor) bookDescEditor.setData(info.description || '');

          // Ảnh bìa
          document.getElementById('uploadedImagesPreview').innerHTML = '';
          googleBookCoverUrl = ''; // Reset trước khi gán
          if (info.imageLinks && info.imageLinks.thumbnail) {
            document.getElementById('uploadedImagesPreview').innerHTML = `
              <div style="position: relative; display: inline-block; margin: 2px;">
                <img src="${info.imageLinks.thumbnail}" style="max-width:100px; border:1px solid #ddd;">
              </div>
            `;
            // Gán URL ảnh vào biến tạm để submit
            googleBookCoverUrl = info.imageLinks.thumbnail;
          }

          // Thumbnail
          document.getElementById('thumbnailPreview').innerHTML = '';
          if (info.imageLinks && info.imageLinks.thumbnail) {
            document.getElementById('thumbnailPreview').innerHTML = `
              <div style="position: relative; display: inline-block;">
                <img src="${info.imageLinks.thumbnail}" style="max-width:100px; border:1px solid #ddd;">
              </div>
            `;
          }

          await fetchCategoriesForSelect();
          const select = document.getElementById('bookCategory');
          if (info.categories && info.categories.length > 0) {
            Array.from(select.options).forEach(opt => {
              opt.selected = info.categories.some(cat => opt.textContent === cat);
            });
            if (select.choicesInstance) {
              select.choicesInstance.removeActiveItems();
              info.categories.forEach(cat => {
                const option = Array.from(select.options).find(opt => opt.textContent === cat);
                if (option) select.choicesInstance.setChoiceByValue(option.value);
              });
            }
          }

          dialogOverlay.classList.add('active');
          googleBookDialogOverlay.style.display = 'none';
          btn.disabled = false;
          btn.textContent = 'Thêm vào sản phẩm';
        } catch (err) {
          btn.textContent = 'Lỗi!';
          btn.style.background = '#ff4d4f';
          btn.style.color = '#fff';
          alert('Lỗi lấy dữ liệu sách: ' + err.message);
        }
      };
    });
  } catch (err) {
    googleBookResults.innerHTML = `<p>Lỗi khi tìm kiếm: ${err.message}</p>`;
  }
});

async function fetchImageAsFile(imageUrl, fileName = 'cover.jpg') {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  // Đoán loại file từ blob hoặc giữ là jpg
  const ext = blob.type.split('/')[1] || 'jpg';
  return new File([blob], `${fileName}.${ext}`, { type: blob.type });
}

router.post('/import/google', auth, async (req, res) => {
  try {
    const userRole = req.user.role || (Array.isArray(req.user.roles) ? req.user.roles[0] : undefined);
    const isAdmin = userRole === 'admin' || (Array.isArray(req.user.roles) && req.user.roles.includes('admin'));
    if (!isAdmin) {
      return res.status(403).json({ msg: 'Forbidden: Admins only' });
    }

    const { googleBooksId, additionalData = {} } = req.body;
    if (!googleBooksId) {
      return res.status(400).json({
        success: false,
        message: 'Google Books ID is required'
      });
    }

    // Check if book already exists
    const existingBook = await Book.findOne({ googleBooksId });
    if (existingBook) {
      return res.status(409).json({
        success: false,
        message: 'Book already exists in database',
        book: existingBook
      });
    }

    // Get book data from Google Books
    let googleBookData;
    try {
      googleBookData = await googleBooksService.createCompleteBookFromGoogle(googleBooksId, additionalData);
      // Kiểm tra dữ liệu trả về
      if (!googleBookData || !googleBookData.title) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy hoặc thiếu dữ liệu sách từ Google Books'
        });
      }
      // Bổ sung dữ liệu mặc định nếu thiếu
      googleBookData.price = googleBookData.price || 10000;
      googleBookData.stock = googleBookData.stock || 10;
      googleBookData.cover_image = googleBookData.cover_image && googleBookData.cover_image.length > 0 ? googleBookData.cover_image : ['https://server-shelf-stacker-w1ds.onrender.com/assets/images/default-thumbnail.png'];
      googleBookData.thumbnail = googleBookData.thumbnail || 'https://server-shelf-stacker-w1ds/onrender.com/assets/images/default-thumbnail.png';
      googleBookData.categories = googleBookData.categories || [];
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi lấy dữ liệu từ Google Books',
        error: err.message
      });
    }

    // Create new book in database
    const newBook = new Book({
      ...googleBookData,
      googleBooksId,
      stock: additionalData.stock || googleBookData.stock,
      featured: additionalData.featured || false,
      createdBy: req.user.id
    });

    await newBook.save();

    const savedBook = await Book.findById(newBook._id).populate('categories');

    res.status(201).json({
      success: true,
      message: 'Book imported successfully from Google Books',
      book: savedBook
    });

  } catch (error) {
    console.error('Import book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import book from Google Books',
      error: error.message
    });
  }
});