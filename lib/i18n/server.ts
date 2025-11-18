import { cookies, headers } from 'next/headers';
import { defaultLocale, isLocale, type Locale } from './config';
import enMessages, { type Messages } from './en';
import frMessages from './fr';

const messagesByLocale: Record<Locale, Messages> = {
  en: enMessages,
  fr: frMessages
};

export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('locale')?.value;

  if (cookieLocale && isLocale(cookieLocale)) {
    return cookieLocale;
  }

  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language');

  if (acceptLanguage) {
    const [languageRange] = acceptLanguage.split(',');
    const code = languageRange?.trim().slice(0, 2).toLowerCase();

    if (code && isLocale(code)) {
      return code;
    }
  }

  return defaultLocale;
}

export function getMessages(locale: Locale): Messages {
  return messagesByLocale[locale] ?? messagesByLocale[defaultLocale];
}
