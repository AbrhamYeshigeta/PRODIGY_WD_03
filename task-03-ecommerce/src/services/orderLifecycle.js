const prisma = require('../config/prisma');

const RECEIPT_CONFIRMATION_WINDOW_MS = 24 * 60 * 60 * 1000;

async function completeDeliveredOrders() {
  const deadline = new Date(Date.now() - RECEIPT_CONFIRMATION_WINDOW_MS);
  const dueOrders = await prisma.order.findMany({
    where: {
      status: 'delivered',
      deliveredAt: { lte: deadline },
    },
    select: { id: true, paymentMethod: true },
    take: 100,
  });

  let completedCount = 0;
  for (const order of dueOrders) {
    const completed = await prisma.$transaction(async (tx) => {
      const claimed = await tx.order.updateMany({
        where: {
          id: order.id,
          status: 'delivered',
          deliveredAt: { lte: deadline },
        },
        data: {
          status: 'completed',
          completedAt: new Date(),
          settlementStatus: order.paymentMethod === 'chapa' ? 'eligible' : 'not_applicable',
        },
      });
      if (claimed.count !== 1) return false;

      await tx.orderItem.updateMany({
        where: { orderId: order.id, status: 'delivered' },
        data: { status: 'completed' },
      });
      await tx.fulfillment.updateMany({
        where: { orderId: order.id, status: 'delivered' },
        data: { status: 'completed' },
      });
      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          actorRole: 'system',
          status: 'completed',
          note: order.paymentMethod === 'chapa'
            ? 'Order completed after the 24-hour receipt window. Seller settlement is eligible for the platform payout process.'
            : 'Order completed after the 24-hour receipt window.',
        },
      });
      return true;
    });
    if (completed) completedCount += 1;
  }
  return completedCount;
}

module.exports = { completeDeliveredOrders };
