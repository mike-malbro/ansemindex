# Operator notes — roadmap vs how we build

**Public** = product story (`/roadmap`, whitepaper).  
**Private** = how the bot actually runs (`/manage`, this file).  
Do not put copycat / control language on the homepage.

---

## Two layers

| Layer | Audience | What it is |
|-------|----------|------------|
| **Roadmap** | Public | Index → Flywheel → Launchpad → Network |
| **Operational** | Operators | Bot functions, wallets, tick loop, how you steer it |

---

## Control model (reality)

The keeper is a **copycat of the map / LP wallet holdings**.

- What you hold, seed, and claim in the tracked wallet(s) is the **manual control surface**.
- The bot does not invent a separate portfolio — it **mirrors** open TOKEN–ANSEM positions and fee flow from that book.
- You steer by changing holdings / seeding pools / claiming; the tick follows.

This is intentional. It is **not** marketed as “copy trading.” Internally: *holdings = instructions.*

---

## Bot functions (tick)

Each keeper tick (dry or live):

1. **Read** open DAMM positions on LP / map wallet  
2. **Claim** eligible LP fees (above min)  
3. **Sweep** SOL LP → operator (if configured)  
4. **Route** fee USD: buy+send ANSEM → dest · SOL reserve  
5. **Gate** — while ANSEM stack &lt; 70%: build; at ≥ 70%: buybacks  
6. **Persist** tick + fee events to Postgres (hub ledger)

Signing keys stay on the **private keeper** only. Hub `/manage` shows pubkeys + dry plans.

---

## Wallets

| Role | Env | Signs? |
|------|-----|--------|
| Map / LP | `TRACKED_WALLETS` / `LP_WALLET` | Claims (LP key on keeper) |
| Operator | `OPERATOR_WALLET` | Buy / send |
| ANSEM dest | `ANSEM_DEST_WALLET` | Receives bought ANSEM |

Hub never stores private keys. See [SECURITY.md](./SECURITY.md).

---

## Where to look

- **Ops UI:** `/manage` (not in public footer cycle)  
- **Public product:** `/book`, `/roadmap`, `/whitepaper`  
- **Data contract:** [DATA.md](./DATA.md)

---

## Build order (ops)

1. Keep map wallets accurate (you + Joe) — index truth  
2. Dry ticks on `/manage` until plans look right  
3. Set `ANSEM_DEST_WALLET` when $AI creator fees go live  
4. Flip keeper live only with keys on keeper env — never on hub  
5. Watch fee ledger (`/api/fees`, Creator tab) for sends + ANSEM %
