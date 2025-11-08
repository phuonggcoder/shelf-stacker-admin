// Voucher Management JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let currentPage = 1;
    let pageSize = 10;
    let totalPages = 1;
    let currentFilters = {
        status: '',
        type: '',
        startDate: '',
        endDate: '',
        sort: 'created_desc'
    };

    // Initialize UI elements
    const statusFilter = document.getElementById('statusFilter');
    const typeFilter = document.getElementById('typeFilter');
    const startDateFilter = document.getElementById('startDate');
    const endDateFilter = document.getElementById('endDate');
    const sortByFilter = document.getElementById('sortBy');
    const voucherTable = document.getElementById('voucherTable');
    const createVoucherBtn = document.getElementById('createVoucherBtn');
    const voucherForm = document.getElementById('voucherForm');
    const saveVoucherBtn = document.getElementById('saveVoucherBtn');
    const voucherModal = new bootstrap.Modal(document.getElementById('voucherModal'));

    // Initialize event listeners
    [statusFilter, typeFilter, startDateFilter, endDateFilter, sortByFilter].forEach(filter => {
        filter.addEventListener('change', () => {
            currentPage = 1;
            loadVouchers();
        });
    });

    createVoucherBtn.addEventListener('click', () => {
        resetVoucherForm();
        voucherModal.show();
    });

    saveVoucherBtn.addEventListener('click', handleVoucherSave);

    // Handle dynamic form fields
    document.getElementById('voucher_type').addEventListener('change', updateFormFields);
    document.getElementById('discount_type').addEventListener('change', updateDiscountFields);
    
    // Form validation and preview
    const formInputs = voucherForm.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        input.addEventListener('input', () => {
            validateForm();
            updateVoucherPreview();
        });
    });

    // Load initial data
    loadVouchers();
    loadVoucherStats();

    // Functions
    async function loadVouchers() {
        try {
            UI.showLoading(voucherTable);
            
            const params = {
                page: currentPage,
                limit: pageSize,
                status: statusFilter.value,
                type: typeFilter.value,
                start_date: startDateFilter.value,
                end_date: endDateFilter.value,
                sort: sortByFilter.value
            };

            const response = await ApiClient.getVouchers(params);
            renderVoucherTable(response.vouchers);
            updatePagination(response.total, response.pages);
            
            UI.hideLoading(voucherTable);
        } catch (error) {
            UI.showError('Không thể tải danh sách voucher: ' + error.message);
            UI.hideLoading(voucherTable);
        }
    }

    async function loadVoucherStats() {
        try {
            const stats = await ApiClient.getVoucherStats({
                start_date: startDateFilter.value,
                end_date: endDateFilter.value
            });

            document.getElementById('activeVouchers').querySelector('.h2').textContent = stats.active_count;
            document.getElementById('totalUsage').querySelector('.h2').textContent = stats.total_uses;
            document.getElementById('totalDiscount').querySelector('.h2').textContent = 
                new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
                    .format(stats.total_discount_amount);
        } catch (error) {
            UI.showError('Không thể tải thống kê voucher: ' + error.message);
        }
    }

    function renderVoucherTable(vouchers) {
        const tbody = voucherTable.querySelector('tbody');
        tbody.innerHTML = '';

        vouchers.forEach(voucher => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${voucher.voucher_id}</strong><br><small>${voucher.description || ''}</small></td>
                <td>
                    <span class="discount-type">
                        ${voucher.voucher_type === 'shipping' ? 'Giảm vận chuyển' : 'Giảm giá'}
                    </span>
                </td>
                <td>
                    ${formatDiscountValue(voucher)}
                    ${voucher.max_discount_value ? `<br><small>Tối đa: ${formatCurrency(voucher.max_discount_value)}</small>` : ''}
                </td>
                <td>
                    ${formatDate(voucher.start_date)}<br>
                    <small>đến ${formatDate(voucher.end_date)}</small>
                </td>
                <td>
                    ${voucher.uses_count || 0}/${voucher.max_uses || '∞'}<br>
                    <small>${formatCurrency(voucher.total_discount_amount || 0)}</small>
                </td>
                <td><span class="status-badge status-${getVoucherStatus(voucher)}">${formatStatus(voucher)}</span></td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-outline-primary" onclick="editVoucher('${voucher._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${getActionButton(voucher)}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function updatePagination(total, pages) {
        totalPages = pages;
        const pagination = document.getElementById('voucherPagination');
        
        const startItem = (currentPage - 1) * pageSize + 1;
        const endItem = Math.min(currentPage * pageSize, total);
        
        pagination.innerHTML = `
            <div>
                Hiển thị ${startItem}-${endItem} trên ${total} voucher
            </div>
            <div class="btn-group">
                <button class="btn btn-outline-primary" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="btn btn-outline-primary" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    }

    function updateFormFields() {
        const voucherType = document.getElementById('voucher_type').value;
        const discountFields = document.querySelector('.discount-fields');
        const maxDiscountField = document.getElementById('max_discount_value');
        
        if (voucherType === 'shipping') {
            discountFields.style.display = 'none';
            maxDiscountField.parentElement.style.display = 'none';
        } else {
            discountFields.style.display = 'block';
            maxDiscountField.parentElement.style.display = 'block';
            updateDiscountFields();
        }
    }

    function updateDiscountFields() {
        const discountType = document.getElementById('discount_type').value;
        const discountValue = document.getElementById('discount_value');
        const maxDiscountValue = document.getElementById('max_discount_value');
        
        if (discountType === 'percentage') {
            discountValue.max = '100';
            maxDiscountValue.parentElement.style.display = 'block';
        } else {
            discountValue.removeAttribute('max');
            maxDiscountValue.parentElement.style.display = 'none';
        }
    }

    function validateForm() {
        const form = document.getElementById('voucherForm');
        const saveBtn = document.getElementById('saveVoucherBtn');
        
        // Basic validation
        const isValid = form.checkValidity();
        saveBtn.disabled = !isValid;

        // Custom validations
        const voucherId = document.getElementById('voucher_id');
        const startDate = document.getElementById('start_date');
        const endDate = document.getElementById('end_date');
        const discountValue = document.getElementById('discount_value');
        const maxDiscountValue = document.getElementById('max_discount_value');

        // Voucher ID format
        if (!/^[A-Z0-9]+$/.test(voucherId.value)) {
            voucherId.setCustomValidity('Mã voucher chỉ được chứa chữ in hoa và số');
        } else {
            voucherId.setCustomValidity('');
        }

        // Date validation
        if (startDate.value && endDate.value) {
            if (new Date(startDate.value) >= new Date(endDate.value)) {
                endDate.setCustomValidity('Ngày kết thúc phải sau ngày bắt đầu');
            } else {
                endDate.setCustomValidity('');
            }
        }

        // Discount value validation
        const discountType = document.getElementById('discount_type').value;
        if (discountType === 'percentage' && discountValue.value > 100) {
            discountValue.setCustomValidity('Giảm giá theo % không được vượt quá 100%');
        } else {
            discountValue.setCustomValidity('');
        }

        // Max discount validation
        if (maxDiscountValue.value && parseInt(maxDiscountValue.value) < parseInt(discountValue.value)) {
            maxDiscountValue.setCustomValidity('Giảm giá tối đa phải lớn hơn hoặc bằng giá trị giảm');
        } else {
            maxDiscountValue.setCustomValidity('');
        }
    }

    function updateVoucherPreview() {
        const formData = new FormData(voucherForm);
        const preview = document.getElementById('previewContent');
        
        const voucherType = formData.get('voucher_type');
        const discountType = formData.get('discount_type');
        const discountValue = formData.get('discount_value');
        const maxDiscountValue = formData.get('max_discount_value');
        const minOrderValue = formData.get('min_order_value');

        let discountText = '';
        if (voucherType === 'shipping') {
            discountText = `Giảm ${formatCurrency(discountValue)} phí vận chuyển`;
        } else {
            if (discountType === 'percentage') {
                discountText = `Giảm ${discountValue}% `;
                if (maxDiscountValue) {
                    discountText += `(tối đa ${formatCurrency(maxDiscountValue)})`;
                }
            } else {
                discountText = `Giảm ${formatCurrency(discountValue)}`;
            }
        }

        preview.innerHTML = `
            <div class="preview-voucher p-2 border rounded">
                <div class="h5 mb-2">${formData.get('voucher_id')}</div>
                <div>${discountText}</div>
                <div class="text-muted">
                    Đơn tối thiểu: ${formatCurrency(minOrderValue)}<br>
                    ${formData.get('start_date')} - ${formData.get('end_date')}
                </div>
            </div>
        `;
    }

    async function handleVoucherSave() {
        try {
            UI.showLoading(saveVoucherBtn);
            
            const formData = new FormData(voucherForm);
            const voucherData = {};
            
            formData.forEach((value, key) => {
                if (value) voucherData[key] = value;
            });

            // Convert numeric fields
            ['discount_value', 'max_discount_value', 'min_order_value', 'max_uses', 'max_uses_per_user']
                .forEach(field => {
                    if (voucherData[field]) {
                        voucherData[field] = Number(voucherData[field]);
                    }
                });

            const voucherId = document.getElementById('voucherForm').dataset.voucherId;
            let response;
            
            if (voucherId) {
                response = await ApiClient.updateVoucher(voucherId, voucherData);
            } else {
                response = await ApiClient.createVoucher(voucherData);
            }

            voucherModal.hide();
            await loadVouchers();
            await loadVoucherStats();
            
            UI.showSuccess(`Voucher đã được ${voucherId ? 'cập nhật' : 'tạo'} thành công`);
        } catch (error) {
            UI.showError(error.message);
        } finally {
            UI.hideLoading(saveVoucherBtn);
        }
    }

    // Utility functions
    function resetVoucherForm() {
        voucherForm.reset();
        voucherForm.dataset.voucherId = '';
        document.getElementById('voucherModalTitle').textContent = 'Tạo Voucher Mới';
        updateFormFields();
        updateVoucherPreview();
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
            .format(amount);
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatDiscountValue(voucher) {
        if (voucher.voucher_type === 'shipping') {
            return formatCurrency(voucher.shipping_discount);
        }
        return voucher.discount_type === 'percentage' 
            ? `${voucher.discount_value}%`
            : formatCurrency(voucher.discount_value);
    }

    function getVoucherStatus(voucher) {
        const now = new Date();
        const startDate = new Date(voucher.start_date);
        const endDate = new Date(voucher.end_date);

        if (voucher.is_deleted) return 'deleted';
        if (now < startDate) return 'pending';
        if (now > endDate) return 'expired';
        if (voucher.max_uses && voucher.uses_count >= voucher.max_uses) return 'expired';
        return 'active';
    }

    function formatStatus(voucher) {
        const statusMap = {
            active: 'Đang hoạt động',
            expired: 'Đã hết hạn',
            pending: 'Chưa bắt đầu',
            deleted: 'Đã xóa'
        };
        return statusMap[getVoucherStatus(voucher)];
    }

    function getActionButton(voucher) {
        const status = getVoucherStatus(voucher);
        if (status === 'deleted') {
            return `
                <button class="btn btn-sm btn-outline-success" onclick="restoreVoucher('${voucher._id}')">
                    <i class="fas fa-undo"></i>
                </button>
            `;
        }
        return `
            <button class="btn btn-sm btn-outline-danger" onclick="deleteVoucher('${voucher._id}')">
                <i class="fas fa-trash"></i>
            </button>
        `;
    }

    // Global functions
    window.changePage = function(page) {
        if (page > 0 && page <= totalPages) {
            currentPage = page;
            loadVouchers();
        }
    };

    window.editVoucher = async function(id) {
        try {
            UI.showLoading(createVoucherBtn);
            const voucher = await ApiClient.getVoucherById(id);
            
            voucherForm.dataset.voucherId = id;
            document.getElementById('voucherModalTitle').textContent = 'Chỉnh Sửa Voucher';
            
            Object.entries(voucher).forEach(([key, value]) => {
                const input = document.getElementById(key);
                if (input) {
                    if (key.includes('date')) {
                        input.value = new Date(value).toISOString().slice(0, 16);
                    } else {
                        input.value = value;
                    }
                }
            });

            updateFormFields();
            updateVoucherPreview();
            voucherModal.show();
        } catch (error) {
            UI.showError(error.message);
        } finally {
            UI.hideLoading(createVoucherBtn);
        }
    };

    window.deleteVoucher = async function(id) {
        if (confirm('Bạn có chắc muốn xóa voucher này?')) {
            try {
                await ApiClient.archiveVoucher(id);
                await loadVouchers();
                await loadVoucherStats();
                UI.showSuccess('Voucher đã được xóa');
            } catch (error) {
                UI.showError(error.message);
            }
        }
    };

    window.restoreVoucher = async function(id) {
        try {
            await ApiClient.restoreVoucher(id);
            await loadVouchers();
            await loadVoucherStats();
            UI.showSuccess('Voucher đã được khôi phục');
        } catch (error) {
            UI.showError(error.message);
        }
    };
});