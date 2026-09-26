/* ============================================
   Orders — localStorage-backed
   Badge/key: prodigy_orders_v1
   ============================================ */

const ORDERS_KEY = 'prodigy_orders_v1';
const listeners = new Set();

function read() {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  listeners.forEach((fn) => fn(orders));
}

function generateOrderNumber() {
  const d = new Date();
  const ymd =
    `${d.getFullYear()}` +
    `${String(d.getMonth() + 1).padStart(2, '0')}` +
    `${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${ymd}-${rand}`;
}

function normalizeCustomer(customer = {}) {
  const email = String(customer.email || '').trim().toLowerCase();
  return {
    id: customer.id || '',
    username: customer.username || customer.fullName || 'Customer',
    email,
  };
}

export const Orders = {
  create(cartItems, shippingAddress = {}, options = {}) {
    const subtotal = cartItems.reduce(
      (s, i) => s + Math.round(i.price * i.quantity),
      0
    );
    const shipping = subtotal >= 50000 ? 0 : 5000;
    const total = subtotal + shipping;
    const customer = normalizeCustomer(options.customer || {});

    const order = {
      id: generateOrderNumber(),
      createdAt: Date.now(),
      items: cartItems.map((i) => ({ ...i })),
      subtotal,
      shipping,
      total,
      currency: 'ETB',
      status: 'pending_payment',
      statusHistory: [{ status: 'pending_payment', at: Date.now() }],
      shippingAddress,
      paymentMethod: options.paymentMethod || 'cash_on_delivery',
      customerNote: options.customerNote || '',
      customer,
      customerId: customer.id,
      customerName: customer.username,
      customerEmail: customer.email,
    };

    const orders = read();
    orders.unshift(order);
    write(orders);
    return order;
  },

  getAll() { return read(); },
  getById(id) { return read().find((o) => o.id === id); },
  getForUser(user = null) {
    if (!user) return [];
    const email = String(user.email || '').trim().toLowerCase();
    const id = String(user.id || '');

    return read().filter((order) => {
      const customer = order.customer || {};
      const customerEmail = String(customer.email || order.customerEmail || '').trim().toLowerCase();
      const customerId = String(customer.id || order.customerId || '');
      return customerEmail === email || customerId === id || (!email && !id && order.customerName === user.username);
    });
  },

  updateStatus(id, status) {
    const orders = read();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    orders[idx].status = status;
    orders[idx].statusHistory.push({ status, at: Date.now() });
    write(orders);
    return orders[idx];
  },

  clear() { write([]); },

  onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};