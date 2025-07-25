const apiURL = 'https://server-shelf-stacker.onrender.com/api/books/all';
const apiPostURL = 'https://server-shelf-stacker.onrender.com/api/books';
const uploadURL = 'https://server-shelf-stacker.onrender.com/api/upload/smart';
const categoriesURL = 'https://server-shelf-stacker.onrender.com/api/categories';

const productGrid = document.getElementById('productGrid');
const searchBox = document.getElementById('searchBox');
const addBookBtn = document.getElementById('addBookBtn');
const dialogOverlay = document.getElementById('dialogOverlay');
const closeDialogBtn = document.getElementById('closeDialogBtn');
const addBookForm = document.getElementById('addBookForm');
const dialogTitle = document.getElementById('dialogTitle');

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
      formData.append('folder', 'admin_ckeditor5_uploads');
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
      const fallbackThumb = 'https://server-shelf-stacker.onrender.com/assets/images/default-thumbnail.png';
      thumbnailPreview.innerHTML = thumb
        ? `<div style="position: relative; display: inline-block;"><img src="${thumb}" style="max-width:100px; border:1px solid #ddd;" onerror="this.onerror=null;this.src='${fallbackThumb}'"><button class="delete-thumbnail-btn" style="position: absolute; top: 2px; right: 2px; background: #ff4444; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer;"><i class="fas fa-times"></i></button><button class="edit-thumbnail-btn" style="position: absolute; top: 25px; right: 2px; background: #007bff; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer;"><i class="fas fa-edit"></i></button></div>`
        : `<div style="position: relative; display: inline-block;"><img src="${fallbackThumb}" style="max-width:100px; border:1px solid #ddd;"></div>`;

      const coverPreview = document.getElementById('uploadedImagesPreview');
      existingCoverImages = book.cover_image || [];
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

function filterProducts(products, keyword) {
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
  const sortOrder = document.getElementById('sort-title').value;
  let filtered = filterProducts(products, keyword);
  filtered = sortByTitle(filtered, sortOrder);
  renderProductsWithPagination(filtered, page);
}

document.getElementById('btn-search').addEventListener('click', () => renderFilteredAndSorted(1));
searchBox.addEventListener('input', () => renderFilteredAndSorted(1));
document.getElementById('sort-title').addEventListener('change', () => renderFilteredAndSorted(1));

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

  const id = addBookForm.getAttribute('data-edit-id');
  const formData = new FormData();

  formData.append('title', document.getElementById('bookName').value.trim());
  formData.append('author', document.getElementById('bookAuthor').value.trim());
  formData.append('price', document.getElementById('bookPrice').value);
  formData.append('stock', document.getElementById('bookStock').value);
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
  for (let i = 0; i < coverFiles.length; i++) {
    formData.append('cover_images', coverFiles[i]);
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
    products = await fetchProducts();
    renderFilteredAndSorted(currentPage);
  } catch (err) {
    showErrorDialog('Có lỗi khi lưu truyện!', err.message);
  }
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
    showErrorDialog('Lỗi Danh Mục', 'Không thể tải danh mục: ' + error.message);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const filterCategorySelect = document.getElementById('filter-category');
  const toggleCategoryBtn = document.getElementById('toggle-category-btn');
  const filterChoicesWrap = document.getElementById('category-filter-choices-wrap');
  let filterCategoryChoices = null;
  let isOpen = false;

  async function fetchCategoriesForFilter() {
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
      showErrorDialog('Lỗi Danh Mục', 'Không thể tải danh mục lọc: ' + err.message);
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

  products = await fetchProducts();
  renderFilteredAndSorted(1);
});

function showErrorDialog(title, message) {
  const dialog = document.createElement('div');
  dialog.id = 'dialog-error';
  dialog.style.cssText = 'position: fixed; inset: 0; z-index: 9999; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-family: \'Segoe UI\', sans-serif;';
  dialog.innerHTML = `
    <div style="background: #fff; border-radius: 12px; padding: 24px 32px; max-width: 360px; width: 100%; text-align: center;">
      <img src="https://img.icons8.com/color/48/000000/error.png" alt="error">
      <h3 style="margin-top: 12px; font-size: 18px;">${title}</h3>
      <p style="color: #d32f2f;">${message}</p>
      <button onclick="document.getElementById('dialog-error').remove()" style="margin-top: 20px; padding: 8px 24px; background: #ff4444; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">OK</button>
    </div>
  `;
  document.body.appendChild(dialog);
}

function showSuccessDeletebook() {
  const dialog = document.createElement('div');
  dialog.id = 'dialog-success-delete-book';
  dialog.style.cssText = 'position: fixed; inset: 0; z-index: 9999; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-family: \'Segoe UI\', sans-serif;';
  dialog.innerHTML = `
    <div style="background: #fff; border-radius: 12px; padding: 24px 32px; max-width: 360px; width: 100%; text-align: center;">
      <img src="https://img.icons8.com/color/48/000000/ok--v1.png" alt="ok">
      <h3 style="margin-top: 12px; font-size: 18px;">Đã xóa truyện thành công!</h3>
      <button onclick="closeDeleteDialog()" style="margin-top: 20px; padding: 8px 24px; background: #00cfff; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">OK</button>
    </div>
  `;
  document.body.appendChild(dialog);
}

function closeDeleteDialog() {
  const dialog = document.getElementById('dialog-success-delete-book');
  if (dialog) {
    dialog.remove();
    fetchProducts().then(data => {
      products = data;
      renderFilteredAndSorted(currentPage);
    });
  }
}

function showAddBookSuccessDialog(action = 'add', message = '') {
  const dialog = document.createElement('div');
  dialog.id = 'dialog-success-add-book';
  dialog.style.cssText = 'position: fixed; inset: 0; z-index: 9999; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-family: \'Segoe UI\', sans-serif;';
  const title = action === 'add' ? 'Thêm truyện thành công!' : 'Cập nhật truyện thành công!';
  dialog.innerHTML = `
    <div style="background: #fff; border-radius: 12px; padding: 24px 32px; max-width: 360px; width: 100%; text-align: center;">
      <img src="https://img.icons8.com/color/48/000000/ok--v1.png" alt="ok">
      <h2 style="margin-top: 12px; font-size: 18px;">${title}</h2>
      <p style="color: #2e7d32;">${message}</p>
      <button onclick="closeAddBookDialog()" style="margin-top: 20px; padding: 8px 24px; background: #00cfff; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">OK</button>
    </div>
  `;
  document.body.appendChild(dialog);
}

function closeAddBookDialog() {
  const dialog = document.getElementById('dialog-success-add-book');
  if (dialog) dialog.remove();
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
          <button id="btn-ok-delete" style="padding: 6px 16px; background: #00cfff; color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.3s;">OK</button>
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

function updateImageIndices(preview) {
  const buttons = preview.querySelectorAll('.delete-image-btn, .edit-image-btn');
  buttons.forEach((btn, i) => {
    btn.setAttribute('data-index', i);
  });
}

function renderImagePreviews(preview, files, existingImages) {
  preview.innerHTML = '';
  const fallbackThumb = 'https://server-shelf-stacker.onrender.com/assets/images/default-thumbnail.png';

  existingImages.forEach((url, i) => {
    const div = document.createElement('div');
    div.style.cssText = 'position: relative; display: inline-block; margin: 2px;';
    div.setAttribute('data-existing', 'true');
    div.setAttribute('data-url', url);
    div.innerHTML = `
      <img src="${url}" style="max-width:100px; border:1px solid #ddd;" onerror="this.onerror=null;this.src='${fallbackThumb}'">
      <button class="delete-image-btn" data-index="${i}" style="position: absolute; top: 2px; right: 2px; background: #ff4444; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer;"><i class="fas fa-times"></i></button>
      <button class="edit-image-btn" data-index="${i}" style="position: absolute; top: 25px; right: 2px; background: #007bff; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer;"><i class="fas fa-edit"></i></button>
    `;
    preview.appendChild(div);
  });

  Array.from(files).forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const div = document.createElement('div');
      div.style.cssText = 'position: relative; display: inline-block; margin: 2px;';
      div.innerHTML = `
        <img src="${e.target.result}" style="max-width:100px; border:1px solid #ddd; border-radius: 4px;">
        <button class="delete-image-btn" data-index="${i + existingImages.length}" style="position: absolute; top: 2px; right: 2px; background: #ff4444; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer;"><i class="fas fa-times"></i></button>
        <button class="edit-image-btn" data-index="${i + existingImages.length}" style="position: absolute; top: 25px; right: 2px; background: #007bff; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer;"><i class="fas fa-edit"></i></button>
      `;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}