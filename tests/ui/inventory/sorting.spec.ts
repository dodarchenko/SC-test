import { test, expect } from '@fixtures';
import { defaultSortOption, sortOptionValues } from '@data/inventory';
import { users } from '@data/users';
import { findTitleIssues } from '@utils/product-title';
import { report } from '@utils/report';

test.describe('Inventory sorting', () => {
  test(
    'sorts products by name Z to A',
    { tag: ['@inventory'] },
    async ({ signInViaState, inventoryPage, messages, locale }) => {
      const sortLabels = messages.inventory.sortOptions;
      // Expected order follows the alphabet of the test's locale.
      const { compare } = new Intl.Collator(locale);

      await signInViaState(users.standard);

      const initialTitles = await test.step('Inventory opens with the default sort', async () => {
        await expect(inventoryPage.activeSortOption).toHaveText(sortLabels[defaultSortOption]);
        return inventoryPage.products.readTitles();
      });

      await test.step(`Select "${sortLabels.nameZToA}"`, async () => {
        await inventoryPage.sortBy('nameZToA');
        await expect(inventoryPage.activeSortOption).toHaveText(sortLabels.nameZToA);
        await expect(inventoryPage.sortSelect).toHaveValue(sortOptionValues.nameZToA);
      });

      const sortedTitles = await test.step('Products are in Z to A order', async () => {
        // Web-first assertion: retries until the list re-renders in the new order.
        await expect(inventoryPage.products.itemTitles).toHaveText([...initialTitles].sort((a, b) => compare(b, a)));
        return inventoryPage.products.readTitles();
      });

      await test.step('Flag malformed product titles', async () => {
        // Titles with defects still take part in sorting (checked above). They're
        // reported as issues and fail the test, after the sort check has run.
        const issues = findTitleIssues(sortedTitles);
        for (const { title, reason } of issues) {
          await report({
            type: 'issue',
            summary: `Product title "${title}" ${reason}`,
            data: { title, reason },
            level: 'warn',
          });
        }
        expect.soft(issues, 'product titles without content defects').toEqual([]);
      });
    },
  );
});
