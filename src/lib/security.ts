/**
 * Public hub security — never accept or store private keys.
 * Postgres holds pubkeys, pool addresses, snapshots, reports only.
 */

const SECRET_KEY_RE =
  /^(private_key|secret|seed|mnemonic|secret_key|treasury_secret|operator_key|keypair|sk)$/i;

const SECRET_VALUE_HINT =
  /\b(private[_\s-]?key|seed\s*phrase|mnemonic|BEGIN\s+PRIVATE)\b/i;

export function assertNoSecrets(
  body: unknown,
  path = "",
): asserts body is Record<string, unknown> | unknown[] | null | undefined {
  if (body == null) return;
  if (typeof body !== "object") return;

  if (Array.isArray(body)) {
    body.forEach((item, i) => assertNoSecrets(item, `${path}[${i}]`));
    return;
  }

  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    const full = path ? `${path}.${key}` : key;
    if (SECRET_KEY_RE.test(key)) {
      throw new Error(
        `Rejected secret field "${full}" — public hub accepts pubkeys only`,
      );
    }
    if (typeof value === "string" && SECRET_VALUE_HINT.test(value)) {
      throw new Error(
        `Rejected secret-looking value at "${full}" — never paste keys here`,
      );
    }
    if (value && typeof value === "object") {
      assertNoSecrets(value, full);
    }
  }
}
