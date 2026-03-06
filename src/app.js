// Intersection Observer para animaciones al scrollear
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            console.log("Element revealing:", entry.target.tagName, entry.target.className);
            entry.target.classList.add('active');
        }
    });
}, observerOptions);

function initAnimations() {
    const elements = document.querySelectorAll('h1, h2, p, .product-card, .carousel-card, img, button:not(.filter-btn), input');
    elements.forEach(el => {
        if (!el.classList.contains('reveal') && !el.classList.contains('active')) {
            el.classList.add('reveal');
            observer.observe(el);
        }
    });
}

let products = {};
let bestSellers = [];
let cart = [];
let currentProduct = null;
let selectedQty = 1;
let selectedColor = 'Blanco';
let currentPayment = 'transfer';

let carouselInterval = null;

async function initApp() {
    // Start carousel immediately, don't wait for API
    startHeroCarousel();

    try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        products = data.products;
        bestSellers = data.bestSellers;
        console.log("Data loaded from API:", { products, bestSellers });

        renderGrid();
        renderBestSellers();
        initAnimations();
    } catch (error) {
        console.error("Error loading products:", error);
    }
}

function startHeroCarousel() {
    if (carouselInterval) return; // Prevent multiple intervals

    const slides = document.querySelectorAll('.carousel-slide');
    if (slides.length <= 1) return;

    console.log("Starting Hero Carousel...");
    let current = 0;
    carouselInterval = setInterval(() => {
        slides[current].classList.remove('active');
        current = (current + 1) % slides.length;
        slides[current].classList.add('active');
    }, 5000);
}

function renderBestSellers() {
    const container = document.getElementById('best-sellers-scroll');
    if (!container) return;

    container.innerHTML = bestSellers.map(id => {
        const prod = products[id];
        if (!prod) return '';
        return `
            <div class="carousel-card bg-white border border-black p-6 group cursor-pointer hover:shadow-xl transition-all duration-500" onclick="openProduct('${id}')">
                <div class="aspect-square bg-gray-50 mb-6 overflow-hidden flex items-center justify-center relative">
                    <img src="${prod.images[0]}" alt="${prod.name}" class="object-cover w-full h-full mix-blend-multiply opacity-100 group-hover:scale-110 transition-transform duration-700">
                    <div class="absolute top-0 right-0 bg-black text-white text-[8px] px-3 py-1 font-black uppercase tracking-widest">Top Sold</div>
                </div>
                <h3 class="font-black text-lg uppercase tracking-tighter mb-1">${prod.name}</h3>
                <p class="mono text-[10px] text-zinc-400 uppercase mb-4">${prod.category}</p>
                <div class="flex justify-between items-center">
                    <span class="font-black text-sm">$${prod.price.toLocaleString()}</span>
                    <span class="text-[9px] font-bold uppercase tracking-widest border-b border-black pb-1 group-hover:text-orange-400 group-hover:border-orange-400 transition-colors">Ver Producto</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderGrid(filter = 'all') {
    console.log("--- renderGrid Start ---");
    console.log("Filter:", filter);
    const grid = document.getElementById('products-grid');
    if (!grid) {
        console.error("CRITICAL: Grid element 'products-grid' not found in DOM.");
        return;
    }

    const entries = Object.entries(products).filter(([id, prod]) => {
        if (filter === 'all') return true;
        if (filter === 'Decoración') return prod.category.includes('Decoración') || prod.category.includes('Arte');
        return prod.category.includes(filter);
    });
    console.log("Entries to render:", entries.length);

    grid.innerHTML = entries.map(([id, prod], index) => `
        <div id="product-card-${id}" class="product-card p-8 flex flex-col bg-white" style="transition-delay: ${index * 100}ms" onclick="openProduct('${id}')">
            <div class="aspect-square bg-gray-50 mb-8 relative overflow-hidden flex items-center justify-center group">
                <img src="${prod.images[0]}" alt="${prod.name}" class="object-cover w-full h-full mix-blend-multiply opacity-70 grayscale group-hover:grayscale-0 transition-all duration-500">
                <div class="absolute top-0 left-0 mono text-[9px] bg-black text-white px-3 py-1 uppercase tracking-widest font-bold">${prod.code}</div>
            </div>
            <div class="flex justify-between items-baseline mb-3">
                <h3 class="font-black text-xl uppercase tracking-tighter">${prod.name}</h3>
                <span class="mono font-bold text-sm">$${prod.price.toLocaleString()}</span>
            </div>
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6 italic">${prod.category}</p>
            
            <div class="mt-auto flex flex-col gap-3">
                <button class="btn-orange py-4 text-[10px] font-black uppercase tracking-[0.2em] w-full" 
                        onclick="event.stopPropagation(); openProduct('${id}')">
                    Ver Detalles
                </button>
                <button class="text-black border border-black py-4 text-[10px] font-black uppercase tracking-[0.2em] w-full hover:bg-black hover:text-white transition-all duration-300" 
                        onclick="event.stopPropagation(); addToCart('${id}', '${prod.name}', ${prod.price}, 1, 'Blanco')">
                    Añadir al Carrito
                </button>
            </div>
        </div>
    `).join('');
    console.log("HTML injected into grid.");
    initAnimations();
}

function filterGrid(category, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderGrid(category);
}

function showView(view) {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('view-active'));
    document.getElementById(`view-${view}`).classList.add('view-active');
    window.scrollTo(0, 0);
}

function openProduct(id) {
    const prod = products[id];
    currentProduct = prod;
    selectedQty = 1;
    selectedColor = 'Blanco';

    document.getElementById('detail-name').innerText = prod.name;
    document.getElementById('detail-desc').innerText = prod.desc;
    document.getElementById('detail-category').innerText = `Categoría: ${prod.category} / V.03 Build`;
    document.getElementById('detail-price').innerText = `$${prod.price.toLocaleString()}`;
    document.getElementById('detail-material').innerText = prod.material;
    document.getElementById('detail-time').innerText = prod.time;
    document.getElementById('detail-dims').innerText = prod.dims;
    document.getElementById('image-code').innerText = `REF: ${prod.code}`;
    document.getElementById('qty-value').innerText = selectedQty;

    const mainImg = document.getElementById('main-image');
    mainImg.src = prod.images[0];

    const thumbContainer = document.getElementById('thumbnails-container');
    thumbContainer.innerHTML = prod.images.map((img, index) => `
        <div onclick="updateMainImage('${img}', this)" class="thumbnail border border-black aspect-square bg-gray-50 overflow-hidden ${index === 0 ? 'active' : ''}">
            <img src="${img}" class="w-full h-full object-cover mix-blend-multiply">
        </div>
    `).join('');

    document.getElementById('add-to-cart-detail').onclick = () => {
        addToCart(id, prod.name, prod.price, selectedQty, selectedColor);
    };

    showView('detail');
}

function updateMainImage(src, thumbEl) {
    const mainImg = document.getElementById('main-image');
    mainImg.style.opacity = '0';
    setTimeout(() => {
        mainImg.src = src;
        mainImg.style.opacity = '1';
    }, 200);
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    thumbEl.classList.add('active');
}

function selectColor(color, el) {
    selectedColor = color;
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    el.classList.add('active');
}

function changeQty(val) {
    selectedQty = Math.max(1, selectedQty + val);
    document.getElementById('qty-value').innerText = selectedQty;
}

function toggleCart() {
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const isOpen = !cartSidebar.classList.contains('translate-x-full');
    if (isOpen) {
        cartSidebar.classList.add('translate-x-full');
        cartOverlay.classList.add('hidden');
        cartOverlay.classList.remove('opacity-100');
    } else {
        cartSidebar.classList.remove('translate-x-full');
        cartOverlay.classList.remove('hidden');
        setTimeout(() => cartOverlay.classList.add('opacity-100'), 10);
    }
}

function addToCart(id, name, price, qty = 1, color = 'N/A') {
    const cartId = `${id}-${color}`;
    const existingItem = cart.find(item => item.cartId === cartId);
    if (existingItem) {
        existingItem.qty += qty;
    } else {
        cart.push({ cartId, id, name, price, qty, color });
    }
    renderCart();
    toggleCart();
}

function removeFromCart(id) {
    cart = cart.filter(item => item.cartId !== id);
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');

    if (cart.length === 0) {
        container.innerHTML = '<div class="flex flex-col items-center justify-center h-40 opacity-20"><p class="mono text-[10px] uppercase font-bold">Vacío</p></div>';
        cartCount.innerText = '0';
        cartTotal.innerText = '$0';
        return;
    }

    let total = 0;
    let count = 0;

    container.innerHTML = cart.map(item => {
        total += item.price * item.qty;
        count += item.qty;
        return `
            <div class="flex gap-6 items-start pb-8 border-b border-gray-100 last:border-0">
                <div class="w-16 h-16 bg-gray-50 flex-shrink-0 flex items-center justify-center relative border border-gray-100">
                     <div class="absolute -top-1 -left-1 bg-black text-[8px] text-white px-1 font-bold mono">x${item.qty}</div>
                </div>
                <div class="flex-grow">
                    <div class="flex justify-between items-start">
                        <h4 class="text-[11px] font-black uppercase tracking-tight leading-tight mb-1">${item.name}</h4>
                        <button onclick="removeFromCart('${item.cartId}')" class="text-gray-300 hover:text-black">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                    <p class="mono text-[9px] text-gray-400 uppercase">COLOR: ${item.color}</p>
                    <p class="text-xs font-black mt-3">$${(item.price * item.qty).toLocaleString()}</p>
                </div>
            </div>
        `;
    }).join('');

    cartCount.innerText = count;
    cartTotal.innerText = '$' + total.toLocaleString();
}

function selectPayment(method, el) {
    currentPayment = method;
    document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
    document.querySelectorAll('.payment-detail-block').forEach(b => b.classList.add('hidden'));
    document.getElementById(`details-${method}`).classList.remove('hidden');
}

function goToCheckout() {
    if (cart.length === 0) return;
    toggleCart();
    renderCheckout();
    showView('checkout');
}

function renderCheckout() {
    let subtotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
    document.getElementById('checkout-subtotal').innerText = `$${subtotal.toLocaleString()}`;
    document.getElementById('checkout-total').innerText = `$${(subtotal + 1500).toLocaleString()}`;
    document.getElementById('checkout-items').innerHTML = cart.map(i => `
        <div class="flex justify-between text-[10px] mono uppercase">
            <span>${i.qty}x ${i.name}</span>
            <span>$${(i.price * i.qty).toLocaleString()}</span>
        </div>
    `).join('');
}

const whatsappNumber = "5491169348674";

function sendWhatsAppReceipt() {
    const orderId = document.getElementById('success-order-id').innerText;
    const message = encodeURIComponent(`Hola VOLUMEN! Envío el comprobante de mi pedido ${orderId}.`);
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
}

async function processFinalPayment() {
    const btn = document.querySelector('#view-checkout .btn-orange');
    const originalText = btn.innerText;

    const customerData = {
        name: document.querySelector('input[placeholder="NOMBRE COMPLETO"]').value,
        email: document.querySelector('input[placeholder="EMAIL"]').value,
        phone: document.querySelector('input[placeholder="TELÉFONO"]').value,
        address: document.querySelector('input[placeholder="DIRECCIÓN"]').value,
        city: document.querySelector('input[placeholder="CIUDAD"]').value,
        zip: document.querySelector('input[placeholder="CÓDIGO POSTAL"]').value
    };

    if (!customerData.name || !customerData.email || !customerData.phone) {
        alert("Por favor completa los datos de contacto y teléfono.");
        return;
    }

    let API_URL = '';
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        API_URL = 'http://localhost:3001';
    }

    console.log("Using API_URL:", API_URL || "(relative)");

    btn.disabled = true;

    if (currentPayment === 'mercadopago') {
        btn.innerText = "REDIRECCIONANDO...";
        try {
            const response = await fetch(`${API_URL}/create_preference`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart,
                    customer: customerData
                }),
            });

            if (!response.ok) throw new Error('Error en el servidor');
            const preference = await response.json();

            const mp = new MercadoPago('APP_USR-4546c1d5-aa74-459f-b2f9-a53078b94d60', { locale: 'es-AR' });
            mp.checkout({ preference: { id: preference.id }, autoOpen: true });
        } catch (error) {
            console.error('Error:', error);
            alert('Error con Mercado Pago.');
            btn.innerText = originalText;
            btn.disabled = false;
        }
        return;
    }

    if (currentPayment === 'transfer') {
        btn.innerText = "PROCESANDO PEDIDO...";
        try {
            const response = await fetch(`${API_URL}/confirm_transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart,
                    customer: customerData,
                    total: document.getElementById('checkout-total').innerText
                }),
            });

            if (!response.ok) throw new Error('Error al enviar el pedido');
            const result = await response.json();

            document.getElementById('success-order-id').innerText = `Orden ID: ${result.orderId}`;
            document.getElementById('transfer-whatsapp-container').classList.remove('hidden');

            cart = [];
            renderCart();
            showView('success');
        } catch (error) {
            console.error('Error:', error);
            alert('Error al procesar el pedido por transferencia.');
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }
}

// Attach functions to window for global access
window.initApp = initApp;
window.renderBestSellers = renderBestSellers;
window.renderGrid = renderGrid;
window.filterGrid = filterGrid;
window.showView = showView;
window.openProduct = openProduct;
window.updateMainImage = updateMainImage;
window.selectColor = selectColor;
window.changeQty = changeQty;
window.toggleCart = toggleCart;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.renderCart = renderCart;
window.selectPayment = selectPayment;
window.goToCheckout = goToCheckout;
window.renderCheckout = renderCheckout;
window.sendWhatsAppReceipt = sendWhatsAppReceipt;
window.processFinalPayment = processFinalPayment;

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event Fired");
    initApp();

    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    if (status === 'success') {
        cart = [];
        renderCart();
        document.getElementById('transfer-whatsapp-container').classList.add('hidden');
        showView('success');
    } else if (status === 'failure') {
        alert('El pago no pudo procesarse. Por favor, intenta de nuevo.');
        showView('checkout');
    }
});

window.onload = () => {
    console.log("Window Load event Fired");
    const grid = document.getElementById('products-grid');
    if (grid && !grid.children.length && Object.keys(products).length === 0) {
        console.log("Grid empty and products not loaded, calling initApp...");
        initApp();
    }
};
