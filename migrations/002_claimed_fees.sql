-- Track claimed LP fees on snapshots (unclaimed alone understates the book).

ALTER TABLE pool_snapshots
  ADD COLUMN IF NOT EXISTS claimed_fees_usd NUMERIC NOT NULL DEFAULT 0;
