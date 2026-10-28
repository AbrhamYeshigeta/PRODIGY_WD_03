// src/config/constants.js

const ROLES = {
  CUSTOMER: 'customer',
  SELLER:   'seller',
  ADMIN:    'admin',
};

const SELLER_SCALES = {
  retail:    { unit: 'kg',      kgFactor: 1,    label: 'Kilo Seller',    minOrder: 1 },
  wholesale: { unit: 'quintal', kgFactor: 100,  label: 'Quintal Seller', minOrder: 1 },
  bulk:      { unit: 'ton',     kgFactor: 1000, label: 'Ton Seller',     minOrder: 1 },
};

const SELLER_STATUS = {
  PENDING:   'pending',
  VERIFIED:  'verified',
  REJECTED:  'rejected',
  SUSPENDED: 'suspended',
};

const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PAID:            'paid',
  PROCESSING:      'processing',
  SHIPPED:         'shipped',
  DELIVERED:       'delivered',
  CANCELLED:       'cancelled',
};

const PAYMENT_METHODS = {
  CHAPA:           'chapa',
  CASH_ON_DELIVERY: 'cod',
  BANK_TRANSFER:   'bank_transfer',
};

const OFFER_STATUS = {
  ACTIVE:       'active',
  PAUSED:       'paused',
  OUT_OF_STOCK: 'out_of_stock',
  DRAFT:        'draft',
};

/* How much Etfruit keeps from each sale (percent) */
const PLATFORM_COMMISSION_PCT = 10;

module.exports = {
  ROLES,
  SELLER_SCALES,
  SELLER_STATUS,
  ORDER_STATUS,
  PAYMENT_METHODS,
  OFFER_STATUS,
  PLATFORM_COMMISSION_PCT,
};