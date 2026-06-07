// script.js

let products = [];

// Fetch products from JSON file
async function fetchProducts() {
    try {
        const response = await fetch('products.json');
        if (!response.ok) throw new Error('Failed to fetch products');
        products = await response.json();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Default placeholder icon (medical cross style) in case there is no image
const defaultImage = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%230d6efd' viewBox='0 0 16 16'%3E%3Cpath d='M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z'/%3E%3Cpath d='M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z'/%3E%3C/svg%3E";

/**
 * Render the product grid on the homepage
 * @param {Array} productList - Array of products to render
 */
function renderProducts(productList) {
    const grid = document.getElementById('productGrid');
    const emptyState = document.getElementById('emptyState');
    
    // Check if we are on the homepage (grid exists)
    if (!grid) return;

    grid.innerHTML = ''; // Clear current products

    if (productList.length === 0) {
        emptyState.classList.remove('d-none');
    } else {
        emptyState.classList.add('d-none');
        
        productList.forEach(product => {
            const imgPath = product.image ? product.image : defaultImage;
            const displayName = product.name_en;

            // Create column element
            const col = document.createElement('div');
            col.className = 'col-12 col-md-6 col-lg-4';
            
            // Build card HTML
            col.innerHTML = `
                <div class="card product-card h-100" onclick="goToDetails(${product.id})">
                    <div class="product-img-wrapper">
                        <img src="${imgPath}" alt="${product.name_en}" loading="lazy">
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title text-center mb-4" style="min-height: 48px; font-weight:700;">${displayName}</h5>
                        <div class="mt-auto d-flex justify-content-between align-items-center gap-2" onclick="event.stopPropagation()">
                            <button class="btn btn-primary-custom btn-icon flex-grow-1 text-white" onclick="openIFU('${product.pdf}')">
                                <i class="bi bi-file-earmark-pdf"></i> View IFU
                            </button>
                            <button class="btn btn-outline-secondary btn-icon" onclick="shareProduct(${product.id}, '${product.name_en.replace(/'/g, "\\'")}')" title="Share Product">
                                <i class="bi bi-share"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            grid.appendChild(col);
        });
    }
}

/**
 * Real-time search filter function
 */
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filteredProducts = products.filter(p => {
            // Search in both English, Arabic names, and optional keywords
            const matchEn = p.name_en.toLowerCase().includes(query);
            const matchAr = p.name_ar.toLowerCase().includes(query);
            const matchKeywords = p.keywords ? p.keywords.toLowerCase().includes(query) : false;
            return matchEn || matchAr || matchKeywords;
        });
        renderProducts(filteredProducts);
    });
}

/**
 * Opens the IFU PDF in a new tab
 * @param {string} pdfUrl 
 */
function openIFU(pdfUrl) {
    window.open(pdfUrl, '_blank');
}

/**
 * Navigate to the product details page
 * @param {number} productId 
 */
function goToDetails(productId) {
    window.location.href = `product.html?id=${productId}`;
}

/**
 * Handles sharing functionality using Web Share API or Clipboard fallback
 * @param {number} id 
 * @param {string} name 
 */
async function shareProduct(id, name) {
    // Find the product to get its PDF link
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    // Determine the absolute PDF URL
    let pdfUrl = product.pdf;
    if (!pdfUrl.startsWith('http')) {
        let basePath = window.location.pathname;
        if (basePath.endsWith('html')) {
            basePath = basePath.substring(0, basePath.lastIndexOf('/'));
        } else if (basePath.endsWith('/')) {
            basePath = basePath.slice(0, -1);
        }
        const baseUrl = window.location.origin + basePath;
        pdfUrl = `${baseUrl}/${pdfUrl}`;
    }
    
    // Encode the URL to replace spaces with %20 so that Whatsapp links do not break
    pdfUrl = encodeURI(pdfUrl);
    
    const shareData = {
        title: `AlSafwa - ${name} IFU`,
        text: `Here is the Instruction For Use (IFU) for ${name}:`,
        url: pdfUrl
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
            showToast('PDF link shared successfully!');
        } else {
            await navigator.clipboard.writeText(pdfUrl);
            showToast('PDF link copied to clipboard!');
        }
    } catch (err) {
        console.error('Error sharing:', err);
        if (err.name !== 'AbortError') {
            showToast('Failed to share PDF link.');
        }
    }
}

/**
 * Display a Bootstrap Toast message
 * @param {string} message 
 */
function showToast(message) {
    const toastEl = document.getElementById('shareToast');
    const msgEl = document.getElementById('toastMessage');
    if (toastEl && msgEl) {
        msgEl.textContent = message;
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }
}

/**
 * Loads and renders product details on the product.html page
 */
function loadProductDetails() {
    const container = document.getElementById('productDetailsContainer');
    if (!container) return;

    // Get product ID from URL query string
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    
    const product = products.find(p => p.id === productId);

    if (product) {
        const imgPath = product.image ? product.image : defaultImage;
        const displayName = product.name_ar ? `${product.name_en} - ${product.name_ar}` : product.name_en;

        container.innerHTML = `
            <div class="row align-items-center">
                <div class="col-md-6 mb-4 mb-md-0">
                    <div class="details-image-wrapper p-4 bg-white rounded shadow-sm d-flex justify-content-center">
                        <img src="${imgPath}" alt="${product.name_en}" class="img-fluid" style="max-height: 400px; object-fit: contain;">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="details-card">
                        <h2 class="fw-bold mb-4">${displayName}</h2>
                        <p class="text-muted mb-5">High-quality product from AlSafwa. Explore the features and detailed instructions for use by downloading the PDF manual below.</p>
                        
                        <div class="d-grid gap-3 d-md-flex justify-content-md-start">
                            <button class="btn btn-primary-custom btn-icon btn-lg text-white px-4" onclick="openIFU('${product.pdf}')">
                                <i class="bi bi-file-earmark-pdf"></i> Open IFU PDF
                            </button>
                            <button class="btn btn-outline-secondary btn-icon btn-lg px-4" onclick="shareProduct(${product.id}, '${product.name_en.replace(/'/g, "\\'")}')">
                                <i class="bi bi-share"></i> Share Product
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-exclamation-triangle display-1 text-warning"></i>
                <h2 class="mt-4">Product Not Found</h2>
                <p class="text-muted">The product you are looking for does not exist or has been removed.</p>
                <a href="index.html" class="btn btn-primary-custom mt-3">Go to Homepage</a>
            </div>
        `;
    }
}

// Initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    await fetchProducts(); // Wait for products to load

    // Initialize homepage if productGrid exists
    if (document.getElementById('productGrid')) {
        renderProducts(products);
        setupSearch();
    }
    
    // Initialize product.html if productDetailsContainer exists
    if (document.getElementById('productDetailsContainer')) {
        loadProductDetails();
    }
});
