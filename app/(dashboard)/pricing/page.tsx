import { checkoutAction } from '@/lib/payments/actions';
import { Check } from 'lucide-react';
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { SubmitButton } from './submit-button';
import { getRequestLocale, getMessages } from '@/lib/i18n/server';
import type { Locale } from '@/lib/i18n/config';
import type { Messages } from '@/lib/i18n/en';

// Prices are fresh for one hour max
export const revalidate = 3600;

export default async function PricingPage() {
  const [prices, products] = await Promise.all([
    getStripePrices(),
    getStripeProducts(),
  ]);

  const locale: Locale = await getRequestLocale();
  const messages = getMessages(locale);

  const vmapProduct =
    products.find((product) => product.name === 'vmap') || products[0];

  const vmapPrices = prices.filter((price) => price.productId === vmapProduct?.id);
  const monthlyPrice = vmapPrices.find((price) => price.interval === 'month');
  const yearlyPrice = vmapPrices.find((price) => price.interval === 'year');

  const monthlyInterval = monthlyPrice?.interval || 'month';
  const yearlyInterval = yearlyPrice?.interval || 'year';
  const monthlyTrialDays = monthlyPrice?.trialPeriodDays || 14;
  const yearlyTrialDays = yearlyPrice?.trialPeriodDays || 14;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid md:grid-cols-2 gap-8 max-w-xl mx-auto">
        <PricingCard
          name={
            vmapProduct
              ? `${vmapProduct.name} - ${messages['pricing.card.monthly.suffix']}`
              : messages['pricing.card.monthly.name']
          }
          price={monthlyPrice?.unitAmount || 2900}
          trialText={buildTrialText(monthlyTrialDays, messages)}
          perSiteText={buildPerSiteText(monthlyInterval, messages)}
          features={[
            messages['pricing.feature.unlimitedUsage'],
            messages['pricing.feature.unlimitedMembers'],
            messages['pricing.feature.emailSupport'],
          ]}
          priceId={monthlyPrice?.id}
        />
        <PricingCard
          name={
            vmapProduct
              ? `${vmapProduct.name} - ${messages['pricing.card.yearly.suffix']}`
              : messages['pricing.card.yearly.name']
          }
          price={yearlyPrice?.unitAmount || 29000}
          trialText={buildTrialText(yearlyTrialDays, messages)}
          perSiteText={buildPerSiteText(yearlyInterval, messages)}
          features={[
            messages['pricing.feature.basePlus'],
            messages['pricing.feature.earlyAccess'],
            messages['pricing.feature.premiumSupport'],
          ]}
          priceId={yearlyPrice?.id}
        />
      </div>
    </main>
  );
}

function PricingCard({
  name,
  price,
  trialText,
  perSiteText,
  features,
  priceId,
}: {
  name: string;
  price: number;
  trialText: string;
  perSiteText: string;
  features: string[];
  priceId?: string;
}) {
  return (
    <div className="pt-6">
      <h2 className="text-2xl font-medium text-gray-900 mb-2">{name}</h2>
      <p className="text-sm text-gray-600 mb-4">
        {trialText}
      </p>
      <p className="text-4xl font-medium text-gray-900 mb-6">
        €{price / 100}{' '}
        <span className="text-xl font-normal text-gray-600">
          {perSiteText}
        </span>
      </p>
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      <form action={checkoutAction}>
        <input type="hidden" name="priceId" value={priceId} />
        <SubmitButton />
      </form>
    </div>
  );
}

function formatIntervalLabel(interval: string, messages: Messages): string {
  if (interval === 'month') return messages['pricing.interval.month'];
  if (interval === 'year') return messages['pricing.interval.year'];
  return interval;
}

function buildTrialText(trialDays: number, messages: Messages): string {
  return (
    messages['pricing.trial.prefix'] +
    String(trialDays) +
    messages['pricing.trial.suffix']
  );
}

function buildPerSiteText(interval: string, messages: Messages): string {
  const label = formatIntervalLabel(interval, messages);
  return `${messages['pricing.price.perSite']} ${label}`;
}
