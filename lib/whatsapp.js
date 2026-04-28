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
      const qty = i.quantity || 1;
      return `* ${i.name} x${qty} - $${((rawPrice / 1.15) * qty).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    })
    .join('\n');

  let totalsSection = '';
  if (isTransfer && totals.discountAmount > 0) {
    const baseWithoutTax = parseFloat(totals.baseTotal) / 1.15;
    const discountWithoutTax = parseFloat(totals.discountAmount) / 1.15;
    const baseImponible = parseFloat(totals.total) / 1.15;
    const finalTaxValue = parseFloat(totals.total) - baseImponible;
    totalsSection = `Subtotal: $${baseWithoutTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
Descuento: -$${discountWithoutTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
Base Imponible: $${baseImponible.toLocaleString(undefined, { minimumFractionDigits: 2 })}
IVA (15%): $${finalTaxValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
Total: $${parseFloat(totals.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  } else {
    const baseImponible = parseFloat(totals.total) / 1.15;
    totalsSection = `Subtotal: $${baseImponible.toLocaleString(undefined, { minimumFractionDigits: 2 })}
Base Imponible: $${baseImponible.toLocaleString(undefined, { minimumFractionDigits: 2 })}
IVA (15%): $${parseFloat(totals.tax).toLocaleString(undefined, { minimumFractionDigits: 2 })}
Total: $${parseFloat(totals.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }

  const message = `Hola, acabo de realizar el pedido:

Orden: ${order.order_number}
Cliente: ${order.full_name}

Productos:
${productsList}

${totalsSection}

Método de pago: ${isTransfer ? 'Transferencia bancaria' : 'PayPhone'}

Realizaré la transferencia y adjunto el comprobante por este medio.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};
