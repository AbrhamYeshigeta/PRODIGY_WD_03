require('dotenv').config();
const prisma = require('../config/prisma');

const products = [
  { slug: 'fresh-parsley-bunch', name: 'Fresh Parsley Bunch', category: 'Herbs', image: '/img/Fresh Parsley Bunch.avif' },
  { slug: 'purple-eggplant', name: 'Purple Eggplant', category: 'Fruit Vegetables', image: '/img/purple_eggplant.jpeg' },
  { slug: 'passion-fruits-pack-of-6', name: 'Passion Fruits (Pack of 6)', category: 'Fruits', image: '/img/Passion Fruits (Pack of 6).jpeg' },
  { slug: 'fresh-mint-bunch', name: 'Fresh Mint Bunch', category: 'Herbs', image: '/img/Fresh Mint Bunch.jpg' },
  { slug: 'swiss-chard-bunch', name: 'Swiss Chard Bunch', category: 'Leafy Greens', image: '/img/Swiss Chard Bunch.jpeg' },
  { slug: 'fresh-beetroot-3-pcs', name: 'Fresh Beetroot (3 pcs)', category: 'Root Vegetables', image: '/img/Fresh Beetroot (3 pcs).jpeg' },
  { slug: 'cauliflower-head', name: 'Cauliflower Head', category: 'Fruit Vegetables', image: '/img/Cauliflower Head.jpg' },
  { slug: 'fresh-ginger', name: 'Fresh Ginger', category: 'Root Vegetables', image: '/img/Fresh-Ginger.jpg' },
  { slug: 'sweet-potatoes', name: 'Sweet Potatoes', category: 'Root Vegetables', image: '/img/Sweet Potatoes.jpeg' },
  { slug: 'fresh-cilantro', name: 'Fresh Cilantro', category: 'Herbs', image: '/img/dhania-cilantro.jpg' },
].map((product) => ({ ...product, image: encodeURI(product.image) }));

async function seedCatalog() {
  let inserted = 0;
  for (const product of products) {
    const existing = await prisma.product.findUnique({ where: { slug: product.slug } });
    if (existing) continue;
    await prisma.product.create({ data: product });
    inserted += 1;
  }
  console.log(`Catalog ready: added ${inserted} products; existing products were left unchanged.`);
}

seedCatalog()
  .catch((error) => {
    console.error('Catalog seeding failed', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
