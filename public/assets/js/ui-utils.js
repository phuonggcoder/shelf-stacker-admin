// UI utilities and components
class UiUtils {
  static initializeDataTable(tableId, options = {}) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const defaultOptions = {
      pageSize: 10,
      pageSizes: [10, 25, 50, 100],
      searchable: true,
      sortable: true,
    };

    const settings = { ...defaultOptions, ...options };
    
    // Create table wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'datatable-wrapper';
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);

    // Add table controls
    const controls = document.createElement('div');
    controls.className = 'datatable-controls';
    wrapper.insertBefore(controls, table);

    // Add search if enabled
    if (settings.searchable) {
      const search = document.createElement('div');
      search.className = 'datatable-search';
      search.innerHTML = `
        <input type="text" placeholder="Tìm kiếm..." class="search-input">
        <i class="fas fa-search"></i>
      `;
      controls.appendChild(search);

      const searchInput = search.querySelector('input');
      searchInput.addEventListener('input', () => {
        this.filterTable(table, searchInput.value);
      });
    }

    // Add page size selector
    const pageSizeSelector = document.createElement('div');
    pageSizeSelector.className = 'datatable-pagesize';
    pageSizeSelector.innerHTML = `
      <select>
        ${settings.pageSizes.map(size => `<option value="${size}">${size}</option>`).join('')}
      </select>
      <span>dòng mỗi trang</span>
    `;
    controls.appendChild(pageSizeSelector);

    // Initialize pagination
    this.initializePagination(table, settings.pageSize);

    // Make sortable if enabled
    if (settings.sortable) {
      this.makeSortable(table);
    }
  }

  static filterTable(table, query) {
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    const regex = new RegExp(query, 'i');

    rows.forEach(row => {
      const text = Array.from(row.cells).map(cell => cell.textContent).join(' ');
      row.style.display = regex.test(text) ? '' : 'none';
    });

    this.updatePagination(table);
  }

  static initializePagination(table, pageSize) {
    table.dataset.pageSize = pageSize;
    table.dataset.currentPage = 1;

    const pager = document.createElement('div');
    pager.className = 'datatable-pager';
    table.parentNode.appendChild(pager);

    this.updatePagination(table);
  }

  static updatePagination(table) {
    const pageSize = parseInt(table.dataset.pageSize);
    const currentPage = parseInt(table.dataset.currentPage);
    const rows = Array.from(table.querySelectorAll('tbody tr')).filter(row => row.style.display !== 'none');
    const totalPages = Math.ceil(rows.length / pageSize);

    // Update row visibility
    rows.forEach((row, index) => {
      const shouldShow = Math.floor(index / pageSize) + 1 === currentPage;
      row.classList.toggle('visible', shouldShow);
    });

    // Update pager
    const pager = table.parentNode.querySelector('.datatable-pager');
    pager.innerHTML = '';

    if (totalPages > 1) {
      // Previous button
      const prev = document.createElement('button');
      prev.innerHTML = '<i class="fas fa-chevron-left"></i>';
      prev.disabled = currentPage === 1;
      prev.addEventListener('click', () => {
        if (currentPage > 1) {
          table.dataset.currentPage = currentPage - 1;
          this.updatePagination(table);
        }
      });
      pager.appendChild(prev);

      // Page numbers
      for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.classList.toggle('active', i === currentPage);
        btn.addEventListener('click', () => {
          table.dataset.currentPage = i;
          this.updatePagination(table);
        });
        pager.appendChild(btn);
      }

      // Next button
      const next = document.createElement('button');
      next.innerHTML = '<i class="fas fa-chevron-right"></i>';
      next.disabled = currentPage === totalPages;
      next.addEventListener('click', () => {
        if (currentPage < totalPages) {
          table.dataset.currentPage = currentPage + 1;
          this.updatePagination(table);
        }
      });
      pager.appendChild(next);
    }
  }

  static makeSortable(table) {
    const headers = table.querySelectorAll('th');
    headers.forEach(header => {
      if (header.dataset.sortable !== 'false') {
        header.classList.add('sortable');
        header.addEventListener('click', () => this.sortTable(table, header));
      }
    });
  }

  static sortTable(table, header) {
    const column = Array.from(header.parentNode.children).indexOf(header);
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    const isAsc = header.classList.contains('asc');

    // Reset all headers
    table.querySelectorAll('th').forEach(th => {
      th.classList.remove('asc', 'desc');
    });

    // Sort rows
    rows.sort((a, b) => {
      const aVal = a.cells[column].textContent;
      const bVal = b.cells[column].textContent;
      
      if (this.isNumeric(aVal) && this.isNumeric(bVal)) {
        return isAsc ? bVal - aVal : aVal - bVal;
      }
      return isAsc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
    });

    // Update header sort indicator
    header.classList.toggle('asc', !isAsc);
    header.classList.toggle('desc', isAsc);

    // Update table body
    const tbody = table.querySelector('tbody');
    rows.forEach(row => tbody.appendChild(row));
  }

  static isNumeric(str) {
    return !isNaN(str) && !isNaN(parseFloat(str));
  }

  static initializeForm(formId, options = {}) {
    const form = document.getElementById(formId);
    if (!form) return;

    const defaultOptions = {
      validateOnChange: true,
      submitButton: form.querySelector('[type="submit"]'),
      errorClass: 'error',
    };

    const settings = { ...defaultOptions, ...options };

    // Add validation on change if enabled
    if (settings.validateOnChange) {
      const inputs = form.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        input.addEventListener('change', () => {
          this.validateInput(input, settings.errorClass);
        });
        input.addEventListener('input', () => {
          input.classList.remove(settings.errorClass);
          const error = input.nextElementSibling;
          if (error && error.classList.contains('error-message')) {
            error.remove();
          }
        });
      });
    }

    // Handle form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (settings.submitButton) {
        settings.submitButton.disabled = true;
        settings.submitButton.classList.add('loading');
      }

      try {
        // Validate all inputs
        const isValid = Array.from(form.elements).every(input => 
          !input.hasAttribute('required') || this.validateInput(input, settings.errorClass)
        );

        if (!isValid) {
          throw new Error('Vui lòng điền đầy đủ thông tin');
        }

        // Call onSubmit handler if provided
        if (options.onSubmit) {
          const formData = new FormData(form);
          const data = Object.fromEntries(formData.entries());
          await options.onSubmit(data);
        }
      } catch (error) {
        this.showError(error.message);
      } finally {
        if (settings.submitButton) {
          settings.submitButton.disabled = false;
          settings.submitButton.classList.remove('loading');
        }
      }
    });
  }

  static validateInput(input, errorClass) {
    // Remove existing error
    const existingError = input.nextElementSibling;
    if (existingError && existingError.classList.contains('error-message')) {
      existingError.remove();
    }

    // Check validity
    const isValid = input.checkValidity();
    input.classList.toggle(errorClass, !isValid);

    if (!isValid) {
      const error = document.createElement('div');
      error.className = 'error-message';
      error.textContent = input.validationMessage || 'Trường này là bắt buộc';
      input.parentNode.insertBefore(error, input.nextSibling);
    }

    return isValid;
  }

  static showLoading(element) {
    element.classList.add('loading');
    element.disabled = true;
  }

  static hideLoading(element) {
    element.classList.remove('loading');
    element.disabled = false;
  }

  static showError(message, element = null) {
    if (element) {
      element.textContent = message;
      element.style.display = 'block';
    } else {
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = message;
        toast.className = 'toast error';
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 5000);
      }
    }
  }

  static showSuccess(message) {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = message;
      toast.className = 'toast success';
      toast.style.display = 'block';
      setTimeout(() => toast.style.display = 'none', 3000);
    }
  }

  static initializeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    // Close when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(modal);
      }
    });

    // Close when pressing Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'block') {
        this.closeModal(modal);
      }
    });

    return {
      open: () => this.openModal(modal),
      close: () => this.closeModal(modal)
    };
  }

  static openModal(modal) {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Focus first input if exists
    const firstInput = modal.querySelector('input, select, textarea');
    if (firstInput) {
      firstInput.focus();
    }
  }

  static closeModal(modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// Export for use in other files
window.UiUtils = UiUtils;