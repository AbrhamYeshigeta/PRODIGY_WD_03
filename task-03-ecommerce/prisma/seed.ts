import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config'; 

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

interface CatalogItem {
  name: string;
  category: string;
  image: string;
}

const catalog: CatalogItem[] = [
  // ── 1. Leafy Greens ──
  { name: 'Spinach', category: 'Leafy Greens', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&q=80' },
  { name: 'Kale', category: 'Leafy Greens', image: 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?w=500&q=80' },
  { name: 'Romaine Lettuce', category: 'Leafy Greens', image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=500&q=80' },
  { name: 'Arugula', category: 'Leafy Greens', image: 'https://images.unsplash.com/photo-1590868309235-ea34bed7bd7f?w=500&q=80' },
  { name: 'Swiss Chard', category: 'Leafy Greens', image: 'https://images.unsplash.com/photo-1590868309235-ea34bed7bd7f?w=500&q=80' },
  { name: 'Collard Greens', category: 'Leafy Greens', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&q=80' },
  { name: 'Bok Choy', category: 'Leafy Greens', image: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=500&q=80' },
  { name: 'Mustard Greens', category: 'Leafy Greens', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&q=80' },
  { name: 'Cabbage', category: 'Leafy Greens', image: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=500&q=80' },
  { name: 'Red Cabbage', category: 'Leafy Greens', image: 'https://images.unsplash.com/photo-1625938145312-c1826f3d6814?w=500&q=80' },

  // ── 2. Root Vegetables ──
  { name: 'Carrots', category: 'Root Vegetables', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&q=80' },
  { name: 'Beets', category: 'Root Vegetables', image: 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?w=500&q=80' },
  { name: 'Sweet Potatoes', category: 'Root Vegetables', image: 'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?w=500&q=80' },
  { name: 'Turnips', category: 'Root Vegetables', image: 'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?w=500&q=80' },
  { name: 'Radishes', category: 'Root Vegetables', image: 'https://images.unsplash.com/photo-1563561134-441dd961b0e1?w=500&q=80' },
  { name: 'Onions', category: 'Root Vegetables', image: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=500&q=80' },
  { name: 'Garlic', category: 'Root Vegetables', image: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=500&q=80' },

  // ── 3. Fruit Vegetables ──
  { name: 'Tomatoes', category: 'Fruit Vegetables', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80' },
  { name: 'Eggplant', category: 'Fruit Vegetables', image: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=500&q=80' },
  { name: 'Cucumbers', category: 'Fruit Vegetables', image: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=500&q=80' },
  { name: 'Zucchini', category: 'Fruit Vegetables', image: 'https://images.unsplash.com/photo-1563252722-6434563a985d?w=500&q=80' },
  { name: 'Okra', category: 'Fruit Vegetables', image: 'https://images.unsplash.com/photo-1628101986614-7b6e0cc9e8b1?w=500&q=80' },
  { name: 'Pumpkin', category: 'Fruit Vegetables', image: 'https://images.unsplash.com/photo-1506918561942-0e20b6c98b1c?w=500&q=80' },
  { name: 'Broccoli', category: 'Fruit Vegetables', image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=500&q=80' },
  { name: 'Cauliflower', category: 'Fruit Vegetables', image: 'https://images.unsplash.com/photo-1568584711271-9c9298a3e935?w=500&q=80' },
  { name: 'Green Beans', category: 'Fruit Vegetables', image: 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?w=500&q=80' },
  { name: 'Snap Peas', category: 'Fruit Vegetables', image: 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?w=500&q=80' },

  // ── 4. Peppers ──
  { name: 'Bell Peppers', category: 'Peppers', image: 'https://images.unsplash.com/photo-1563561134-441dd961b0e1?w=500&q=80' },
  { name: 'Green Pepper (Karya)', category: 'Peppers', image: 'https://images.unsplash.com/photo-1601648764658-cf37e8c89b70?w=500&q=80' },
  { name: 'Mitmita (Very Hot Pepper)', category: 'Peppers', image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=500&q=80' },
  { name: 'Mareko Fana', category: 'Peppers', image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=500&q=80' },
  { name: 'Bako Local', category: 'Peppers', image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=500&q=80' },

  // ── 5. Herbs ──
  { name: 'Fresh Mint', category: 'Herbs', image: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=500&q=80' },
  { name: 'Fresh Parsley', category: 'Herbs', image: 'https://images.unsplash.com/photo-1590868309235-ea34bed7bd7f?w=500&q=80' },
  { name: 'Fresh Cilantro', category: 'Herbs', image: 'https://images.unsplash.com/photo-1590868309235-ea34bed7bd7f?w=500&q=80' },
  { name: 'Fresh Basil', category: 'Herbs', image: 'https://images.unsplash.com/photo-1618375569909-3c8616cf7733?w=500&q=80' },
  { name: 'Rosemary', category: 'Herbs', image: 'https://images.unsplash.com/photo-1515586000433-45406d8e6662?w=500&q=80' },

  // ── 6. Fruits ──
  { name: 'Bananas', category: 'Fruits', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&q=80' },
  { name: 'Mango', category: 'Fruits', image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&q=80' },
  { name: 'Pineapple', category: 'Fruits', image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=500&q=80' },
  { name: 'Papaya', category: 'Fruits', image: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=500&q=80' },
  { name: 'Guava', category: 'Fruits', image: 'https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?w=500&q=80' },
  { name: 'Watermelon', category: 'Fruits', image: 'https://images.unsplash.com/photo-1589984662646-e7b2e4962f18?w=500&q=80' },
  { name: 'Cantaloupe', category: 'Fruits', image: 'https://images.unsplash.com/photo-1571575173700-afb9492e6a50?w=500&q=80' },
  { name: 'Honeydew', category: 'Fruits', image: 'https://images.unsplash.com/photo-1571575173700-afb9492e6a50?w=500&q=80' },
  { name: 'Apples', category: 'Fruits', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&q=80' },
  { name: 'Pears', category: 'Fruits', image: 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=500&q=80' },
  { name: 'Peaches', category: 'Fruits', image: 'https://images.unsplash.com/photo-1629828874514-c1e5010c9e4b?w=500&q=80' },
  { name: 'Plums', category: 'Fruits', image: 'https://images.unsplash.com/photo-1595124245030-4145c8e5594a?w=500&q=80' },
  { name: 'Nectarines', category: 'Fruits', image: 'https://images.unsplash.com/photo-1629828874514-c1e5010c9e4b?w=500&q=80' },
  { name: 'Cherries', category: 'Fruits', image: 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=500&q=80' },
  { name: 'Apricots', category: 'Fruits', image: 'https://images.unsplash.com/photo-1595124245030-4145c8e5594a?w=500&q=80' },
  { name: 'Grapes', category: 'Fruits', image: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=500&q=80' },
  { name: 'Pomegranate', category: 'Fruits', image: 'https://images.unsplash.com/photo-1541344999736-83eca272f6fc?w=500&q=80' },
  { name: 'Figs', category: 'Fruits', image: 'https://images.unsplash.com/photo-1601379760886-4b6e4bc9b01e?w=500&q=80' },
  { name: 'Avocado', category: 'Fruits', image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&q=80' },
  { name: 'Oranges', category: 'Fruits', image: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=500&q=80' },
  { name: 'Grapefruit', category: 'Fruits', image: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=500&q=80' },
  { name: 'Tangerines', category: 'Fruits', image: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=500&q=80' },
  { name: 'Clementines', category: 'Fruits', image: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=500&q=80' },
  { name: 'Lemons', category: 'Fruits', image: 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=500&q=80' },
  { name: 'Limes', category: 'Fruits', image: 'https://images.unsplash.com/photo-1622957461168-20276c2df3e9?w=500&q=80' },
];

async function main(): Promise<void> {
  console.log('Seeding database with strictly 6 categories...');
  
  for (const item of catalog) {
    const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    await prisma.product.upsert({
      where: { slug },
      update: {
        category: item.category, // Force update the category if it exists
      },
      create: {
        name: item.name,
        slug: slug,
        category: item.category,
        image: item.image,
      },
    });
  }
  
  console.log('Seeding complete! 🎉');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());