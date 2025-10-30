import { getUser, getUserWithTeamRole } from '@/lib/db/queries';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json(null);
  }

  // Get active team from user's lastActiveTeamId
  if (user.lastActiveTeamId) {
    const userWithRole = await getUserWithTeamRole(user.id, user.lastActiveTeamId);
    if (userWithRole) {
      return Response.json({ ...user, role: userWithRole.role });
    }
  }

  // Fallback: return user without team-specific role
  return Response.json({ ...user, role: 'member' });
}
