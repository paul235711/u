import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';
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

  return (
    <html
      lang="en"
      className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
      suppressHydrationWarning
    >
      <body className="min-h-[100dvh] bg-gray-50" suppressHydrationWarning>
        <Providers>
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
        </Providers>
      </body>
    </html>
  );
}
