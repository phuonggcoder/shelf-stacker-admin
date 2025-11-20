/**
 * Admin UI Components
 * Reusable modal, form, and UI components for CRUD operations
 */

class AdminUIComponents {
    // ==================== Modal Component ====================
    static createModal(options = {}) {
        const {
            title = 'Modal',
            content = '',
            size = 'medium', // small, medium, large, xlarge
            showFooter = true,
            buttons = [],
            onClose = null,
            closable = true
        } = options;

        const modal = document.createElement('div');
        modal.className = 'admin-modal-overlay';
        modal.innerHTML = `
            <div class="admin-modal admin-modal-${size}">
                <div class="admin-modal-header">
                    <h3 class="admin-modal-title">${title}</h3>
                    ${closable ? '<button class="admin-modal-close" onclick="this.closest(\'.admin-modal-overlay\').remove()"><i class="fas fa-times"></i></button>' : ''}
                </div>
                <div class="admin-modal-body">
                    ${content}
                </div>
                ${showFooter ? `
                    <div class="admin-modal-footer">
                        ${buttons.map((btn, idx) => `
                            <button class="btn ${btn.class || 'btn-secondary'}" 
                                    ${btn.onClick ? `onclick="${btn.onClick}"` : ''}
                                    data-btn-index="${idx}">
                                ${btn.icon ? `<i class="${btn.icon}"></i> ` : ''}${btn.text}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        document.body.appendChild(modal);

        // Close on overlay click
        if (closable) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                    if (onClose) onClose();
                }
            });
        }

        // Close on ESC key
        const escHandler = (e) => {
            if (e.key === 'Escape' && closable) {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
                if (onClose) onClose();
            }
        };
        document.addEventListener('keydown', escHandler);

        return modal;
    }

    // ==================== Form Component ====================
    static createForm(fields = [], onSubmit = null) {
        const form = document.createElement('form');
        form.className = 'admin-form';
        form.innerHTML = fields.map(field => {
            const { name, label, type = 'text', value = '', placeholder = '', required = false, options = [], rows = 3 } = field;
            
            let inputHTML = '';
            
            switch (type) {
                case 'textarea':
                    inputHTML = `<textarea name="${name}" class="form-textarea" placeholder="${placeholder}" ${required ? 'required' : ''} rows="${rows}">${value}</textarea>`;
                    break;
                case 'select':
                    inputHTML = `
                        <select name="${name}" class="form-select" ${required ? 'required' : ''}>
                            <option value="">Chọn ${label}</option>
                            ${options.map(opt => `
                                <option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>${opt.label}</option>
                            `).join('')}
                        </select>
                    `;
                    break;
                case 'checkbox':
                    inputHTML = `
                        <label class="form-checkbox">
                            <input type="checkbox" name="${name}" ${value ? 'checked' : ''}>
                            <span>${placeholder || label}</span>
                        </label>
                    `;
                    break;
                case 'file':
                    inputHTML = `
                        <input type="file" name="${name}" class="form-input"
                               ${required ? 'required' : ''}
                               accept="${field.accept || '*/*'}"
                               ${field.multiple ? 'multiple' : ''}>
                        ${value ? `<div class="form-file-preview"><img src="${value}" alt="Preview" style="max-width: 200px; margin-top: 0.5rem;"></div>` : ''}
                    `;
                    break;
                case 'date':
                case 'datetime-local':
                    inputHTML = `<input type="${type}" name="${name}" class="form-input" value="${value}" ${required ? 'required' : ''}>`;
                    break;
                default:
                    inputHTML = `<input type="${type}" name="${name}" class="form-input" value="${value}" placeholder="${placeholder}" ${required ? 'required' : ''}>`;
            }

            return `
                <div class="form-group">
                    ${type !== 'checkbox' ? `<label class="form-label">${label} ${required ? '<span style="color: red;">*</span>' : ''}</label>` : ''}
                    ${inputHTML}
                    ${field.helpText ? `<small class="form-help-text">${field.helpText}</small>` : ''}
                </div>
            `;
        }).join('');

        if (onSubmit) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const data = {};
                
                // Convert FormData to object
                for (let [key, value] of formData.entries()) {
                    if (data[key]) {
                        // Handle multiple values (e.g., checkboxes)
                        if (Array.isArray(data[key])) {
                            data[key].push(value);
                        } else {
                            data[key] = [data[key], value];
                        }
                    } else {
                        data[key] = value;
                    }
                }

                // Handle checkboxes
                form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    data[cb.name] = cb.checked;
                });

                await onSubmit(data, form);
            });
        }

        return form;
    }

    // ==================== Confirm Dialog ====================
    static confirm(options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Xác nhận',
                message = 'Bạn có chắc chắn muốn thực hiện hành động này?',
                confirmText = 'Xác nhận',
                cancelText = 'Hủy',
                confirmClass = 'btn-danger',
                icon = 'fas fa-exclamation-triangle'
            } = options;

            let resolved = false;
            const resolveOnce = (value) => {
                if (!resolved) {
                    resolved = true;
                    resolve(value);
                }
            };

            const modal = this.createModal({
                title,
                size: 'small',
                content: `
                    <div style="text-align: center; padding: 1rem;">
                        <i class="${icon}" style="font-size: 3rem; color: #f59e0b; margin-bottom: 1rem;"></i>
                        <p style="font-size: 1rem; color: #374151;">${message}</p>
                    </div>
                `,
                buttons: [
                    {
                        text: cancelText,
                        class: 'btn-secondary'
                        // No onClick - attach handler manually
                    },
                    {
                        text: confirmText,
                        class: confirmClass
                        // No onClick - attach handler manually
                    }
                ],
                onClose: () => {
                    // If closed without clicking buttons, resolve as false
                    if (!resolved) {
                        resolveOnce(false);
                    }
                }
            });

            // Attach handlers manually
            const modalFooter = modal.querySelector('.admin-modal-footer');
            if (modalFooter) {
                const cancelBtn = modalFooter.querySelector('.btn-secondary');
                const confirmBtn = modalFooter.querySelector('.' + confirmClass);

                if (cancelBtn) {
                    cancelBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        resolveOnce(false);
                        modal.remove();
                    });
                }

                if (confirmBtn) {
                    confirmBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        resolveOnce(true);
                        modal.remove();
                    });
                }
            }
        });
    }

    // ==================== Alert/Toast ====================
    static alert(message, type = 'info') {
        const modal = this.createModal({
            title: type === 'error' ? 'Lỗi' : type === 'success' ? 'Thành công' : 'Thông báo',
            size: 'small',
            content: `
                <div style="text-align: center; padding: 1rem;">
                    <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}" 
                       style="font-size: 3rem; color: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'}; margin-bottom: 1rem;"></i>
                    <p style="font-size: 1rem; color: #374151;">${message}</p>
                </div>
            `,
            buttons: [{
                text: 'Đóng',
                class: 'btn-primary',
                onClick: 'this.closest(\'.admin-modal-overlay\').remove();'
            }]
        });
    }

    // ==================== Loading Spinner ====================
    static showLoading(message = 'Đang xử lý...') {
        const overlay = document.createElement('div');
        overlay.className = 'admin-loading-overlay';
        overlay.id = 'adminLoadingOverlay';
        overlay.innerHTML = `
            <div class="admin-loading-spinner">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    static hideLoading() {
        const overlay = document.getElementById('adminLoadingOverlay');
        if (overlay) overlay.remove();
    }

    // ==================== Data Table ====================
    static createTable(data = [], columns = [], options = {}) {
        const {
            id = 'dataTable',
            pagination = true,
            pageSize = 10,
            searchable = true
        } = options;

        const table = document.createElement('div');
        table.className = 'admin-data-table';
        table.id = id;

        let html = '';
        
        if (searchable) {
            html += `
                <div class="table-search" style="margin-bottom: 1rem;">
                    <input type="text" class="form-input" placeholder="Tìm kiếm..." id="${id}Search">
                </div>
            `;
        }

        html += `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            ${columns.map(col => `<th>${col.label}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody id="${id}Body">
                        ${this.renderTableRows(data, columns)}
                    </tbody>
                </table>
            </div>
        `;

        if (pagination) {
            html += `
                <div class="table-pagination">
                    <div class="pagination-info">Hiển thị 1-${Math.min(pageSize, data.length)} của ${data.length}</div>
                    <div class="pagination-controls">
                        <button class="btn btn-sm btn-secondary" disabled>Trước</button>
                        <span>Trang 1 / 1</span>
                        <button class="btn btn-sm btn-secondary" disabled>Sau</button>
                    </div>
                </div>
            `;
        }

        table.innerHTML = html;
        return table;
    }

    static renderTableRows(data, columns) {
        if (data.length === 0) {
            return `<tr><td colspan="${columns.length}" style="text-align: center; padding: 3rem;">Không có dữ liệu</td></tr>`;
        }

        return data.map(row => `
            <tr>
                ${columns.map(col => {
                    const value = col.render ? col.render(row) : (row[col.key] || '');
                    return `<td>${value}</td>`;
                }).join('')}
            </tr>
        `).join('');
    }
}

// Export
window.AdminUIComponents = AdminUIComponents;



