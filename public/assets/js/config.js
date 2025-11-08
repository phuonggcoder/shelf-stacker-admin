// External backend base URL (use the URL provided by the user)
const BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

// Backwards-compatible globals for older scripts that reference different names
window.base_url = BASE_URL;
window.API_BASE = BASE_URL;
window.apiBase = BASE_URL;
window.VOUCHER_API = BASE_URL;

// Named constants for module-aware scripts
const API_BASE = BASE_URL;
const apiBase = BASE_URL;

// CommonJS export for tools that `require` this file
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BASE_URL, API_BASE, apiBase };
}

