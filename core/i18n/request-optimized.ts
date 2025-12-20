import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

// Static imports - faster compilation, no dynamic module resolution
import common from './locales/en/common.json';
import navigation from './locales/en/navigation.json';
import kana from './locales/en/kana.json';
import kanji from './locales/en/kanji.json';
import vocabulary from './locales/en/vocabulary.json';
import achievements from './locales/en/achievements.json';
import statistics from './locales/en/statistics.json';
import settings from './locales/en/settings.json';
import errors from './locales/en/errors.json';
import menuInfo from './locales/en/menuInfo.json';

const isDev = process.env.NODE_ENV !== 'production';

// Pre-bundled messages for dev mode (only 'en' locale)
const devMessages = {
  common,
  navigation,
  kana,
  kanji,
  vocabulary,
  achievements,
  statistics,
  settings,
  errors,
  menuInfo
};

/**
 * List of translation namespaces
 * Each namespace corresponds to a JSON file in locales/{lang}/
 */
const NAMESPACES = [
  'common',
  'navigation',
  'kana',
  'kanji',
  'vocabulary',
  'achievements',
  'statistics',
  'settings',
  'errors',
  'menuInfo'
] as const;

// Cache for loaded messages to avoid re-importing in dev
const messageCache = new Map<string, Record<string, unknown>>();

export default getRequestConfig(async ({ locale }) => {
  // Ensure locale is always defined and valid
  const validLocale =
    locale &&
    routing.locales.includes(locale as (typeof routing.locales)[number])
      ? locale
      : routing.defaultLocale;

  // In dev mode with single locale, use pre-bundled messages
  if (isDev && validLocale === 'en') {
    return {
      locale: validLocale,
      messages: devMessages
    };
  }

  // Check cache first (helps in dev with HMR)
  const cacheKey = validLocale;
  if (messageCache.has(cacheKey)) {
    return {
      locale: validLocale,
      messages: messageCache.get(cacheKey)!
    };
  }

  // Load all namespace translations in parallel for better performance
  const namespacePromises = NAMESPACES.map(async namespace => {
    try {
      const namespaceMessages = (
        await import(`./locales/${validLocale}/${namespace}.json`)
      ).default;
      return [namespace, namespaceMessages] as const;
    } catch (error) {
      console.error(
        `Failed to load namespace "${namespace}" for locale "${validLocale}":`,
        error
      );
      return [namespace, {}] as const;
    }
  });

  const results = await Promise.all(namespacePromises);
  const messages: Record<string, unknown> = Object.fromEntries(results);

  // Cache the result
  messageCache.set(cacheKey, messages);

  return {
    locale: validLocale,
    messages
  };
});
