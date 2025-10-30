import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { invitations, teams } from '@/lib/db/schema';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = await db
    .select({
      id: invitations.id,
      teamId: invitations.teamId,
      email: invitations.email,
      role: invitations.role,
      status: invitations.status,
      invitedAt: invitations.invitedAt,
      teamName: teams.name,
    })
    .from(invitations)
    .leftJoin(teams, eq(invitations.teamId, teams.id))
    .where(and(eq(invitations.email, user.email!), eq(invitations.status, 'pending')));

  return NextResponse.json(results);
}
