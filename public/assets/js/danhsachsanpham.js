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
      .create(document.querySelector('#bookDesc'))
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
  
  // Reset file inputs
  document.getElementById('bookImageUpload').value = '';
  document.getElementById('bookThumbnailUpload').value = '';
  
  // Clear previews
  document.getElementById('uploadedImagesPreview').innerHTML = '';
  document.getElementById('thumbnailPreview').innerHTML = '';

  // Xóa CKEditor nội dung
  setTimeout(() => {
    initCKEditorIfNeeded().then(() => {
      if (bookDescEditor) bookDescEditor.setData('');
    });
  }, 0);

  addBookForm.removeAttribute('data-edit-id');
  dialogOverlay.classList.add('active');

  fetchCategoriesForSelect();
  fetchCampaignsForSelect();
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

    // Hiển thị ảnh thumbnail
    let thumbUrl = product.thumbnail && product.thumbnail !== 'undefined' ? product.thumbnail : '';
    let fallbackThumb = 'https://server-shelf-stacker.onrender.com/assets/images/default-thumbnail.png';
    let imagesHtml = thumbUrl
      ? `<img src="${thumbUrl}" alt="Thumbnail" onerror="this.onerror=null;this.src='${fallbackThumb}'" style="max-width:80px; margin:2px;">`
      : `<img src="${fallbackThumb}" alt="No thumbnail" style="max-width:80px; margin:2px;">`;

    card.innerHTML = `
      ${imagesHtml}
      <div class="info">
        <h3>${product.title || product.name}</h3>
        <p><b>Tác giả:</b> ${product.author || ''}</p>
        <p><b>Giá:</b> ${product.price ? Number(product.price).toLocaleString('vi-VN') + '₫' : ''}</p>
        <div class="desc-wrap">${descHtml}</div>
        <span><b>Danh mục:</b> ${(product.categories || []).map(c => c.name || c).join(', ')}</span><br>
        <span><b>Chiến dịch:</b> ${(product.campaigns || []).map(c => c.name || c).join(', ')}</span><br>
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

 // ... (các phần code khác giữ nguyên cho đến phần xử lý xóa)

  // XÓA
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async function () {
      const id = this.getAttribute('data-id');
      if (await showConfirmDeleteDialog()) {
        try {
          const res = await fetch(`https://server-shelf-stacker.onrender.com/api/books/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': 'Bearer ' + (localStorage.getItem('authToken') || '')
            }
          });

          if (!res.ok) {
            const errText = await res.text();
            showErrorDialog('Xóa thất bại!', errText); // Hiển thị dialog lỗi
            return;
          }
          showSuccessDeletebook(); // Gọi dialog thành công
          // Chờ người dùng đóng dialog trước khi tải lại dữ liệu
        } catch (err) {
          showErrorDialog('Có lỗi khi xóa truyện!', err.message);
        }
      }
    });
  });

  // Hàm hiển thị dialog thành công (tạo động giống dialog lỗi)
  function showSuccessDeletebook() {
    const dialog = document.createElement('div');
    dialog.id = 'dialog-success-delete-book';
    dialog.style.cssText = `
      position: fixed; inset: 0; z-index: 9999;
      background-color: rgba(0,0,0,0.5);
      display: flex; justify-content: center; align-items: center;
      font-family: 'Segoe UI', sans-serif;
    `;
    dialog.innerHTML = `
      <div style="background: white; border-radius: 12px; padding: 24px 32px; max-width: 360px; width: 100%; text-align: center;">
        <img src="https://img.icons8.com/color/48/000000/ok--v1.png" alt="ok">
        <h3 style="margin-top: 12px; font-size: 18px;">Đã xóa truyện thành công!</h3>
        <button onclick="closeDeleteDialog()" style="
          margin-top: 20px; padding: 8px 24px;
          background: #00cfff; color: white; border: none; border-radius: 6px;
          cursor: pointer; font-weight: bold;
        ">OK</button>
      </div>
    `;
    document.body.appendChild(dialog);
    setTimeout(() => {
      dialog.style.display = 'flex';
    }, 0);
  }

  

  // Hàm hiển thị dialog lỗi (giữ nguyên)
  function showErrorDialog(title, message) {
    const dialog = document.createElement('div');
    dialog.id = 'dialog-error';
    dialog.style.cssText = `
      position: fixed; inset: 0; z-index: 9999;
      background-color: rgba(0,0,0,0.5);
      display: flex; justify-content: center; align-items: center;
      font-family: 'Segoe UI', sans-serif;
    `;
    dialog.innerHTML = `
      <div style="background: white; border-radius: 12px; padding: 24px 32px; max-width: 360px; width: 100%; text-align: center;">
        <img src="https://img.icons8.com/color/48/000000/error.png" alt="error">
        <h3 style="margin-top: 12px; font-size: 18px;">${title}</h3>
        <p style="color: #d32f2f;">${message}</p>
        <button onclick="document.getElementById('dialog-error').style.display='none'" style="
          margin-top: 20px; padding: 8px 24px;
          background: #ff4444; color: white; border: none; border-radius: 6px;
          cursor: pointer; font-weight: bold;
        ">OK</button>
      </div>
    `;
    document.body.appendChild(dialog);
    setTimeout(() => {
      dialog.style.display = 'flex';
    }, 0);
  }


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

      // Hiển thị thumbnail preview khi edit
      const thumbnailPreview = document.getElementById('thumbnailPreview');
      const thumb = book.thumbnail && book.thumbnail !== 'undefined' ? book.thumbnail : '';
      const fallbackThumb = 'https://server-shelf-stacker.onrender.com/assets/images/default-thumbnail.png';
      thumbnailPreview.innerHTML = thumb
        ? `<img src="${thumb}" style="max-width:100px;" onerror="this.onerror=null;this.src='${fallbackThumb}'">`
        : `<img src="${fallbackThumb}" style="max-width:100px;">`;

      // Hiển thị cover images preview khi edit
      const coverPreview = document.getElementById('uploadedImagesPreview');
      const coverImages = book.cover_image || [];
      coverPreview.innerHTML = coverImages.map(url => `
        <img src="${url}" style="max-width:100px; margin:2px;">
      `).join('');

      initCKEditorIfNeeded().then(() => {
        if (bookDescEditor) bookDescEditor.setData(book.description || '');
      });

      addBookForm.setAttribute('data-edit-id', id);
      dialogOverlay.classList.add('active');

      // Load danh mục và set chọn lại
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

      // Load campaigns và set chọn lại
      fetchCampaignsForSelect().then(() => {
        const select = document.getElementById('bookCampaign');
        const campaignIds = book.campaigns || [];

        if (select.choicesInstance) {
          select.choicesInstance.removeActiveItems();
          campaignIds.forEach(val => select.choicesInstance.setChoiceByValue(val));
        } else {
          Array.from(select.options).forEach(opt => {
            opt.selected = campaignIds.includes(opt.value);
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

// Hàm lọc sản phẩm theo từ khóa
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

// Thêm HTML cho phân trang
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

  // Render nút phân trang
  pagination.innerHTML = '';
  if (totalPages > 1) {
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="#007bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    prevBtn.className = 'pagination-btn';
    prevBtn.disabled = page === 1;
    prevBtn.style.cssText = "background:#fff;border:1px solid #007bff;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;margin:0 6px;";
    prevBtn.onclick = () => renderFilteredAndSorted(page - 1);

    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="#007bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    nextBtn.className = 'pagination-btn';
    nextBtn.disabled = page === totalPages;
    nextBtn.style.cssText = "background:#fff;border:1px solid #007bff;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;margin:0 6px;";
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

// Event listeners
document.getElementById('btn-search').addEventListener('click', () => renderFilteredAndSorted(1));
searchBox.addEventListener('input', () => renderFilteredAndSorted(1));
document.getElementById('sort-title').addEventListener('change', () => renderFilteredAndSorted(1));

// File upload handlers
document.getElementById('btn-select-image').addEventListener('click', () => {
  document.getElementById('bookImageUpload').click();
});

document.getElementById('btn-select-thumbnail').addEventListener('click', () => {
  document.getElementById('bookThumbnailUpload').click();
});

// Preview uploaded images
document.getElementById('bookImageUpload').addEventListener('change', function() {
  const files = this.files;
  const preview = document.getElementById('uploadedImagesPreview');
  preview.innerHTML = '';
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.cssText = 'max-width:100px; margin:2px; border:1px solid #ddd;';
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
});

// Preview thumbnail
document.getElementById('bookThumbnailUpload').addEventListener('change', function() {
  const file = this.files[0];
  const preview = document.getElementById('thumbnailPreview');
  
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      preview.innerHTML = `<img src="${e.target.result}" style="max-width:100px; border:1px solid #ddd;">`;
    };
    reader.readAsDataURL(file);
  }
});

// Lưu thông tin sách với FormData
addBookForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const id = addBookForm.getAttribute('data-edit-id');
  const formData = new FormData();
  
  // Thêm text fields
  formData.append('title', document.getElementById('bookName').value.trim());
  formData.append('author', document.getElementById('bookAuthor').value.trim());
  formData.append('price', document.getElementById('bookPrice').value);
  formData.append('stock', document.getElementById('bookStock').value);
  formData.append('publication_date', document.getElementById('bookPubDate').value);
  formData.append('publisher', document.getElementById('bookPublisher').value.trim());
  formData.append('language', document.getElementById('bookLanguage').value.trim());
  
  // Thêm description từ CKEditor
  const description = bookDescEditor ? bookDescEditor.getData() : document.getElementById('bookDesc').value;
  formData.append('description', description);
  
  // Thêm categories
  const select = document.getElementById('bookCategory');
  let categories = [];
  if (select.choicesInstance) {
    categories = select.choicesInstance.getValue(true);
  } else {
    categories = Array.from(select.selectedOptions).map(opt => opt.value);
  }
  formData.append('categories', categories.join(','));
  
  // Thêm campaigns
  const campaignSelect = document.getElementById('bookCampaign');
  let campaigns = [];
  if (campaignSelect.choicesInstance) {
    campaigns = campaignSelect.choicesInstance.getValue(true);
  } else {
    campaigns = Array.from(campaignSelect.selectedOptions).map(opt => opt.value);
  }
  formData.append('campaigns', campaigns.join(','));
  
  // Thêm cover images
  const coverFiles = document.getElementById('bookImageUpload').files;
  for (let i = 0; i < coverFiles.length; i++) {
    formData.append('cover_images', coverFiles[i]);
  }
  
  // Thêm thumbnail
  const thumbnailFile = document.getElementById('bookThumbnailUpload').files[0];
  if (thumbnailFile) {
    formData.append('thumbnail', thumbnailFile);
  }
  
  // Thêm token
  function getToken() {
    return localStorage.getItem('authToken') || '';
  }
  
  try {
    let res;
    if (id) {
      res = await fetch(`${apiPostURL}/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + getToken()
        },
        body: formData
      });
    } else {
      res = await fetch(apiPostURL, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + getToken()
        },
        body: formData
      });
    }
    
    if (!res.ok) {
  let errMessage = 'Lỗi không xác định!';
  try {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const errJson = await res.json();
      errMessage = errJson.message || JSON.stringify(errJson);
    } else {
      errMessage = await res.text(); // Fallback nếu không phải JSON
    }
  } catch (parseError) {
    errMessage = 'Không thể phân tích lỗi từ server!';
  }
  alert('Lưu thất bại: ' + errMessage);
  return;
}

    
    showAddBookSuccessDialog();
    dialogOverlay.classList.remove('active');
    products = await fetchProducts();
    renderFilteredAndSorted(currentPage);
  } catch (err) {
    alert('Có lỗi khi lưu truyện!\n' + err.message);
  }
});

// Category filter
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
      }
    } catch (err) {
      console.error('Lỗi load categories:', err);
    }
  }
  
  await fetchCategoriesForFilter();

  toggleCategoryBtn.addEventListener('click', function(e) {
    e.preventDefault();
    isOpen = !isOpen;
    if (isOpen) {
      filterChoicesWrap.style.display = 'block';
      toggleCategoryBtn.innerHTML = '<i class="fa fa-chevron-up"></i>';
    } else {
      filterChoicesWrap.style.display = 'none';
      toggleCategoryBtn.innerHTML = '<i class="fa fa-chevron-down"></i>';
    }
  });

  filterCategorySelect.addEventListener('change', () => {
    renderFilteredAndSorted(1);
  });

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
        matchCategory = selectedCats.some(catId => prodCatIds.includes(catId));
      }
      return matchText && matchCategory;
    });
  };
});

// Fetch categories for form select
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
  }
}

// Fetch campaigns for form select
async function fetchCampaignsForSelect() {
  try {
    const res = await fetch('https://server-shelf-stacker.onrender.com/api/campaigns');
    if (!res.ok) throw new Error('Response not OK');
    const data = await res.json();

    const select = document.getElementById('bookCampaign');
    select.innerHTML = '';
    data.forEach(camp => {
      const option = document.createElement('option');
      option.value = camp._id;
      option.textContent = camp.name;
      select.appendChild(option);
    });

    if (!select.choicesInstance) {
      select.choicesInstance = new Choices(select, {
        removeItemButton: true,
        placeholderValue: 'Chọn chiến dịch...',
        searchPlaceholderValue: 'Tìm chiến dịch...',
        noResultsText: 'Không có chiến dịch',
        itemSelectText: '',
        shouldSort: false
      });
    }
  } catch (err) {
    console.error('Lỗi lấy campaign:', err);
  }
}


function showSuccessDeletesbook() {
  fetch('/components/dialogs/success-delete-book.html')
    .then(res => res.text())
    .then(html => document.body.insertAdjacentHTML('beforeend', html));
}

// Main init
document.addEventListener('DOMContentLoaded', async () => {
  products = await fetchProducts();
  renderFilteredAndSorted(1);
});
// Hàm đóng dialog thành công và tải lại dữ liệu (định nghĩa toàn cục)
  function closeDeleteDialog() {
    const dialog = document.getElementById('dialog-success-delete-book');
    if (dialog) {
      dialog.style.display = 'none';
      document.body.removeChild(dialog); // Xóa dialog khỏi DOM sau khi đóng
      // Tải lại dữ liệu sau khi đóng
      fetchProducts().then(products => {
        renderProductsWithPagination(products, currentPage);
      });
    }
  }
  function showAddBookSuccessDialog() {
  const dialog = document.createElement('div');
  dialog.id = 'dialog-success-add-book';
  dialog.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    background-color: rgba(0,0,0,0.5);
    display: flex; justify-content: center; align-items: center;
    font-family: 'Segoe UI', sans-serif;
  `;

  dialog.innerHTML = `
    <div style="background: white; border-radius: 12px; padding: 24px 32px; max-width: 360px; width: 100%; text-align: center;">
      <div style="margin-bottom: 16px;">
        <img src="https://img.icons8.com/color/48/000000/ok--v1.png" alt="ok">
      </div>
      <h3 style="font-size: 18px; margin-bottom: 24px;">Thêm sách thành công , và sửa thành công !</h3>
      <div style="display: flex; justify-content: space-around;">
        <button onclick="closeAddBookDialog()" style="
          padding: 8px 24px;
          background: #e0e0e0; color: #000; border: none; border-radius: 6px;
          cursor: pointer; font-weight: bold;
        ">Quay lại</button>
        <button onclick="closeAddBookDialog()" style="
          padding: 8px 24px;
          background: #00cfff; color: white; border: none; border-radius: 6px;
          cursor: pointer; font-weight: bold;
        ">Xác nhận</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(dialog);
  setTimeout(() => {
    dialog.style.display = 'flex';
  }, 0);
}

function closeAddBookDialog() {
  const dialog = document.getElementById('dialog-success-add-book');
  if (dialog) {
    dialog.style.display = 'none';
    document.body.removeChild(dialog);
  }
}
function showUpdateBookSuccessDialog() {
  const dialog = document.createElement('div');
  dialog.id = 'dialog-success-update-book';
  dialog.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    background-color: rgba(0,0,0,0.5);
    display: flex; justify-content: center; align-items: center;
    font-family: 'Segoe UI', sans-serif;
  `;

  dialog.innerHTML = `
    <div style="background: white; border-radius: 12px; padding: 24px 32px; max-width: 360px; width: 100%; text-align: center;">
      <div style="margin-bottom: 16px;">
        <img src="https://img.icons8.com/color/48/000000/ok--v1.png" alt="ok">
      </div>
      <h3 style="font-size: 18px; margin-bottom: 20px;">Cập nhật truyện thành công!</h3>
      <button onclick="closeUpdateBookDialog()" style="
        padding: 8px 24px;
        background: #00cfff; color: white; border: none; border-radius: 6px;
        cursor: pointer; font-weight: bold;
      ">OK</button>
    </div>
  `;
  
  document.body.appendChild(dialog);
  setTimeout(() => {
    dialog.style.display = 'flex';
  }, 0);
}

function closeUpdateBookDialog() {
  const dialog = document.getElementById('dialog-success-update-book');
  if (dialog) {
    dialog.style.display = 'none';
    document.body.removeChild(dialog);
  }
}

function showConfirmDeleteDialog(message = 'Bạn có chắc muốn xóa danh mục này?') {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.id = 'confirm-delete-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 9998;
      background-color: rgba(0,0,0,0.5);
      display: flex; justify-content: center; align-items: center;
      font-family: 'Segoe UI', sans-serif;
    `;

    overlay.innerHTML = `
      <div style="
        background: white;
        border-radius: 12px;
        padding: 16px 20px;
        max-width: 360px;
        width: 100%;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        text-align: left;
      ">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <img src="https://img.icons8.com/fluency/24/delete-sign.png" alt="delete-icon" />
          <span style="font-size: 15px;">${message}</span>
        </div>
        <div style="height: 2px; background-color: #00cfff; margin-bottom: 16px;"></div>
        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <button id="btn-cancel-delete" style="
            padding: 6px 16px;
            background: #ffecec;
            color: #f44336;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.3s;
          ">Hủy</button>
          <button id="btn-ok-delete" style="
            padding: 6px 16px;
            background: #00cfff;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.3s;
          ">OK</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#btn-cancel-delete').onclick = () => {
      document.body.removeChild(overlay);
      resolve(false);
    };

    overlay.querySelector('#btn-ok-delete').onclick = () => {
      document.body.removeChild(overlay);
      resolve(true);
    };
  });
}
