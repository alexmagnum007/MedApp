import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import pt from './locales/pt';
import en from './locales/en';
import es from './locales/es';

const LANGUAGE_KEY = '@medapp_language';

type Translations = typeof pt;
type Language = 'pt' | 'en' | 'es';

const resources: Record<Language, Translations> = { pt, en, es };

function detectLanguage(): Language {
  const tag = Localization.getLocales?.()?.[0]?.languageTag ?? 'pt';
  const lang = tag.split('-')[0].toLowerCase();
  if (lang === 'en') return 'en';
  if (lang === 'es') return 'es';
  return 'pt';
}

function get(obj: any, path: string, vars?: Record<string, any>): string {
  const val = path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
  if (typeof val !== 'string') return path;
  if (!vars) return val;
  return val.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ''));
}

interface I18nContextType {
  t: (key: string, vars?: Record<string, any>) => string;
  language: Language;
  changeLanguage: (lang: Language) => Promise<void>;
}

const I18nContext = createContext<I18nContextType>({
  t: (key) => key,
  language: 'pt',
  changeLanguage: async () => {},
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('pt');

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(LANGUAGE_KEY) as Language | null;
      setLanguage(saved ?? detectLanguage());
    })();
  }, []);

  const t = (key: string, vars?: Record<string, any>) =>
    get(resources[language], key, vars);

  const changeLanguage = async (lang: Language) => {
    setLanguage(lang);
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  };

  return (
    <I18nContext.Provider value={{ t, language, changeLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const { t, language, changeLanguage } = useContext(I18nContext);
  return { t, i18n: { language }, changeLanguage };
}
