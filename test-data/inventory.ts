/**
 * `<option value>` of each entry in the inventory sort dropdown. The visible
 * labels are site texts and live in the i18n messages (`inventory.sortOptions`).
 */
export const sortOptionValues = {
  nameAToZ: 'az',
  nameZToA: 'za',
  priceLowToHigh: 'lohi',
  priceHighToLow: 'hilo',
} as const;

export type SortOption = keyof typeof sortOptionValues;

/** Sort the inventory uses when nothing is selected. */
export const defaultSortOption: SortOption = 'nameAToZ';
