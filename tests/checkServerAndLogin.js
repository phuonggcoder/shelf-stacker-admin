const axios = require('axios');

const BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

async function main() {
  console.log('Checking server health:', `${BASE_URL}/api/health`);
  try {
    const h = await axios.get(`${BASE_URL}/api/health`, { timeout: 15000 });
    console.log('Health status:', h.status, h.data || '(no body)');
  } catch (err) {
    console.error('Health check failed:', err.response ? {
      status: err.response.status,
      data: err.response.data
    } : err.message);
  }

  // Test login cases
  const testCases = [
    { description: 'Valid admin login', credentials: { email: 'binhanvoidoi@gmail.com', password: '123456' } },
    { description: 'Invalid password', credentials: { email: 'binhanvoidoi@gmail.com', password: 'wrongpassword' } },
    // Non-admin test omitted because we don't have a sample non-admin account here
  ];

  for (const t of testCases) {
    console.log('\n===', t.description, '===');
    try {
      const res = await axios.post(`${BASE_URL}/auth/login`, t.credentials, { timeout: 20000 });
      console.log('Login success:', res.status);
      console.log('Returned keys:', Object.keys(res.data));
      if (res.data && res.data.access_token) {
        console.log('Access token length:', res.data.access_token.length);
      }
      if (res.data && res.data.user) {
        console.log('User roles:', res.data.user.roles);
      }

      // If admin token present, try documented protected endpoints
      if (res.data && res.data.access_token) {
        console.log('Testing documented admin endpoints:');
        const endpoints = [
          '/api/admin/statistics/dashboard', // Dashboard statistics
          '/api/admin/statistics/orders',    // Order statistics
          '/api/vouchers'                    // Vouchers endpoint
        ];

        for (const endpoint of endpoints) {
          console.log(`\nTesting ${endpoint}...`);
          try {
            const resp = await axios.get(`${BASE_URL}${endpoint}`, {
              headers: { Authorization: `Bearer ${res.data.access_token}` },
              timeout: 20000
            });
            console.log('Status:', resp.status);
            if (resp.data) {
              if (typeof resp.data === 'object') {
                console.log('Response keys:', Object.keys(resp.data));
              } else {
                console.log('Response type:', typeof resp.data);
              }
            }
          } catch (err) {
            console.error('Endpoint failed:', err.response ? {
              status: err.response.status,
              data: err.response.data
            } : err.message);
          }
        }
      }

    } catch (err) {
      console.error('Login failed:', err.response ? {
        status: err.response.status,
        data: err.response.data
      } : err.message);
    }
  }
}

main().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
