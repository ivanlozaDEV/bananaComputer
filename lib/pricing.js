export function getOrderBreakdown(items, paymentMethod) {
  const safeItems = Array.isArray(items) ? items : [];
  
  // 1. Calculate Base Total (Sum of standard prices)
  const baseTotalConIva = safeItems.reduce((sum, item) => {
    const price = parseFloat(item.price || item.unit_price) || 0;
    const qty = parseInt(item.quantity) || 1;
    return sum + (price * qty);
  }, 0);
  
  const baseTotalSinIva = baseTotalConIva / 1.15;

  // 2. Calculate Cart Total (Applying active payment method rules)
  let cartTotalConIva = 0;
  if (paymentMethod === 'transfer') {
    cartTotalConIva = safeItems.reduce((sum, item) => {
      const raw = parseFloat(item.price || item.unit_price) || 0;
      const transfer = parseFloat(item.transfer_price) || (raw / 1.06);
      const qty = parseInt(item.quantity) || 1;
      return sum + (transfer * qty);
    }, 0);
  } else {
    cartTotalConIva = baseTotalConIva;
  }

  // 3. Compute explicit discounts
  const discountConIva = Math.max(0, baseTotalConIva - cartTotalConIva);
  const discountSinIva = discountConIva / 1.15;

  // 4. Compute Tax Parameters relative to the net payable amount
  const baseImponible = cartTotalConIva / 1.15;
  const iva = cartTotalConIva - baseImponible;

  return {
    baseTotalConIva,
    baseTotalSinIva,
    cartTotalConIva,
    discountConIva,
    discountSinIva,
    baseImponible,
    iva,
    isTransfer: paymentMethod === 'transfer',
    hasDiscount: discountConIva > 0
  };
}
