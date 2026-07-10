# ansem-node

Runnable **ANSEM LP INDEX** node. Pull the public pool list, deposit into pools on your own, run fee ticks locally or on Railway. **Keys never leave this process.**

Mike’s node (`HpJbzERP…`) is **influence** — a reference book. Your deposits and keys are independent.

## Join

1. **Buy `$ANSEMLP`** (when live) — creator fees fund buybacks and growth into Index pools.
2. **Deposit independently** into any TOKEN–ANSEM pool on [Meteora](https://app.meteora.ag) (use *your* LP wallet).
3. **Pull the index** (no keys):

```bash
pnpm install
pnpm index          # JSON
pnpm index --csv    # CSV
```

4. **Run a node** — local or Railway (below).

Hub join guide: https://hub-production-7867.up.railway.app/join  
Public API: https://hub-production-7867.up.railway.app/api/public

## Security (hard rules)

| Do | Don’t |
|----|--------|
| Put keys in `cell_secrets.env` (chmod 600) or Railway secrets | Commit `.env` / `cell_secrets.env` |
| Sign only in this node process | Paste keys into the public hub or Postgres |
| Keep `DRY_RUN=true` until doctor + dry ticks are clean | Go live with empty `OPERATOR_WALLET` / dest |
| Use *your* `LP_WALLET` | Point your node at Mike’s LP key |

## Local

```bash
cp .env.example .env
cp cell_secrets.env.example cell_secrets.env
# set LP_WALLET, OPERATOR_WALLET, ANSEM_DEST_WALLET (pubkeys)
# set LP_PRIVATE_KEY + OPERATOR_PRIVATE_KEY in cell_secrets.env
chmod 600 cell_secrets.env

pnpm install
pnpm doctor
pnpm dry          # one dry tick — no signing
pnpm start        # loop, still DRY_RUN until flipped
```

## Railway / server

1. New Railway service → this repo (or this folder).
2. Dockerfile is included (`railway.toml` healthcheck `/health`).
3. Set env: pubkeys + `LP_PRIVATE_KEY` / `OPERATOR_PRIVATE_KEY` as **secrets**.
4. Leave `DRY_RUN=true` `SIMULATION_MODE=true` until ready.
5. Go live: `DRY_RUN=false` `SIMULATION_MODE=false`.

## Fee tick

```
claim LP fees → sweep SOL → Jupiter buy ANSEM → send to ANSEM_DEST
```

Default split: **70%** buy+send ANSEM · **30%** SOL reserve.  
`$ANSEMLP` creator fees (when live) are the program flywheel; this node claims **your** pool LP fees.

## Influence vs custody

- **Influence:** Mike’s map wallet sizes the public index story. Optional reference.
- **Custody:** Only wallets *you* fund and keys *you* store in secrets.
- **Hub:** Pubkeys + pool list only. Never signing material.

## Publish this repo

This folder is meant to be its **own GitHub project** (e.g. `mike-malbro/ansem-node`). Copy or subtree-split from the hub monorepo:

```bash
# from hub repo root
git subtree split -P packages/ansem-node -b ansem-node-publish
# then push branch to the new remote
```

Or create the new repo and copy `packages/ansem-node/*` into it.
