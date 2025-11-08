// Use configured API base from config.js
const API_BASE = (typeof window !== 'undefined' && (window.API_BASE || window.base_url || window.apiBase)) || '';
function authHeader(){ const t = localStorage.getItem('authToken'); return t ? { 'Authorization': 'Bearer ' + t } : {}; }

async function fetchTrash() {
  const res = await fetch(`${API_BASE}/api/vouchers?include_deleted=only`, { headers: { ...authHeader() } });
  const data = await res.json();
  const tbody = document.querySelector('#trash-table tbody');
  tbody.innerHTML = '';
  (data.vouchers||[]).forEach(v => {
    // Expect v.is_deleted === true
    const id = v._id || v.id;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="checkbox" class="row-trash-checkbox" data-id="${id}"></td>
      <td>${v.voucher_id || v.code || ''}</td>
      <td>${v.voucher_type || v.type || ''}</td>
      <td>${v.discount_value || v.value || ''}</td>
      <td>${v.updatedAt ? new Date(v.updatedAt).toLocaleString() : ''}</td>
      <td>
        <button data-id="${id}" class="btn-restore">Khôi phục</button>
        <button data-id="${id}" class="btn-hard-delete">Xóa vĩnh viễn</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  fetchTrash();
  document.getElementById('btn-back').addEventListener('click', () => { window.location.href = '/vouchers-admin'; });
  document.getElementById('trash-table').addEventListener('click', async (e) => {
    const id = e.target.dataset.id;
    if (!id) return;
    if (e.target.classList.contains('btn-restore')) {
      if (!confirm('Khôi phục voucher này?')) return;
  const res = await fetch(`${API_BASE}/api/vouchers/${id}/restore`, { method: 'POST', headers: { ...authHeader() } });
      if (res.ok) { alert('Restored'); fetchTrash(); } else { alert('Failed to restore'); }
    }
    if (e.target.classList.contains('btn-hard-delete')) {
      // show strong confirmation modal: require typing voucher code
      const row = e.target.closest('tr');
      const codeCell = row.querySelector('td:nth-child(2)');
      const code = codeCell ? codeCell.innerText.trim() : '';
      const modal = document.getElementById('confirm-hard-delete-modal');
      document.getElementById('hard-delete-code').innerText = code;
      const input = document.getElementById('hard-delete-input');
      const confirmBtn = document.getElementById('hard-delete-confirm');
      input.value = '';
      confirmBtn.disabled = true;
      modal.classList.remove('hidden');
      const onInput = () => { confirmBtn.disabled = input.value.trim() !== code; };
      input.addEventListener('input', onInput);
      const cleanup = () => { input.removeEventListener('input', onInput); document.getElementById('hard-delete-cancel').removeEventListener('click', onCancel); confirmBtn.removeEventListener('click', onConfirm); };
      const onCancel = () => { modal.classList.add('hidden'); cleanup(); };
      const onConfirm = async () => {
  const res = await fetch(`${API_BASE}/api/vouchers/${id}/hard`, { method: 'DELETE', headers: { ...authHeader() } });
        if (res.ok) { alert('Deleted permanently'); fetchTrash(); } else { const txt = await res.text(); alert('Failed to delete permanently: ' + txt); }
        modal.classList.add('hidden'); cleanup();
      };
      document.getElementById('hard-delete-cancel').addEventListener('click', onCancel);
      confirmBtn.addEventListener('click', onConfirm);
    }
  });

  document.getElementById('select-all-trash').addEventListener('change', (e) => {
    document.querySelectorAll('.row-trash-checkbox').forEach(cb => cb.checked = e.target.checked);
  });

  document.getElementById('btn-bulk-restore').addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('.row-trash-checkbox:checked')).map(cb => cb.dataset.id);
    if (!ids.length) return alert('No vouchers selected');
    if (!confirm(`Khôi phục ${ids.length} voucher?`)) return;
    for (const id of ids) {
  await fetch(`${API_BASE}/api/vouchers/${id}/restore`, { method: 'POST', headers: { ...authHeader() } });
    }
    alert('Restored selected'); fetchTrash();
  });

  document.getElementById('btn-bulk-hard-delete').addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('.row-trash-checkbox:checked')).map(cb => cb.dataset.id);
    if (!ids.length) return alert('No vouchers selected');
    if (!confirm(`Xóa vĩnh viễn ${ids.length} voucher? Không thể hoàn tác.`)) return;
  const res = await fetch(`${API_BASE}/api/vouchers/bulk-hard-delete`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ ids }) });
    if (res.ok) { alert('Deleted permanently'); fetchTrash(); } else { alert('Bulk hard delete failed'); }
  });
  // Optional: Empty Trash (delete all archived) - admin only
  const btnEmpty = document.createElement('button');
  btnEmpty.innerText = 'Empty Trash (Xóa tất cả)';
  btnEmpty.addEventListener('click', async () => {
    if (!confirm('Xóa vĩnh viễn tất cả voucher đã lưu trữ? Không thể hoàn tác.')) return;
    // Collect all ids currently loaded and call bulk-hard-delete
    const ids = Array.from(document.querySelectorAll('.row-trash-checkbox')).map(cb => cb.dataset.id);
    if (!ids.length) return alert('Trash is empty');
  const res = await fetch(`${API_BASE}/api/vouchers/bulk-hard-delete`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ ids }) });
    if (res.ok) { alert('Emptied trash'); fetchTrash(); } else { alert('Empty trash failed'); }
  });
  document.getElementById('trash-actions').appendChild(btnEmpty);
});