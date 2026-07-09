# Operator notes — roadmap vs how we build

**Public** = product story (`/roadmap`, whitepaper).  
**Private** = how the bot actually runs (`/manage`, this file).  
Do not put copycat / control language on the homepage.

---

## Two layers

| Layer | Audience | What it is |
|-------|----------|------------|
| **Roadmap** | Public | Manual → Flywheel → ML watch → Continue |
| **Operational** | Operators | Bot functions, wallets, tick loop, how you steer it |

---

## Control model (reality)

The keeper is a **copycat of the map / LP wallet holdings**.

- What you hold, seed, and claim in the tracked wallet(s) is the **manual control surface**.
- The bot does not invent a separate portfolio — it **mirrors** open TOKEN–ANSEM positions and fee flow from that book.
- You steer by changing holdings / seeding pools / claiming; the tick follows.

### Proportional mirror (critical)

If **you** sell **90%** of a position, the **creator / bot book sells 90%** of that same position (same pool, same relative cut).

| You do | Bot / creator book does |
|--------|-------------------------|
| Open / seed a pool | Mirror into the tracked book |
| Add size | Add proportional size |
| Sell / withdraw 90% | Sell / withdraw 90% |
| Close 100% | Close 100% |

Same idea for adds: your Δ% is the instruction. Not “copy absolute dollars” — **copy the change in weight / size**.

This is intentional. It is **not** marketed as “copy trading” on the public site. Internally: *your wallet moves = instructions.*

**Phase path:** Manual (now) → Flywheel live → **ML / see-microtrader** watches DEX for new fee entries → candidates feed the same process → Continue (launchpad / nodes). Manual override stays available.

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

1. **Manual** — map wallets accurate (you + Joe); dry ticks until plans look right  
2. Set `ANSEM_DEST_WALLET` when $AI creator fees go live  
3. Flip keeper live only with keys on keeper env — never on hub  
4. Watch fee ledger (`/api/fees`, Creator tab) for sends + ANSEM %  
5. **ML** — load see-microtrader (or successor) to monitor DEX for new fee entries; ops review before size  
6. **Continue** — launchpad / nodes; same flywheel; process compounds  
