-- Multi-horizon price change for Index sort (5m / 1h / 6h / 24h).
ALTER TABLE pool_snapshots
  ADD COLUMN IF NOT EXISTS price_change_5m NUMERIC,
  ADD COLUMN IF NOT EXISTS price_change_1h NUMERIC,
  ADD COLUMN IF NOT EXISTS price_change_6h NUMERIC;
