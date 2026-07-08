-- Fee ledger: index ANSEM 0–70% snapshots, keeper ticks, fee events, creator sends.
-- Pubkeys + amounts + signatures only — never private keys.

CREATE TABLE IF NOT EXISTS index_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'ingest',
  total_position_usd NUMERIC NOT NULL DEFAULT 0,
  total_ansem_usd NUMERIC NOT NULL DEFAULT 0,
  ansem_pct NUMERIC NOT NULL DEFAULT 0,
  total_unclaimed_fees_usd NUMERIC NOT NULL DEFAULT 0,
  total_claimed_fees_usd NUMERIC NOT NULL DEFAULT 0,
  pool_count INTEGER NOT NULL DEFAULT 0,
  gate_phase TEXT NOT NULL DEFAULT 'build',
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw JSONB
);

CREATE INDEX IF NOT EXISTS idx_index_snapshots_time
  ON index_snapshots(project_id, snapshot_at DESC);

CREATE TABLE IF NOT EXISTS keeper_ticks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  dry_run BOOLEAN NOT NULL DEFAULT true,
  live BOOLEAN NOT NULL DEFAULT false,
  lp_wallet TEXT,
  operator_wallet TEXT,
  ansem_dest_wallet TEXT,
  claimable_fees_usd NUMERIC NOT NULL DEFAULT 0,
  claimed_usd NUMERIC NOT NULL DEFAULT 0,
  route_budget_usd NUMERIC NOT NULL DEFAULT 0,
  plan_status TEXT,
  plan_total_usd NUMERIC NOT NULL DEFAULT 0,
  sol_usd NUMERIC,
  raw JSONB
);

CREATE INDEX IF NOT EXISTS idx_keeper_ticks_time
  ON keeper_ticks(project_id, finished_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS fee_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tick_id UUID REFERENCES keeper_ticks(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'dry_run',
  position_address TEXT,
  pool_address TEXT,
  mint TEXT,
  amount_ui NUMERIC,
  usd NUMERIC,
  recipient TEXT,
  tx_signature TEXT,
  related_tx_signature TEXT,
  leg_id TEXT,
  error TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw JSONB
);

CREATE INDEX IF NOT EXISTS idx_fee_events_type_time
  ON fee_events(project_id, event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_fee_events_sig
  ON fee_events(tx_signature)
  WHERE tx_signature IS NOT NULL;

CREATE TABLE IF NOT EXISTS creator_fee_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tick_id UUID REFERENCES keeper_ticks(id) ON DELETE SET NULL,
  fee_event_id UUID REFERENCES fee_events(id) ON DELETE SET NULL,
  recipient TEXT NOT NULL,
  mint TEXT NOT NULL,
  amount_ui NUMERIC NOT NULL DEFAULT 0,
  usd NUMERIC NOT NULL DEFAULT 0,
  swap_tx TEXT,
  transfer_tx TEXT,
  dry_run BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creator_fee_sends_time
  ON creator_fee_sends(project_id, sent_at DESC);
