# Security — ANSEM LP INDEX hub

## Hard rules

1. **Public hub never holds private keys.** No seed phrases, no `TREASURY_SECRET_KEY`, no operator signing material in Railway hub env or Postgres.
2. **Postgres stores pubkeys and pool data only** — addresses, mints, snapshots, ingest runs, node reports.
3. **APIs reject secret fields** — `assertNoSecrets()` on POST bodies (`private_key`, `secret`, `seed`, `mnemonic`, …).
4. **Map wallets are pubkeys** we read to discover open TOKEN–ANSEM pools. Adding a wallet means adding its **address** to `TRACKED_WALLETS`, never a key.
5. **Signing** (fee claim, launch, buys) happens only on a **separate private node/keeper** or the user’s own wallet — never on the public hub.
6. **Mike’s node is influence** — reference LP `HpJbzERP…`. Other operators never receive or paste that private key. Fork `packages/ansem-node` with *their* wallets.

## Join / publish boundary

| Surface | Holds keys? |
|---------|-------------|
| Hub (`ansemindex`) + Postgres | **No** |
| Public API `GET /api/public` | **No** (read-only pool list) |
| `packages/ansem-node` / published node repo | **Yes** — only in `cell_secrets.env` / Railway secrets |
| Mike influence keeper (`keeper/`) | **Yes** — Mike’s ops only |

## Env checklist (hub)

Allowed: `DATABASE_URL`, `TRACKED_WALLETS` (pubkeys), `ANSEM_MINT`, `SOLANA_RPC_URL`, public URLs, `KEEPER_URL` (HTTPS to *your* keeper health — no keys in the URL).

Forbidden on hub: any `*_PRIVATE_KEY`, `*_SECRET_KEY`, mnemonic, keypair JSON.

## Node checklist (operators)

See [packages/ansem-node/SECURITY.md](./packages/ansem-node/SECURITY.md):

- [ ] Own `LP_WALLET` / `OPERATOR_WALLET` / `ANSEM_DEST_WALLET`
- [ ] Keys only in secrets; `chmod 600` locally
- [ ] `DRY_RUN=true` until doctor + dry ticks pass
- [ ] Never POST keys to hub APIs

## Perpad parallel

Perpad keeps treasury keys in Fly/Supabase **secrets**, never in the DB. We mirror that split for ANSEM LP INDEX.

## Production data

See [DATA.md](./DATA.md) for the full production schema roadmap (event spine,
LP history, 70% gate, dashboards, GitHub/collab). Whitepaper: `/whitepaper#data`.
Join: `/join` · Nodes: `/nodes`.
