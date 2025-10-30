-- Add lastActiveTeamId column to users table
ALTER TABLE users ADD COLUMN last_active_team_id INTEGER;

-- Set lastActiveTeamId to the first team each user is a member of
UPDATE users
SET last_active_team_id = (
  SELECT team_id 
  FROM team_members 
  WHERE team_members.user_id = users.id 
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 
  FROM team_members 
  WHERE team_members.user_id = users.id
);
