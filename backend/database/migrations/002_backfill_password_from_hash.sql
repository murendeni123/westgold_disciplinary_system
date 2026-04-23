-- Backfill: copy password_hash → password for any users created by onboarding
-- that have a password_hash set but password is NULL.
-- This fixes admins created before the onboarding INSERT column was corrected.
UPDATE public.users
SET password = password_hash
WHERE password IS NULL
  AND password_hash IS NOT NULL;
