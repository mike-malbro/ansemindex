# Security — ANSEM Index hub

## Hard rules

1. **Public hub never holds private keys.** No seed phrases, no `TREASURY_SECRET_KEY`, no operator signing material in Railway hub env or Postgres.
2. **Postgres stores pubkeys and pool data only** — addresses, mints, snapshots, ingest runs, node reports.
3. **APIs reject secret fields** — `assertNoSecrets()` on POST bodies (`private_key`, `secret`, `seed`, `mnemonic`, …).
4. **Map wallets are pubkeys** we read to discover open TOKEN–ANSEM pools. Adding a wallet means adding its **address** to `TRACKED_WALLETS`, never a key.
5. **Signing** (fee claim, launch, buys) happens only on a **separate private keeper** or the user’s own wallet — never on the public hub.

## Env checklist (hub)

Allowed: `DATABASE_URL`, `TRACKED_WALLETS` (pubkeys), `ANSEM_MINT`, `SOLANA_RPC_URL`, public URLs.

Forbidden on hub: any `*_PRIVATE_KEY`, `*_SECRET_KEY`, mnemonic, keypair JSON.

## Perpad parallel

Perpad keeps treasury keys in Fly/Supabase **secrets**, never in the DB. We mirror that split for ANSEM Index.

## Production data

See [DATA.md](./DATA.md) for the full production schema roadmap (event spine,
LP history, 70% gate, dashboards, GitHub/collab). Whitepaper: `/whitepaper#data`.
