// UI Library for ShelfStacker Admin
const UILibrary = {
    // Table Component
    Table: {
        create: (config) => {
            const table = document.createElement('table');
            table.className = 'admin-table';
            
            // Add header
            if (config.headers) {
                const thead = document.createElement('thead');
                const headerRow = document.createElement('tr');
                config.headers.forEach(header => {
                    const th = document.createElement('th');
                    th.textContent = header;
                    headerRow.appendChild(th);
                });
                thead.appendChild(headerRow);
                table.appendChild(thead);
            }

            // Add body
            const tbody = document.createElement('tbody');
            if (config.data) {
                config.data.forEach(row => {
                    const tr = document.createElement('tr');
                    config.columns.forEach(column => {
                        const td = document.createElement('td');
                        td.innerHTML = column.render ? column.render(row) : row[column.key];
                        tr.appendChild(td);
                    });
                    tbody.appendChild(tr);
                });
            }
            table.appendChild(tbody);

            // Add loading state
            table.setLoading = (isLoading) => {
                table.classList.toggle('loading', isLoading);
            };

            return table;
        }
    },

    // Form Component
    Form: {
        create: (config) => {
            const form = document.createElement('form');
            form.className = 'admin-form';
            
            config.fields.forEach(field => {
                const formGroup = document.createElement('div');
                formGroup.className = 'form-group';

                // Label
                const label = document.createElement('label');
                label.textContent = field.label;
                formGroup.appendChild(label);

                // Input
                let input;
                switch (field.type) {
                    case 'select':
                        input = document.createElement('select');
                        field.options.forEach(option => {
                            const opt = document.createElement('option');
                            opt.value = option.value;
                            opt.textContent = option.label;
                            input.appendChild(opt);
                        });
                        break;
                    case 'textarea':
                        input = document.createElement('textarea');
                        break;
                    default:
                        input = document.createElement('input');
                        input.type = field.type;
                }

                input.name = field.name;
                input.id = field.id || field.name;
                input.className = 'form-control';
                if (field.required) input.required = true;
                if (field.placeholder) input.placeholder = field.placeholder;
                
                // Validation
                if (field.validation) {
                    input.addEventListener('input', (e) => {
                        const value = e.target.value;
                        const error = field.validation(value);
                        const errorElement = formGroup.querySelector('.error-message');
                        
                        if (error) {
                            if (!errorElement) {
                                const errDiv = document.createElement('div');
                                errDiv.className = 'error-message';
                                errDiv.textContent = error;
                                formGroup.appendChild(errDiv);
                            } else {
                                errorElement.textContent = error;
                            }
                            input.classList.add('invalid');
                        } else {
                            if (errorElement) formGroup.removeChild(errorElement);
                            input.classList.remove('invalid');
                        }
                    });
                }

                formGroup.appendChild(input);
                form.appendChild(formGroup);
            });

            // Add submit handler
            if (config.onSubmit) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData.entries());
                    
                    try {
                        form.classList.add('loading');
                        await config.onSubmit(data);
                    } catch (error) {
                        console.error('Form submission error:', error);
                        // Show error message
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'form-error';
                        errorDiv.textContent = error.message || 'An error occurred';
                        form.insertBefore(errorDiv, form.firstChild);
                    } finally {
                        form.classList.remove('loading');
                    }
                });
            }

            return form;
        }
    },

    // Modal Component
    Modal: {
        create: (config) => {
            const modal = document.createElement('div');
            modal.className = 'modal';
            if (config.id) modal.id = config.id;

            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';

            // Header
            if (config.title) {
                const header = document.createElement('div');
                header.className = 'modal-header';
                
                const title = document.createElement('h2');
                title.textContent = config.title;
                header.appendChild(title);

                const closeBtn = document.createElement('button');
                closeBtn.className = 'close-button';
                closeBtn.innerHTML = '&times;';
                closeBtn.onclick = () => modal.close();
                header.appendChild(closeBtn);

                modalContent.appendChild(header);
            }

            // Body
            const body = document.createElement('div');
            body.className = 'modal-body';
            if (typeof config.content === 'string') {
                body.innerHTML = config.content;
            } else if (config.content instanceof HTMLElement) {
                body.appendChild(config.content);
            }
            modalContent.appendChild(body);

            // Footer
            if (config.buttons) {
                const footer = document.createElement('div');
                footer.className = 'modal-footer';
                
                config.buttons.forEach(btn => {
                    const button = document.createElement('button');
                    button.textContent = btn.text;
                    button.className = `btn ${btn.class || ''}`;
                    button.onclick = btn.onClick;
                    footer.appendChild(button);
                });

                modalContent.appendChild(footer);
            }

            modal.appendChild(modalContent);

            // Methods
            modal.open = () => {
                document.body.appendChild(modal);
                setTimeout(() => modal.classList.add('show'), 10);
            };

            modal.close = () => {
                modal.classList.remove('show');
                setTimeout(() => {
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                }, 300);
            };

            // Close on outside click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.close();
                }
            });

            return modal;
        }
    }
};

export default UILibrary;