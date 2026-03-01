/**
 * Price formatting utility
 * Formats prices in Russian Rubles
 */

const RUB_FORMATTER = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const RUB_FORMATTER_WITH_DECIMALS = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format price in Russian Rubles
 */
export function formatPrice(
  price: number,
  showCurrency: boolean = true,
  decimals: boolean = false
): string {
  const formatter = decimals ? RUB_FORMATTER_WITH_DECIMALS : RUB_FORMATTER;
  const formatted = formatter.format(price);

  if (!showCurrency) {
    // Remove currency symbol and whitespace
    return formatted.replace(/\s*₽\s*/g, '').trim();
  }

  return formatted;
}

/**
 * Format price range
 */
export function formatPriceRange(
  minPrice: number,
  maxPrice: number,
  showCurrency: boolean = true
): string {
  if (minPrice === maxPrice) {
    return formatPrice(minPrice, showCurrency);
  }

  const min = formatPrice(minPrice, false);
  const max = formatPrice(maxPrice, showCurrency);

  return showCurrency ? `${min} – ${max}` : `${min} – ${max}`;
}

/**
 * Parse price string to number
 */
export function parsePrice(priceString: string): number {
  // Remove all non-numeric characters except decimal point
  const cleaned = priceString.replace(/[^\d.,]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}
