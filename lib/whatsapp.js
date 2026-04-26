/**
 * Genera la URL de WhatsApp con un mensaje estructurado del pedido.
 * @param {Object} order - Datos de la orden (order_number, full_name, etc.)
 * @param {Array} items - Lista de productos en el carrito
 * @param {Object} totals - Desglose de totales (subtotal, tax, total)
 * @param {string} paymentMethod - 'transfer' | 'payphone'
 */
export const getWhatsAppUrl = (order, items, totals, paymentMethod = 'transfer') => {
  const phone = "593999046647"; // Banana Computer ventas

  const isTransfer = paymentMethod === 'transfer';

  const productsList = items
    .map(i => {
      const rawPrice = parseFloat(i.price) || 0;
      const displayPrice = isTransfer ? rawPrice / 1.06 : rawPrice;
      const qty = i.quantity || 1;
      return `* ${i.name} x${qty} - $${(displayPrice * qty).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    })
    .join('\n');

  const message = `Hola, acabo de realizar el pedido:

Orden: ${order.order_number}
Cliente: ${order.full_name}

Productos:
${productsList}

Subtotal: $${parseFloat(totals.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
IVA (15%): $${parseFloat(totals.tax).toLocaleString(undefined, { minimumFractionDigits: 2 })}
Total: $${parseFloat(totals.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}

Método de pago: ${isTransfer ? 'Transferencia bancaria' : 'PayPhone'}

Realizaré la transferencia y adjunto el comprobante por este medio.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};
