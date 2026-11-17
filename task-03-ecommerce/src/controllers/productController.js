const asyncHandler = require('../utils/asyncHandler');
const ApiError     = require('../utils/ApiError');
const prisma       = require('../config/prisma');
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
            status: OFFER_STATUS.ACTIVE, // Only count active offers
            stock: { gt: 0 },            // Only count if in stock
            seller: { is: { verificationStatus: 'verified' } }, // Only count if seller is verified
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

    // Remove the heavy offers array from the final payload to keep the landing page fast
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
        orderBy: { pricePerKg: 'asc' } // Cheapest first
      }
    }
  });

  if (!product) throw ApiError.notFound('Product not found');

  // This returns { success: true, data: { id, name, slug, offers: [...] } }
  // It matches the frontend perfectly.
  res.json({ 
    success: true, 
    data: product 
  });
});