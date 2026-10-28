// src/utils/money.js
/* All money in the DB is stored in cents (integer). 9000 = 90.00 ETB */

const toCents = (etb) => Math.round(Number(etb) * 100);
const toETB   = (cents) => (cents / 100).toFixed(2);
const format  = (cents) =>
  `${(cents / 100).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`;

module.exports = { toCents, toETB, format };