# ANSEM INDEX

Independent Meteora DAMM v2 LP terminal + Life-style fee keeper for the ANSEM index.

**Fee flow (launch):** claim LP fees → sweep to operator → Jupiter buy ANSEM → **send to creator fee wallet** (not burn).

**Docs:** [DATA.md](./DATA.md) (production databasing) · [OPERATOR.md](./OPERATOR.md) (ops / bot functions — not public product copy) · [SECURITY.md](./SECURITY.md) · whitepaper `/whitepaper#data`

## Two services (Railway)

| Service | Path | Role | Keys |
|---------|------|------|------|
| **Hub** | repo root (Next.js) | Portfolio terminal + `/manage` | Pubkeys only |
| **Keeper** | `keeper/` | Claim / buy / send loop | `LP_PRIVATE_KEY`, `OPERATOR_PRIVATE_KEY` |

## Creator fee wallets

| Wallet | Env | Signs |
|--------|-----|-------|
| W0 Main | `MAIN_WALLET` | Never |
| W1 LP | `LP_WALLET` + `LP_PRIVATE_KEY` | `claimPositionFee2`, SOL sweep |
| W2 Operator | `OPERATOR_WALLET` + `OPERATOR_PRIVATE_KEY` | Jupiter buy, SPL send |
| ANSEM dest | `ANSEM_DEST_WALLET` | Receives bought ANSEM |

Default tracked LP (view): `HpJbzERP44V21mKGRDDUArb9JJaL9NdPSgXzZ9uyieVB`  
ANSEM mint: `9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump`

Default split: **70% buy+send ANSEM**, **30% SOL reserve** (editable in `keeper/cell.json`).

## Local — hub

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

- Terminal: http://localhost:3000  
- Manage: http://localhost:3000/manage  

## Local — keeper (dry)

```bash
cd keeper
cp .env.example .env
# set OPERATOR_WALLET + ANSEM_DEST_WALLET (pubkeys)
pnpm install
pnpm doctor
pnpm dry          # one dry tick — no signing
pnpm start        # loop, still DRY_RUN until flipped
```

## Add liquidity

1. Phantom → **W1 LP wallet**
2. [app.meteora.ag](https://app.meteora.ag) → deposit TOKEN–ANSEM
3. Positions show on the terminal automatically
4. Keeper claims all open W1 positions each tick

## Go live

1. `pnpm doctor` clean  
2. Several dry ticks OK  
3. Fund W1 (~0.05 SOL) + W2 (enough for buys)  
4. On keeper Railway: `DRY_RUN=false` `SIMULATION_MODE=false`  
5. Hub: set `KEEPER_URL=https://your-keeper.up.railway.app` so `/manage` talks to it  

## API

- Hub: `GET /api/health`, `GET /api/portfolio`, `GET /api/pool/[address]`, `GET|POST /api/keeper`
- Keeper: `GET /health`, `GET /api/state`, `POST /api/tick`
