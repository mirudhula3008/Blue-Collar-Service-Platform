import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from '../locales/en.json';
import ta from '../locales/ta.json';
import hi from '../locales/hi.json';
import bn from '../locales/bn.json';

export const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
];

const DICTIONARIES = { en, ta, hi, bn };
// Intl locales for dates and times (numbers and ₹ keep Indian English grouping everywhere).
const LOCALES = { en: 'en-IN', ta: 'ta-IN', hi: 'hi-IN', bn: 'bn-IN' };
const STORAGE_KEY = 'language';
const DEFAULT = 'en';

const LanguageContext = createContext(null);

function readStored() {
  try {
    const code = localStorage.getItem(STORAGE_KEY);
    return DICTIONARIES[code] ? code : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

// 'hero.title' → dict.hero.title (undefined if any segment is missing)
const lookup = (dict, key) => key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dict);

// Module-level copy of the current language so plain helpers (date formatting,
// API error messages) can translate without a hook. Kept in sync by the provider.
let activeLanguage = readStored();

export const getLocale = () => LOCALES[activeLanguage];

/**
 * translate('payment.payAmount', { amount: '₹450' }) → "Pay ₹450"
 * Falls back to English, then to the key itself, so a missing translation never breaks the UI.
 */
export function translate(key, vars, language = activeLanguage) {
  let text = lookup(DICTIONARIES[language], key);
  if (typeof text !== 'string') text = lookup(en, key);
  if (typeof text !== 'string') {
    if (import.meta.env.DEV) console.warn(`[i18n] Missing key: ${key}`);
    return key;
  }
  return vars ? text.replace(/{{(\w+)}}/g, (m, name) => (vars[name] ?? m)) : text;
}

export function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState(activeLanguage);
  activeLanguage = currentLanguage;

  // <html lang> drives the Indic font rules in index.css and screen-reader pronunciation.
  useEffect(() => {
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  const changeLanguage = useCallback((code) => {
    if (!DICTIONARIES[code]) return;
    activeLanguage = code;
    setCurrentLanguage(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // storage unavailable — choice lasts for this visit only
    }
  }, []);

  // Re-created on language change so consumers re-render with the new text.
  const t = useCallback((key, vars) => translate(key, vars, currentLanguage), [currentLanguage]);

  const value = useMemo(() => ({ t, currentLanguage, changeLanguage, languages }), [t, currentLanguage, changeLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}
