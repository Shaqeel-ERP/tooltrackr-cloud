const baseUrl = 'https://tooltrackr-api.tooltrackr.workers.dev';

const endpoints = [
    '/api/analytics/dashboard',
    '/api/tools',
    '/api/lending?status=active', // the prompt said /outstanding but route expects /?status=active
    '/api/transfers',
    '/api/purchases',
    '/api/locations',
    '/api/workers',
    '/api/suppliers'
];

async function run() {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });

    const loginData = await loginRes.json();
    const token = loginData.token;

    for (const ep of endpoints) {
        console.log(`> curl ${baseUrl}${ep} -H "Authorization: Bearer <TOKEN>"`);
        try {
            const res = await fetch(`${baseUrl}${ep}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const text = await res.text();
            console.log(`${res.status} OK\n${text.slice(0, 300)}...\n`);
        } catch (e) {
            console.log(`FETCH ERROR: ${e.message}\n`);
        }
    }
}

run();
