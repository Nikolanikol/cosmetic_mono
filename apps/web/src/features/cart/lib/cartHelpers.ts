export function calculateCartTotal(
  items: Array<{ price: number; salePrice?: number | null; quantity: number }>
): number {
  return items.reduce(
    (sum, item) => sum + (item.salePrice ?? item.price) * item.quantity,
    0
  );
}

export function calculateDiscount(
  items: Array<{ price: number; salePrice?: number | null; quantity: number }>
): number {
  return items.reduce((sum, item) => {
    const discount = item.salePrice != null ? item.price - item.salePrice : 0;
    return sum + discount * item.quantity;
  }, 0);
}
