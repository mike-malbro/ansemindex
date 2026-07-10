# Security — ansem-node

Same boundary as the public hub ([SECURITY.md](https://github.com/mike-malbro/ansemindex/blob/main/SECURITY.md)):

1. **This process may hold keys.** The public hub must not.
2. **Never commit** `cell_secrets.env`, `.env`, or key material.
3. **Never POST keys** to `/api/public`, `/api/index`, or any hub route.
4. **Doctor before live** — `pnpm doctor` must be clean; several `pnpm dry` ticks OK.
5. **Influence ≠ custody** — Mike’s LP pubkey is a reference. Do not import his private key.

## Checklist

- [ ] `LP_WALLET` / `OPERATOR_WALLET` / `ANSEM_DEST_WALLET` are *your* pubkeys
- [ ] Keys only in Railway secrets or local `cell_secrets.env` (chmod 600)
- [ ] `DRY_RUN=true` until go-live
- [ ] Hub `INDEX_API_URL` is HTTPS public API (read-only)
- [ ] No secrets in `cell.json` (pubkeys + routes only)
