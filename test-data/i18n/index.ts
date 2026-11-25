import { en } from './en';

/** Same shape as a dictionary, with plain strings instead of the English literals. */
type Dictionary<T> = { readonly [K in keyof T]: T[K] extends string ? string : Dictionary<T[K]> };

/** The texts of one locale. English defines the keys; other locales must match them. */
export type Messages = Dictionary<typeof en>;

/**
 * Registered locales, keyed by language (`en`) or full tag (`en-GB`) for regional variants.
 * To add one: create `nl.ts` exporting `nl: Messages`, then register it here.
 */
const locales: Record<string, Messages> = { en };

/**
 * Texts for a browser locale such as `en-US`. Tries the full tag first, then the
 * language, so `en-US` and `en-GB` both use `en` unless a regional variant exists.
 */
export function messagesFor(locale: string): Messages {
  const language = locale.split('-')[0];
  const messages = locales[locale] ?? locales[language];
  if (!messages) {
    throw new Error(`No messages for locale "${locale}". Available: ${Object.keys(locales).join(', ')}`);
  }
  return messages;
}

/** Fills `{name}` placeholders: formatMessage("Hi {name}", { name: "Ann" }) → "Hi Ann". */
export function formatMessage(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    if (!(name in values)) throw new Error(`Missing value for ${placeholder} in "${template}"`);
    return String(values[name]);
  });
}
