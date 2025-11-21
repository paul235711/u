'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { customerPortalAction } from '@/lib/payments/actions';
import { useActionState, useState } from 'react';
import { TeamDataWithMembers, User } from '@/lib/db/schema';
import { removeTeamMember, inviteTeamMember, updateTeamName, updateTeamMemberRole, cancelInvitation, acceptInvitation } from '@/app/(login)/actions';
import useSWR, { useSWRConfig } from 'swr';
import { Suspense } from 'react';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle } from 'lucide-react';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { useI18n } from '@/app/i18n-provider';

type ActionState = {
  error?: string;
  success?: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function SubscriptionSkeleton() {
  const { t } = useI18n();

  return (
    <Card className="mb-8 h-[140px]">
      <CardHeader>
        <CardTitle>{t('dashboard.subscription.cardTitle')}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function UserInvitations() {
  const { data: invitations, mutate } = useSWR<any[]>('/api/invitations', fetcher);
  const { mutate: globalMutate } = useSWRConfig();
  const [state, action, pending] = useActionState<ActionState, FormData>(acceptInvitation, {});
   const { t } = useI18n();

  const list = Array.isArray(invitations) ? invitations : [];

  if (list.length === 0) {
    return null;
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{t('dashboard.invitations.yourInvitationsTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {list.map((inv) => (
            <li key={inv.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {inv.teamName || `${t('dashboard.invitations.teamPrefix')}${inv.teamId}`}
                </p>
                <p className="text-sm text-muted-foreground capitalize">{inv.role}</p>
              </div>
              <form
                action={async (fd) => {
                  const res = (await action(fd)) as any;
                  await mutate();
                  // Also refresh team info so UI reflects switch
                  try { await globalMutate('/api/team'); } catch {}
                  return res;
                }}
              >
                <input type="hidden" name="invitationId" value={inv.id} />
                <Button type="submit" size="sm" disabled={pending}>
                  {pending ? t('dashboard.invitations.acceptLoading') : t('dashboard.invitations.acceptButton')}
                </Button>
              </form>
            </li>
          ))}
        </ul>
        {state?.error && <p className="text-red-500 mt-2">{state.error}</p>}
        {state?.success && <p className="text-green-500 mt-2">{state.success}</p>}
      </CardContent>
    </Card>
  );
}

function InvitationsList() {
  const { data: teamData, mutate } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const isOwner = user?.role === 'owner';
  const [cancelState, cancelAction, cancelPending] = useActionState<ActionState, FormData>(cancelInvitation, {});
  const { t } = useI18n();

  const pendingInvites = teamData?.invitations?.filter((i: any) => i.status === 'pending') || [];
  if (!pendingInvites.length) {
    return null;
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{t('dashboard.invitations.pendingTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {pendingInvites.map((inv: any) => (
            <li key={inv.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{inv.email}</p>
                <p className="text-sm text-muted-foreground capitalize">{inv.role}</p>
              </div>
              <form
                action={async (fd) => {
                  const res = (await cancelAction(fd)) as any;
                  await mutate();
                  return res;
                }}
              >
                <input type="hidden" name="invitationId" value={inv.id} />
                <Button type="submit" size="sm" variant="outline" disabled={!isOwner || cancelPending}>
                  {cancelPending ? t('dashboard.invitations.cancelLoading') : t('common.cancel')}
                </Button>
              </form>
            </li>
          ))}
        </ul>
        {cancelState?.error && <p className="text-red-500 mt-2">{cancelState.error}</p>}
        {cancelState?.success && <p className="text-green-500 mt-2">{cancelState.success}</p>}
      </CardContent>
    </Card>
  );
}

function TeamNameForm() {
  const { data: teamData, mutate } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const isOwner = user?.role === 'owner';
  const [state, action, pending] = useActionState<ActionState, FormData>(updateTeamName, {});
  const [editing, setEditing] = useState(false);
  const [localName, setLocalName] = useState<string>('');
  const { t } = useI18n();
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{t('dashboard.team.nameCardTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        {!isOwner && (
          <p className="text-sm">{teamData?.name || '—'}</p>
        )}
        {isOwner && !editing && (
          <div className="flex items-center justify-between">
            <p className="text-sm">{teamData?.name || '—'}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setLocalName(teamData?.name || '');
                setEditing(true);
              }}
            >
              {t('dashboard.team.editButton')}
            </Button>
          </div>
        )}
        {isOwner && editing && (
          <form
            action={async (fd) => {
              const res = (await action(fd)) as any;
              await mutate();
              if (!(res as any)?.error) {
                setEditing(false);
              }
              return res;
            }}
            className="flex items-center space-x-2"
          >
            <input type="hidden" name="name" value={localName} />
            <Input
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              placeholder={t('dashboard.team.nameInputPlaceholder')}
              disabled={pending}
            />
            <Button type="submit" disabled={pending}>
              {pending ? t('dashboard.team.saveLoading') : t('dashboard.team.saveButton')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditing(false)}
              disabled={pending}
            >
              {t('common.cancel')}
            </Button>
          </form>
        )}
        {state?.error && <p className="text-red-500 mt-2">{state.error}</p>}
        {state?.success && <p className="text-green-500 mt-2">{state.success}</p>}
      </CardContent>
    </Card>
  );
}

function ManageSubscription() {
  const { data: teamData } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const isOwner = user?.role === 'owner';
  const { t } = useI18n();

  if (!isOwner) {
    return null;
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{t('dashboard.subscription.cardTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="mb-4 sm:mb-0">
              <p className="font-medium">
                {t('dashboard.subscription.currentPlan')} {teamData?.planName || t('dashboard.subscription.freePlan')}
              </p>
              <p className="text-sm text-muted-foreground">
                {teamData?.subscriptionStatus === 'active'
                  ? t('dashboard.subscription.billedMonthly')
                  : teamData?.subscriptionStatus === 'trialing'
                  ? t('dashboard.subscription.trialPeriod')
                  : t('dashboard.subscription.noActive')}
              </p>
            </div>
            <form action={customerPortalAction}>
              <Button type="submit" variant="outline">
                {t('dashboard.subscription.manageButton')}
              </Button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamMembersSkeleton() {
  const { t } = useI18n();

  return (
    <Card className="mb-8 h-[140px]">
      <CardHeader>
        <CardTitle>{t('dashboard.members.cardTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse space-y-4 mt-1">
          <div className="flex items-center space-x-4">
            <div className="size-8 rounded-full bg-gray-200"></div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-3 w-14 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamMembers() {
  const { data: teamData, mutate } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const isOwner = user?.role === 'owner';
  const [removeState, removeAction, isRemovePending] = useActionState<
    ActionState,
    FormData
  >(removeTeamMember, {});
  const [roleState, roleAction, rolePending] = useActionState<ActionState, FormData>(updateTeamMemberRole, {});
  const { t } = useI18n();

  const getUserDisplayName = (user: Pick<User, 'id' | 'name' | 'email'>) => {
    return user.name || user.email || t('dashboard.members.unknownUser');
  };

  if (!teamData?.teamMembers?.length) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t('dashboard.members.cardTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('dashboard.members.empty')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{t('dashboard.members.cardTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {teamData.teamMembers.map((member, index) => (
            <li key={member.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar>
                  {/* 
                    This app doesn't save profile images, but here
                    is how you'd show them:

                    <AvatarImage
                      src={member.user.image || ''}
                      alt={getUserDisplayName(member.user)}
                    />
                  */}
                  <AvatarFallback>
                    {getUserDisplayName(member.user)
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {getUserDisplayName(member.user)}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {member.role}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <form
                  action={async (fd) => {
                    const res = (await roleAction(fd)) as any;
                    await mutate();
                    return res;
                  }}
                  className="flex items-center space-x-2"
                >
                  <input type="hidden" name="memberId" value={member.id} />
                  <select
                    name="role"
                    defaultValue={member.role}
                    disabled={!isOwner || rolePending}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="member">{t('dashboard.members.role.member')}</option>
                    <option value="owner">{t('dashboard.members.role.owner')}</option>
                  </select>
                  <Button type="submit" size="sm" variant="outline" disabled={!isOwner || rolePending}>
                    {rolePending ? t('dashboard.members.updateLoading') : t('dashboard.members.updateButton')}
                  </Button>
                </form>
                {index > 1 ? (
                  <form
                    action={async (fd) => {
                      const res = (await removeAction(fd)) as any;
                      await mutate();
                      return res;
                    }}
                  >
                    <input type="hidden" name="memberId" value={member.id} />
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      disabled={isRemovePending || !isOwner}
                    >
                      {isRemovePending ? t('dashboard.members.removeLoading') : t('dashboard.members.removeButton')}
                    </Button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        {removeState?.error && (
          <p className="text-red-500 mt-4">{removeState.error}</p>
        )}
        {roleState?.error && (
          <p className="text-red-500 mt-2">{roleState.error}</p>
        )}
        {roleState?.success && (
          <p className="text-green-500 mt-2">{roleState.success}</p>
        )}
      </CardContent>
    </Card>
  );
}

function InviteTeamMemberSkeleton() {
  const { t } = useI18n();

  return (
    <Card className="h-[260px]">
      <CardHeader>
        <CardTitle>{t('dashboard.invite.cardTitle')}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function InviteTeamMember() {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const isOwner = user?.role === 'owner';
  const [inviteState, inviteAction, isInvitePending] = useActionState<
    ActionState,
    FormData
  >(inviteTeamMember, {});
  const { t } = useI18n();

  if (!isOwner) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.invite.cardTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={inviteAction} className="space-y-4">
          <div>
            <Label htmlFor="email" className="mb-2">
              {t('auth.field.email.label')}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t('auth.field.email.placeholder')}
              required
              disabled={!isOwner}
            />
          </div>
          <div>
            <Label>{t('dashboard.invite.roleLabel')}</Label>
            <RadioGroup
              defaultValue="member"
              name="role"
              className="flex space-x-4"
              disabled={!isOwner}
            >
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="member" id="member" />
                <Label htmlFor="member">{t('dashboard.members.role.member')}</Label>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="owner" id="owner" />
                <Label htmlFor="owner">{t('dashboard.members.role.owner')}</Label>
              </div>
            </RadioGroup>
          </div>
          {inviteState?.error && (
            <p className="text-red-500">{inviteState.error}</p>
          )}
          {inviteState?.success && (
            <p className="text-green-500 text-sm">{inviteState.success}</p>
          )}
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isInvitePending || !isOwner}
          >
            {isInvitePending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('dashboard.invite.submitLoading')}
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('dashboard.invite.submitButton')}
              </>
            )}
          </Button>
        </form>
      </CardContent>
      {!isOwner && (
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            {t('dashboard.invite.ownerWarning')}
          </p>
        </CardFooter>
      )}
    </Card>
  );
}

export default function SettingsPage() {
  const { t } = useI18n();

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg lg:text-2xl font-medium">{t('dashboard.settings.title')}</h1>
        <LocaleSwitcher />
      </div>
      <Suspense fallback={null}>
        <UserInvitations />
      </Suspense>

      <Suspense fallback={null}>
        <TeamNameForm />
      </Suspense>
      <Suspense fallback={<SubscriptionSkeleton />}>
        <ManageSubscription />
      </Suspense>
      <Suspense fallback={<TeamMembersSkeleton />}>
        <TeamMembers />
      </Suspense>
      <Suspense fallback={null}>
        <InvitationsList />
      </Suspense>
      <Suspense fallback={<InviteTeamMemberSkeleton />}>
        <InviteTeamMember />
      </Suspense>
    </section>
  );
}
