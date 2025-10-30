"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useActionState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { acceptInvitation } from '@/app/(login)/actions';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ActionState = { error?: string; success?: string };

export default function OnboardingPage() {
  const { data: invitations, mutate } = useSWR<any[]>('/api/invitations', fetcher);
  const { mutate: globalMutate } = useSWRConfig();
  const [acceptState, acceptAction, acceptPending] = useActionState<ActionState, FormData>(acceptInvitation, {});

  const list = Array.isArray(invitations) ? invitations : [];

  const hasInvites = list.length > 0;

  return (
    <section className="max-w-2xl mx-auto p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">Welcome</h1>

      {hasInvites ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {list.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{inv.teamName || `Team #${inv.teamId}`}</p>
                    <p className="text-sm text-muted-foreground capitalize">{inv.role}</p>
                  </div>
                  <form
                    action={async (fd) => {
                      const res = (await acceptAction(fd)) as any;
                      await mutate();
                      try { await globalMutate('/api/team'); } catch {}
                      return res;
                    }}
                  >
                    <input type="hidden" name="invitationId" value={inv.id} />
                    <Button type="submit" size="sm" disabled={acceptPending}>
                      {acceptPending ? 'Joining...' : 'Accept'}
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
            {acceptState?.error && <p className="text-red-500 mt-2">{acceptState.error}</p>}
            {acceptState?.success && <p className="text-green-500 mt-2">{acceptState.success}</p>}
          </CardContent>
        </Card>
      ) : null}

      

      <div className="mt-6 flex">
        <a href="/dashboard" className="text-sm text-muted-foreground underline">Skip for now</a>
      </div>
    </section>
  );
}
