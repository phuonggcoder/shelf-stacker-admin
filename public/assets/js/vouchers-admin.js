
// Use configured API base from config.js (backwards-compatible globals)
const API_BASE = (typeof window !== 'undefined' && (window.API_BASE || window.base_url || window.apiBase)) || '';
function authHeader(){
  const t = localStorage.getItem('authToken');
  return t ? { 'Authorization': 'Bearer ' + t } : {};
}

// Map FE fields to BE contract
function toApiVoucher(formData) {
  return {
    code: formData.code,
    type: formData.type,
    value: Number(formData.value),
    minOrderValue: Number(formData.minOrderValue),
    validFrom: formData.validFrom,
    validTo: formData.validTo,
    usageLimit: Number(formData.usageLimit),
    userSegment: formData.userSegment,
    description: formData.description
  };
}

async function fetchVouchers() {
  const status = document.getElementById('filter-status') ? document.getElementById('filter-status').value : 'active';
  const q = document.getElementById('filter-search') ? document.getElementById('filter-search').value.trim() : '';
  const params = new URLSearchParams();
  if (status === 'archived') params.set('include_deleted', 'only');
  else if (status === 'all') params.set('include_deleted', 'true');
  if (q) params.set('q', q);
  const res = await fetch(`${API_BASE}/api/vouchers?${params.toString()}`, { headers: { ...authHeader() } });
  const data = await res.json();
  const tbody = document.querySelector('#voucher-table tbody');
  tbody.innerHTML = '';
  (data.vouchers||[]).forEach(v => {
    const id = v._id || v.id;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="checkbox" class="row-checkbox" data-id="${id}"></td>
      <td><a class="link-detail" href="/voucher-detail?id=${id}">${v.voucher_id || v.code || ''}</a></td>
      <td>${v.voucher_type || v.type || ''}</td>
      <td>${v.discount_value || v.value || ''}</td>
      <td>${v.end_date ? new Date(v.end_date).toLocaleDateString() : ''}</td>
      <td>${v.usage_limit || v.usageLimit || ''}</td>
      <td>${v.is_deleted ? 'archived' : (v.is_active ? 'active' : 'inactive')}</td>
      <td>
        <button data-id="${id}" data-code="${v.voucher_id || v.code || ''}" class="btn-edit">Edit</button>
        ${v.is_deleted ? '' : `<button data-id="${id}" data-code="${v.voucher_id || v.code || ''}" class="btn-archive">Archive</button>`}
        <button data-id="${id}" class="btn-usage">Usages</button>
        <button data-id="${id}" class="btn-duplicate">Duplicate</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  fetchVouchers();
  // Search button
  const btnSearch = document.getElementById('btn-search');
  btnSearch && btnSearch.addEventListener('click', (e) => { fetchVouchers(); });
  document.getElementById('filter-status') && document.getElementById('filter-status').addEventListener('change', () => fetchVouchers());
  document.getElementById('btn-new').addEventListener('click', () => { openModal(); });
  const btnTrash = document.getElementById('btn-view-trash');
  btnTrash && btnTrash.addEventListener('click', () => { window.location.href = '/vouchers-trash'; });
  document.getElementById('btn-cancel').addEventListener('click', () => { closeModal(); });
  document.getElementById('voucher-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form).entries());
    const apiData = toApiVoucher(data);
  let method = 'POST', url = `${API_BASE}/api/vouchers`;
    if (form.dataset.editId) {
      method = 'PUT';
  url = `${API_BASE}/api/vouchers/${form.dataset.editId}`;
    }
    
    // Disable submit button
    const submitBtn = document.getElementById('btn-save-voucher') || form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = method === 'PUT' ? 'Đang cập nhật...' : 'Đang lưu...';
      submitBtn.style.opacity = '0.6';
    }
    
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(apiData) });
      if (res.ok) { closeModal(); fetchVouchers(); } else { const txt = await res.text(); alert('Failed to save voucher: ' + txt); }
    } finally {
      // Re-enable button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = method === 'PUT' ? 'Cập nhật' : 'Lưu';
        submitBtn.style.opacity = '1';
      }
    }
  });
  document.querySelector('#voucher-table tbody').addEventListener('click', async (e) => {
    const id = e.target.dataset.id;
    if (e.target.classList.contains('btn-edit')) {
  const res = await fetch(`${API_BASE}/api/vouchers/${id}`, { headers: { ...authHeader() } });
      const v = await res.json();
      openModal(v);
    }
    if (e.target.classList.contains('btn-archive')) {
      const code = e.target.dataset.code || '';
      // show confirm modal
      const confirmModal = document.getElementById('confirm-archive-modal');
      document.getElementById('confirm-archive-code').innerText = code;
      confirmModal.classList.remove('hidden');
      const onOk = async () => {
  await fetch(`${API_BASE}/api/vouchers/${id}/archive`, { method: 'POST', headers: { ...authHeader() } });
        confirmModal.classList.add('hidden');
        fetchVouchers();
        cleanup();
      };
      const cleanup = () => {
        document.getElementById('confirm-archive-cancel').removeEventListener('click', onCancel);
        document.getElementById('confirm-archive-ok').removeEventListener('click', onOk);
      };
      const onCancel = () => { confirmModal.classList.add('hidden'); cleanup(); };
      document.getElementById('confirm-archive-cancel').addEventListener('click', onCancel);
      document.getElementById('confirm-archive-ok').addEventListener('click', onOk);
    }
    if (e.target.classList.contains('btn-usage')) {
      window.location.href = `/voucher-detail?id=${id}`;
    }
    if (e.target.classList.contains('btn-duplicate')) {
  const res = await fetch(`${API_BASE}/api/vouchers/${id}`, { headers: { ...authHeader() } });
      const v = await res.json();
      v.code = v.code + '_COPY';
      delete v.id;
      openModal(v, true);
    }
  });
  // Select-all checkbox
  const selectAll = document.getElementById('select-all');
  selectAll && selectAll.addEventListener('change', (e) => {
    document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = selectAll.checked);
  });

  // Bulk archive
  document.getElementById('btn-bulk-archive').addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('.row-checkbox:checked')).map(cb => cb.dataset.id);
    if (!ids.length) return alert('No vouchers selected');
    if (!confirm(`Archive ${ids.length} selected vouchers?`)) return;
  const res = await fetch(`${API_BASE}/api/vouchers/bulk-archive`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ ids })
    });
    if (res.ok) { alert('Archived ' + ids.length + ' vouchers'); fetchVouchers(); } else { alert('Bulk archive failed'); }
  });

  // Bulk delete (alias to bulk-archive for now)
  document.getElementById('btn-bulk-delete').addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('.row-checkbox:checked')).map(cb => cb.dataset.id);
    if (!ids.length) return alert('No vouchers selected');
    if (!confirm(`Delete ${ids.length} selected vouchers? This is permanent.`)) return;
    // For safety, call bulk-archive then optionally implement hard-delete on server later
  const res = await fetch(`${API_BASE}/api/vouchers/bulk-archive`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ ids })
    });
    if (res.ok) { alert('Deleted (archived) ' + ids.length + ' vouchers'); fetchVouchers(); } else { alert('Bulk delete failed'); }
  });
});

function openModal(v, isDuplicate) {
  const modal = document.getElementById('modal');
  const form = document.getElementById('voucher-form');
  form.reset();
  form.dataset.editId = '';
  if (v) {
    document.getElementById('modal-title').innerText = isDuplicate ? 'Duplicate Voucher' : 'Edit Voucher';
    form.elements['code'].value = v.code || '';
    form.elements['type'].value = v.type || '';
    form.elements['value'].value = v.value || '';
    form.elements['minOrderValue'].value = v.minOrderValue || '';
    form.elements['validFrom'].value = v.validFrom ? v.validFrom.substr(0,10) : '';
    form.elements['validTo'].value = v.validTo ? v.validTo.substr(0,10) : '';
    form.elements['usageLimit'].value = v.usageLimit || '';
    form.elements['userSegment'].value = v.userSegment || 'all';
    form.elements['description'].value = v.description || '';
    if (!isDuplicate) form.dataset.editId = v.id;
  } else {
    document.getElementById('modal-title').innerText = 'Tạo Voucher';
  }
  modal.classList.remove('hidden');
}
function closeModal() { document.getElementById('modal').classList.add('hidden'); }
