/**
 * Admin CRUD Forms
 * Pre-built forms for common CRUD operations
 */

class AdminCRUDForms {
    // ==================== Book Form ====================
    static createBookForm(bookData = null) {
        const isEdit = !!bookData;
        const fields = [
            {
                name: 'title',
                label: 'Tên sách',
                type: 'text',
                value: bookData?.title || '',
                required: true,
                placeholder: 'Nhập tên sách'
            },
            {
                name: 'author',
                label: 'Tác giả',
                type: 'text',
                value: bookData?.author || '',
                required: true,
                placeholder: 'Nhập tên tác giả'
            },
            {
                name: 'price',
                label: 'Giá',
                type: 'number',
                value: bookData?.price || '',
                required: true,
                placeholder: 'Nhập giá sách'
            },
            {
                name: 'stock',
                label: 'Tồn kho',
                type: 'number',
                value: bookData?.stock || '',
                required: true,
                placeholder: 'Nhập số lượng tồn kho'
            },
            {
                name: 'description',
                label: 'Mô tả',
                type: 'textarea',
                value: bookData?.description || '',
                rows: 5,
                placeholder: 'Nhập mô tả sách'
            },
            {
                name: 'publisher',
                label: 'Nhà xuất bản',
                type: 'text',
                value: bookData?.publisher || '',
                placeholder: 'Nhập nhà xuất bản'
            },
            {
                name: 'publication_date',
                label: 'Ngày xuất bản',
                type: 'date',
                value: bookData?.publication_date ? bookData.publication_date.split('T')[0] : ''
            },
            {
                name: 'language',
                label: 'Ngôn ngữ',
                type: 'text',
                value: bookData?.language || 'vi',
                placeholder: 'vi, en, ...'
            },
            {
                name: 'page_count',
                label: 'Số trang',
                type: 'number',
                value: bookData?.page_count || '',
                placeholder: 'Nhập số trang'
            },
            {
                name: 'weight',
                label: 'Trọng lượng (gram)',
                type: 'number',
                value: bookData?.weight || '',
                placeholder: 'Nhập trọng lượng'
            },
            {
                name: 'dimensions',
                label: 'Kích thước',
                type: 'text',
                value: bookData?.dimensions || '',
                placeholder: 'VD: 20x15x2 cm'
            },
            {
                name: 'featured',
                label: 'Sách nổi bật',
                type: 'checkbox',
                value: bookData?.featured || false
            },
            {
                name: 'thumbnail',
                label: 'Ảnh thumbnail',
                type: 'file',
                accept: 'image/*',
                value: bookData?.thumbnail || '',
                helpText: 'Upload ảnh thumbnail cho sách'
            },
            {
                name: 'cover_images',
                label: 'Ảnh bìa (có thể chọn nhiều)',
                type: 'file',
                accept: 'image/*',
                multiple: true,
                helpText: 'Upload một hoặc nhiều ảnh bìa cho sách'
            }
        ];

        // Note: This form is used by showAddBookModal and showEditBookModal
        // They handle FormData submission directly, so this onSubmit is not used
        return AdminUIComponents.createForm(fields, async (data, formElement) => {
            try {
                AdminUIComponents.showLoading('Đang lưu...');
                
                // Convert data types
                if (data.price) data.price = parseFloat(data.price);
                if (data.stock) data.stock = parseInt(data.stock);
                if (data.page_count) data.page_count = parseInt(data.page_count);
                if (data.weight) data.weight = parseFloat(data.weight);
                if (data.featured === 'true' || data.featured === true) {
                    data.featured = true;
                } else {
                    data.featured = false;
                }

                if (isEdit) {
                    await AdminServices.updateBook(bookData._id, data);
                    showToast('Cập nhật sách thành công', 'success');
                } else {
                    await AdminServices.createBook(data);
                    showToast('Tạo sách thành công', 'success');
                }
                
                // Reload page or refresh data
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } catch (error) {
                console.error('Error saving book:', error);
                showToast(error.message || 'Không thể lưu sách', 'error');
            } finally {
                AdminUIComponents.hideLoading();
            }
        });
    }

    // ==================== Category Form ====================
    static createCategoryForm(categoryData = null, parentCategories = []) {
        const isEdit = !!categoryData;
        const fields = [
            {
                name: 'name',
                label: 'Tên danh mục',
                type: 'text',
                value: categoryData?.name || '',
                required: true,
                placeholder: 'Nhập tên danh mục'
            },
            {
                name: 'slug',
                label: 'Slug',
                type: 'text',
                value: categoryData?.slug || '',
                placeholder: 'Tự động tạo từ tên (để trống)',
                helpText: 'Slug sẽ được tạo tự động từ tên nếu để trống'
            },
            {
                name: 'description',
                label: 'Mô tả',
                type: 'textarea',
                value: categoryData?.description || '',
                rows: 4,
                placeholder: 'Nhập mô tả danh mục'
            },
            {
                name: 'categoryBook_id',
                label: 'Danh mục cha',
                type: 'select',
                value: categoryData?.categoryBook_id || categoryData?.parent_id || '',
                options: [
                    { value: '', label: 'Không có (Danh mục gốc)' },
                    ...parentCategories.map(cat => ({
                        value: cat._id,
                        label: cat.name
                    }))
                ]
            },
            {
                name: 'isVisible',
                label: 'Hiển thị',
                type: 'checkbox',
                value: categoryData?.isVisible !== false
            },
            {
                name: 'image',
                label: 'Ảnh danh mục',
                type: 'file',
                accept: 'image/*',
                helpText: 'Upload ảnh cho danh mục'
            }
        ];

        return AdminUIComponents.createForm(fields, async (data) => {
            try {
                AdminUIComponents.showLoading('Đang lưu...');
                
                if (!data.categoryBook_id) delete data.categoryBook_id;
                data.isVisible = data.isVisible === 'true' || data.isVisible === true;

                if (isEdit) {
                    await AdminServices.updateCategory(categoryData._id, data);
                    showToast('Cập nhật danh mục thành công', 'success');
                } else {
                    await AdminServices.createCategory(data);
                    showToast('Tạo danh mục thành công', 'success');
                }
                
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } catch (error) {
                console.error('Error saving category:', error);
                showToast(error.message || 'Không thể lưu danh mục', 'error');
            } finally {
                AdminUIComponents.hideLoading();
            }
        });
    }

    // ==================== Voucher Form ====================
    static createVoucherForm(voucherData = null) {
        const isEdit = !!voucherData;
        const voucherType = voucherData?.voucher_type || 'discount';
        
        const baseFields = [
            {
                name: 'voucher_id',
                label: 'Mã voucher',
                type: 'text',
                value: voucherData?.voucher_id || '',
                required: true,
                placeholder: 'VD: SUMMER2023',
                helpText: 'Mã voucher phải là duy nhất'
            },
            {
                name: 'voucher_type',
                label: 'Loại voucher',
                type: 'select',
                value: voucherType,
                required: true,
                options: [
                    { value: 'discount', label: 'Giảm giá' },
                    { value: 'shipping', label: 'Miễn phí ship' }
                ]
            },
            {
                name: 'min_order_value',
                label: 'Đơn tối thiểu',
                type: 'number',
                value: voucherData?.min_order_value || '',
                required: true,
                placeholder: 'Giá trị đơn hàng tối thiểu'
            },
            {
                name: 'usage_limit',
                label: 'Giới hạn sử dụng',
                type: 'number',
                value: voucherData?.usage_limit || '',
                placeholder: 'Để trống = không giới hạn'
            },
            {
                name: 'max_per_user',
                label: 'Số lần dùng tối đa/người',
                type: 'number',
                value: voucherData?.max_per_user || 1,
                required: true
            },
            {
                name: 'start_date',
                label: 'Ngày bắt đầu',
                type: 'datetime-local',
                value: voucherData?.start_date ? new Date(voucherData.start_date).toISOString().slice(0, 16) : '',
                required: true
            },
            {
                name: 'end_date',
                label: 'Ngày kết thúc',
                type: 'datetime-local',
                value: voucherData?.end_date ? new Date(voucherData.end_date).toISOString().slice(0, 16) : '',
                required: true
            },
            {
                name: 'description',
                label: 'Mô tả',
                type: 'textarea',
                value: voucherData?.description || '',
                rows: 3
            }
        ];

        // Add discount-specific fields
        if (voucherType === 'discount') {
            baseFields.splice(2, 0, 
                {
                    name: 'discount_type',
                    label: 'Loại giảm giá',
                    type: 'select',
                    value: voucherData?.discount_type || 'fixed',
                    required: true,
                    options: [
                        { value: 'fixed', label: 'Giảm số tiền cố định' },
                        { value: 'percentage', label: 'Giảm theo phần trăm' }
                    ]
                },
                {
                    name: 'discount_value',
                    label: 'Giá trị giảm',
                    type: 'number',
                    value: voucherData?.discount_value || '',
                    required: true,
                    placeholder: voucherData?.discount_type === 'percentage' ? 'VD: 10 (10%)' : 'VD: 50000 (50,000₫)'
                },
                {
                    name: 'max_discount_value',
                    label: 'Giảm tối đa (cho % giảm)',
                    type: 'number',
                    value: voucherData?.max_discount_value || '',
                    placeholder: 'Chỉ áp dụng khi giảm theo %'
                }
            );
        } else {
            // Shipping voucher
            baseFields.splice(2, 0, {
                name: 'shipping_discount',
                label: 'Giá trị miễn phí ship',
                type: 'number',
                value: voucherData?.shipping_discount || '',
                required: true,
                placeholder: 'VD: 30000 (30,000₫)'
            });
        }

        return AdminUIComponents.createForm(baseFields, async (data) => {
            try {
                AdminUIComponents.showLoading('Đang lưu...');
                
                // Convert data types
                if (data.min_order_value) data.min_order_value = parseFloat(data.min_order_value);
                if (data.usage_limit) data.usage_limit = parseInt(data.usage_limit);
                if (data.max_per_user) data.max_per_user = parseInt(data.max_per_user);
                
                if (data.voucher_type === 'discount') {
                    if (data.discount_value) data.discount_value = parseFloat(data.discount_value);
                    if (data.max_discount_value) data.max_discount_value = parseFloat(data.max_discount_value);
                } else {
                    if (data.shipping_discount) data.shipping_discount = parseFloat(data.shipping_discount);
                }

                // Convert datetime to ISO
                if (data.start_date) {
                    data.start_date = new Date(data.start_date).toISOString();
                }
                if (data.end_date) {
                    data.end_date = new Date(data.end_date).toISOString();
                }

                if (isEdit) {
                    await AdminServices.updateVoucher(voucherData._id, data);
                    showToast('Cập nhật voucher thành công', 'success');
                } else {
                    await AdminServices.createVoucher(data);
                    showToast('Tạo voucher thành công', 'success');
                }
                
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } catch (error) {
                console.error('Error saving voucher:', error);
                showToast(error.message || 'Không thể lưu voucher', 'error');
            } finally {
                AdminUIComponents.hideLoading();
            }
        });
    }

    // ==================== User Form ====================
    static createUserForm(userData = null) {
        const isEdit = !!userData;
        const fields = [
            {
                name: 'email',
                label: 'Email',
                type: 'email',
                value: userData?.email || '',
                required: true,
                placeholder: 'user@example.com',
                disabled: isEdit
            },
            {
                name: 'username',
                label: 'Tên đăng nhập',
                type: 'text',
                value: userData?.username || '',
                placeholder: 'Tên đăng nhập (tùy chọn)'
            },
            {
                name: 'full_name',
                label: 'Họ và tên',
                type: 'text',
                value: userData?.full_name || '',
                required: true,
                placeholder: 'Nhập họ và tên'
            },
            {
                name: 'phone_number',
                label: 'Số điện thoại',
                type: 'tel',
                value: userData?.phone_number || '',
                placeholder: 'Nhập số điện thoại'
            },
            ...(isEdit ? [] : [{
                name: 'password',
                label: 'Mật khẩu',
                type: 'password',
                value: '',
                required: true,
                placeholder: 'Nhập mật khẩu'
            }]),
            {
                name: 'roles',
                label: 'Vai trò',
                type: 'select',
                value: userData?.roles?.[0] || 'user',
                required: true,
                options: [
                    { value: 'user', label: 'Người dùng' },
                    { value: 'shipper', label: 'Shipper' },
                    { value: 'admin', label: 'Admin' }
                ]
            }
        ];

        return AdminUIComponents.createForm(fields, async (data) => {
            try {
                AdminUIComponents.showLoading('Đang lưu...');
                
                // Convert roles to array
                data.roles = [data.roles];
                
                if (isEdit) {
                    // Update user (would need update endpoint)
                    showToast('Tính năng cập nhật người dùng đang được phát triển', 'info');
                } else {
                    await AdminServices.createUser(data);
                    showToast('Tạo người dùng thành công', 'success');
                }
                
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } catch (error) {
                console.error('Error saving user:', error);
                showToast(error.message || 'Không thể lưu người dùng', 'error');
            } finally {
                AdminUIComponents.hideLoading();
            }
        });
    }
}

// Export
window.AdminCRUDForms = AdminCRUDForms;

