import { Button } from '@/components/ui/button';
import { ArrowRight, Map, GitBranch, AlertTriangle } from 'lucide-react';
import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const user = await getUser();

  if (user) {
    redirect('/synoptics');
  }

  return (
    <main className="flex-1">
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center">
            <div className="lg:col-span-6">
              <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
                Conformité Article U62 – plans de gaz médicaux à disposition des secours
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                Cartographiez vos réseaux de gaz médicaux.
                <span className="block text-blue-600">Soyez prêt face à l’Article U62.</span>
              </h1>
              <p className="mt-5 text-base text-gray-600 sm:text-lg">
                VMap centralise les plans de gaz médicaux de l’hôpital et permet aux équipes
                techniques et aux services de secours de localiser en quelques secondes les
                vannes de coupure et l’impact d’une isolation de zone.
              </p>
              <p className="mt-3 text-sm text-gray-500">
                En France, l’Article U62 impose que les plans des installations de gaz
                médicaux, le cheminement des canalisations et l’emplacement des vannes
                soient immédiatement accessibles aux services de secours.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  className="rounded-full bg-blue-600 text-white hover:bg-blue-700"
                >
                  Demander une démo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  Voir un exemple de plan
                </Button>
              </div>

              <dl className="mt-8 grid grid-cols-2 gap-6 text-sm text-gray-600 sm:max-w-md">
                <div>
                  <dt className="font-semibold text-gray-900">Typologie</dt>
                  <dd>CHU, cliniques MCO, GHT…</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-900">Fluides</dt>
                  <dd>O₂, N₂O, AIR, vide médical…</dd>
                </div>
              </dl>
            </div>

            <div className="mt-12 lg:mt-0 lg:col-span-6">
              <div className="relative rounded-2xl border border-dashed border-gray-300 bg-gray-100 px-6 py-5 shadow-sm sm:px-8 sm:py-8">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Aperçu des synoptiques VMap</p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-500 shadow-sm">
                    Placeholder écran
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col rounded-xl bg-white/80 p-4 shadow-sm">
                    <span className="text-xs font-medium text-gray-500">Bâtiment A – 2ᵉ étage</span>
                    <div className="mt-3 flex-1 rounded-lg border border-dashed border-gray-300 bg-gray-50" />
                    <span className="mt-3 text-xs text-gray-500">
                      Layout par zones U10, couleur par fluide disponible.
                    </span>
                  </div>
                  <div className="flex flex-col rounded-xl bg-white/80 p-4 shadow-sm">
                    <span className="text-xs font-medium text-gray-500">Vannes de coupure</span>
                    <div className="mt-3 flex-1 rounded-lg border border-dashed border-gray-300 bg-gray-50" />
                    <span className="mt-3 text-xs text-gray-500">
                      Localisation précise des vannes et périmètre d’impact.
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-xs text-gray-500">
                  Intégrez plus tard ici vos propres captures d’écran : synoptique hôpital,
                  bâtiment, étage, zone U10, chambre…
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
              Les fonctionnalités clés pour répondre à l’Article U62
            </h2>
            <p className="mt-3 text-base text-gray-600">
              VMap ne se contente pas de stocker des plans : l’application les rend
              exploitables en situation normale comme en urgence.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-600 text-white">
                <Map className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h3 className="text-lg font-medium text-gray-900">
                  Visualiser les fluides par bâtiment et zone
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Vue synoptique par bâtiment, étage et zone U10, avec possibilité de
                  descendre jusqu’à la chambre. Présence des fluides (O₂, N₂O, AIR)
                  lisible en un coup d’œil.
                </p>
              </div>
            </div>

            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald-600 text-white">
                <GitBranch className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h3 className="text-lg font-medium text-gray-900">
                  Localiser les vannes de coupure
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Identification certaine des vannes nécessaires pour isoler une zone
                  U10, un étage ou un bâtiment. Chaque vanne est reliée à son périmètre
                  exact d’action.
                </p>
              </div>
            </div>

            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-orange-500 text-white">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h3 className="text-lg font-medium text-gray-900">
                  Visualiser l’impact d’une coupure
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Visualisation instantanée des zones U10, étages ou bâtiments impactés
                  par la fermeture d’une vanne. Support aux exercices de crise et aux
                  plans blancs.
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
                Une base solide pour vos propres layouts
              </h2>
              <p className="mt-3 text-base text-gray-600">
                Vous pouvez démarrer avec les layouts fournis par VMap (hôpital, bâtiment,
                étage, zone U10) puis les adapter à vos conventions internes :
                codification des zones, couleurs de fluides, légendes, etc.
              </p>
              <p className="mt-3 text-sm text-gray-500">
                Nous prévoyons des modèles de plans prêts à l’emploi, que vous pourrez
                remplacer progressivement par vos synoptiques normalisés.
              </p>
            </div>
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
              Placeholder pour une grande capture d’écran ou un layout hôpital complet.
              <div className="mt-4 h-48 rounded-xl border border-dashed border-gray-300 bg-white" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
