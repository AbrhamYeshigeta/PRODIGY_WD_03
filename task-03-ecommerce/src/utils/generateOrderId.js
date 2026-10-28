// src/utils/generateOrderId.js
const crypto = require('crypto');

module.exports = function generateOrderId() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 hex chars
  return `ORD-${ymd}-${rand}`;
};