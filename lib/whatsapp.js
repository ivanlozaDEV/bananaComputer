/**
 * Genera la URL de WhatsApp con un mensaje estructurado del pedido.
 * @param {Object} order - Datos de la orden (order_number, full_name, etc.)
 * @param {Array} items - Lista de productos en el carrito
 * @param {Object} totals - Desglose de totales (subtotal, tax, total)
 */
export const getWhatsAppUrl = (order, items, totals) => {
  const phone = "593984852504"; // Número de Banana Computer - Reemplazar con el correcto si es diferente
  
  const productsList = items
    .map(i => `* ${i.name} x${i.quantity || 1} - $${((parseFloat(i.price) || 0) * (i.quantity || 1)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`)
    .join('\n');

  const message = `Hola, acabo de realizar el pedido:

Orden: ${order.order_number}
Cliente: ${order.full_name}

Productos:
${productsList}

Subtotal: $${parseFloat(totals.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
IVA (15%): $${parseFloat(totals.tax).toLocaleString(undefined, { minimumFractionDigits: 2 })}
Total: $${parseFloat(totals.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}

Método de pago: Transferencia bancaria

Realizaré la transferencia y adjunto el comprobante por este medio.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};
