import { Button } from '@/components/ui/button';
import { ArrowRight, Map, GitBranch, AlertTriangle } from 'lucide-react';
import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { getRequestLocale, getMessages } from '@/lib/i18n/server';

export default async function HomePage() {
  const user = await getUser();

  if (user) {
    redirect('/synoptics');
  }

  const locale = await getRequestLocale();
  const messages = getMessages(locale);

  return (
    <main className="flex-1">
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center">
            <div className="lg:col-span-6">
              <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
                {messages['landing.hero.badge']}
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                {messages['landing.hero.title.main']}
                <span className="block text-blue-600">{messages['landing.hero.title.highlight']}</span>
              </h1>
              <p className="mt-5 text-base text-gray-600 sm:text-lg">
                {messages['landing.hero.body.main']}
              </p>
              <p className="mt-3 text-sm text-gray-500">
                {messages['landing.hero.body.note']}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  className="rounded-full bg-blue-600 text-white hover:bg-blue-700"
                >
                  {messages['landing.hero.cta.demo']}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  {messages['landing.hero.cta.example']}
                </Button>
              </div>

              <dl className="mt-8 grid grid-cols-2 gap-6 text-sm text-gray-600 sm:max-w-md">
                <div>
                  <dt className="font-semibold text-gray-900">{messages['landing.hero.typology.title']}</dt>
                  <dd>{messages['landing.hero.typology.value']}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-900">{messages['landing.hero.fluids.title']}</dt>
                  <dd>{messages['landing.hero.fluids.value']}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-12 lg:mt-0 lg:col-span-6">
              <div className="relative rounded-2xl border border-dashed border-gray-300 bg-gray-100 px-6 py-5 shadow-sm sm:px-8 sm:py-8">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">{messages['landing.preview.title']}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-500 shadow-sm">
                    {messages['landing.preview.badge']}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col rounded-xl bg-white/80 p-4 shadow-sm">
                    <span className="text-xs font-medium text-gray-500">{messages['landing.preview.card1.title']}</span>
                    <div className="mt-3 flex-1 rounded-lg border border-dashed border-gray-300 bg-gray-50" />
                    <span className="mt-3 text-xs text-gray-500">
                      {messages['landing.preview.card1.body']}
                    </span>
                  </div>
                  <div className="flex flex-col rounded-xl bg-white/80 p-4 shadow-sm">
                    <span className="text-xs font-medium text-gray-500">{messages['landing.preview.card2.title']}</span>
                    <div className="mt-3 flex-1 rounded-lg border border-dashed border-gray-300 bg-gray-50" />
                    <span className="mt-3 text-xs text-gray-500">
                      {messages['landing.preview.card2.body']}
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-xs text-gray-500">
                  {messages['landing.preview.footer']}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <h2 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
              {messages['landing.features.sectionTitle']}
            </h2>
            <p className="mt-3 text-base text-gray-600">
              {messages['landing.features.sectionBody']}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-600 text-white">
                <Map className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h3 className="text-lg font-medium text-gray-900">
                  {messages['landing.features.card1.title']}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {messages['landing.features.card1.body']}
                </p>
              </div>
            </div>

            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald-600 text-white">
                <GitBranch className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h3 className="text-lg font-medium text-gray-900">
                  {messages['landing.features.card2.title']}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {messages['landing.features.card2.body']}
                </p>
              </div>
            </div>

            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-orange-500 text-white">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h3 className="text-lg font-medium text-gray-900">
                  {messages['landing.features.card3.title']}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {messages['landing.features.card3.body']}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                {messages['landing.layouts.sectionTitle']}
              </h2>
              <p className="mt-3 text-base text-gray-600">
                {messages['landing.layouts.sectionBody1']}
              </p>
              <p className="mt-3 text-sm text-gray-500">
                {messages['landing.layouts.sectionBody2']}
              </p>
            </div>
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
              {messages['landing.layouts.placeholder']}
              <div className="mt-4 h-48 rounded-xl border border-dashed border-gray-300 bg-white" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
