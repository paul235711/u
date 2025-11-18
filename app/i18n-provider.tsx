'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { Locale } from '@/lib/i18n/config';
import type { Messages } from '@/lib/i18n/en';

type I18nContextValue = {
  locale: Locale;
  messages: Messages;
  t: (key: keyof Messages) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({
  locale,
  messages,
  children
}: {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
}) {
  const t = (key: keyof Messages) => messages[key] ?? String(key);

  return (
    <I18nContext.Provider value={{ locale, messages, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }

  return context;
}
