import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Locale } from '../i18n';

const LOCALE_KEY = 'noteflow_locale';

function getDeviceLocale(): Locale {
  try {
    const locales = require('expo-localization');
    const locale = locales.getLocales?.()?.[0]?.languageCode ?? 'en';
    return locale === 'es' ? 'es' : 'en';
  } catch {
    return 'en';
  }
}

interface LocaleStore {
  locale: Locale;
  loaded: boolean;
  load: () => Promise<void>;
  setLocale: (locale: Locale) => Promise<void>;
}

export const useLocaleStore = create<LocaleStore>((set) => ({
  locale: 'en',
  loaded: false,

  load: async () => {
    try {
      const saved = await AsyncStorage.getItem(LOCALE_KEY);
      if (saved === 'es' || saved === 'en') {
        set({ locale: saved, loaded: true });
      } else {
        const device = getDeviceLocale();
        await AsyncStorage.setItem(LOCALE_KEY, device);
        set({ locale: device, loaded: true });
      }
    } catch {
      const device = getDeviceLocale();
      set({ locale: device, loaded: true });
    }
  },

  setLocale: async (locale: Locale) => {
    try {
      await AsyncStorage.setItem(LOCALE_KEY, locale);
      set({ locale });
    } catch {
      set({ locale });
    }
  },
}));
