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

This is intentional. It is **not** marketed as “copy trading” on the public site. Internally: *your wallet moves = instructions.*

---

## Mirror workflow (the rule)

**Leader** = your map / control wallet.  
**Follower** = creator / bot book (operator-controlled positions).

Every open TOKEN–ANSEM pool on the leader is a row the follower must match **by relative size**, not by copying dollar amounts.

### Actions

| You (leader) | Bot / creator book (follower) |
|--------------|-------------------------------|
| Enter / seed a pool | Enter same pool (proportional size) |
| Add size (+X%) | Add same relative % |
| Trim / sell 90% | Trim / sell **90%** of that position |
| **Zap out** (full exit) | **Zap out** of that pool — full close |
| Re-enter later | Re-enter when you do (same workflow) |

**Zap out = full exit.** If the leader position goes to zero on a pool, the follower must close that pool completely on the next mirror pass. No leftover dust as “policy” — close it.

### Workflow loop (ops)

```text
1. Snapshot leader open positions (pool → size / share)
2. Snapshot follower open positions (same pools)
3. Diff per pool:
     - leader missing / zero  → follower ZAP OUT (full withdraw)
     - leader size Δ%         → follower apply same Δ%
     - leader new pool        → follower enter (sized to policy %)
4. Execute follower txs (dry_run first; live on keeper keys only)
5. Persist events to fee ledger / lp_events
6. Repeat on interval (or on detected leader change)
```

### Fee tick vs mirror tick

| Loop | Job |
|------|-----|
| **Fee tick** | Claim → sweep → buy ANSEM → gate / buybacks |
| **Mirror tick** | Match leader entries / exits / size changes |

Both run under Manual phase. Mirror is how you **control** the book; fee tick is how **$AI creator fees** (when live) buy ANSEM.

### Safety

- Dry-run mirror plans on `/manage` before live.
- Never sign on the public hub — keeper only.
- Cap max withdraw / max enter per pass if needed.
- If RPC / Meteora fails mid-zap, retry until follower is flat on that pool.

---

## Bot functions (fee tick)

Each keeper fee tick (dry or live):

1. **Read** open DAMM positions on LP / map wallet  
2. **Claim** eligible LP fees (above min)  
3. **Sweep** SOL LP → operator (if configured)  
4. **Route** fee USD: buy+send ANSEM → dest · SOL reserve  
5. **Gate** — while ANSEM stack < 70%: build; at ≥ 70%: buybacks  
6. **Persist** tick + fee events to Postgres (hub ledger)

Signing keys stay on the **private keeper** only. Hub `/manage` shows pubkeys + dry plans.

---

## Wallets

| Role | Env | Signs? |
|------|-----|--------|
| Map / LP (leader) | `TRACKED_WALLETS` / `LP_WALLET` | Claims (LP key on keeper) |
| Operator / follower | `OPERATOR_WALLET` | Buy / send / mirror enter-exit |
| ANSEM dest | `ANSEM_DEST_WALLET` | Receives bought ANSEM |

Hub never stores private keys. See [SECURITY.md](./SECURITY.md).

---

## Where to look

- **Ops UI:** `/manage` (not in public footer cycle)  
- **Public product:** `/book`, `/roadmap`, `/whitepaper`  
- **Data contract:** [DATA.md](./DATA.md)

---

## Build order (ops)

1. **Manual** — map wallets accurate; dry fee ticks + dry **mirror** plans (enter / trim / zap)  
2. Set `ANSEM_DEST_WALLET` when $AI creator fees go live  
3. Flip keeper live only with keys on keeper env — never on hub  
4. Watch fee ledger + confirm zap-outs clear follower positions  
5. **ML** — see-microtrader watches DEX for new fee entries; ops review before size  
6. **Continue** — launchpad / nodes; same flywheel; process compounds  
