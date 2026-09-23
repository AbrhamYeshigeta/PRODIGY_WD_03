/* ============================================
   Cart — localStorage-backed
   Works across pages, survives reloads.
   Badge shows NUMBER OF PRODUCTS, not total kg.
   ============================================ */

const STORAGE_KEY = 'prodigy_cart_v1';
const listeners = new Set();

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  listeners.forEach((fn) => fn(items));
}

function notify() {
  const items = read();
  listeners.forEach((fn) => fn(items));
}

export const Cart = {
  /* Get all items */
  getAll() {
    return read();
  },

  /* Add item or increment if already present
     product: { id, name, slug, price, image, category, merchant }
     quantity: in kg (number, e.g. 1.5) */
  add(product, quantity) {
    const items = read();
    const existing = items.find((i) => i.id === product.id);

    if (existing) {
      existing.quantity = Math.round((existing.quantity + quantity) * 10) / 10;
    } else {
      items.push({
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,            // cents per kg
        image: product.image,
        category: product.category,
        merchant: product.merchant || 'Prodigy Farms',
        quantity: Math.round(quantity * 10) / 10,
        addedAt: Date.now(),
      });
    }
    write(items);
    return items;
  },

  /* Set exact quantity (0 removes) */
  setQuantity(productId, quantity) {
    let items = read();
    if (quantity <= 0) {
      items = items.filter((i) => i.id !== productId);
    } else {
      const item = items.find((i) => i.id === productId);
      if (item) item.quantity = Math.round(quantity * 10) / 10;
    }
    write(items);
    return items;
  },

  /* Remove a single item */
  remove(productId) {
    const items = read().filter((i) => i.id !== productId);
    write(items);
    return items;
  },

  /* Empty the cart */
  clear() {
    write([]);
  },

  /* ⚡ Badge count = NUMBER OF DISTINCT PRODUCTS (not total kg) */
  getCount() {
    return read().length;
  },

  /* Subtotal in cents */
  getSubtotal() {
    return read().reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  /* Subscribe to changes — returns unsubscribe fn */
  onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  /* Force a notify (call after page load) */
  refresh() {
    notify();
  },
};

/* ============================================
   Auto-update header cart badge on every page
   ============================================ */
function updateHeaderBadge() {
  const badge = document.getElementById('cart-count');
  if (!badge) return;
  badge.textContent = Cart.getCount();
}

document.addEventListener('DOMContentLoaded', updateHeaderBadge);
window.addEventListener('storage', updateHeaderBadge);   // cross-tab sync
Cart.onChange(updateHeaderBadge);