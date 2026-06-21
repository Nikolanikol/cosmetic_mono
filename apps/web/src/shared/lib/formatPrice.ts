const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPrice(
  price: number,
  showCurrency: boolean = true,
): string {
  const formatted = USD_FORMATTER.format(price);
  if (!showCurrency) {
    return formatted.replace(/\$\s*/g, '').trim();
  }
  return formatted;
}

export function formatPriceRange(
  minPrice: number,
  maxPrice: number,
  showCurrency: boolean = true
): string {
  if (minPrice === maxPrice) {
    return formatPrice(minPrice, showCurrency);
  }
  return `${formatPrice(minPrice, false)} – ${formatPrice(maxPrice, showCurrency)}`;
}

export function parsePrice(priceString: string): number {
  const cleaned = priceString.replace(/[^\d.,]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}
