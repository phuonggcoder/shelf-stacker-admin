/**
 * LOADING STATE HELPER - Universal Wrapper
 * Automatically manages button states during async operations
 * 
 * @author AI Assistant
 * @date 2025-11-09
 */

(function(window) {
    'use strict';

    /**
     * Wraps an async function with automatic loading state management
     * 
     * @param {string|HTMLElement} button - Button ID or element
     * @param {Function} asyncFn - Async function to execute
     * @param {Object} options - Configuration options
     * @returns {Promise<any>} Result from asyncFn
     * 
     * @example
     * await withLoadingState('save-btn', async () => {
     *   await AdminServices.createCategory(data);
     * });
     * 
     * @example
     * // With custom options
     * await withLoadingState('update-btn', async () => {
     *   await AdminServices.updateProduct(id, data);
     * }, {
     *   loadingText: 'Đang cập nhật...',
     *   successText: 'Đã lưu!',
     *   showSuccessFor: 1000
     * });
     */
    async function withLoadingState(button, asyncFn, options = {}) {
        // Default options
        const config = {
            loadingText: 'Đang xử lý...',
            successText: null,
            errorText: null,
            showSuccessFor: 0,
            showErrorFor: 2000,
            disableButton: true,
            changeOpacity: true,
            changeCursor: true,
            restoreOriginalText: true,
            throwError: true,
            onStart: null,
            onSuccess: null,
            onError: null,
            onFinally: null,
            ...options
        };

        // Get button element
        const btn = typeof button === 'string' 
            ? document.getElementById(button) || document.querySelector(button)
            : button;

        if (!btn) {
            console.warn(`[LoadingState] Button not found: ${button}`);
            // Still execute the function even if button not found
            return await asyncFn();
        }

        // Save original state
        const originalText = btn.textContent || btn.innerText;
        const originalDisabled = btn.disabled;
        const originalOpacity = btn.style.opacity;
        const originalCursor = btn.style.cursor;

        try {
            // Apply loading state
            if (config.disableButton) {
                btn.disabled = true;
            }
            
            if (config.loadingText) {
                btn.textContent = config.loadingText;
            }
            
            if (config.changeOpacity) {
                btn.style.opacity = '0.6';
            }
            
            if (config.changeCursor) {
                btn.style.cursor = 'not-allowed';
            }

            // Call onStart callback
            if (typeof config.onStart === 'function') {
                config.onStart(btn);
            }

            // Execute async function
            const result = await asyncFn();

            // Show success state if configured
            if (config.successText && config.showSuccessFor > 0) {
                btn.textContent = config.successText;
                btn.style.opacity = '1';
                await new Promise(resolve => setTimeout(resolve, config.showSuccessFor));
            }

            // Call onSuccess callback
            if (typeof config.onSuccess === 'function') {
                config.onSuccess(result, btn);
            }

            return result;

        } catch (error) {
            // Show error state if configured
            if (config.errorText && config.showErrorFor > 0) {
                btn.textContent = config.errorText;
                btn.style.opacity = '1';
                btn.style.color = '#dc3545';
                await new Promise(resolve => setTimeout(resolve, config.showErrorFor));
            }

            // Call onError callback
            if (typeof config.onError === 'function') {
                config.onError(error, btn);
            }

            // Re-throw error if configured
            if (config.throwError) {
                throw error;
            }

            return null;

        } finally {
            // Restore original state
            if (config.restoreOriginalText) {
                btn.textContent = originalText;
            }
            
            btn.disabled = originalDisabled;
            btn.style.opacity = originalOpacity || '1';
            btn.style.cursor = originalCursor || 'pointer';
            
            if (btn.style.color) {
                btn.style.color = '';
            }

            // Call onFinally callback
            if (typeof config.onFinally === 'function') {
                config.onFinally(btn);
            }
        }
    }

    /**
     * Wraps a form submit handler with loading state
     * 
     * @param {string|HTMLElement} form - Form ID or element
     * @param {string|HTMLElement} submitButton - Submit button ID or element
     * @param {Function} asyncFn - Async function to execute (receives FormData)
     * @param {Object} options - Configuration options
     * 
     * @example
     * withFormLoadingState('category-form', 'save-btn', async (formData) => {
     *   const data = Object.fromEntries(formData);
     *   await AdminServices.createCategory(data);
     * });
     */
    function withFormLoadingState(form, submitButton, asyncFn, options = {}) {
        const formElement = typeof form === 'string' 
            ? document.getElementById(form) || document.querySelector(form)
            : form;

        if (!formElement) {
            console.error(`[LoadingState] Form not found: ${form}`);
            return;
        }

        formElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(formElement);
            
            await withLoadingState(submitButton, async () => {
                return await asyncFn(formData, formElement);
            }, {
                loadingText: options.loadingText || 'Đang lưu...',
                ...options
            });
        });
    }

    /**
     * Wraps a button click handler with loading state
     * 
     * @param {string|HTMLElement} button - Button ID or element
     * @param {Function} asyncFn - Async function to execute
     * @param {Object} options - Configuration options
     * 
     * @example
     * withButtonLoadingState('delete-btn', async () => {
     *   await AdminServices.deleteCategory(id);
     * });
     */
    function withButtonLoadingState(button, asyncFn, options = {}) {
        const btn = typeof button === 'string'
            ? document.getElementById(button) || document.querySelector(button)
            : button;

        if (!btn) {
            console.error(`[LoadingState] Button not found: ${button}`);
            return;
        }

        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            await withLoadingState(btn, asyncFn, options);
        });
    }

    /**
     * Batch wrap multiple buttons with loading states
     * 
     * @param {Array<Object>} configs - Array of button configurations
     * 
     * @example
     * batchWrapButtons([
     *   { button: 'save-btn', handler: async () => await save() },
     *   { button: 'update-btn', handler: async () => await update() },
     *   { button: 'delete-btn', handler: async () => await remove(), loadingText: 'Đang xóa...' }
     * ]);
     */
    function batchWrapButtons(configs) {
        configs.forEach(config => {
            if (!config.button || !config.handler) {
                console.warn('[LoadingState] Invalid config:', config);
                return;
            }

            withButtonLoadingState(config.button, config.handler, config.options || {});
        });
    }

    /**
     * Create a loading overlay for the entire page
     * 
     * @param {string} message - Loading message
     * @returns {Object} Overlay controller
     */
    function createPageLoadingOverlay(message = 'Đang tải...') {
        const overlay = document.createElement('div');
        overlay.id = 'page-loading-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            backdrop-filter: blur(3px);
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 30px 40px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            text-align: center;
            font-family: 'Segoe UI', sans-serif;
        `;

        const spinner = document.createElement('div');
        spinner.style.cssText = `
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px auto;
        `;

        const text = document.createElement('div');
        text.textContent = message;
        text.style.cssText = `
            font-size: 16px;
            color: #333;
            font-weight: 500;
        `;

        content.appendChild(spinner);
        content.appendChild(text);
        overlay.appendChild(content);

        // Add spinner animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);

        return {
            show: () => {
                document.body.appendChild(overlay);
            },
            hide: () => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            },
            updateMessage: (newMessage) => {
                text.textContent = newMessage;
            }
        };
    }

    // Export to window
    window.LoadingStateHelper = {
        withLoadingState,
        withFormLoadingState,
        withButtonLoadingState,
        batchWrapButtons,
        createPageLoadingOverlay
    };

    // Also export individual functions for convenience
    window.withLoadingState = withLoadingState;
    window.withFormLoadingState = withFormLoadingState;
    window.withButtonLoadingState = withButtonLoadingState;

    console.log('✅ LoadingStateHelper initialized');

})(window);

