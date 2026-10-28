// src/services/chapa.js
const axios = require('axios');
const env = require('../config/env');

const chapa = axios.create({
  baseURL: env.chapa.baseUrl,
  headers: {
    Authorization: `Bearer ${env.chapa.secretKey}`,
    'Content-Type': 'application/json',
  },
});

/* Initialize a payment — returns { checkout_url } */
exports.initialize = async ({ amount, currency = 'ETB', email, firstName, lastName, phone, txRef, callbackUrl, returnUrl, subaccounts }) => {
  const { data } = await chapa.post('/transaction/initialize', {
    amount,
    currency,
    email,
    first_name: firstName,
    last_name: lastName,
    phone_number: phone,
    tx_ref: txRef,
    callback_url: callbackUrl,
    return_url: returnUrl,
    customization: {
      title: 'Etfruit',
      description: 'Fresh produce from Ethiopian sellers',
    },
    ...(subaccounts?.length ? { subaccounts } : {}),
  });
  return data;
};

/* Verify a payment — returns { status, data: {...} } */
exports.verify = async (txRef) => {
  const { data } = await chapa.get(`/transaction/verify/${txRef}`);
  return data;
};

/* Create a seller subaccount after admin approval */
exports.createSubaccount = async ({ businessName, accountName, accountNumber, bankCode, splitType = 'percentage', splitValue = 90 }) => {
  const { data } = await chapa.post('/subaccount', {
    business_name: businessName,
    account_name: accountName,
    account_number: accountNumber,
    bank_code: bankCode,
    split_type: splitType,
    split_value: splitValue,
  });
  return data;
};