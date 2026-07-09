# Production data model — ANSEM LP INDEX

This is the **honest** databasing plan. Tonight’s hub has a thin fee ledger.
Production needs an **append-only event spine**, full tx coverage, dashboards
that never lose history, and a collab workflow that keeps keys off the public
repo and off Postgres.

Companion docs: [SECURITY.md](./SECURITY.md) · whitepaper `/whitepaper#data` ·
migrations in [`migrations/`](./migrations/).

---

## 1. Principles (non-negotiable)

1. **Postgres never stores private keys** — only pubkeys, mints, pool addresses,
   amounts, signatures, and JSON reports.
2. **Append-only for money events** — claims, swaps, sends, LP deposits/withdraws
   are inserted, never updated in place (corrections = new compensating rows).
3. **Every on-chain action has a row** with `tx_signature` (or an explicit
   `dry_run` / `error` status if unsigned).
4. **Hub vs keeper split** — public hub reads + writes *public* ledger rows;
   private keeper signs and POSTs tick summaries. Same rule as Perpad secrets.
5. **Reproducible index** — any day’s Share % and ANSEM % can be rebuilt from
   snapshots + events, not from UI state.

---

## 2. What we have today (v0 ledger)

| Table | Role |
|-------|------|
| `projects` | One ANSEM LP INDEX project row |
| `controller_wallets` | Map wallets (discovery pubkeys) |
| `pools` | TOKEN–ANSEM pool book |
| `pool_snapshots` | Per-ingest LP position time series |
| `ingest_runs` | Ingest audit |
| `index_snapshots` | Index-level ANSEM % + gate phase |
| `keeper_ticks` | One row per keeper/hub tick |
| `fee_events` | Atomic fee-path events |
| `creator_fee_sends` | ANSEM buy+send to creator fee dest |

**Gaps (must close for production):** no generic chain tx log, no wallet
balance history, no LP deposit/withdraw ledger, no launchpad mint events, no
node registry, no dashboard materializations, unused `pool_holders`.

---

## 3. Target production schema (future migrations)

Think in **layers**. Ship migrations in this order.

### Layer A — Event spine (migration `005`)

```text
chain_transactions
  id, project_id, signature UNIQUE, slot, block_time,
  program_id, instruction_type, success, fee_lamports,
  signer_pubkeys[], raw JSONB, ingested_at

wallet_balance_snapshots
  id, project_id, wallet, mint, amount_ui, usd,
  source (rpc|derived), snapshot_at

-- Links any domain event → one or more chain txs
event_tx_links
  event_table, event_id, signature, role (primary|related)
```

**Why:** “every transaction” means we can answer “show me every sig that
touched the fee path / map wallets / creator dest” without scraping Solscan
by hand.

### Layer B — Liquidity & index truth (migration `006`)

```text
lp_events
  type: deposit | withdraw | claim_fees | position_open | position_close
  pool_address, position_address, wallet, amounts, usd, signature, at

pool_share_history
  pool_id, share_pct, position_usd, snapshot_at
  -- denormalized from pool_snapshots for fast charts

index_composition_daily
  day, pool_address, weight_pct, position_usd
```

**Why:** dashboards need Share % over time and LP cashflows, not only the
latest open book.

### Layer C — Creator fee & 70% gate (extend `004`)

```text
gate_transitions
  from_phase, to_phase, ansem_pct, triggered_at, tick_id

creator_fee_accruals
  -- optional: estimated unclaimed creator fees before claim
  wallet, mint, amount_ui, usd, observed_at

treasury_positions
  -- what the creator fee wallet holds over time (ANSEM + index tokens)
  wallet, mint, amount_ui, usd, snapshot_at
```

**Why:** the product story is “fees → ANSEM → 0–70% → buybacks.” That needs
**accrual → claim → buy → send → gate flip** as first-class rows, not a pie
chart computed once.

### Layer D — Launchpad & nodes (migrations `007`–`008`)

```text
launches
  launcher_wallet, token_mint, pool_address, status,
  create_sig, pool_sig, created_at

node_registry
  pubkey, label, status, registered_at   -- NO keys

node_reports
  node_id, report JSONB, submitted_at    -- public metrics only
```

### Layer E — Dashboard materializations (migration `009`)

```text
dash_fee_daily
  day, claimed_usd, sent_to_creator_usd, reserve_usd, buyback_usd

dash_ansem_pct_hourly
  hour, ansem_pct, gate_phase, total_position_usd

dash_pool_top
  as_of, pool_address, share_pct, fees_24h_usd
```

Refresh via cron / after ingest / after tick — never compute heavy joins on
every page load in production.

---

## 4. Event model (canonical fee path)

```text
claim_fees  →  sweep_sol  →  jupiter_buy  →  ansem_send  →  (optional) seed_lp
                     ↘ sol_reserve
gate check: if ansem_pct >= 0.70 → buybacks-only legs
```

Each step:

| Field | Required |
|-------|----------|
| `event_type` | yes |
| `status` | `dry_run` \| `live` \| `error` \| `skip` |
| `usd` / `amount_ui` | when known |
| `tx_signature` | when live |
| `tick_id` | when from keeper |
| `raw` JSONB | full provider payload |

**Idempotency:** unique on `(signature)` or `(tick_id, leg_id, event_type)` so
retries don’t double-count.

---

## 5. What “detailed production” means for dashboards

| Dashboard | Data source |
|-----------|-------------|
| Index book | `pools` + latest `pool_snapshots` |
| Share % history | `pool_share_history` / `index_composition_daily` |
| ANSEM 0–70% | `index_snapshots` + `gate_transitions` |
| Creator fee wallet | `treasury_positions` + `creator_fee_sends` |
| Every tx | `chain_transactions` + `fee_events` |
| Keeper health | `keeper_ticks` (latency, dry vs live, errors) |
| Launchpad | `launches` |
| Nodes | `node_registry` + `node_reports` |

UI rule: **Creator / Index / Wallet tabs read the ledger**, not ad-hoc RPC
only. RPC is for enrichment and backfill; Postgres is the system of record
for the product.

---

## 6. Backfill & ops

1. **Forward-only first** — new ticks and ingests write complete rows.
2. **Backfill jobs** (separate worker): scan map wallets + creator dest for
   historical sigs → `chain_transactions` → classify into `fee_events` /
   `lp_events` where possible.
3. **Retention** — keep raw JSONB; compress or archive `pool_snapshots` older
   than N days into daily rollups if storage bites.
4. **Migrations** — numbered SQL in `migrations/`, applied by
   `ensureMigrated()`; never edit applied files — add `010_…`.

---

## 7. GitHub & collaboration

### Repo layout

| Path | Who | Secrets? |
|------|-----|----------|
| `mike-malbro/ansemindex` (this hub) | Public / collaborators | **No** |
| `migrations/`, `DATA.md`, `SECURITY.md` | Everyone | No |
| Private keeper repo or Railway service env | Operators only | **Yes** (signing keys) |

### Branch & PR workflow

1. **`main`** — production hub (Railway auto-deploy).
2. Feature branches: `feat/…`, `fix/…`, `data/005-chain-tx`.
3. PRs required for schema + API changes; migration file must be in the PR.
4. Review checklist: no keys in diff, `assertNoSecrets` on new POSTs,
   migration idempotent (`IF NOT EXISTS`).

### Issues / projects (suggested labels)

- `data` — schema, backfill, ledger
- `fee-path` — claim / buy / send / gate
- `dashboard` — Creator / Index / charts
- `launchpad` · `nodes` · `keeper`
- `security` — anything near keys or RPC auth

### Collab rules

- Collaborators get **repo + Railway viewer** as needed; **never** keeper
  signing env.
- Map wallets / `ANSEM_DEST_WALLET` are **pubkeys in env**, documented in
  Manage — not in git.
- Design docs land in `DATA.md` / whitepaper `#data` before big schema PRs.
- Discord/Telegram for chat; **GitHub Issues** for decisions that change
  tables or fee rules (so the paper can cite them).

### Environments

| Env | DB | Keeper |
|-----|----|--------|
| Local | Docker Postgres or Railway branch | dry_run |
| Production hub | Railway Postgres | dry until go-live |
| Production keeper | same DB write via hub `POST /api/keeper` persist **or** direct DB with least privilege | live keys |

Prefer **hub persist API** so the keeper never needs broad DB credentials.

---

## 8. Near-term build order

1. **`005_chain_transactions`** + link fee events to sigs  
2. **`lp_events`** + Share % history views  
3. **`treasury_positions`** cron for creator fee wallet  
4. **`gate_transitions`** when `ansem_pct` crosses 70%  
5. Materialized `dash_*` tables + Creator/Index charts  
6. Launchpad + node tables when those products ship  

Until then: treat `004` as the **minimum viable ledger**, not the end state.

---

## 9. Honesty check

Tonight we can show pools, a 0–70% bar, and a few dry-run fee rows. That is
**not** production-grade transaction coverage. Production means: every claim,
every swap, every send, every LP change, every gate flip — queryable,
idempotent, and rebuildable. This file is the contract for that work.
