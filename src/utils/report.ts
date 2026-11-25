import { test } from '@playwright/test';

export interface ReportEntry {
  /** Short category, e.g. "issue" or "product added to cart". */
  readonly type: string;
  /** One-line, human-readable summary. */
  readonly summary: string;
  /** Optional details, attached to the report as JSON. */
  readonly data?: unknown;
  readonly level?: 'info' | 'warn';
}

/**
 * Records something worth seeing in the results: an annotation in the HTML
 * report, a JSON attachment in the report and trace, and a console line.
 */
export async function report({ type, summary, data, level = 'info' }: ReportEntry): Promise<void> {
  const testInfo = test.info();
  testInfo.annotations.push({ type, description: summary });
  if (data !== undefined) {
    await testInfo.attach(type, { body: JSON.stringify(data, null, 2), contentType: 'application/json' });
  }
  const log = level === 'warn' ? console.warn : console.log;
  log(`[${type}] ${summary}`);
}
