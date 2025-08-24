/**
 * Notification Admin System
 * Quản lý template, gửi thông báo và theo dõi lịch sử
 */

class NotificationAdmin {
    constructor() {
        this.authToken = this.getAuthToken();
        this.templates = [];
        this.users = [];
        this.selectedUsers = new Set();
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.historyPage = 1;
        this.historyItemsPerPage = 10;

        this.init();
    }

    init() {
        // Initialize event listeners
        document.getElementById('notificationTabs').addEventListener('shown.bs.tab', (event) => {
            if (event.target.id === 'templates-tab') {
                this.loadTemplates();
            } else if (event.target.id === 'send-tab') {
                this.loadTemplates(); // Reload templates for send form
                this.loadUsers(); // Load users for single/multicast
                this.handleSendTypeChange(); // Initialize send type UI
            } else if (event.target.id === 'history-tab') {
                this.loadHistory();
            }
        });

        document.getElementById('sendType').addEventListener('change', this.handleSendTypeChange.bind(this));
        document.getElementById('templateSelect').addEventListener('change', this.handleTemplateSelectChange.bind(this));
        document.getElementById('fileInput').addEventListener('change', this.handleFileInputChange.bind(this));
        document.getElementById('sendNotificationForm').addEventListener('submit', this.sendNotification.bind(this));
        document.getElementById('selectAllUsers').addEventListener('change', (event) => {
            document.querySelectorAll('#usersTableBody input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = event.target.checked;
                const userId = checkbox.dataset.userId;
                if (event.target.checked) {
                    this.selectedUsers.add(userId);
                } else {
                    this.selectedUsers.delete(userId);
                }
            });
        });

        // Initial loads
        this.loadStats();
        this.loadTemplates();
        this.loadUsers();
    }

    getAuthToken() {
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    }

    showNotification(message, type = 'success') {
        // Placeholder for a notification display mechanism (e.g., toast, alert)
        console.log(`Notification (${type}): ${message}`);
        alert(message); // For demonstration
    }

    async fetchData(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`,
                    ...options.headers,
                },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            this.showNotification(`Error: ${error.message}`, 'danger');
            console.error('Fetch error:', error);
            throw error;
        }
    }

    async loadStats() {
        try {
            const stats = await this.fetchData('/api/notifications/stats');
            document.getElementById('totalTemplates').textContent = stats.totalTemplates;
            document.getElementById('totalSent').textContent = stats.totalSent;
            document.getElementById('pendingCount').textContent = stats.pendingCount;
            document.getElementById('failedCount').textContent = stats.failedCount;
        } catch (error) {
            this.showNotification('Lỗi khi tải thống kê.', 'danger');
        }
    }

    async loadTemplates() {
        try {
            const data = await this.fetchData('/api/notifications/templates');
            this.templates = data.templates;
            const tbody = document.getElementById('templatesTableBody');
            tbody.innerHTML = '';
            const templateSelect = document.getElementById('templateSelect');
            templateSelect.innerHTML = '<option value="">Chọn template...</option>';

            this.templates.forEach(template => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${template._id}</td>
                    <td>${template.name}</td>
                    <td>${template.type}</td>
                    <td>
                        <span class="badge bg-${template.isActive ? 'success' : 'secondary'}">
                            ${template.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td>${new Date(template.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-info me-2" onclick="notificationAdmin.editTemplate('${template._id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger me-2" onclick="notificationAdmin.deleteTemplate('${template._id}')"><i class="fas fa-trash"></i></button>
                        <button class="btn btn-sm btn-${template.isActive ? 'warning' : 'success'}" onclick="notificationAdmin.toggleTemplateStatus('${template._id}', ${!template.isActive})">
                            <i class="fas fa-${template.isActive ? 'pause' : 'play'}"></i>
                        </button>
                    </td>
                `;
                const option = document.createElement('option');
                option.value = template._id;
                option.textContent = template.name;
                templateSelect.appendChild(option);
            });
        } catch (error) {
            this.showNotification('Lỗi khi tải danh sách template.', 'danger');
        }
    }

    createTemplate() {
        document.getElementById('templateForm').reset();
        document.getElementById('templateModalTitle').textContent = 'Tạo Template mới';
        document.getElementById('templateActive').checked = true;
        new bootstrap.Modal(document.getElementById('templateModal')).show();
    }

    async editTemplate(templateId) {
        try {
            const template = await this.fetchData(`/api/notifications/templates/${templateId}`);
            document.getElementById('templateModalTitle').textContent = 'Chỉnh sửa Template';
            document.getElementById('templateName').value = template.name;
            document.getElementById('templateType').value = template.type;
            document.getElementById('templateTitle').value = template.title;
            document.getElementById('templateContent').value = template.content;
            document.getElementById('templateActive').checked = template.isActive;
            document.getElementById('templateForm').dataset.templateId = template._id; // Store ID for saving
            new bootstrap.Modal(document.getElementById('templateModal')).show();
        } catch (error) {
            this.showNotification('Lỗi khi tải chi tiết template.', 'danger');
        }
    }

    async saveTemplate() {
        const templateId = document.getElementById('templateForm').dataset.templateId;
        const name = document.getElementById('templateName').value;
        const type = document.getElementById('templateType').value;
        const title = document.getElementById('templateTitle').value;
        const content = document.getElementById('templateContent').value;
        const isActive = document.getElementById('templateActive').checked;

        const templateData = { name, type, title, content, isActive };

        try {
            if (templateId) {
                await this.fetchData(`/api/notifications/templates/${templateId}`, {
                    method: 'PUT',
                    body: JSON.stringify(templateData),
                });
                this.showNotification('Template đã được cập nhật thành công!');
            } else {
                await this.fetchData('/api/notifications/templates', {
                    method: 'POST',
                    body: JSON.stringify(templateData),
                });
                this.showNotification('Template đã được tạo thành công!');
            }
            bootstrap.Modal.getInstance(document.getElementById('templateModal')).hide();
            this.loadTemplates();
            this.loadStats();
        } catch (error) {
            this.showNotification('Lỗi khi lưu template.', 'danger');
        }
    }

    async deleteTemplate(templateId) {
        if (!confirm('Bạn có chắc chắn muốn xóa template này?')) return;
        try {
            await this.fetchData(`/api/notifications/templates/${templateId}`, { method: 'DELETE' });
            this.showNotification('Template đã được xóa thành công!');
            this.loadTemplates();
            this.loadStats();
        } catch (error) {
            this.showNotification('Lỗi khi xóa template.', 'danger');
        }
    }

    async toggleTemplateStatus(templateId, isActive) {
        try {
            await this.fetchData(`/api/notifications/templates/${templateId}/toggle`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive }),
            });
            this.showNotification(`Template đã được ${isActive ? 'kích hoạt' : 'tạm khóa'}!`);
            this.loadTemplates();
        } catch (error) {
            this.showNotification('Lỗi khi cập nhật trạng thái template.', 'danger');
        }
    }

    insertVariable(variable) {
        const textarea = document.getElementById('templateContent');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        textarea.value = text.substring(0, start) + variable + text.substring(end, text.length);
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + variable.length;
    }

    async loadUsers() {
        try {
            const data = await this.fetchData('/api/users'); // Assuming an API endpoint for users
            this.users = data.users;
            const singleUserSelect = document.getElementById('singleUserSelect');
            const usersTableBody = document.getElementById('usersTableBody');
            singleUserSelect.innerHTML = '<option value="">Chọn người dùng...</option>';
            usersTableBody.innerHTML = '';

            this.users.forEach(user => {
                const option = document.createElement('option');
                option.value = user._id;
                option.textContent = `${user.name} (${user.email})`;
                singleUserSelect.appendChild(option);

                const row = usersTableBody.insertRow();
                row.innerHTML = `
                    <td><input type="checkbox" data-user-id="${user._id}" ${this.selectedUsers.has(user._id) ? 'checked' : ''} onchange="notificationAdmin.handleUserSelection(this)"></td>
                    <td>${user._id}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td><span class="badge bg-${user.isEmailVerified ? 'success' : 'danger'}">${user.isEmailVerified ? 'Verified' : 'Unverified'}</span></td>
                `;
            });
        } catch (error) {
            this.showNotification('Lỗi khi tải danh sách người dùng.', 'danger');
        }
    }

    handleUserSelection(checkbox) {
        const userId = checkbox.dataset.userId;
        if (checkbox.checked) {
            this.selectedUsers.add(userId);
        } else {
            this.selectedUsers.delete(userId);
        }
    }

    selectAllUsers() {
        document.querySelectorAll('#usersTableBody input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = true;
            this.selectedUsers.add(checkbox.dataset.userId);
        });
        document.getElementById('selectAllUsers').checked = true;
    }

    clearSelection() {
        document.querySelectorAll('#usersTableBody input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
            this.selectedUsers.delete(checkbox.dataset.userId);
        });
        document.getElementById('selectAllUsers').checked = false;
    }

    handleSendTypeChange() {
        const sendType = document.getElementById('sendType').value;
        document.getElementById('singleUserSection').style.display = 'none';
        document.getElementById('multicastSection').style.display = 'none';

        if (sendType === 'single') {
            document.getElementById('singleUserSection').style.display = 'block';
        } else if (sendType === 'multicast') {
            document.getElementById('multicastSection').style.display = 'block';
        }
    }

    handleTemplateSelectChange() {
        const templateId = document.getElementById('templateSelect').value;
        const templateVariablesDiv = document.getElementById('templateVariables');
        const variablesContainer = document.getElementById('variablesContainer');
        templateVariablesDiv.style.display = 'none';
        variablesContainer.innerHTML = '';

        if (templateId) {
            const selectedTemplate = this.templates.find(t => t._id === templateId);
            if (selectedTemplate && selectedTemplate.content) {
                const regex = /\{\{(\w+)\}\}/g;
                let match;
                const variables = new Set();
                while ((match = regex.exec(selectedTemplate.content)) !== null) {
                    variables.add(match[1]);
                }

                if (variables.size > 0) {
                    templateVariablesDiv.style.display = 'block';
                    variables.forEach(variable => {
                        const div = document.createElement('div');
                        div.className = 'mb-2';
                        div.innerHTML = `
                            <label class="form-label">Giá trị cho {{${variable}}}</label>
                            <input type="text" class="form-control template-variable-input" data-variable-name="${variable}" placeholder="Nhập giá trị cho ${variable}">
                        `;
                        variablesContainer.appendChild(div);
                    });
                }
            }
        }
    }

    handleFileInputChange() {
        const fileInput = document.getElementById('fileInput');
        const filePreview = document.getElementById('filePreview');
        filePreview.innerHTML = '';

        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                this.showNotification('Kích thước file không được vượt quá 10MB.', 'danger');
                fileInput.value = '';
                return;
            }
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                this.showNotification('Chỉ hỗ trợ file PDF, DOC, DOCX, JPG, PNG.', 'danger');
                fileInput.value = '';
                return;
            }
            filePreview.innerHTML = `<p class="text-muted">File đã chọn: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)</p>`;
        }
    }

    previewNotification() {
        const templateId = document.getElementById('templateSelect').value;
        if (!templateId) {
            this.showNotification('Vui lòng chọn một template để xem trước.', 'warning');
            return;
        }

        const selectedTemplate = this.templates.find(t => t._id === templateId);
        if (!selectedTemplate) {
            this.showNotification('Template không tồn tại.', 'danger');
            return;
        }

        let previewContent = selectedTemplate.content;
        const variableInputs = document.querySelectorAll('.template-variable-input');
        variableInputs.forEach(input => {
            const varName = input.dataset.variableName;
            const varValue = input.value || `{{${varName}}}`; // Use placeholder if no value
            previewContent = previewContent.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), varValue);
        });

        document.getElementById('previewContent').innerHTML = `
            <h5>${selectedTemplate.title}</h5>
            <p>${previewContent}</p>
        `;
        document.getElementById('notificationPreview').style.display = 'block';
    }

    async sendNotification(event) {
        event.preventDefault();

        const templateId = document.getElementById('templateSelect').value;
        const sendType = document.getElementById('sendType').value;
        const fileInput = document.getElementById('fileInput');
        const attachment = fileInput.files[0];

        if (!templateId) {
            this.showNotification('Vui lòng chọn một template.', 'warning');
            return;
        }

        let recipientIds = [];
        if (sendType === 'single') {
            const userId = document.getElementById('singleUserSelect').value;
            if (!userId) {
                this.showNotification('Vui lòng chọn người dùng.', 'warning');
                return;
            }
            recipientIds.push(userId);
        } else if (sendType === 'multicast') {
            recipientIds = Array.from(this.selectedUsers);
            if (recipientIds.length === 0) {
                this.showNotification('Vui lòng chọn ít nhất một người dùng để gửi.', 'warning');
                return;
            }
        } // For broadcast, recipientIds remains empty, backend handles all users

        const variables = {};
        document.querySelectorAll('.template-variable-input').forEach(input => {
            variables[input.dataset.variableName] = input.value;
        });

        const formData = new FormData();
        formData.append('templateId', templateId);
        formData.append('sendType', sendType);
        formData.append('recipientIds', JSON.stringify(recipientIds));
        formData.append('variables', JSON.stringify(variables));
        if (attachment) {
            formData.append('attachment', attachment);
        }

        try {
            const response = await fetch('/api/notifications/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            this.showNotification('Thông báo đã được gửi thành công!');
            document.getElementById('sendNotificationForm').reset();
            document.getElementById('notificationPreview').style.display = 'none';
            document.getElementById('filePreview').innerHTML = '';
            this.selectedUsers.clear();
            this.loadStats();
            this.loadHistory();
        } catch (error) {
            this.showNotification(`Lỗi khi gửi thông báo: ${error.message}`, 'danger');
            console.error('Send notification error:', error);
        }
    }

    async loadHistory(page = 1) {
        this.historyPage = page;
        const search = document.getElementById('historySearch').value;
        const status = document.getElementById('statusFilter').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        const query = new URLSearchParams({
            page: this.historyPage,
            limit: this.historyItemsPerPage,
            search,
            status,
            startDate,
            endDate,
        }).toString();

        try {
            const data = await this.fetchData(`/api/notifications/history?${query}`);
            const tbody = document.getElementById('historyTableBody');
            tbody.innerHTML = '';

            data.history.forEach(item => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${item._id}</td>
                    <td>${item.templateName}</td>
                    <td>${item.recipientCount} người nhận</td>
                    <td><span class="badge bg-${item.status === 'sent' ? 'success' : item.status === 'pending' ? 'info' : 'danger'}">${item.status}</span></td>
                    <td>${new Date(item.sentAt).toLocaleString()}</td>
                    <td>
                        <button class="btn btn-sm btn-info me-2" onclick="notificationAdmin.viewHistoryDetail('${item._id}')"><i class="fas fa-eye"></i></button>
                        ${item.status === 'failed' ? `<button class="btn btn-sm btn-warning" onclick="notificationAdmin.resendNotification('${item._id}')"><i class="fas fa-redo"></i></button>` : ''}
                    </td>
                `;
            });
            this.renderPagination(data.totalItems, this.historyPage, this.historyItemsPerPage, 'historyPagination', this.loadHistory.bind(this));
        } catch (error) {
            this.showNotification('Lỗi khi tải lịch sử thông báo.', 'danger');
        }
    }

    searchHistory = this.debounce(() => this.loadHistory(1), 300);

    async viewHistoryDetail(historyId) {
        try {
            const detail = await this.fetchData(`/api/notifications/history/${historyId}`);
            // Placeholder for displaying detail in a modal or similar
            alert(`Chi tiết thông báo ID: ${detail._id}\nTemplate: ${detail.templateName}\nStatus: ${detail.status}\nContent: ${detail.content}`);
        } catch (error) {
            this.showNotification('Lỗi khi tải chi tiết lịch sử.', 'danger');
        }
    }

    async resendNotification(historyId) {
        if (!confirm('Bạn có muốn gửi lại thông báo này?')) return;
        try {
            await this.fetchData(`/api/notifications/history/${historyId}/resend`, { method: 'POST' });
            this.showNotification('Thông báo đã được gửi lại thành công!');
            this.loadHistory();
            this.loadStats();
        } catch (error) {
            this.showNotification('Lỗi khi gửi lại thông báo.', 'danger');
        }
    }

    renderPagination(totalItems, currentPage, itemsPerPage, targetElementId, loadFunction) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const paginationUl = document.getElementById(targetElementId);
        paginationUl.innerHTML = '';

        if (totalPages <= 1) return;

        const createPageItem = (page, text, isActive = false, isDisabled = false) => {
            const li = document.createElement('li');
            li.className = `page-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`;
            const a = document.createElement('a');
            a.className = 'page-link';
            a.href = '#';
            a.textContent = text;
            if (!isDisabled && !isActive) {
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    loadFunction(page);
                });
            }
            li.appendChild(a);
            return li;
        };

        paginationUl.appendChild(createPageItem(currentPage - 1, 'Previous', false, currentPage === 1));

        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, currentPage + 2);

        if (endPage - startPage < 4) {
            if (startPage === 1) {
                endPage = Math.min(totalPages, startPage + 4);
            } else if (endPage === totalPages) {
                startPage = Math.max(1, endPage - 4);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationUl.appendChild(createPageItem(i, i, i === currentPage));
        }

        paginationUl.appendChild(createPageItem(currentPage + 1, 'Next', false, currentPage === totalPages));
    }

    debounce(func, delay) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.notificationAdmin = new NotificationAdmin();
});
