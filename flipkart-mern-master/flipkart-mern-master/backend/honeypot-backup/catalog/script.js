// ==================================================
// Honeypot Session
// ==================================================

let sessionId =
    sessionStorage.getItem('honeypotSessionId');

if (!sessionId) {

    sessionId =
        'hp_' +
        Date.now() +
        '_' +
        Math.random()
            .toString(36)
            .substring(2, 8);

    sessionStorage.setItem(
        'honeypotSessionId',
        sessionId
    );
}


// ==================================================
// Event logging
// ==================================================

async function recordEvent(
    interactionType,
    endpoint,
    metadata = {}
) {

    try {

        await fetch(
            '/api/v1/honeypot/events',
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({

                    sessionId: sessionId,

                    attackType: 'BOT_TRAFFIC',

                    honeypotType: 'CATALOG',

                    originalEndpoint: null,

                    honeypotEndpoint: endpoint,

                    interactionType: interactionType,

                    metadata: metadata

                })
            }
        );

    } catch (error) {

        console.error(
            'Honeypot logging error:',
            error
        );
    }
}


// ==================================================
// Fake products
// ==================================================

const products = [

    {
        id: 'HP001',
        name: 'Wireless Headphones',
        category: 'Electronics',
        price: 2999,
        icon: '🎧',
        description:
            'Wireless headphones with noise cancellation and long battery life.'
    },

    {
        id: 'HP002',
        name: 'Smart Watch',
        category: 'Electronics',
        price: 4499,
        icon: '⌚',
        description:
            'Smart watch with activity tracking and notifications.'
    },

    {
        id: 'HP003',
        name: 'Mechanical Keyboard',
        category: 'Electronics',
        price: 1499,
        icon: '⌨️',
        description:
            'Mechanical keyboard designed for productivity and gaming.'
    },

    {
        id: 'HP004',
        name: 'Laptop Backpack',
        category: 'Accessories',
        price: 1899,
        icon: '🎒',
        description:
            'Water-resistant backpack with dedicated laptop compartment.'
    },

    {
        id: 'HP005',
        name: 'Running Shoes',
        category: 'Fashion',
        price: 3299,
        icon: '👟',
        description:
            'Lightweight running shoes for everyday training.'
    },

    {
        id: 'HP006',
        name: 'Cotton Hoodie',
        category: 'Fashion',
        price: 2199,
        icon: '👕',
        description:
            'Comfortable cotton hoodie for casual everyday wear.'
    },

    {
        id: 'HP007',
        name: 'Desk Lamp',
        category: 'Home',
        price: 1299,
        icon: '💡',
        description:
            'Adjustable LED desk lamp with multiple brightness levels.'
    },

    {
        id: 'HP008',
        name: 'Coffee Maker',
        category: 'Home',
        price: 3999,
        icon: '☕',
        description:
            'Compact coffee maker for home and office use.'
    },

    {
        id: 'HP009',
        name: 'Bluetooth Speaker',
        category: 'Electronics',
        price: 2499,
        icon: '🔊',
        description:
            'Portable Bluetooth speaker with powerful audio.'
    },

    {
        id: 'HP010',
        name: 'Travel Wallet',
        category: 'Accessories',
        price: 899,
        icon: '👝',
        description:
            'Compact travel wallet with multiple compartments.'
    },

    {
        id: 'HP011',
        name: 'Gaming Mouse',
        category: 'Electronics',
        price: 1799,
        icon: '🖱️',
        description:
            'Responsive gaming mouse with programmable buttons.'
    },

    {
        id: 'HP012',
        name: 'Water Bottle',
        category: 'Accessories',
        price: 699,
        icon: '🥤',
        description:
            'Reusable insulated water bottle.'
    }
];


// ==================================================
// DOM elements
// ==================================================

const productGrid =
    document.getElementById('productGrid');

const resultCount =
    document.getElementById('resultCount');

const searchInput =
    document.getElementById('searchInput');

const searchButton =
    document.getElementById('searchButton');

const productDetails =
    document.getElementById('productDetails');

const detailsContent =
    document.getElementById('detailsContent');

const closeDetails =
    document.getElementById('closeDetails');


// ==================================================
// Display products
// ==================================================

function displayProducts(productList) {

    productGrid.innerHTML = '';

    resultCount.textContent =
        `${productList.length} products`;


    if (productList.length === 0) {

        productGrid.innerHTML = `
            <div class="empty">
                No products found.
            </div>
        `;

        return;
    }


    productList.forEach(product => {

        const card =
            document.createElement('div');

        card.className =
            'product-card';


        card.innerHTML = `

            <div class="product-image">
                ${product.icon}
            </div>

            <div class="product-info">

                <div class="product-category">
                    ${product.category}
                </div>

                <div class="product-name">
                    ${product.name}
                </div>

                <div class="product-price">
                    ₹${product.price.toLocaleString('en-IN')}
                </div>

                <button
                    class="view-button"
                    data-id="${product.id}"
                >
                    View Product
                </button>

            </div>
        `;


        productGrid.appendChild(card);
    });


    document
        .querySelectorAll('.view-button')
        .forEach(button => {

            button.addEventListener(
                'click',
                () => {

                    const product =
                        products.find(
                            item =>
                                item.id ===
                                button.dataset.id
                        );

                    showProduct(product);
                }
            );
        });
}


// ==================================================
// Product details
// ==================================================

function showProduct(product) {

    if (!product) {
        return;
    }


    recordEvent(
        'PRODUCT_VIEW',
        `/honeypot/catalog/product/${product.id}`,
        {
            productId: product.id,
            category: product.category
        }
    );


    productGrid.classList.add('hidden');

    productDetails.classList.remove('hidden');


    detailsContent.innerHTML = `

        <div class="details-layout">

            <div class="details-image">
                ${product.icon}
            </div>

            <div class="details-info">

                <div class="product-category">
                    ${product.category}
                </div>

                <h2>
                    ${product.name}
                </h2>

                <div class="price">
                    ₹${product.price.toLocaleString('en-IN')}
                </div>

                <p>
                    ${product.description}
                </p>

                <br>

                <button
                    id="fakeCartButton"
                >
                    Add to Cart
                </button>

            </div>

        </div>
    `;


    document
        .getElementById('fakeCartButton')
        .addEventListener(
            'click',
            () => {

                recordEvent(
                    'ADD_TO_CART',
                    `/honeypot/catalog/cart`,
                    {
                        productId: product.id
                    }
                );

                alert(
                    'Product added to cart.'
                );
            }
        );
}


// ==================================================
// Close product details
// ==================================================

closeDetails.addEventListener(
    'click',
    () => {

        recordEvent(
            'NAVIGATION',
            '/honeypot/catalog'
        );

        productDetails.classList.add('hidden');

        productGrid.classList.remove('hidden');
    }
);


// ==================================================
// Search
// ==================================================

function performSearch() {

    const searchTerm =
        searchInput.value
            .trim()
            .toLowerCase();


    const filteredProducts =
        products.filter(product =>

            product.name
                .toLowerCase()
                .includes(searchTerm)

            ||

            product.category
                .toLowerCase()
                .includes(searchTerm)
        );


    recordEvent(
        'SEARCH',
        '/honeypot/catalog/search',
        {
            queryLength: searchTerm.length,
            resultCount: filteredProducts.length
        }
    );


    displayProducts(filteredProducts);
}


searchButton.addEventListener(
    'click',
    performSearch
);


searchInput.addEventListener(
    'keydown',
    event => {

        if (event.key === 'Enter') {
            performSearch();
        }
    }
);


// ==================================================
// Category filtering
// ==================================================

document
    .querySelectorAll(
        '[data-category]'
    )
    .forEach(element => {

        element.addEventListener(
            'click',
            event => {

                event.preventDefault();

                const category =
                    element.dataset.category;


                let filteredProducts;


                if (category === 'All') {

                    filteredProducts =
                        products;

                } else {

                    filteredProducts =
                        products.filter(
                            product =>
                                product.category ===
                                category
                        );
                }


                recordEvent(
                    'CATEGORY_CLICK',
                    `/honeypot/catalog/category/${category}`,
                    {
                        category: category,
                        resultCount:
                            filteredProducts.length
                    }
                );


                displayProducts(
                    filteredProducts
                );
            }
        );
    });


// ==================================================
// Initial page visit
// ==================================================

recordEvent(
    'PAGE_VIEW',
    '/honeypot/catalog'
);


// ==================================================
// Initial products
// ==================================================

displayProducts(products);