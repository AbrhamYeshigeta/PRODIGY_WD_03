// src/config/prisma.js
require('dotenv').config(); // Load environment variables
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

// 1. Create the PostgreSQL driver adapter
const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL 
});

// 2. Pass the adapter to the Prisma Client constructor
const prisma = new PrismaClient({ adapter });

module.exports = prisma;