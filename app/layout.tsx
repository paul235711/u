import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';
import { getRequestLocale, getMessages } from '@/lib/i18n/server';
import type { Locale } from '@/lib/i18n/config';
import { I18nProvider } from './i18n-provider';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Vmap',
  description: 'Get started quickly with Next.js, Postgres, and Stripe.'
};

export const viewport: Viewport = {
  maximumScale: 1
};

const manrope = Manrope({ subsets: ['latin'] });

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const team = await getTeamForUser();
  const locale: Locale = await getRequestLocale();
  const messages = getMessages(locale);

  return (
    <html
      lang={locale}
      className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
      suppressHydrationWarning
    >
      <body className="min-h-[100dvh] bg-gray-50" suppressHydrationWarning>
        <Providers>
          <I18nProvider locale={locale} messages={messages}>
            <SWRConfig
              value={{
                fallback: {
                  '/api/user': user,
                  '/api/team': team
                }
              }}
            >
              {children}
            </SWRConfig>
          </I18nProvider>
        </Providers>
      </body>
    </html>
  );
}
