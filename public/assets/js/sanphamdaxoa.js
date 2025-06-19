
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

    async function fetchTrashBooks() {
      const trashGrid = document.getElementById('trashGrid');
      trashGrid.innerHTML = '<p>Đang tải...</p>';
      try {
        const res = await fetch('https://server-shelf-stacker.onrender.com/api/books/trash/all');
        if (!res.ok) {
          trashGrid.innerHTML = '<p>Lỗi tải dữ liệu!</p>';
          return;
        }
        const books = await res.json();
        renderTrashBooks(books);
      } catch (err) {
        trashGrid.innerHTML = '<p>Lỗi kết nối server!</p>';
      }
    }

    function renderTrashBooks(books) {
      const trashGrid = document.getElementById('trashGrid');
      trashGrid.innerHTML = '';
      if (!books || !Array.isArray(books) || books.length === 0) {
        trashGrid.innerHTML = '<p>Không có sách đã xóa gần đây.</p>';
        return;
      }
      books.forEach((book, idx) => {
        let imagesHtml = '';
        if (book.cover_image && Array.isArray(book.cover_image) && book.cover_image.length) {
          imagesHtml = book.cover_image.map(img => `<img src="${img}" alt="Ảnh sách" style="max-width:80px; margin:2px;">`).join('');
        }
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
          ${imagesHtml}
          <div class="info">
            <h3>${book.title || ''}</h3>
            <p><b>Tác giả:</b> ${book.author || ''}</p>
            <p><b>Giá:</b> ${book.price ? book.price + '₫' : ''}</p>
            <div class="desc-wrap">${renderDesc(book.description, idx)}</div>
            <span>
              <b>Danh mục:</b> ${(book.categories && book.categories.length > 0) ? book.categories.map(c=>c.name || c).join(', ') : ''}
            </span>
            <br>
            <span>
              <b>Số lượng:</b> ${book.stock || ''}
            </span>
            <br>
            <span>
              <b>Ngày xuất bản:</b> ${book.publication_date ? new Date(book.publication_date).toLocaleDateString() : ''}
            </span>
            <br>
            <span>
              <b>Nhà xuất bản:</b> ${book.publisher || ''}
            </span>
            <br>
            <span>
              <b>Ngôn ngữ:</b> ${book.language || ''}
            </span>
            <br>
            <button class="restore-btn" data-id="${book._id}"><i class="fa fa-undo"></i> Khôi phục</button>
            <button class="force-delete-btn" data-id="${book._id}" style="background:#dc3545; color:#fff; border:none; border-radius:5px; padding:8px 14px; font-size:15px; cursor:pointer; margin-top:8px; transition: background 0.2s;">
              <i class="fa fa-trash"></i> XÓA CỨNG
            </button>
          </div>
        `;
        trashGrid.appendChild(card);
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

      // Sự kiện khôi phục
      document.querySelectorAll('.restore-btn').forEach(btn => {
        btn.onclick = async function() {
          const id = this.getAttribute('data-id');
          if (!confirm('Khôi phục sách này?')) return;
          try {
            const res = await fetch(`https://server-shelf-stacker.onrender.com/api/books/${id}/restore`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' }
            });
            if (!res.ok) {
              alert('Khôi phục thất bại!');
              return;
            }
            alert('Đã khôi phục!');
            fetchTrashBooks(); // hoặc reload lại danh sách
          } catch (err) {
            alert('Lỗi kết nối!');
          }
        };
      });

      // Sự kiện xóa vĩnh viễn
      document.querySelectorAll('.force-delete-btn').forEach(btn => {
        btn.onclick = async function() {
          const id = this.getAttribute('data-id');
          if (!confirm('Bạn có chắc muốn xóa vĩnh viễn sách này?')) return;
          try {
            const res = await fetch(`https://server-shelf-stacker.onrender.com/api/books/${id}/force`, {
              method: 'DELETE'
            });
            if (!res.ok) {
              alert('Xóa cứng thất bại!');
              return;
            }
            alert('Đã xóa vĩnh viễn!');
            fetchTrashBooks(); // Reload lại danh sách đã xóa gần đây
          } catch (err) {
            alert('Lỗi kết nối!');
          }
        };
      });
    }

    // Tải danh sách khi vào trang
    document.addEventListener('DOMContentLoaded', fetchTrashBooks);
