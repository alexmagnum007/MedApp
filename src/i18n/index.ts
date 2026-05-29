import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import pt from './locales/pt';
import en from './locales/en';
import es from './locales/es';

const LANGUAGE_KEY = '@medapp_language';

const resources = {
  pt: { translation: pt },
  en: { translation: en },
  es: { translation: es },
};

// Detect the best supported language from device locale
function detectLanguage(locale: string | null): string {
  if (!locale) return 'pt';
  const lang = locale.split('-')[0].toLowerCase();
  if (lang === 'en') return 'en';
  if (lang === 'es') return 'es';
  return 'pt';
}

async function initI18n() {
  // Try to load saved language preference
  let savedLanguage: string | null = null;
  try {
    savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
  } catch (_) {}

  const deviceLocale = Localization.getLocales?.()?.[0]?.languageTag ?? null;
  const language = savedLanguage ?? detectLanguage(deviceLocale);

  await i18n.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });
}

export async function changeLanguage(lang: string) {
  await i18n.changeLanguage(lang);
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch (_) {}
}

// Initialize immediately (fire-and-forget; app should await this before rendering or use Suspense)
initI18n();

export default i18n;
