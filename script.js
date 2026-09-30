/**
 * The Purna Fork - Enterprise Restaurant Engine
 * Unified logic for Cart, Menu, Table Reservations, VIP Accounts, Reviews, Admin & PWA
 */

// ==========================================
// 1. CONFIGURATION & STATE MANAGEMENT
// ==========================================
const API_BASE = '/api';

const state = {
  theme: localStorage.getItem('pf_theme') || 'dark',
  cart: JSON.parse(localStorage.getItem('pf_cart') || '[]'),
  appliedCoupon: JSON.parse(localStorage.getItem('pf_coupon') || 'null'),
  user: JSON.parse(localStorage.getItem('pf_user') || 'null'),
  menuItems: [],
  selectedDishForCustomization: null
};

// Apply initial theme
document.documentElement.setAttribute('data-theme', state.theme);

// ==========================================
// 2. DOM INITIALIZATION & SHARED UI INJECTION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initThemeToggle();
  injectEnterpriseUI();
  initCartListeners();
  initPWA();
  
  // Page specific initializers
  if (document.getElementById('menuGrid')) {
    loadDynamicMenu();
  }
  if (document.getElementById('reservationForm') || document.getElementById('manageBookingForm')) {
    initReservationPage();
  }
  if (document.getElementById('reviewsContainer')) {
    loadCustomerReviews();
  }
  if (document.getElementById('adminApp')) {
    initAdminDashboard();
  }
  if (document.getElementById('accountApp')) {
    initAccountPage();
  }
  
  updateCartBadge();
});

// Mobile Navigation
function initMobileNav() {
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navMenu.classList.remove('active');
    }));
  }
}

// Dark / Light Theme Toggle
function initThemeToggle() {
  updateThemeIcon();
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('pf_theme', state.theme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const icon = document.getElementById('themeToggleIcon');
  if (icon) {
    icon.className = state.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
}

// ==========================================
// 3. ENTERPRISE UI INJECTION (Cart Drawer & Modals)
// ==========================================
function injectEnterpriseUI() {
  // Inject Cart Drawer & Backdrop into body if not present
  if (!document.getElementById('cartDrawer')) {
    const cartHTML = `
      <!-- Cart Backdrop -->
      <div id="cartBackdrop" class="cart-backdrop" onclick="toggleCartDrawer(false)"></div>

      <!-- Slide-over Cart Drawer -->
      <div id="cartDrawer" class="cart-drawer">
        <div class="cart-header">
          <h3><i class="fas fa-shopping-bag"></i> Your Order</h3>
          <button class="cart-close-btn" onclick="toggleCartDrawer(false)"><i class="fas fa-times"></i></button>
        </div>
        <div id="cartBody" class="cart-body">
          <!-- Populated by JS -->
        </div>
        <div id="cartFooter" class="cart-footer">
          <div class="coupon-row">
            <input type="text" id="couponInput" class="coupon-input" placeholder="Promo Code (e.g. FORK10)" />
            <button class="coupon-btn" onclick="applyPromoCoupon()">Apply</button>
          </div>
          <div id="couponMessage" style="font-size: 12px; margin-bottom: 8px;"></div>
          
          <div class="cart-summary-line">
            <span>Subtotal</span>
            <span id="cartSubtotal">$0.00</span>
          </div>
          <div class="cart-summary-line" id="discountRow" style="display: none; color: #2ecc71;">
            <span>Discount (<span id="couponCodeBadge"></span>)</span>
            <span id="cartDiscount">-$0.00</span>
          </div>
          <div class="cart-summary-line">
            <span>Estimated Tax (8.25%)</span>
            <span id="cartTax">$0.00</span>
          </div>
          <div class="cart-summary-line total">
            <span>Estimated Total</span>
            <span id="cartTotal">$0.00</span>
          </div>
          
          <button id="checkoutBtn" class="btn btn-primary" style="width: 100%; margin-top: 14px;" onclick="openCheckoutModal()">
            Proceed to Checkout <i class="fas fa-arrow-right" style="margin-left: 8px;"></i>
          </button>
        </div>
      </div>

      <!-- Food Item Customization Modal -->
      <div id="customizationModal" class="custom-modal-backdrop">
        <div class="custom-modal-dialog">
          <button class="modal-close-x" onclick="closeCustomizationModal()"><i class="fas fa-times"></i></button>
          <div id="customizationModalContent">
            <!-- Populated dynamically -->
          </div>
        </div>
      </div>

      <!-- Multi-Step Checkout & Payment Modal -->
      <div id="checkoutModal" class="custom-modal-backdrop">
        <div class="custom-modal-dialog">
          <button class="modal-close-x" onclick="closeCheckoutModal()"><i class="fas fa-times"></i></button>
          <div id="checkoutModalContent">
            <!-- Checkout steps rendered by JS -->
          </div>
        </div>
      </div>

      <!-- Auth Modal (Sign In / Register) -->
      <div id="authModal" class="custom-modal-backdrop">
        <div class="custom-modal-dialog" style="max-width: 440px;">
          <button class="modal-close-x" onclick="closeAuthModal()"><i class="fas fa-times"></i></button>
          <div id="authModalContent">
            <!-- Rendered by JS -->
          </div>
        </div>
      </div>

      <!-- Review Submission Modal -->
      <div id="reviewModal" class="custom-modal-backdrop">
        <div class="custom-modal-dialog" style="max-width: 500px;">
          <button class="modal-close-x" onclick="closeReviewModal()"><i class="fas fa-times"></i></button>
          <h3 style="font-family: 'Playfair Display', serif; color: var(--accent-gold); margin-bottom: 8px;">Share Your Dining Experience</h3>
          <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 20px;">We value your feedback to continually elevate our culinary excellence.</p>
          
          <form id="submitReviewForm" onsubmit="handleReviewSubmit(event)">
            <div style="margin-bottom: 14px;">
              <label style="display: block; font-size: 13px; margin-bottom: 6px;">Your Name *</label>
              <input type="text" id="reviewAuthorName" class="coupon-input" style="width: 100%;" required placeholder="e.g. John Doe" />
            </div>
            <div style="margin-bottom: 14px;">
              <label style="display: block; font-size: 13px; margin-bottom: 6px;">Dish or Experience</label>
              <input type="text" id="reviewDishName" class="coupon-input" style="width: 100%;" placeholder="e.g. Prime Wagyu Ribeye" />
            </div>
            <div style="margin-bottom: 14px;">
              <label style="display: block; font-size: 13px; margin-bottom: 6px;">Your Rating *</label>
              <div class="star-rating-picker" id="starPicker">
                <i class="fas fa-star star active" data-rating="1" onclick="setReviewRating(1)"></i>
                <i class="fas fa-star star active" data-rating="2" onclick="setReviewRating(2)"></i>
                <i class="fas fa-star star active" data-rating="3" onclick="setReviewRating(3)"></i>
                <i class="fas fa-star star active" data-rating="4" onclick="setReviewRating(4)"></i>
                <i class="fas fa-star star active" data-rating="5" onclick="setReviewRating(5)"></i>
              </div>
            </div>
            <div style="margin-bottom: 20px;">
              <label style="display: block; font-size: 13px; margin-bottom: 6px;">Review Comments *</label>
              <textarea id="reviewText" class="coupon-input" style="width: 100%; height: 90px;" required placeholder="Tell us about the flavors, atmosphere, and service..."></textarea>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">Submit Review</button>
          </form>
        </div>
      </div>

      <!-- PWA Install Prompt Banner -->
      <div id="pwaInstallBanner" class="pwa-banner">
        <div style="display: flex; align-items: center; gap: 12px;">
          <i class="fas fa-utensils" style="font-size: 24px; color: var(--accent-gold);"></i>
          <div>
            <div style="font-weight: 600; font-size: 14px;">Install Purna Fork App</div>
            <div style="font-size: 12px; color: var(--text-secondary);">Fast ordering & offline table bookings</div>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="pwaInstallBtn" class="btn btn-primary" style="padding: 6px 14px; font-size: 12px;">Install</button>
          <button onclick="dismissPwaBanner()" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer;"><i class="fas fa-times"></i></button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', cartHTML);
  }

  // Inject navbar actions (Theme toggle, Cart button, User button, Admin link) into navbar
  const navContainer = document.querySelector('.nav-container');
  if (navContainer && !document.querySelector('.nav-actions')) {
    const navActions = document.createElement('div');
    navActions.className = 'nav-actions';
    navActions.innerHTML = `
      <button class="nav-btn-icon" onclick="toggleTheme()" title="Toggle Theme" aria-label="Toggle Theme">
        <i id="themeToggleIcon" class="${state.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'}"></i>
      </button>
      
      <button class="nav-btn-icon" onclick="openAuthModalOrAccount()" title="VIP Account" aria-label="VIP Account">
        <i class="fas fa-user-circle"></i>
      </button>

      <button class="nav-btn-icon" onclick="toggleCartDrawer(true)" title="View Cart" aria-label="View Cart">
        <i class="fas fa-shopping-bag"></i>
        <span id="navCartBadge" class="nav-badge" style="display: none;">0</span>
      </button>

      <a href="admin.html" class="nav-btn-icon" title="Staff Portal" style="font-size: 14px; text-decoration: none;">
        <i class="fas fa-shield-alt"></i>
      </a>
    `;

    // Insert before hamburger
    const hamburger = document.querySelector('.hamburger');
    if (hamburger) {
      navContainer.insertBefore(navActions, hamburger);
    } else {
      navContainer.appendChild(navActions);
    }
  }
}

// ==========================================
// 4. CART & CUSTOMIZATION LOGIC
// ==========================================
function initCartListeners() {
  renderCartItems();
}

function toggleCartDrawer(open) {
  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('cartBackdrop');
  if (drawer && backdrop) {
    if (open) {
      renderCartItems();
      drawer.classList.add('active');
      backdrop.classList.add('active');
    } else {
      drawer.classList.remove('active');
      backdrop.classList.remove('active');
    }
  }
}

function updateCartBadge() {
  const badge = document.getElementById('navCartBadge');
  const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  if (badge) {
    if (totalCount > 0) {
      badge.textContent = totalCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
}

function openCustomizationModal(dish) {
  state.selectedDishForCustomization = dish;
  const modal = document.getElementById('customizationModal');
  const content = document.getElementById('customizationModalContent');
  if (!modal || !content) return;

  const spiceOptions = dish.spiceOptions || ['Mild', 'Medium', 'Spicy'];
  const availableAddons = dish.availableAddons || [];

  content.innerHTML = `
    <div class="dish-header-preview">
      <img src="${dish.image}" alt="${dish.name}" />
      <div>
        <span class="slot-badge available" style="margin-bottom: 4px;">${dish.tag || 'Chef Selection'}</span>
        <h3>${dish.name}</h3>
        <p style="color: var(--accent-gold); font-weight: 700; font-size: 18px;">$${parseFloat(dish.price).toFixed(2)}</p>
      </div>
    </div>

    <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 20px;">${dish.description}</p>

    ${spiceOptions.length > 0 ? `
      <div class="customization-section">
        <label><i class="fas fa-pepper-hot" style="color: #e74c3c; margin-right: 6px;"></i> Select Spice / Preparation:</label>
        <div class="spice-pills" id="spicePillsGroup">
          ${spiceOptions.map((opt, idx) => `
            <div class="spice-pill ${idx === 0 ? 'active' : ''}" onclick="selectSpicePill(this, '${opt}')">${opt}</div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    ${availableAddons.length > 0 ? `
      <div class="customization-section">
        <label><i class="fas fa-plus-circle" style="color: var(--accent-gold); margin-right: 6px;"></i> Gourmet Add-ons & Accompaniments:</label>
        <div>
          ${availableAddons.map((addon, idx) => `
            <label class="addon-checkbox-row">
              <span style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" class="addon-check" data-name="${addon.name}" data-price="${addon.price}" onchange="updateCustomizationSubtotal()" />
                <span>${addon.name}</span>
              </span>
              <span style="color: var(--accent-gold); font-weight: 600;">+$${parseFloat(addon.price).toFixed(2)}</span>
            </label>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <div class="customization-section">
      <label><i class="fas fa-comment-alt" style="margin-right: 6px;"></i> Chef & Allergy Notes:</label>
      <textarea id="dishSpecialNotes" class="coupon-input" style="width: 100%; height: 60px;" placeholder="e.g. No dairy, extra napkins, separate sauce..."></textarea>
    </div>

    <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 24px; border-top: 1px solid var(--border-subtle); padding-top: 18px;">
      <div class="cart-qty-ctrl" style="padding: 6px 14px;">
        <button class="cart-qty-btn" onclick="adjustModalQty(-1)"><i class="fas fa-minus"></i></button>
        <span id="modalItemQty" style="font-weight: 700; padding: 0 10px;">1</span>
        <button class="cart-qty-btn" onclick="adjustModalQty(1)"><i class="fas fa-plus"></i></button>
      </div>

      <button class="btn btn-primary" onclick="confirmAddToCart()">
        Add to Order • <span id="modalFinalPrice">$${parseFloat(dish.price).toFixed(2)}</span>
      </button>
    </div>
  `;

  modal.classList.add('active');
}

function closeCustomizationModal() {
  const modal = document.getElementById('customizationModal');
  if (modal) modal.classList.remove('active');
}

let currentSelectedSpice = 'Mild';
let currentModalQty = 1;

function selectSpicePill(element, spice) {
  document.querySelectorAll('#spicePillsGroup .spice-pill').forEach(p => p.classList.remove('active'));
  element.classList.add('active');
  currentSelectedSpice = spice;
}

function adjustModalQty(delta) {
  currentModalQty = Math.max(1, currentModalQty + delta);
  const qtyEl = document.getElementById('modalItemQty');
  if (qtyEl) qtyEl.textContent = currentModalQty;
  updateCustomizationSubtotal();
}

function updateCustomizationSubtotal() {
  if (!state.selectedDishForCustomization) return;
  const basePrice = parseFloat(state.selectedDishForCustomization.price);
  let addonsSum = 0;
  document.querySelectorAll('.addon-check:checked').forEach(chk => {
    addonsSum += parseFloat(chk.dataset.price || 0);
  });

  const total = (basePrice + addonsSum) * currentModalQty;
  const priceEl = document.getElementById('modalFinalPrice');
  if (priceEl) priceEl.textContent = `$${total.toFixed(2)}`;
}

function confirmAddToCart() {
  if (!state.selectedDishForCustomization) return;

  const dish = state.selectedDishForCustomization;
  const addons = [];
  document.querySelectorAll('.addon-check:checked').forEach(chk => {
    addons.push({
      name: chk.dataset.name,
      price: parseFloat(chk.dataset.price)
    });
  });

  const notes = document.getElementById('dishSpecialNotes')?.value || '';
  const spicePillActive = document.querySelector('#spicePillsGroup .spice-pill.active');
  const selectedSpice = spicePillActive ? spicePillActive.textContent.trim() : 'Standard';

  const cartItemId = `${dish.id}-${selectedSpice}-${addons.map(a => a.name).sort().join('_')}`;

  const existingIndex = state.cart.findIndex(i => i.cartItemId === cartItemId);
  if (existingIndex > -1) {
    state.cart[existingIndex].quantity += currentModalQty;
  } else {
    state.cart.push({
      cartItemId,
      id: dish.id,
      name: dish.name,
      price: parseFloat(dish.price),
      image: dish.image,
      spice: selectedSpice,
      addons,
      notes,
      quantity: currentModalQty
    });
  }

  localStorage.setItem('pf_cart', JSON.stringify(state.cart));
  updateCartBadge();
  closeCustomizationModal();
  toggleCartDrawer(true);
}

function renderCartItems() {
  const container = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');
  if (!container) return;

  if (!state.cart.length) {
    container.innerHTML = `
      <div class="cart-empty-state">
        <i class="fas fa-utensils"></i>
        <h4>Your Bag is Empty</h4>
        <p style="font-size: 13px; margin-top: 6px;">Explore our menu and indulge in culinary perfection.</p>
        <a href="menu.html" class="btn btn-primary" style="margin-top: 18px; display: inline-block;">Browse Menu</a>
      </div>
    `;
    if (footer) footer.style.display = 'none';
    return;
  }

  if (footer) footer.style.display = 'block';

  let subtotal = 0;

  container.innerHTML = state.cart.map((item, index) => {
    const addonsTotal = (item.addons || []).reduce((acc, a) => acc + parseFloat(a.price || 0), 0);
    const itemTotal = (item.price + addonsTotal) * item.quantity;
    subtotal += itemTotal;

    return `
      <div class="cart-item-card">
        <button class="cart-remove-btn" onclick="removeFromCart(${index})" title="Remove item"><i class="fas fa-trash-alt"></i></button>
        <img src="${item.image}" alt="${item.name}" class="cart-item-img" />
        <div class="cart-item-info">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-meta">
            ${item.spice ? `<span style="margin-right: 6px;">🌶️ ${item.spice}</span>` : ''}
            ${item.addons?.length ? item.addons.map(a => `+ ${a.name}`).join(', ') : ''}
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px;">
            <div class="cart-qty-ctrl">
              <button class="cart-qty-btn" onclick="updateCartQty(${index}, -1)">-</button>
              <span style="font-size: 13px; font-weight: 600;">${item.quantity}</span>
              <button class="cart-qty-btn" onclick="updateCartQty(${index}, 1)">+</button>
            </div>
            <div class="cart-item-price">$${itemTotal.toFixed(2)}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Calculate discounts & totals
  let discount = 0;
  if (state.appliedCoupon) {
    discount = Math.min((subtotal * state.appliedCoupon.discountPercent) / 100, state.appliedCoupon.maxDiscount || 50);
  }

  const tax = (subtotal - discount) * 0.0825;
  const total = subtotal - discount + tax;

  document.getElementById('cartSubtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('cartTax').textContent = `$${tax.toFixed(2)}`;
  document.getElementById('cartTotal').textContent = `$${total.toFixed(2)}`;

  const discountRow = document.getElementById('discountRow');
  if (discountRow) {
    if (discount > 0) {
      discountRow.style.display = 'flex';
      document.getElementById('couponCodeBadge').textContent = state.appliedCoupon.code;
      document.getElementById('cartDiscount').textContent = `-$${discount.toFixed(2)}`;
    } else {
      discountRow.style.display = 'none';
    }
  }
}

function updateCartQty(index, delta) {
  if (!state.cart[index]) return;
  state.cart[index].quantity += delta;
  if (state.cart[index].quantity <= 0) {
    state.cart.splice(index, 1);
  }
  localStorage.setItem('pf_cart', JSON.stringify(state.cart));
  updateCartBadge();
  renderCartItems();
}

function removeFromCart(index) {
  state.cart.splice(index, 1);
  localStorage.setItem('pf_cart', JSON.stringify(state.cart));
  updateCartBadge();
  renderCartItems();
}

async function applyPromoCoupon() {
  const input = document.getElementById('couponInput');
  const msg = document.getElementById('couponMessage');
  if (!input || !input.value.trim()) return;

  const code = input.value.trim().toUpperCase();
  const subtotal = state.cart.reduce((sum, item) => {
    const addons = (item.addons || []).reduce((acc, a) => acc + (a.price || 0), 0);
    return sum + (item.price + addons) * item.quantity;
  }, 0);

  try {
    const res = await fetch(`${API_BASE}/orders/validate-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal })
    });
    const data = await res.json();

    if (data.success) {
      state.appliedCoupon = { code: data.code, discountPercent: data.discountPercent, maxDiscount: 50 };
      localStorage.setItem('pf_coupon', JSON.stringify(state.appliedCoupon));
      msg.style.color = '#2ecc71';
      msg.textContent = `Promo code ${code} applied successfully! (${data.discountPercent}% OFF)`;
      renderCartItems();
    } else {
      msg.style.color = '#e74c3c';
      msg.textContent = data.message || 'Invalid coupon code';
    }
  } catch (e) {
    // Fallback if offline
    if (code === 'FORK10') {
      state.appliedCoupon = { code: 'FORK10', discountPercent: 10, maxDiscount: 20 };
      msg.style.color = '#2ecc71';
      msg.textContent = '10% discount applied!';
      renderCartItems();
    } else {
      msg.style.color = '#e74c3c';
      msg.textContent = 'Invalid promo code. Try FORK10';
    }
  }
}

// ==========================================
// 5. MULTI-STEP CHECKOUT & PAYMENT MODAL
// ==========================================
let currentOrderType = 'takeaway';
let selectedPaymentMethod = 'Credit Card (Stripe)';

function openCheckoutModal() {
  toggleCartDrawer(false);
  const modal = document.getElementById('checkoutModal');
  const content = document.getElementById('checkoutModalContent');
  if (!modal || !content) return;

  renderCheckoutStep1();
  modal.classList.add('active');
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  if (modal) modal.classList.remove('active');
}

function renderCheckoutStep1() {
  const content = document.getElementById('checkoutModalContent');
  const user = state.user;

  content.innerHTML = `
    <h3 style="font-family: 'Playfair Display', serif; color: var(--accent-gold); margin-bottom: 6px;">Complete Your Order</h3>
    <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 20px;">Select dining preference and contact details.</p>

    <!-- Order Type Selector -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
      <div class="payment-method-card ${currentOrderType === 'takeaway' ? 'active' : ''}" onclick="setOrderType('takeaway')">
        <i class="fas fa-walking"></i>
        <div style="font-size: 13px;">Takeaway</div>
      </div>
      <div class="payment-method-card ${currentOrderType === 'delivery' ? 'active' : ''}" onclick="setOrderType('delivery')">
        <i class="fas fa-motorcycle"></i>
        <div style="font-size: 13px;">Delivery</div>
      </div>
      <div class="payment-method-card ${currentOrderType === 'dine-in' ? 'active' : ''}" onclick="setOrderType('dine-in')">
        <i class="fas fa-utensils"></i>
        <div style="font-size: 13px;">Dine-In Preorder</div>
      </div>
    </div>

    <form id="checkoutForm" onsubmit="handleProceedToPayment(event)">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
        <div>
          <label style="font-size: 12px; color: var(--text-secondary);">Full Name *</label>
          <input type="text" id="chkName" class="coupon-input" style="width: 100%;" required value="${user?.name || ''}" placeholder="Alexander Wright" />
        </div>
        <div>
          <label style="font-size: 12px; color: var(--text-secondary);">Phone Number *</label>
          <input type="tel" id="chkPhone" class="coupon-input" style="width: 100%;" required value="${user?.phone || ''}" placeholder="+1 (555) 000-0000" />
        </div>
      </div>

      <div style="margin-bottom: 12px;">
        <label style="font-size: 12px; color: var(--text-secondary);">Email Address (For receipt & live tracking) *</label>
        <input type="email" id="chkEmail" class="coupon-input" style="width: 100%;" required value="${user?.email || ''}" placeholder="alexander@example.com" />
      </div>

      ${currentOrderType === 'delivery' ? `
        <div style="margin-bottom: 12px;">
          <label style="font-size: 12px; color: var(--text-secondary);">Delivery Address *</label>
          <input type="text" id="chkAddress" class="coupon-input" style="width: 100%;" required value="${user?.savedAddress || ''}" placeholder="Street address, Apt / Suite number" />
        </div>
      ` : ''}

      ${currentOrderType === 'dine-in' ? `
        <div style="margin-bottom: 12px;">
          <label style="font-size: 12px; color: var(--text-secondary);">Table / Arrival Time *</label>
          <input type="text" id="chkTable" class="coupon-input" style="width: 100%;" required placeholder="e.g. Table 4 / 7:30 PM" />
        </div>
      ` : ''}

      <div style="margin-bottom: 20px;">
        <label style="font-size: 12px; color: var(--text-secondary);">Special Instructions for Kitchen / Delivery</label>
        <textarea id="chkNotes" class="coupon-input" style="width: 100%; height: 50px;" placeholder="Gate code, contactless delivery preference..."></textarea>
      </div>

      <button type="submit" class="btn btn-primary" style="width: 100%;">
        Continue to Secure Payment <i class="fas fa-lock" style="margin-left: 8px;"></i>
      </button>
    </form>
  `;
}

function setOrderType(type) {
  currentOrderType = type;
  renderCheckoutStep1();
}

let customerCheckoutData = null;

function handleProceedToPayment(e) {
  e.preventDefault();
  customerCheckoutData = {
    name: document.getElementById('chkName').value,
    phone: document.getElementById('chkPhone').value,
    email: document.getElementById('chkEmail').value,
    address: document.getElementById('chkAddress')?.value || '',
    tableNumber: document.getElementById('chkTable')?.value || '',
    notes: document.getElementById('chkNotes')?.value || ''
  };

  renderPaymentStep();
}

function renderPaymentStep() {
  const content = document.getElementById('checkoutModalContent');
  if (!content) return;

  // Calculate totals
  const subtotal = state.cart.reduce((sum, item) => {
    const addons = (item.addons || []).reduce((acc, a) => acc + (a.price || 0), 0);
    return sum + (item.price + addons) * item.quantity;
  }, 0);
  const discount = state.appliedCoupon ? Math.min((subtotal * state.appliedCoupon.discountPercent) / 100, 50) : 0;
  const deliveryFee = currentOrderType === 'delivery' ? 4.99 : 0;
  const tax = (subtotal - discount) * 0.0825;
  const grandTotal = subtotal - discount + tax + deliveryFee;

  content.innerHTML = `
    <h3 style="font-family: 'Playfair Display', serif; color: var(--accent-gold); margin-bottom: 6px;">Secure Payment</h3>
    <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 18px;">Encrypted 256-bit SSL transaction.</p>

    <!-- Payment Gateways -->
    <div class="payment-methods-grid">
      <div class="payment-method-card ${selectedPaymentMethod === 'Credit Card (Stripe)' ? 'active' : ''}" onclick="selectPaymentMethod('Credit Card (Stripe)')">
        <i class="fab fa-cc-stripe"></i>
        <div style="font-size: 13px;">Credit Card</div>
      </div>
      <div class="payment-method-card ${selectedPaymentMethod === 'Razorpay / UPI' ? 'active' : ''}" onclick="selectPaymentMethod('Razorpay / UPI')">
        <i class="fas fa-qrcode"></i>
        <div style="font-size: 13px;">UPI / Razorpay</div>
      </div>
      <div class="payment-method-card ${selectedPaymentMethod === 'Apple Pay' ? 'active' : ''}" onclick="selectPaymentMethod('Apple Pay')">
        <i class="fab fa-apple-pay"></i>
        <div style="font-size: 13px;">Apple Pay</div>
      </div>
      <div class="payment-method-card ${selectedPaymentMethod === 'Cash on Delivery' ? 'active' : ''}" onclick="selectPaymentMethod('Cash on Delivery')">
        <i class="fas fa-money-bill-wave"></i>
        <div style="font-size: 13px;">Pay at Pickup</div>
      </div>
    </div>

    <!-- Mock Card Fields -->
    <div id="cardFieldsContainer" style="background: var(--bg-card); padding: 14px; border-radius: var(--radius-md); margin-bottom: 18px; border: 1px solid var(--border-subtle);">
      <div style="margin-bottom: 10px;">
        <label style="font-size: 12px; color: var(--text-secondary);">Card Number</label>
        <input type="text" class="coupon-input" style="width: 100%;" placeholder="4242 •••• •••• 4242" value="4242 8891 3321 4242" />
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div>
          <label style="font-size: 12px; color: var(--text-secondary);">Expiry (MM/YY)</label>
          <input type="text" class="coupon-input" style="width: 100%;" placeholder="12/28" value="12/28" />
        </div>
        <div>
          <label style="font-size: 12px; color: var(--text-secondary);">CVC / CVV</label>
          <input type="password" class="coupon-input" style="width: 100%;" placeholder="888" value="888" />
        </div>
      </div>
    </div>

    <div style="background: rgba(212, 175, 55, 0.08); padding: 12px 16px; border-radius: var(--radius-sm); margin-bottom: 18px;">
      <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
        <span>Amount Payable:</span>
        <strong style="color: var(--accent-gold); font-size: 16px;">$${grandTotal.toFixed(2)}</strong>
      </div>
      <div style="font-size: 11px; color: var(--text-muted);">Includes taxes and instant kitchen transmission.</div>
    </div>

    <div style="display: flex; gap: 10px;">
      <button class="btn btn-secondary" style="flex: 1;" onclick="renderCheckoutStep1()">Back</button>
      <button class="btn btn-primary" style="flex: 2;" onclick="processOrderPayment(${grandTotal})">
        Authorize & Pay $${grandTotal.toFixed(2)}
      </button>
    </div>
  `;
}

function selectPaymentMethod(method) {
  selectedPaymentMethod = method;
  renderPaymentStep();
}

async function processOrderPayment(grandTotal) {
  const content = document.getElementById('checkoutModalContent');
  if (!content) return;

  // Processing animation
  content.innerHTML = `
    <div style="text-align: center; padding: 40px 20px;">
      <i class="fas fa-spinner fa-spin" style="font-size: 54px; color: var(--accent-gold); margin-bottom: 20px;"></i>
      <h3 style="font-family: 'Playfair Display', serif; color: var(--accent-gold); margin-bottom: 8px;">Processing Secure Transaction</h3>
      <p style="color: var(--text-secondary); font-size: 14px;">Connecting to banking gateway and dispatching order to executive kitchen...</p>
    </div>
  `;

  const orderPayload = {
    orderType: currentOrderType,
    customer: customerCheckoutData,
    items: state.cart,
    couponCode: state.appliedCoupon?.code || null,
    paymentMethod: selectedPaymentMethod,
    notes: customerCheckoutData.notes
  };

  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    const result = await res.json();
    const orderData = result.data || {
      id: `PF-ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      total: grandTotal,
      createdAt: new Date().toISOString()
    };

    // Clear cart
    state.cart = [];
    state.appliedCoupon = null;
    localStorage.setItem('pf_cart', '[]');
    localStorage.removeItem('pf_coupon');
    updateCartBadge();

    // Render Success Screen with invoice & live tracking
    renderOrderConfirmation(orderData);
  } catch (e) {
    console.error('Error submitting order to API:', e);
    renderOrderConfirmation({
      id: `PF-ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      total: grandTotal,
      customer: customerCheckoutData,
      createdAt: new Date().toISOString()
    });
  }
}

function renderOrderConfirmation(order) {
  const content = document.getElementById('checkoutModalContent');
  if (!content) return;

  content.innerHTML = `
    <div style="text-align: center; padding: 20px 10px;">
      <div style="width: 70px; height: 70px; background: rgba(46, 204, 113, 0.15); border: 2px solid #2ecc71; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
        <i class="fas fa-check" style="font-size: 32px; color: #2ecc71;"></i>
      </div>
      <span class="slot-badge available" style="margin-bottom: 8px;">Order Confirmed</span>
      <h2 style="font-family: 'Playfair Display', serif; color: var(--accent-gold); margin-bottom: 6px;">Thank You for Dining With Us!</h2>
      <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 20px;">
        Order Reference: <strong style="color: var(--text-primary); font-family: monospace;">${order.id}</strong>
      </p>

      <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 18px; text-align: left; margin-bottom: 22px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
          <span>Status:</span>
          <span style="color: #f39c12; font-weight: 600;"><i class="fas fa-fire"></i> In Kitchen (Prep: 25 mins)</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
          <span>Dining Type:</span>
          <strong style="text-transform: capitalize;">${order.orderType || currentOrderType}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
          <span>Payment:</span>
          <span>${order.paymentMethod || selectedPaymentMethod} (Paid)</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 700; color: var(--accent-gold); border-top: 1px dashed var(--border-subtle); padding-top: 10px; margin-top: 10px;">
          <span>Total Paid:</span>
          <span>$${parseFloat(order.total || 0).toFixed(2)}</span>
        </div>
      </div>

      <div style="display: flex; gap: 10px;">
        <button class="btn btn-secondary" style="flex: 1;" onclick="window.print()"><i class="fas fa-print" style="margin-right: 6px;"></i> Print Receipt</button>
        <button class="btn btn-primary" style="flex: 1;" onclick="closeCheckoutModal()">Done</button>
      </div>
    </div>
  `;
}

// ==========================================
// 6. DYNAMIC MENU CATALOG & FILTERING
// ==========================================
async function loadDynamicMenu() {
  const container = document.getElementById('menuGrid');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/menu`);
    const data = await res.json();
    state.menuItems = data.data || [];
  } catch (e) {
    console.warn('API offline, using static items:', e);
  }

  renderMenuGrid('all');
  initMenuFilters();
}

function renderMenuGrid(filterCategory) {
  const container = document.getElementById('menuGrid');
  if (!container) return;

  let items = state.menuItems;
  if (filterCategory && filterCategory !== 'all') {
    items = items.filter(item => item.category === filterCategory);
  }

  if (!items.length) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No dishes found in this category.</div>`;
    return;
  }

  container.innerHTML = items.map(dish => `
    <div class="menu-item ${dish.category}" data-category="${dish.category}" style="display: block;">
      <div class="menu-item-image" style="position: relative;">
        <img src="${dish.image}" alt="${dish.name}" loading="lazy" />
        ${dish.tag ? `<span class="slot-badge available" style="position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,0.7);">${dish.tag}</span>` : ''}
        ${!dish.inStock ? `<span class="slot-badge full" style="position: absolute; top: 12px; right: 12px;">Out of Stock</span>` : ''}
      </div>
      <div class="menu-item-content">
        <div class="menu-item-header">
          <h3>${dish.name}</h3>
          <span class="price">$${parseFloat(dish.price).toFixed(2)}</span>
        </div>
        <p class="description">${dish.description}</p>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 14px;">
          <div style="font-size: 12px; color: var(--accent-gold);">
            <i class="fas fa-star"></i> ${dish.rating || '4.9'} (${dish.reviewCount || 24})
          </div>
          <button class="btn btn-primary" style="padding: 6px 14px; font-size: 13px;" onclick='openCustomizationModal(${JSON.stringify(dish).replace(/'/g, "&apos;")})' ${!dish.inStock ? 'disabled' : ''}>
            <i class="fas fa-plus" style="margin-right: 4px;"></i> Add to Order
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function initMenuFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const category = btn.getAttribute('data-filter');
      renderMenuGrid(category);
    });
  });
}

// ==========================================
// 7. REAL-TIME TABLE RESERVATIONS & BOOKINGS
// ==========================================
function initReservationPage() {
  const dateInput = document.getElementById('date');
  const today = new Date().toISOString().split('T')[0];
  if (dateInput) {
    dateInput.setAttribute('min', today);
    dateInput.value = today;
    dateInput.addEventListener('change', () => loadSlotsAvailability(dateInput.value));
    loadSlotsAvailability(today);
  }

  // Handle new booking submit
  const form = document.getElementById('reservationForm');
  if (form) {
    form.addEventListener('submit', handleReservationSubmit);
  }

  // Handle manage booking lookup
  const manageForm = document.getElementById('manageBookingForm');
  if (manageForm) {
    manageForm.addEventListener('submit', handleManageBookingSearch);
  }
}

let selectedTimeSlot = '19:00';

async function loadSlotsAvailability(dateStr) {
  const slotsContainer = document.getElementById('timeSlotsContainer');
  if (!slotsContainer) return;

  try {
    const res = await fetch(`${API_BASE}/reservations/availability?date=${dateStr}`);
    const data = await res.json();
    const availability = data.availability || [];

    slotsContainer.innerHTML = availability.map(slot => {
      let badgeClass = 'available';
      if (slot.status === 'Filling Fast') badgeClass = 'filling-fast';
      else if (slot.status === 'Full') badgeClass = 'full';

      const isSelected = slot.time === selectedTimeSlot;
      const isDisabled = slot.status === 'Full';

      return `
        <button type="button" class="time-slot-btn ${isSelected ? 'active' : ''}" ${isDisabled ? 'disabled' : ''} onclick="selectSlotTime('${slot.time}')">
          <div style="font-weight: 600;">${slot.time}</div>
          <span class="slot-badge ${badgeClass}" style="font-size: 10px; margin-top: 4px;">${slot.status}</span>
        </button>
      `;
    }).join('');
  } catch (e) {
    console.warn('Availability API fallback:', e);
  }
}

function selectSlotTime(time) {
  selectedTimeSlot = time;
  const timeInput = document.getElementById('time');
  if (timeInput) timeInput.value = time;
  document.querySelectorAll('.time-slot-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.includes(time));
  });
}

async function handleReservationSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('reservationForm');
  const formData = new FormData(form);

  const payload = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    date: formData.get('date'),
    time: formData.get('time') || selectedTimeSlot,
    guests: formData.get('guests'),
    occasion: formData.get('occasion'),
    requests: formData.get('requests')
  };

  try {
    const res = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    const booking = result.data || { ...payload, refCode: `PF-RES-${Math.floor(1000 + Math.random() * 9000)}`, tableNumber: 'T-04' };

    renderReservationSuccessModal(booking);
    form.reset();
  } catch (err) {
    console.error('Reservation API error:', err);
    renderReservationSuccessModal({ ...payload, refCode: `PF-RES-${Math.floor(1000 + Math.random() * 9000)}`, tableNumber: 'T-04' });
  }
}

function renderReservationSuccessModal(booking) {
  const confirmationModal = document.getElementById('confirmationModal');
  const detailsContainer = document.getElementById('confirmationDetails');
  if (!confirmationModal || !detailsContainer) return;

  const formattedDate = new Date(booking.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  detailsContainer.innerHTML = `
    <div style="text-align: center; margin-bottom: 16px;">
      <span class="slot-badge available" style="font-size: 12px; margin-bottom: 8px;">VIP Reservation Confirmed</span>
      <h3 style="font-family: 'Playfair Display', serif; color: var(--accent-gold);">Reference Code: ${booking.refCode}</h3>
      <p style="color: var(--text-secondary); font-size: 13px;">Save this code or use your email to reschedule or cancel anytime.</p>
    </div>

    <div style="display: flex; justify-content: center;">
      <!-- Dynamic SVG QR Code Representation -->
      <div class="qr-container">
        <svg width="130" height="130" viewBox="0 0 130 130">
          <rect width="130" height="130" fill="#ffffff" />
          <rect x="10" y="10" width="35" height="35" fill="#121212" />
          <rect x="15" y="15" width="25" height="25" fill="#ffffff" />
          <rect x="20" y="20" width="15" height="15" fill="#121212" />
          <rect x="85" y="10" width="35" height="35" fill="#121212" />
          <rect x="90" y="15" width="25" height="25" fill="#ffffff" />
          <rect x="95" y="20" width="15" height="15" fill="#121212" />
          <rect x="10" y="85" width="35" height="35" fill="#121212" />
          <rect x="15" y="90" width="25" height="25" fill="#ffffff" />
          <rect x="20" y="95" width="15" height="15" fill="#121212" />
          <rect x="55" y="20" width="10" height="10" fill="#121212" />
          <rect x="70" y="30" width="10" height="10" fill="#121212" />
          <rect x="55" y="55" width="20" height="20" fill="#D4AF37" />
          <rect x="85" y="60" width="10" height="10" fill="#121212" />
          <rect x="60" y="85" width="10" height="10" fill="#121212" />
          <rect x="75" y="95" width="15" height="15" fill="#121212" />
          <rect x="100" y="85" width="10" height="10" fill="#121212" />
        </svg>
      </div>
    </div>

    <div style="background: var(--bg-card); padding: 14px 18px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin: 16px 0; font-size: 13px;">
      <p><strong>Primary Guest:</strong> ${booking.firstName} ${booking.lastName}</p>
      <p><strong>Table Allocated:</strong> ${booking.tableNumber || 'Assigned on arrival'}</p>
      <p><strong>Date & Time:</strong> ${formattedDate} at ${booking.time}</p>
      <p><strong>Party Size:</strong> ${booking.guests} Guests (${booking.occasion || 'Standard Dining'})</p>
    </div>

    <div style="display: flex; gap: 10px; margin-top: 16px;">
      <button class="btn btn-secondary" style="flex: 1;" onclick="downloadCalendarInvite('${booking.refCode}', '${booking.date}', '${booking.time}', '${booking.guests}')">
        <i class="fas fa-calendar-plus" style="margin-right: 6px;"></i> Add to Calendar (.ics)
      </button>
      <button class="btn btn-primary" style="flex: 1;" onclick="closeConfirmationModal()">Done</button>
    </div>
  `;

  confirmationModal.style.display = 'block';
}

function closeConfirmationModal() {
  const confirmationModal = document.getElementById('confirmationModal');
  if (confirmationModal) confirmationModal.style.display = 'none';
}

// 1-Click .ICS Calendar Download
function downloadCalendarInvite(refCode, date, time, guests) {
  const startDateTime = `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Purna Fork//Table Reservation//EN',
    'BEGIN:VEVENT',
    `SUMMARY:Dinner at The Purna Fork (Ref: ${refCode})`,
    `DESCRIPTION:Table booking for ${guests} guests at The Purna Fork Fine Dining.\\nBooking Ref: ${refCode}`,
    'LOCATION:123 Culinary Street, Food City, FC 12345',
    `DTSTART:${startDateTime}`,
    `DTEND:${startDateTime}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `PurnaFork_Reservation_${refCode}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Search & Manage Reservation
async function handleManageBookingSearch(e) {
  e.preventDefault();
  const query = document.getElementById('searchBookingInput')?.value.trim();
  const resultBox = document.getElementById('manageBookingResult');
  if (!query || !resultBox) return;

  resultBox.innerHTML = `<div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Locating reservation...</div>`;

  try {
    const res = await fetch(`${API_BASE}/reservations/${encodeURIComponent(query)}`);
    const data = await res.json();
    if (data.success && data.data.length > 0) {
      const b = data.data[0];
      resultBox.innerHTML = `
        <div class="history-card" style="margin-top: 18px;">
          <div class="history-card-header">
            <div>
              <strong style="color: var(--accent-gold);">${b.refCode}</strong>
              <div style="font-size: 12px; color: var(--text-secondary);">${b.date} at ${b.time} (${b.guests} Guests)</div>
            </div>
            <span class="slot-badge ${b.status === 'Confirmed' ? 'available' : 'full'}">${b.status}</span>
          </div>
          <p style="font-size: 13px; margin-bottom: 12px;"><strong>Guest:</strong> ${b.firstName} ${b.lastName} • ${b.phone}</p>
          ${b.status !== 'Cancelled' ? `
            <div style="display: flex; gap: 10px;">
              <button class="btn btn-secondary" style="padding: 6px 14px; font-size: 12px;" onclick="cancelBooking('${b.refCode}')">Cancel Reservation</button>
            </div>
          ` : '<p style="color: #e74c3c; font-size: 12px;">This reservation has been cancelled.</p>'}
        </div>
      `;
    } else {
      resultBox.innerHTML = `<div style="color: #e74c3c; padding: 14px;">No reservation found matching "${query}".</div>`;
    }
  } catch (err) {
    resultBox.innerHTML = `<div style="color: #e74c3c; padding: 14px;">Unable to fetch reservation details.</div>`;
  }
}

async function cancelBooking(refCode) {
  if (!confirm(`Are you sure you want to cancel booking ${refCode}?`)) return;
  try {
    await fetch(`${API_BASE}/reservations/${refCode}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Cancelled' })
    });
    alert('Reservation successfully cancelled.');
    document.getElementById('manageBookingForm')?.dispatchEvent(new Event('submit'));
  } catch (e) {
    alert('Failed to cancel reservation.');
  }
}

// ==========================================
// 8. CUSTOMER REVIEWS & RATINGS SYSTEM
// ==========================================
let currentSelectedRating = 5;

function openReviewModal() {
  const modal = document.getElementById('reviewModal');
  if (modal) modal.classList.add('active');
}

function closeReviewModal() {
  const modal = document.getElementById('reviewModal');
  if (modal) modal.classList.remove('active');
}

function setReviewRating(rating) {
  currentSelectedRating = rating;
  document.querySelectorAll('#starPicker .star').forEach(star => {
    const starRating = parseInt(star.dataset.rating);
    star.classList.toggle('active', starRating <= rating);
  });
}

async function handleReviewSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('reviewAuthorName').value;
  const dishName = document.getElementById('reviewDishName').value;
  const comment = document.getElementById('reviewText').value;

  try {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, dishName, comment, rating: currentSelectedRating })
    });
    const result = await res.json();
    alert('Thank you for your review!');
    closeReviewModal();
    loadCustomerReviews();
  } catch (err) {
    alert('Review saved locally. Thank you!');
    closeReviewModal();
  }
}

async function loadCustomerReviews() {
  const container = document.getElementById('reviewsContainer');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/reviews`);
    const data = await res.json();
    const reviews = data.data || [];

    container.innerHTML = reviews.map(rev => `
      <div class="review-card-modern">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <div style="color: var(--accent-gold);">
            ${'★'.repeat(rev.rating)}${'☆'.repeat(5 - rev.rating)}
          </div>
          <span class="slot-badge available" style="font-size: 10px;"><i class="fas fa-check-circle"></i> Verified Diner</span>
        </div>
        <p style="font-size: 14px; font-style: italic; margin-bottom: 12px; color: var(--text-primary);">"${rev.comment}"</p>
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary);">
          <strong>${rev.name}</strong>
          <span>${rev.dishName || 'Dine-in'} • ${rev.date || 'Recent'}</span>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.warn('Reviews offline fallback:', e);
  }
}

// ==========================================
// 9. USER ACCOUNTS & VIP LOYALTY PORTAL
// ==========================================
function openAuthModalOrAccount() {
  if (state.user) {
    window.location.href = 'account.html';
  } else {
    openAuthModal();
  }
}

function openAuthModal() {
  const modal = document.getElementById('authModal');
  const content = document.getElementById('authModalContent');
  if (!modal || !content) return;

  renderAuthLoginForm();
  modal.classList.add('active');
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('active');
}

function renderAuthLoginForm() {
  const content = document.getElementById('authModalContent');
  content.innerHTML = `
    <h3 style="font-family: 'Playfair Display', serif; color: var(--accent-gold); margin-bottom: 6px;">VIP Member Sign In</h3>
    <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 18px;">Access member rewards, points, and saved addresses.</p>

    <form onsubmit="handleAuthLogin(event)">
      <div style="margin-bottom: 12px;">
        <label style="font-size: 12px; color: var(--text-secondary);">Email Address</label>
        <input type="email" id="authEmail" class="coupon-input" style="width: 100%;" required placeholder="user@purnafork.com" />
      </div>
      <div style="margin-bottom: 18px;">
        <label style="font-size: 12px; color: var(--text-secondary);">Password</label>
        <input type="password" id="authPassword" class="coupon-input" style="width: 100%;" required placeholder="••••••••" />
      </div>
      <button type="submit" class="btn btn-primary" style="width: 100%; margin-bottom: 12px;">Sign In</button>
    </form>

    <div style="text-align: center; font-size: 13px; color: var(--text-secondary);">
      Don't have an account? <a href="javascript:void(0)" onclick="renderAuthRegisterForm()" style="color: var(--accent-gold); font-weight: 600;">Join VIP Rewards</a>
    </div>
  `;
}

function renderAuthRegisterForm() {
  const content = document.getElementById('authModalContent');
  content.innerHTML = `
    <h3 style="font-family: 'Playfair Display', serif; color: var(--accent-gold); margin-bottom: 6px;">Join VIP Club</h3>
    <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 18px;">Earn 10 points per dollar spent + 100 bonus signup points!</p>

    <form onsubmit="handleAuthRegister(event)">
      <div style="margin-bottom: 10px;">
        <label style="font-size: 12px; color: var(--text-secondary);">Full Name</label>
        <input type="text" id="regName" class="coupon-input" style="width: 100%;" required placeholder="Sophia Martinez" />
      </div>
      <div style="margin-bottom: 10px;">
        <label style="font-size: 12px; color: var(--text-secondary);">Email Address</label>
        <input type="email" id="regEmail" class="coupon-input" style="width: 100%;" required placeholder="sophia@example.com" />
      </div>
      <div style="margin-bottom: 10px;">
        <label style="font-size: 12px; color: var(--text-secondary);">Password</label>
        <input type="password" id="regPassword" class="coupon-input" style="width: 100%;" required placeholder="••••••••" />
      </div>
      <div style="margin-bottom: 18px;">
        <label style="font-size: 12px; color: var(--text-secondary);">Default Delivery Address</label>
        <input type="text" id="regAddress" class="coupon-input" style="width: 100%;" placeholder="742 Evergreen Terrace, Apt 4B" />
      </div>
      <button type="submit" class="btn btn-primary" style="width: 100%; margin-bottom: 12px;">Create VIP Account</button>
    </form>

    <div style="text-align: center; font-size: 13px; color: var(--text-secondary);">
      Already a member? <a href="javascript:void(0)" onclick="renderAuthLoginForm()" style="color: var(--accent-gold); font-weight: 600;">Sign In</a>
    </div>
  `;
}

async function handleAuthLogin(e) {
  e.preventDefault();
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
      state.user = data.user;
      localStorage.setItem('pf_user', JSON.stringify(data.user));
      closeAuthModal();
      window.location.href = 'account.html';
    } else {
      alert(data.message || 'Login failed');
    }
  } catch (err) {
    // Fallback demo user
    state.user = { name: 'VIP Guest', email, loyaltyPoints: 350, tier: 'Gold VIP', savedAddress: '123 Fine Dining Lane' };
    localStorage.setItem('pf_user', JSON.stringify(state.user));
    closeAuthModal();
    window.location.href = 'account.html';
  }
}

async function handleAuthRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const address = document.getElementById('regAddress').value;

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, address })
    });
    const data = await res.json();
    if (data.success) {
      state.user = data.user;
      localStorage.setItem('pf_user', JSON.stringify(data.user));
      closeAuthModal();
      window.location.href = 'account.html';
    } else {
      alert(data.message || 'Registration failed');
    }
  } catch (err) {
    state.user = { name, email, loyaltyPoints: 100, tier: 'Silver Member', savedAddress: address };
    localStorage.setItem('pf_user', JSON.stringify(state.user));
    closeAuthModal();
    window.location.href = 'account.html';
  }
}

function initAccountPage() {
  const container = document.getElementById('accountApp');
  if (!container) return;

  if (!state.user) {
    container.innerHTML = `
      <div style="text-align: center; padding: 80px 20px;">
        <h2 style="font-family: 'Playfair Display', serif; color: var(--accent-gold); margin-bottom: 12px;">VIP Access Required</h2>
        <p style="color: var(--text-secondary); margin-bottom: 24px;">Please sign in to view your orders, tier status, and points balance.</p>
        <button class="btn btn-primary" onclick="openAuthModal()">Sign In / Register</button>
      </div>
    `;
    return;
  }

  const user = state.user;
  const points = user.loyaltyPoints || 100;
  const progressPercent = Math.min(100, (points / 500) * 100);

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 30px;">
      <!-- Profile & Loyalty Card Column -->
      <div>
        <div class="loyalty-card">
          <span class="loyalty-tier-tag"><i class="fas fa-crown"></i> ${user.tier || 'Gold VIP'}</span>
          <div style="font-size: 13px; color: var(--text-secondary);">Loyalty Reward Balance</div>
          <div class="loyalty-points-display">${points} <span style="font-size: 16px; font-weight: normal; color: var(--accent-gold);">PTS</span></div>
          
          <div class="loyalty-progress-bar">
            <div class="loyalty-progress-fill" style="width: ${progressPercent}%;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted);">
            <span>${points} pts</span>
            <span>Next Reward: 500 pts ($50 off)</span>
          </div>
        </div>

        <div class="history-card">
          <h4 style="color: var(--accent-gold); margin-bottom: 12px;"><i class="fas fa-user-edit"></i> Profile Details</h4>
          <p style="font-size: 13px; margin-bottom: 6px;"><strong>Name:</strong> ${user.name}</p>
          <p style="font-size: 13px; margin-bottom: 6px;"><strong>Email:</strong> ${user.email}</p>
          <p style="font-size: 13px; margin-bottom: 16px;"><strong>Address:</strong> ${user.savedAddress || 'Not set'}</p>
          <button class="btn btn-secondary" style="width: 100%; font-size: 12px;" onclick="handleSignOut()">Sign Out</button>
        </div>
      </div>

      <!-- Orders & Reservations Column -->
      <div>
        <h3 style="font-family: 'Playfair Display', serif; color: var(--accent-gold); margin-bottom: 16px;">Past Orders & Table Reservations</h3>
        <div id="userOrdersList">
          <div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Loading activity...</div>
        </div>
      </div>
    </div>
  `;

  loadUserOrderHistory(user.email);
}

function handleSignOut() {
  state.user = null;
  localStorage.removeItem('pf_user');
  window.location.href = 'index.html';
}

async function loadUserOrderHistory(email) {
  const container = document.getElementById('userOrdersList');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/orders?userEmail=${encodeURIComponent(email)}`);
    const data = await res.json();
    const orders = data.data || [];

    if (!orders.length) {
      container.innerHTML = `<div style="color: var(--text-muted); padding: 20px;">No recent orders placed under this account.</div>`;
      return;
    }

    container.innerHTML = orders.map(ord => `
      <div class="history-card">
        <div class="history-card-header">
          <div>
            <strong style="color: var(--accent-gold);">${ord.id}</strong>
            <span style="font-size: 12px; color: var(--text-secondary); margin-left: 10px;">${new Date(ord.createdAt).toLocaleDateString()}</span>
          </div>
          <span class="status-pill ready">${ord.orderStatus}</span>
        </div>
        <div style="font-size: 13px; margin-bottom: 10px;">
          ${(ord.items || []).map(i => `${i.quantity}x ${i.name}`).join(' • ')}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: var(--accent-gold); font-size: 15px;">Total: $${parseFloat(ord.total).toFixed(2)}</strong>
          <button class="btn btn-primary" style="padding: 4px 12px; font-size: 12px;" onclick="reorderItems('${ord.id}')">Re-order</button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    container.innerHTML = `<div style="color: var(--text-muted);">Loaded offline profile.</div>`;
  }
}

// ==========================================
// 10. ADMIN DASHBOARD CONTROLLER (admin.html)
// ==========================================
async function initAdminDashboard() {
  loadAdminKPIs();
  loadAdminOrdersTable();
  loadAdminMenuTable();
  loadAdminReservationsTable();
}

function switchAdminTab(tabName) {
  document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.admin-tab-content').forEach(pane => pane.style.display = 'none');

  const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
  const activePane = document.getElementById(`tab-${tabName}`);
  if (activeBtn) activeBtn.classList.add('active');
  if (activePane) activePane.style.display = 'block';
}

async function loadAdminKPIs() {
  try {
    const res = await fetch(`${API_BASE}/admin/analytics`);
    const data = await res.json();
    const stats = data.stats || {};

    document.getElementById('kpiRevenue').textContent = `$${parseFloat(stats.totalRevenue || 0).toFixed(2)}`;
    document.getElementById('kpiOrders').textContent = stats.totalOrders || 0;
    document.getElementById('kpiReservations').textContent = stats.totalReservations || 0;
    document.getElementById('kpiDishes').textContent = stats.totalMenuItems || 0;
  } catch (e) {
    console.warn('Admin analytics fallback:', e);
  }
}

async function loadAdminOrdersTable() {
  const container = document.getElementById('adminOrdersBody');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/orders`);
    const data = await res.json();
    const orders = data.data || [];

    container.innerHTML = orders.map(ord => `
      <tr>
        <td><strong>${ord.id}</strong></td>
        <td>${ord.customer?.name || 'Guest'}<br><small style="color: var(--text-muted);">${ord.customer?.phone || ''}</small></td>
        <td><span class="slot-badge available" style="text-transform: capitalize;">${ord.orderType}</span></td>
        <td>${(ord.items || []).map(i => `${i.quantity}x ${i.name}`).join('<br>')}</td>
        <td><strong>$${parseFloat(ord.total).toFixed(2)}</strong></td>
        <td>
          <select onchange="updateOrderStatus('${ord.id}', this.value)" style="background: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--border-subtle); padding: 4px 8px; border-radius: 4px;">
            <option value="Received" ${ord.orderStatus === 'Received' ? 'selected' : ''}>Received</option>
            <option value="Preparing" ${ord.orderStatus === 'Preparing' ? 'selected' : ''}>Preparing</option>
            <option value="In Kitchen" ${ord.orderStatus === 'In Kitchen' ? 'selected' : ''}>In Kitchen</option>
            <option value="Ready for Pickup" ${ord.orderStatus === 'Ready for Pickup' ? 'selected' : ''}>Ready for Pickup</option>
            <option value="Delivered" ${ord.orderStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option value="Cancelled" ${ord.orderStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
      </tr>
    `).join('');
  } catch (e) {}
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    alert(`Order ${orderId} updated to ${newStatus}`);
    loadAdminKPIs();
  } catch (e) {
    alert('Failed to update order status');
  }
}

async function loadAdminMenuTable() {
  const container = document.getElementById('adminMenuBody');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/menu`);
    const data = await res.json();
    const items = data.data || [];

    container.innerHTML = items.map(dish => `
      <tr>
        <td><img src="${dish.image}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;" /></td>
        <td><strong>${dish.name}</strong></td>
        <td><span class="slot-badge available">${dish.category}</span></td>
        <td>$${parseFloat(dish.price).toFixed(2)}</td>
        <td>
          <button class="btn ${dish.inStock ? 'btn-primary' : 'btn-secondary'}" style="padding: 3px 10px; font-size: 11px;" onclick="toggleDishStock('${dish.id}', ${!dish.inStock})">
            ${dish.inStock ? 'In Stock' : 'Out of Stock'}
          </button>
        </td>
        <td>
          <button style="background: transparent; border: none; color: #e74c3c; cursor: pointer;" onclick="deleteDish('${dish.id}')">
            <i class="fas fa-trash-alt"></i>
          </button>
        </td>
      </tr>
    `).join('');
  } catch (e) {}
}

async function toggleDishStock(dishId, newInStock) {
  try {
    await fetch(`${API_BASE}/menu/${dishId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inStock: newInStock })
    });
    loadAdminMenuTable();
  } catch (e) {}
}

async function deleteDish(dishId) {
  if (!confirm('Are you sure you want to remove this dish?')) return;
  try {
    await fetch(`${API_BASE}/menu/${dishId}`, { method: 'DELETE' });
    loadAdminMenuTable();
  } catch (e) {}
}

async function handleAdminAddDish(e) {
  e.preventDefault();
  const name = document.getElementById('newDishName').value;
  const price = document.getElementById('newDishPrice').value;
  const category = document.getElementById('newDishCategory').value;
  const description = document.getElementById('newDishDesc').value;
  const image = document.getElementById('newDishImage').value;

  try {
    await fetch(`${API_BASE}/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price, category, description, image })
    });
    alert('Dish added successfully!');
    document.getElementById('addDishForm')?.reset();
    loadAdminMenuTable();
    loadAdminKPIs();
  } catch (e) {
    alert('Failed to add dish');
  }
}

async function loadAdminReservationsTable() {
  const container = document.getElementById('adminReservationsBody');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/reservations/all`);
    // Or from default state
    const resList = [
      { refCode: 'PF-RES-8821', name: 'Alexander Wright', date: 'Tomorrow', time: '19:30', guests: 4, table: 'T-04', status: 'Confirmed' },
      { refCode: 'PF-RES-4912', name: 'Elena Rostova', date: 'In 2 days', time: '20:00', guests: 2, table: 'T-09', status: 'Confirmed' }
    ];

    container.innerHTML = resList.map(r => `
      <tr>
        <td><strong>${r.refCode}</strong></td>
        <td>${r.name}</td>
        <td>${r.date} at ${r.time}</td>
        <td>${r.guests} Guests</td>
        <td><span class="slot-badge available">${r.table}</span></td>
        <td><span class="status-pill ready">${r.status}</span></td>
      </tr>
    `).join('');
  } catch (e) {}
}

// ==========================================
// 11. PROGRESSIVE WEB APP (PWA) SUPPORT
// ==========================================
let deferredPrompt = null;

function initPWA() {
  // On localhost, unregister any active service worker to avoid caching conflicts with Vite HMR
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) {
          registration.unregister();
        }
      });
    }
  } else if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('[SW] Service Worker registered'))
      .catch(err => console.warn('[SW] Registration failed:', err));
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const banner = document.getElementById('pwaInstallBanner');
    if (banner && !sessionStorage.getItem('pwa_dismissed')) {
      banner.classList.add('visible');
    }
  });

  const installBtn = document.getElementById('pwaInstallBtn');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`PWA install outcome: ${outcome}`);
        deferredPrompt = null;
        dismissPwaBanner();
      }
    });
  }
}

function dismissPwaBanner() {
  const banner = document.getElementById('pwaInstallBanner');
  if (banner) banner.classList.remove('visible');
  sessionStorage.setItem('pwa_dismissed', 'true');
}

// Attach globally for inline HTML event handlers
window.toggleCartDrawer = toggleCartDrawer;
window.openCustomizationModal = openCustomizationModal;
window.closeCustomizationModal = closeCustomizationModal;
window.selectSpicePill = selectSpicePill;
window.adjustModalQty = adjustModalQty;
window.updateCustomizationSubtotal = updateCustomizationSubtotal;
window.confirmAddToCart = confirmAddToCart;
window.updateCartQty = updateCartQty;
window.removeFromCart = removeFromCart;
window.applyPromoCoupon = applyPromoCoupon;
window.openCheckoutModal = openCheckoutModal;
window.closeCheckoutModal = closeCheckoutModal;
window.setOrderType = setOrderType;
window.handleProceedToPayment = handleProceedToPayment;
window.renderCheckoutStep1 = renderCheckoutStep1;
window.selectPaymentMethod = selectPaymentMethod;
window.processOrderPayment = processOrderPayment;
window.selectSlotTime = selectSlotTime;
window.closeConfirmationModal = closeConfirmationModal;
window.downloadCalendarInvite = downloadCalendarInvite;
window.cancelBooking = cancelBooking;
window.openReviewModal = openReviewModal;
window.closeReviewModal = closeReviewModal;
window.setReviewRating = setReviewRating;
window.handleReviewSubmit = handleReviewSubmit;
window.openAuthModalOrAccount = openAuthModalOrAccount;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.renderAuthLoginForm = renderAuthLoginForm;
window.renderAuthRegisterForm = renderAuthRegisterForm;
window.handleAuthLogin = handleAuthLogin;
window.handleAuthRegister = handleAuthRegister;
window.handleSignOut = handleSignOut;
window.switchAdminTab = switchAdminTab;
window.updateOrderStatus = updateOrderStatus;
window.toggleDishStock = toggleDishStock;
window.deleteDish = deleteDish;
window.handleAdminAddDish = handleAdminAddDish;
window.dismissPwaBanner = dismissPwaBanner;
window.toggleTheme = toggleTheme;