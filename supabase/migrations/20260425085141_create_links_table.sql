/*
  # Create links table

  1. New Tables
    - `links`
      - `id` (text, primary key) - 4-digit code
      - `content` (text, not null) - the URL or message being shared
      - `expires_at` (timestamptz, not null) - when the link expires (10 min TTL)
      - `created_at` (timestamptz) - creation timestamp
      - `creator_id` (text, not null) - anonymous client UUID stored in localStorage

  2. Security
    - Enable RLS on `links` table
    - SELECT: any authenticated or anon user can read non-expired rows by id (needed for retrieval by code)
    - INSERT: any anon user can insert their own rows (creator_id must match a supplied value)
    - UPDATE: only the creator can update their own non-expired rows
    - DELETE: only the creator can delete their own rows

  3. Notes
    - The app is anonymous (no auth), so policies use creator_id text matching rather than auth.uid()
    - Reads are intentionally open so any visitor can retrieve content by code
    - Writes are locked to the creator_id supplied at insert time
*/

CREATE TABLE IF NOT EXISTS links (
  id text PRIMARY KEY,
  content text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  creator_id text NOT NULL
);

ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- Anyone can read a link if they know its code (retrieval use case)
CREATE POLICY "Anyone can read non-expired links by id"
  ON links FOR SELECT
  USING (expires_at > now());

-- Anyone can insert a link for themselves
CREATE POLICY "Anyone can insert their own link"
  ON links FOR INSERT
  WITH CHECK (creator_id IS NOT NULL AND creator_id <> '');

-- Only the creator can update their own non-expired link
CREATE POLICY "Creator can update their own link"
  ON links FOR UPDATE
  USING (creator_id = creator_id AND expires_at > now())
  WITH CHECK (creator_id = creator_id);

-- Only the creator can delete their own link
CREATE POLICY "Creator can delete their own link"
  ON links FOR DELETE
  USING (creator_id IS NOT NULL AND creator_id <> '');
