// src/services/email.js
const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

if (env.email.host) {
  transporter = nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.port === 465,
    auth: { user: env.email.user, pass: env.email.pass },
  });
}

async function send({ to, subject, html, text }) {
  if (!transporter) {
    console.warn('⚠️  Email skipped (no SMTP configured):', subject);
    return;
  }
  return transporter.sendMail({ from: env.email.from, to, subject, html, text });
}

exports.sendOrderConfirmation = (order, user) =>
  send({
    to: user.email,
    subject: `Order ${order.orderId} confirmed`,
    html: `<h2>Thanks, ${user.name}!</h2><p>Your order <strong>${order.orderId}</strong> is confirmed.</p>`,
  });

exports.sendSellerApproved = (seller, user) =>
  send({
    to: user.email,
    subject: `You're verified on Etfruit 🎉`,
    html: `<h2>Welcome to Etfruit, ${seller.businessName}</h2><p>Your seller account is verified. You can now publish offers.</p>`,
  });