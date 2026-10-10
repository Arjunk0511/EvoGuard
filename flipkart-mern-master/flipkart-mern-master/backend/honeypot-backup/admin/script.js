// Generate a session ID when the honeypot page is opened
let sessionId = sessionStorage.getItem('honeypotSessionId');

if (!sessionId) {
    sessionId =
        'hp_' +
        Date.now() +
        '_' +
        Math.random().toString(36).substring(2, 8);

    sessionStorage.setItem('honeypotSessionId', sessionId);
}


// Send an interaction to the backend
async function recordEvent(interactionType, endpoint) {

    try {

        await fetch('/api/v1/honeypot/events', {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({

                sessionId: sessionId,

                attackType: 'ADMIN_ENUMERATION',

                honeypotType: 'ADMIN',

                originalEndpoint: null,

                honeypotEndpoint: endpoint,

                interactionType: interactionType,

                metadata: {
                    source: 'fake-admin-dashboard'
                }

            })

        });

    } catch (error) {

        console.error(
            'Failed to record honeypot event:',
            error
        );

    }
}


// Record initial page visit
recordEvent(
    'PAGE_VIEW',
    '/honeypot/admin'
);


// Navigation
function navigate(page) {

    recordEvent(
        'NAVIGATION',
        `/honeypot/admin/${page}`
    );


    const dashboardPage =
        document.getElementById('dashboardPage');

    const dynamicPage =
        document.getElementById('dynamicPage');

    const pageTitle =
        document.getElementById('pageTitle');

    const dynamicTitle =
        document.getElementById('dynamicTitle');

    const dynamicContent =
        document.getElementById('dynamicContent');


    if (page === 'dashboard') {

        dashboardPage.classList.remove('hidden');
        dynamicPage.classList.add('hidden');

        pageTitle.textContent = 'Dashboard';

        return;
    }


    dashboardPage.classList.add('hidden');
    dynamicPage.classList.remove('hidden');


    pageTitle.textContent =
        page.charAt(0).toUpperCase() +
        page.slice(1);

    dynamicTitle.textContent =
        page.charAt(0).toUpperCase() +
        page.slice(1);


    if (page === 'users') {

        recordEvent(
            'CLICK_USERS',
            '/honeypot/admin/users'
        );

        dynamicContent.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Status</th>
                    </tr>
                </thead>

                <tbody>
                    <tr>
                        <td>USR001</td>
                        <td>Rahul Sharma</td>
                        <td>rahul@example.test</td>
                        <td>Active</td>
                    </tr>

                    <tr>
                        <td>USR002</td>
                        <td>Priya Singh</td>
                        <td>priya@example.test</td>
                        <td>Active</td>
                    </tr>

                    <tr>
                        <td>USR003</td>
                        <td>Arjun Kumar</td>
                        <td>arjun@example.test</td>
                        <td>Inactive</td>
                    </tr>
                </tbody>
            </table>
        `;
    }


    else if (page === 'orders') {

        recordEvent(
            'CLICK_ORDERS',
            '/honeypot/admin/orders'
        );

        dynamicContent.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Status</th>
                    </tr>
                </thead>

                <tbody>
                    <tr>
                        <td>ORD1001</td>
                        <td>Customer A</td>
                        <td>₹4,250</td>
                        <td>Delivered</td>
                    </tr>

                    <tr>
                        <td>ORD1002</td>
                        <td>Customer B</td>
                        <td>₹2,180</td>
                        <td>Processing</td>
                    </tr>
                </tbody>
            </table>
        `;
    }


    else if (page === 'products') {

        recordEvent(
            'CLICK_PRODUCTS',
            '/honeypot/admin/products'
        );

        dynamicContent.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Product ID</th>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Stock</th>
                    </tr>
                </thead>

                <tbody>
                    <tr>
                        <td>PRD001</td>
                        <td>Wireless Headphones</td>
                        <td>₹2,999</td>
                        <td>84</td>
                    </tr>

                    <tr>
                        <td>PRD002</td>
                        <td>Smart Watch</td>
                        <td>₹4,499</td>
                        <td>32</td>
                    </tr>
                </tbody>
            </table>
        `;
    }


    else if (page === 'settings') {

        recordEvent(
            'CLICK_SETTINGS',
            '/honeypot/admin/settings'
        );

        dynamicContent.innerHTML = `
            <p>Administrator configuration panel.</p>

            <br>

            <button
                onclick="recordEvent(
                    'FORM_SUBMIT',
                    '/honeypot/admin/settings'
                )"
            >
                Save Settings
            </button>
        `;
    }
}