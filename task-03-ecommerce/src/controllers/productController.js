// src/controllers/productController.js
const asyncHandler = require('../utils/asyncHandler');
const ApiError     = require('../utils/ApiError');
const prisma       = require('../config/prisma'); // Replaced Mongoose models
const { OFFER_STATUS } = require('../config/constants');

/* ── GET /api/products ── landing page: one card per product */
exports.list = asyncHandler(async (req, res) => {
  const { q, category, sort = 'popular', page = 1, limit = 24 } = req.query;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const take = parseInt(limit, 10);

  // 1. Build the Prisma filter
  const where = {};
  if (category) where.category = category;
  if (q) where.name = { contains: q, mode: 'insensitive' }; // Case-insensitive search

  // 2. Fetch products and total count simultaneously
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { name: 'asc' },
      include: {
        offers: {
          where: {
            status: OFFER_STATUS.ACTIVE,
            stock: { gt: 0 },
            seller: { is: { verificationStatus: 'verified' } },
          },
        }
      }
    }),
    prisma.product.count({ where })
  ]);

  // 3. Calculate the aggregation stats in JavaScript
  const enriched = products.map((p) => {
    const sellerCount = new Set(p.offers.map((offer) => offer.sellerId)).size;
    const lowestPricePerKg = p.offers.length > 0
      ? Math.min(...p.offers.map(o => o.pricePerKg)) 
      : 0;
    const totalStock = p.offers.reduce((sum, o) => sum + o.stock, 0);

    // Remove the offers array from the final payload to keep it lightweight
    const { offers, ...productData } = p; 

    return { 
      ...productData, 
      sellerCount,
      offerCount: sellerCount,
      lowestPricePerKg, 
      totalStock 
    };
  });

  // 4. Apply sorting logic
  if (sort === 'lowest-price') {
    enriched.sort((a, b) => (a.lowestPricePerKg || Infinity) - (b.lowestPricePerKg || Infinity));
  }
  if (sort === 'offers' || sort === 'popular') {
    enriched.sort((a, b) => b.sellerCount - a.sellerCount || a.name.localeCompare(b.name));
  }

  res.json({
    success: true,
    data: enriched,
    pagination: {
      page: parseInt(page, 10),
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  });
});

/* ── GET /api/products/:slug ── single product + all its offers */
exports.getOne = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: {
      offers: {
        where: {
          status: OFFER_STATUS.ACTIVE,
          stock: { gt: 0 },
          seller: { is: { verificationStatus: 'verified' } },
        },
        include: {
          seller: {
            select: {
              id: true,
              businessName: true,
              businessType: true,
              city: true,
              country: true,
              rating: true,
              verificationStatus: true,
            },
          },
        },
        orderBy: { pricePerKg: 'asc' }
      }
    }
  });

  if (!product) throw ApiError.notFound('Product not found');

  res.json({ 
    success: true, 
    data: { 
      product, 
      offers: product.offers 
    } 
  });
});

// src/controllers/productController.js
exports.getLandingPageProducts = asyncHandler(async (req, res) => {
  // Fetch ALL products, regardless of whether they have offers
  const products = await prisma.product.findMany({
    include: {
      offers: {
        where: { status: 'active' },
        orderBy: { pricePerKg: 'asc' }
      }
    }
  });

  const formattedProducts = products.map(product => {
    const offers = product.offers;
    const lowestPricePerKg = offers.length > 0 ? offers[0].pricePerKg : 0;
    const sellerCount = offers.length;

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      image: product.image,
      category: product.category,
      sellerCount,           // Will be 0 if no one is selling
      lowestPricePerKg       // Will be 0 if no one is selling
    };
  });

  res.json({ success: true, data: formattedProducts });
});