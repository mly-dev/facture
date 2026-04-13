/**
 * Format a number as FCFA currency
 * e.g. 1500000 → "1 500 000 FCFA"
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 FCFA'
  const num = parseFloat(amount)
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(num) + ' FCFA'
}

/**
 * Format a number with space separator (no currency label)
 */
export function formatNumber(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '0'
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(parseFloat(amount))
}
