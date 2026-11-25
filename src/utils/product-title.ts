export interface TitleIssue {
  readonly title: string;
  readonly reason: string;
}

interface TitleRule {
  readonly reason: string;
  readonly matches: (title: string) => boolean;
}

/**
 * Content rules for customer-facing product titles. A title that breaks one is
 * still a valid string for sorting, but is a content defect worth reporting.
 */
const TITLE_RULES: TitleRule[] = [
  {
    reason: 'contains code (method call) instead of product copy',
    matches: (title) => /\b\w+\.\w+\(\)/.test(title),
  },
  {
    reason: 'has leading or trailing whitespace',
    matches: (title) => title !== title.trim(),
  },
  {
    reason: 'is empty',
    matches: (title) => title.trim().length === 0,
  },
];

export function findTitleIssues(titles: readonly string[]): TitleIssue[] {
  return titles.flatMap((title) =>
    TITLE_RULES.filter((rule) => rule.matches(title)).map(({ reason }) => ({ title, reason })),
  );
}
