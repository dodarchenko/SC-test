/** Parses the first dollar amount in a label: "$29.99", "Item total: $61.97". */
export function parseMoney(label: string): number {
  const match = label.match(/\$\s*([\d,]+(?:\.\d+)?)/);
  if (!match) throw new Error(`Cannot parse a dollar amount from "${label}"`);
  return Number(match[1].replace(/,/g, ''));
}

/** Dollars → integer cents, so sums and comparisons avoid float drift. */
export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Sum of dollar amounts, in cents. */
export function sumCents(amounts: readonly number[]): number {
  return amounts.reduce((total, amount) => total + toCents(amount), 0);
}

export function formatMoney(dollars: number): string {
  return `$${dollars.toFixed(2)}`;
}
