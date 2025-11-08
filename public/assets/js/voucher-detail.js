// Use configured API base from config.js
const apiBase = (typeof window !== 'undefined' && (window.apiBase || window.API_BASE || window.base_url)) || '';

function authHeader() {
  const t = localStorage.getItem('authToken');
  return t ? { 'Authorization': 'Bearer ' + t } : {};
}

async function loadVoucher(id) {
  const res = await fetch(`${apiBase}/api/v1/admin/vouchers/${id}`, { headers: { ...authHeader() } });
  if (!res.ok) {
    document.getElementById('voucher-root').innerText = 'Failed to load voucher: ' + res.status;
    return;
  }
  const data = await res.json();
  renderVoucher(data);
}

function renderVoucher(v) {
  const root = document.getElementById('voucher-root');
  root.innerHTML = `
    <div class="voucher-info">
      <p><strong>ID:</strong> ${v.voucher_id}</p>
      <p><strong>Type:</strong> ${v.voucher_type}</p>
      <p><strong>Discount:</strong> ${v.discount_type} ${v.discount_value}</p>
      <p><strong>Active:</strong> ${v.is_active ? 'Yes' : 'No'}</p>
      <p><strong>Usage Count:</strong> ${v.usage_count || 0}</p>
    </div>
  `;

  const tbody = document.querySelector('#used-by-table tbody');
  tbody.innerHTML = '';
  const used = v.used_by || [];
  used.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.user_id || u.user || ''}</td>
      <td><a href="/orders/${u.order_id}" target="_blank">${u.order_id || ''}</a></td>
      <td>${u.date ? new Date(u.date).toLocaleString() : ''}</td>
      <td>${u.amount || ''}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('export-csv').onclick = () => exportUsedByCSV(v._id || v.id, {});
  document.getElementById('btn-filter-usages').onclick = async () => {
    const from = document.getElementById('usage-from').value;
    const to = document.getElementById('usage-to').value;
    await loadUsages(v._id || v.id, { from, to });
  };
}


async function loadUsages(voucherId, { from, to } = {}) {
  const qs = new URLSearchParams();
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  const res = await fetch(`${apiBase}/api/v1/admin/vouchers/${voucherId}/usages?` + qs.toString(), { headers: { ...authHeader() } });
  if (!res.ok) {
    document.querySelector('#used-by-table tbody').innerHTML = '<tr><td colspan="4">Failed to load usages</td></tr>';
    return;
  }
  const data = await res.json();
  const tbody = document.querySelector('#used-by-table tbody');
  tbody.innerHTML = '';
  (data.usages || []).forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.user_id || u.user || ''}</td>
      <td><a href="/orders/${u.order_id}" target="_blank">${u.order_id || ''}</a></td>
      <td>${u.date ? new Date(u.date).toLocaleString() : ''}</td>
      <td>${u.amount || ''}</td>
    `;
    tbody.appendChild(tr);
  });
  document.getElementById('export-csv').onclick = () => exportUsedByCSV(voucherId, { from, to });
}

function exportUsedByCSV(voucherId, { from, to } = {}) {
  // Request usages with same filters then export CSV
  fetch(`${apiBase}/api/v1/admin/vouchers/${voucherId}/usages?from=${from||''}&to=${to||''}`, { headers: { ...authHeader() } })
    .then(r => r.json())
    .then(data => {
      const rows = [['user_id','order_id','date','amount']];
      (data.usages || []).forEach(u => rows.push([u.user_id||'', u.order_id||'', u.date||'', u.amount||'']));
      const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${voucherId || 'voucher'}-used_by.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }).catch(err => alert('Export failed: ' + err.message));
}

// read id from query
(function init() {
  const qs = new URLSearchParams(window.location.search);
  const id = qs.get('id');
  if (!id) {
    document.getElementById('voucher-root').innerText = 'Missing voucher id in query.';
    return;
  }
  loadVoucher(id).catch(e => { document.getElementById('voucher-root').innerText = 'Error: '+e.message; });
})();
