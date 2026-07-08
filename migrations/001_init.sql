-- ANSEM Index — master schema
-- Controller wallet open pools = the live index.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  mint TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS controller_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'wallet(0)',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, address)
);

CREATE INDEX IF NOT EXISTS idx_controller_wallets_order
  ON controller_wallets(project_id, sort_order);

CREATE TABLE IF NOT EXISTS pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  pool_address TEXT NOT NULL,
  pool_name TEXT,
  token_mint TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  ansem_mint TEXT NOT NULL,
  base_fee_pct NUMERIC,
  source TEXT NOT NULL DEFAULT 'controller',
  status TEXT NOT NULL DEFAULT 'open',
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, pool_address)
);

CREATE INDEX IF NOT EXISTS idx_pools_status ON pools(project_id, status);
CREATE INDEX IF NOT EXISTS idx_pools_symbol ON pools(token_symbol);

CREATE TABLE IF NOT EXISTS pool_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  controller_wallet TEXT NOT NULL,
  position_address TEXT,
  position_value_usd NUMERIC NOT NULL DEFAULT 0,
  unclaimed_fees_usd NUMERIC NOT NULL DEFAULT 0,
  token_amount NUMERIC NOT NULL DEFAULT 0,
  ansem_amount NUMERIC NOT NULL DEFAULT 0,
  token_usd NUMERIC NOT NULL DEFAULT 0,
  ansem_usd NUMERIC NOT NULL DEFAULT 0,
  pool_tvl_usd NUMERIC,
  volume_24h_usd NUMERIC,
  price_change_24h NUMERIC,
  market_cap_usd NUMERIC,
  raw JSONB,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pool_snapshots_pool_time
  ON pool_snapshots(pool_id, snapshot_at DESC);

CREATE TABLE IF NOT EXISTS pool_holders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  mint TEXT NOT NULL,
  owner_address TEXT NOT NULL,
  token_account TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  amount_ui NUMERIC NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL,
  pct_of_top NUMERIC,
  is_controller BOOLEAN NOT NULL DEFAULT false,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pool_id, mint, owner_address, snapshot_at)
);

CREATE INDEX IF NOT EXISTS idx_pool_holders_rank
  ON pool_holders(pool_id, mint, snapshot_at DESC, rank);

CREATE TABLE IF NOT EXISTS ingest_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  wallet TEXT NOT NULL,
  status TEXT NOT NULL,
  pools_upserted INTEGER NOT NULL DEFAULT 0,
  positions_seen INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed ANSEM Index project + controller wallet(0)
INSERT INTO projects (symbol, name, mint)
VALUES (
  'ANSEM',
  'ANSEM Index',
  '9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump'
)
ON CONFLICT (mint) DO NOTHING;

INSERT INTO controller_wallets (project_id, address, label, sort_order)
SELECT p.id,
  'HpJbzERP44V21mKGRDDUArb9JJaL9NdPSgXzZ9uyieVB',
  'wallet(0)',
  0
FROM projects p
WHERE p.mint = '9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump'
ON CONFLICT (project_id, address) DO NOTHING;
