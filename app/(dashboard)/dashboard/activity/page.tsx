import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Settings,
  LogOut,
  UserPlus,
  Lock,
  UserCog,
  AlertCircle,
  UserMinus,
  Mail,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react';
import { ActivityType } from '@/lib/db/schema';
import { getActivityLogs } from '@/lib/db/queries';
import { getMessages, getRequestLocale } from '@/lib/i18n/server';
import type { Messages } from '@/lib/i18n/en';

const iconMap: Record<ActivityType, LucideIcon> = {
  [ActivityType.SIGN_UP]: UserPlus,
  [ActivityType.SIGN_IN]: UserCog,
  [ActivityType.SIGN_OUT]: LogOut,
  [ActivityType.UPDATE_PASSWORD]: Lock,
  [ActivityType.DELETE_ACCOUNT]: UserMinus,
  [ActivityType.UPDATE_ACCOUNT]: Settings,
  [ActivityType.CREATE_TEAM]: UserPlus,
  [ActivityType.REMOVE_TEAM_MEMBER]: UserMinus,
  [ActivityType.INVITE_TEAM_MEMBER]: Mail,
  [ActivityType.ACCEPT_INVITATION]: CheckCircle,
  [ActivityType.CANCEL_INVITATION]: UserMinus,
};

function getRelativeTime(date: Date, messages: Messages) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return messages['dashboard.activity.relative.justNow'];
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${messages['dashboard.activity.relative.minutesPrefix']}${minutes}${messages['dashboard.activity.relative.minutesSuffix']}`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${messages['dashboard.activity.relative.hoursPrefix']}${hours}${messages['dashboard.activity.relative.hoursSuffix']}`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${messages['dashboard.activity.relative.daysPrefix']}${days}${messages['dashboard.activity.relative.daysSuffix']}`;
  }
  return date.toLocaleDateString();
}

function formatAction(action: ActivityType, messages: Messages): string {
  switch (action) {
    case ActivityType.SIGN_UP:
      return messages['dashboard.activity.action.signUp'];
    case ActivityType.SIGN_IN:
      return messages['dashboard.activity.action.signIn'];
    case ActivityType.SIGN_OUT:
      return messages['dashboard.activity.action.signOut'];
    case ActivityType.UPDATE_PASSWORD:
      return messages['dashboard.activity.action.updatePassword'];
    case ActivityType.DELETE_ACCOUNT:
      return messages['dashboard.activity.action.deleteAccount'];
    case ActivityType.UPDATE_ACCOUNT:
      return messages['dashboard.activity.action.updateAccount'];
    case ActivityType.CREATE_TEAM:
      return messages['dashboard.activity.action.createTeam'];
    case ActivityType.REMOVE_TEAM_MEMBER:
      return messages['dashboard.activity.action.removeTeamMember'];
    case ActivityType.INVITE_TEAM_MEMBER:
      return messages['dashboard.activity.action.inviteTeamMember'];
    case ActivityType.ACCEPT_INVITATION:
      return messages['dashboard.activity.action.acceptInvitation'];
    case ActivityType.CANCEL_INVITATION:
      return messages['dashboard.activity.action.cancelInvitation'];
    default:
      return messages['dashboard.activity.action.unknown'];
  }
}

export default async function ActivityPage() {
  const logs = await getActivityLogs();
  const locale = await getRequestLocale();
  const messages = getMessages(locale);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        {messages['dashboard.activity.title']}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>{messages['dashboard.activity.cardTitle']}</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <ul className="space-y-4">
              {logs.map((log) => {
                const Icon = iconMap[log.action as ActivityType] || Settings;
                const formattedAction = formatAction(
                  log.action as ActivityType,
                  messages
                );

                return (
                  <li key={log.id} className="flex items-center space-x-4">
                    <div className="bg-blue-50 rounded-full p-2">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {formattedAction}
                        {log.ipAddress && ` ${messages['dashboard.activity.fromIpPrefix']} ${log.ipAddress}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getRelativeTime(new Date(log.timestamp), messages)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <AlertCircle className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {messages['dashboard.activity.emptyTitle']}
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                {messages['dashboard.activity.emptyBody']}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
