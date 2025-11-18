'use server';

import { z } from 'zod';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  User,
  users,
  teams,
  teamMembers,
  activityLogs,
  type NewUser,
  type NewTeam,
  type NewTeamMember,
  type NewActivityLog,
  ActivityType,
  invitations
} from '@/lib/db/schema';
import { comparePasswords, hashPassword, setSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createCheckoutSession } from '@/lib/payments/stripe';
import { getUser, getUserWithTeam, getUserWithTeamRole } from '@/lib/db/queries';
import {
  validatedAction,
  validatedActionWithUser
} from '@/lib/auth/middleware';

async function logActivity(
  teamId: number | null | undefined,
  userId: number,
  type: ActivityType,
  ipAddress?: string
) {
  if (teamId === null || teamId === undefined) {
    return;
  }
  const newActivity: NewActivityLog = {
    teamId,
    userId,
    action: type,
    ipAddress: ipAddress || ''
  };
  await db.insert(activityLogs).values(newActivity);
}

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100)
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const { email, password } = data;

  const userWithTeam = await db
    .select({
      user: users,
      team: teams
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .leftJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(users.email, email))
    .limit(1);

  if (userWithTeam.length === 0) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password
    };
  }

  const { user: foundUser, team: foundTeam } = userWithTeam[0];

  const isPasswordValid = await comparePasswords(
    password,
    foundUser.passwordHash
  );

  if (!isPasswordValid) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password
    };
  }

  // Initialize lastActiveTeamId if not already set and user has a team
  if (!foundUser.lastActiveTeamId && foundTeam?.id) {
    await db
      .update(users)
      .set({ lastActiveTeamId: foundTeam.id })
      .where(eq(users.id, foundUser.id));
  }

  await Promise.all([
    setSession(foundUser),
    logActivity(foundTeam?.id, foundUser.id, ActivityType.SIGN_IN)
  ]);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    const priceId = formData.get('priceId') as string;
    return createCheckoutSession({ team: foundTeam, priceId });
  }

  // If the user has pending invitations, take them to onboarding
  const pendingInvites = await db
    .select()
    .from(invitations)
    .where(and(eq(invitations.email, email), eq(invitations.status, 'pending')));
  if (pendingInvites.length > 0) {
    redirect('/onboarding');
  }

  redirect('/synoptics');
});

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  inviteId: z.string().optional()
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const { email, password, inviteId } = data;

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return {
      error: 'Failed to create user. Please try again.',
      email,
      password
    };
  }

  const passwordHash = await hashPassword(password);

  const newUser: NewUser = {
    email,
    passwordHash,
    role: 'owner' // Default role, will be overridden if there's an invitation
  };

  const [createdUser] = await db.insert(users).values(newUser).returning();

  if (!createdUser) {
    return {
      error: 'Failed to create user. Please try again.',
      email,
      password
    };
  }

  let teamId: number;
  let userRole: string;
  let createdTeam: typeof teams.$inferSelect | null = null;

  if (inviteId) {
    // Check if there's a valid invitation
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.id, parseInt(inviteId)),
          eq(invitations.email, email),
          eq(invitations.status, 'pending')
        )
      )
      .limit(1);

    if (invitation) {
      teamId = invitation.teamId;
      userRole = invitation.role;

      await db
        .update(invitations)
        .set({ status: 'accepted' })
        .where(eq(invitations.id, invitation.id));

      await logActivity(teamId, createdUser.id, ActivityType.ACCEPT_INVITATION);

      [createdTeam] = await db
        .select()
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1);
    } else {
      return { error: 'Invalid or expired invitation.', email, password };
    }
  } else {
    // Create a new team if there's no invitation
    const newTeam: NewTeam = {
      name: `${email}'s Team`
    };

    [createdTeam] = await db.insert(teams).values(newTeam).returning();

    if (!createdTeam) {
      return {
        error: 'Failed to create team. Please try again.',
        email,
        password
      };
    }

    teamId = createdTeam.id;
    userRole = 'owner';

    await logActivity(teamId, createdUser.id, ActivityType.CREATE_TEAM);
  }

  const newTeamMember: NewTeamMember = {
    userId: createdUser.id,
    teamId: teamId,
    role: userRole
  };

  await Promise.all([
    db.insert(teamMembers).values(newTeamMember),
    logActivity(teamId, createdUser.id, ActivityType.SIGN_UP),
    setSession(createdUser),
    db.update(users).set({ lastActiveTeamId: teamId }).where(eq(users.id, createdUser.id))
  ]);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    const priceId = formData.get('priceId') as string;
    return createCheckoutSession({ team: createdTeam, priceId });
  }

  redirect('/synoptics');
});

export async function signOut() {
  const user = (await getUser()) as User;
  const userWithTeam = await getUserWithTeam(user.id);
  await logActivity(userWithTeam?.teamId, user.id, ActivityType.SIGN_OUT);
  (await cookies()).delete('session');
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100)
});

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, user) => {
    const { currentPassword, newPassword, confirmPassword } = data;

    const isPasswordValid = await comparePasswords(
      currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'Current password is incorrect.'
      };
    }

    if (currentPassword === newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'New password must be different from the current password.'
      };
    }

    if (confirmPassword !== newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'New password and confirmation password do not match.'
      };
    }

    const newPasswordHash = await hashPassword(newPassword);
    const userWithTeam = await getUserWithTeam(user.id);

    await Promise.all([
      db
        .update(users)
        .set({ passwordHash: newPasswordHash })
        .where(eq(users.id, user.id)),
      logActivity(userWithTeam?.teamId, user.id, ActivityType.UPDATE_PASSWORD)
    ]);

    return {
      success: 'Password updated successfully.'
    };
  }
);

const createTeamSchema = z.object({
  name: z.string().min(1).max(100).optional()
});

export const createTeam = validatedActionWithUser(
  createTeamSchema,
  async (data, _, user) => {
    const name = data.name && data.name.trim().length > 0 ? data.name.trim() : `${user.email}'s Team`;

    const [newTeam] = await db.insert(teams).values({ name }).returning();
    if (!newTeam) {
      return { error: 'Failed to create team' };
    }

    const membership: NewTeamMember = {
      userId: user.id,
      teamId: newTeam.id,
      role: 'owner'
    };
    await Promise.all([
      db.insert(teamMembers).values(membership),
      db.update(users).set({ lastActiveTeamId: newTeam.id }).where(eq(users.id, user.id)),
      logActivity(newTeam.id, user.id, ActivityType.CREATE_TEAM)
    ]);

    return { success: 'Team created', teamId: newTeam.id };
  }
);

const acceptInvitationSchema = z.object({
  invitationId: z.coerce.number()
});

export const acceptInvitation = validatedActionWithUser(
  acceptInvitationSchema,
  async (data, _, user) => {
    const { invitationId } = data;

    // Use transaction to prevent race conditions
    const result = await db.transaction(async (tx) => {
      const [invite] = await tx
        .select()
        .from(invitations)
        .where(eq(invitations.id, invitationId))
        .limit(1);

      if (!invite || invite.email !== user.email || invite.status !== 'pending') {
        return { error: 'Invitation not found or not valid' };
      }

      // Check if already a member
      const existingMembership = await tx
        .select()
        .from(teamMembers)
        .where(and(eq(teamMembers.userId, user.id), eq(teamMembers.teamId, invite.teamId)))
        .limit(1);

      if (existingMembership.length === 0) {
        const newTeamMember: NewTeamMember = {
          userId: user.id,
          teamId: invite.teamId,
          role: invite.role
        };
        await tx.insert(teamMembers).values(newTeamMember);
      }

      await Promise.all([
        tx.update(invitations).set({ status: 'accepted' }).where(eq(invitations.id, invitationId)),
        tx.update(users).set({ lastActiveTeamId: invite.teamId }).where(eq(users.id, user.id)),
        logActivity(invite.teamId, user.id, ActivityType.ACCEPT_INVITATION)
      ]);

      return { success: 'Invitation accepted' };
    });

    return result;
  }
);

const switchTeamSchema = z.object({
  teamId: z.coerce.number()
});

export const switchTeam = validatedActionWithUser(
  switchTeamSchema,
  async (data, _, user) => {
    const { teamId } = data;

    const membership = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.userId, user.id), eq(teamMembers.teamId, teamId)))
      .limit(1);

    if (membership.length === 0) {
      return { error: 'Not a member of this team' };
    }

    await db
      .update(users)
      .set({ lastActiveTeamId: teamId })
      .where(eq(users.id, user.id));

    return { success: 'Switched team' };
  }
);

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100)
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, user) => {
    const { password } = data;

    const isPasswordValid = await comparePasswords(password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        password,
        error: 'Incorrect password. Account deletion failed.'
      };
    }

    const userWithTeam = await getUserWithTeam(user.id);

    await logActivity(
      userWithTeam?.teamId,
      user.id,
      ActivityType.DELETE_ACCOUNT
    );

    // Soft delete
    await db
      .update(users)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
        email: sql`CONCAT(email, '-', id, '-deleted')` // Ensure email uniqueness
      })
      .where(eq(users.id, user.id));

    if (userWithTeam?.teamId) {
      await db
        .delete(teamMembers)
        .where(
          and(
            eq(teamMembers.userId, user.id),
            eq(teamMembers.teamId, userWithTeam.teamId)
          )
        );
    }

    (await cookies()).delete('session');
    redirect('/sign-in');
  }
);

const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address')
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user) => {
    const { name, email } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    await Promise.all([
      db.update(users).set({ name, email }).where(eq(users.id, user.id)),
      logActivity(userWithTeam?.teamId, user.id, ActivityType.UPDATE_ACCOUNT)
    ]);

    return { name, success: 'Account updated successfully.' };
  }
);

const removeTeamMemberSchema = z.object({
  memberId: z.coerce.number()
});

export const removeTeamMember = validatedActionWithUser(
  removeTeamMemberSchema,
  async (data, _, user) => {
    const { memberId } = data;
    if (!user.lastActiveTeamId) {
      return { error: 'User is not part of a team' };
    }
    const teamId = user.lastActiveTeamId;

    // Ensure the acting user is a member of this team
    const currentMembership = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.userId, user.id), eq(teamMembers.teamId, teamId)))
      .limit(1);

    if (currentMembership.length === 0) {
      return { error: 'User is not part of this team' };
    }

    // Ensure member belongs to same team and guard against removing last owner
    const targetMember = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.id, memberId), eq(teamMembers.teamId, teamId)))
      .limit(1);

    if (targetMember.length === 0) {
      return { error: 'Member not found' };
    }

    const isTargetOwner = targetMember[0].role === 'owner';

    if (isTargetOwner) {
      const owners = await db
        .select()
        .from(teamMembers)
        .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.role, 'owner')));
      if (owners.length <= 1) {
        return { error: 'Cannot remove the last owner' };
      }
    }

    await db
      .delete(teamMembers)
      .where(
        and(eq(teamMembers.id, memberId), eq(teamMembers.teamId, teamId))
      );

    await logActivity(
      teamId,
      user.id,
      ActivityType.REMOVE_TEAM_MEMBER
    );

    return { success: 'Team member removed successfully' };
  }
);

const inviteTeamMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['member', 'owner'])
});

export const inviteTeamMember = validatedActionWithUser(
  inviteTeamMemberSchema,
  async (data, _, user) => {
    const { email, role } = data;
    // Use the user's active team (lastActiveTeamId) as the context for invitations
    if (!user.lastActiveTeamId) {
      return { error: 'User is not part of a team' };
    }
    const teamId = user.lastActiveTeamId;

    // Use transaction for atomicity
    const result = await db.transaction(async (tx) => {
      // Validate that the inviter is still a member and owner of the team
      const currentMembership = await tx
        .select()
        .from(teamMembers)
        .where(and(eq(teamMembers.userId, user.id), eq(teamMembers.teamId, teamId)))
        .limit(1);

      if (currentMembership.length === 0 || currentMembership[0].role !== 'owner') {
        return { error: 'Forbidden' };
      }

      // Check if user is already a member
      const existingMember = await tx
        .select()
        .from(teamMembers)
        .innerJoin(users, eq(teamMembers.userId, users.id))
        .where(and(eq(teamMembers.teamId, teamId), eq(users.email, email)))
        .limit(1);

      if (existingMember.length > 0) {
        return { error: 'User is already a member of this team' };
      }

      // Check if there's an existing pending invitation
      const existingInvitation = await tx
        .select()
        .from(invitations)
        .where(
          and(
            eq(invitations.email, email),
            eq(invitations.teamId, teamId),
            eq(invitations.status, 'pending')
          )
        )
        .limit(1);

      if (existingInvitation.length > 0) {
        return { error: 'An invitation has already been sent to this email' };
      }

      // Create a new invitation
      await tx.insert(invitations).values({
        teamId,
        email,
        role,
        invitedBy: user.id,
        status: 'pending'
      });

      await logActivity(
        teamId,
        user.id,
        ActivityType.INVITE_TEAM_MEMBER
      );

      // TODO: Send invitation email and include ?inviteId={id} to sign-up URL
      // await sendInvitationEmail(email, userWithTeam.team.name, role)

      return { success: 'Invitation sent successfully' };
    });

    return result;
  }
);

const updateTeamNameSchema = z.object({
  name: z.string().min(1).max(100)
});

export const updateTeamName = validatedActionWithUser(
  updateTeamNameSchema,
  async (data, _, user) => {
    const { name } = data;
    if (!user.lastActiveTeamId) {
      return { error: 'User is not part of a team' };
    }
    const teamId = user.lastActiveTeamId;

    const currentMembership = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.userId, user.id), eq(teamMembers.teamId, teamId)))
      .limit(1);

    if (currentMembership.length === 0) {
      return { error: 'User is not part of this team' };
    }

    if (currentMembership[0].role !== 'owner') {
      return { error: 'Forbidden' };
    }

    await db
      .update(teams)
      .set({ name, updatedAt: new Date() })
      .where(eq(teams.id, teamId));

    return { success: 'Team name updated successfully' };
  }
);

const updateTeamMemberRoleSchema = z.object({
  memberId: z.coerce.number(),
  role: z.enum(['member', 'owner'])
});

export const updateTeamMemberRole = validatedActionWithUser(
  updateTeamMemberRoleSchema,
  async (data, _, user) => {
    const { memberId, role } = data;
    // Use the user's active team as the context for role updates
    if (!user.lastActiveTeamId) {
      return { error: 'User is not part of a team' };
    }
    const teamId = user.lastActiveTeamId;

    // Ensure the target member belongs to this team
    const targetMember = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.id, memberId), eq(teamMembers.teamId, teamId)))
      .limit(1);

    if (targetMember.length === 0) {
      return { error: 'Member not found' };
    }

    // Ensure the acting user is still an owner of this team
    const currentMembership = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.userId, user.id), eq(teamMembers.teamId, teamId)))
      .limit(1);

    if (currentMembership.length === 0 || currentMembership[0].role !== 'owner') {
      return { error: 'Forbidden' };
    }

    // Prevent demoting the last owner
    if (targetMember[0].role === 'owner' && role !== 'owner') {
      const owners = await db
        .select()
        .from(teamMembers)
        .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.role, 'owner')));
      if (owners.length <= 1) {
        return { error: 'Cannot change role of the last owner' };
      }
    }

    await db
      .update(teamMembers)
      .set({ role })
      .where(eq(teamMembers.id, memberId));

    return { success: 'Role updated successfully' };
  }
);

const cancelInvitationSchema = z.object({
  invitationId: z.coerce.number()
});

export const cancelInvitation = validatedActionWithUser(
  cancelInvitationSchema,
  async (data, _, user) => {
    const { invitationId } = data;
    if (!user.lastActiveTeamId) {
      return { error: 'User is not part of a team' };
    }
    const teamId = user.lastActiveTeamId;

    const currentMembership = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.userId, user.id), eq(teamMembers.teamId, teamId)))
      .limit(1);

    if (currentMembership.length === 0) {
      return { error: 'User is not part of this team' };
    }

    if (currentMembership[0].role !== 'owner') {
      return { error: 'Forbidden' };
    }

    // Use transaction for consistency
    const result = await db.transaction(async (tx) => {
      const [invite] = await tx
        .select()
        .from(invitations)
        .where(
          and(eq(invitations.id, invitationId), eq(invitations.teamId, teamId))
        )
        .limit(1);

      if (!invite) {
        return { error: 'Invitation not found' };
      }

      if (invite.status !== 'pending') {
        return { error: 'Invitation is no longer pending' };
      }

      await tx
        .update(invitations)
        .set({ status: 'cancelled' })
        .where(eq(invitations.id, invitationId));

      await logActivity(teamId, user.id, ActivityType.CANCEL_INVITATION);

      return { success: 'Invitation cancelled' };
    });

    return result;
  }
);
