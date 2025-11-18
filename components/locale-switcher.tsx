'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/app/i18n-provider';
import type { Locale } from '@/lib/i18n/config';

const supportedLocales: Locale[] = ['en', 'fr'];

export function LocaleSwitcher() {
  const { locale } = useI18n();
  const [isPending, startTransition] = useTransition();

  function handleChange(nextLocale: Locale) {
    if (nextLocale === locale) return;

    startTransition(() => {
      document.cookie = `locale=${nextLocale}; path=/; max-age=31536000`;
      window.location.reload();
    });
  }

  return (
    <div className="flex items-center gap-2">
      {supportedLocales.map((l) => (
        <Button
          key={l}
          type="button"
          size="sm"
          variant={locale === l ? 'default' : 'outline'}
          onClick={() => handleChange(l)}
          disabled={isPending}
          className="px-3"
        >
          {l.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}
