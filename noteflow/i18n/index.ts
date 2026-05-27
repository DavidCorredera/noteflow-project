import { es } from './es';
import { en } from './en';

export type Locale = 'es' | 'en';

const translations: Record<Locale, Record<string, string>> = { es, en };

export function t(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const value = translations[locale]?.[key];
  if (!value) return key;
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
}
