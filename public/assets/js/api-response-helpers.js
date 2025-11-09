/**
 * API Response Helpers
 * Common functions to extract data and pagination from various API response formats
 */

/**
 * Extract data array from API response
 * @param {*} resp - API response
 * @param {string} key - Key to look for (e.g., 'orders', 'books', 'vouchers')
 * @returns {Array} - Extracted data array
 */
function extractData(resp, key) {
    if (!resp) {
        console.warn('⚠️ Response is null or undefined');
        return [];
    }
    
    // Nếu là array trực tiếp
    if (Array.isArray(resp)) {
        console.log(`📦 Response is array, length: ${resp.length}`);
        return resp;
    }
    
    // Nếu có key cụ thể (orders, books, vouchers, etc.)
    if (key && resp[key]) {
        const data = Array.isArray(resp[key]) ? resp[key] : [];
        console.log(`📦 Found data in response.${key}, length: ${data.length}`);
        return data;
    }
    
    // Nếu có data field
    if (resp.data) {
        // data có thể là array hoặc object có orders field
        if (Array.isArray(resp.data)) {
            console.log(`📦 Found data array, length: ${resp.data.length}`);
            return resp.data;
        }
        if (key && resp.data[key]) {
            const data = Array.isArray(resp.data[key]) ? resp.data[key] : [];
            console.log(`📦 Found data.data.${key}, length: ${data.length}`);
            return data;
        }
    }
    
    // Nếu response có success và data
    if (resp.success && resp.data) {
        if (Array.isArray(resp.data)) {
            console.log(`📦 Found success.data array, length: ${resp.data.length}`);
            return resp.data;
        }
        if (key && resp.data[key]) {
            const data = Array.isArray(resp.data[key]) ? resp.data[key] : [];
            console.log(`📦 Found success.data.${key}, length: ${data.length}`);
            return data;
        }
    }
    
    console.warn('⚠️ Could not extract data from response:', resp);
    return [];
}

/**
 * Extract pagination info from API response
 * @param {*} resp - API response
 * @param {number} defaultPage - Default page number
 * @param {number} defaultLimit - Default limit per page
 * @returns {Object} - Pagination object with page, limit, total, pages, totalPages
 */
function extractPagination(resp, defaultPage = 1, defaultLimit = 20) {
    if (!resp) {
        console.warn('⚠️ Response is null, using defaults');
        return { page: defaultPage, limit: defaultLimit, total: 0, pages: 1, totalPages: 1 };
    }
    
    // Format 1: { pagination: { page, limit, total, pages, totalPages } }
    if (resp.pagination) {
        const pagination = {
            page: resp.pagination.page || defaultPage,
            limit: resp.pagination.limit || defaultLimit,
            total: resp.pagination.total || 0,
            pages: resp.pagination.pages || resp.pagination.totalPages || 1,
            totalPages: resp.pagination.totalPages || resp.pagination.pages || 1
        };
        console.log('📦 Extracted pagination from resp.pagination:', pagination);
        return pagination;
    }
    
    // Format 2: { page, limit, total, pages, totalPages } (trực tiếp)
    if (resp.page !== undefined || resp.total !== undefined) {
        const total = resp.total || 0;
        const limit = resp.limit || defaultLimit;
        const page = resp.page || defaultPage;
        const pages = resp.pages || resp.totalPages || Math.ceil(total / limit) || 1;
        const pagination = { page, limit, total, pages, totalPages: pages };
        console.log('📦 Extracted pagination from resp directly:', pagination);
        return pagination;
    }
    
    // Format 3: { data: { pagination: {...} } }
    if (resp.data && resp.data.pagination) {
        const pagination = {
            page: resp.data.pagination.page || defaultPage,
            limit: resp.data.pagination.limit || defaultLimit,
            total: resp.data.pagination.total || 0,
            pages: resp.data.pagination.pages || resp.data.pagination.totalPages || 1,
            totalPages: resp.data.pagination.totalPages || resp.data.pagination.pages || 1
        };
        console.log('📦 Extracted pagination from resp.data.pagination:', pagination);
        return pagination;
    }
    
    // Format 4: { success: true, data: { pagination: {...} } }
    if (resp.success && resp.data && resp.data.pagination) {
        const pagination = {
            page: resp.data.pagination.page || defaultPage,
            limit: resp.data.pagination.limit || defaultLimit,
            total: resp.data.pagination.total || 0,
            pages: resp.data.pagination.pages || resp.data.pagination.totalPages || 1,
            totalPages: resp.data.pagination.totalPages || resp.data.pagination.pages || 1
        };
        console.log('📦 Extracted pagination from resp.success.data.pagination:', pagination);
        return pagination;
    }
    
    console.warn('⚠️ Could not extract pagination, using defaults');
    return { page: defaultPage, limit: defaultLimit, total: 0, pages: 1, totalPages: 1 };
}

// Export functions to window object for global access
window.extractData = extractData;
window.extractPagination = extractPagination;

