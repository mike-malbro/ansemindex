import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { config } from './config.js';

function loadKeypairFromSecret(secret, label) {
  if (!secret?.trim()) return null;
  try {
    if (secret.startsWith('[')) {
      return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)));
    }
    return Keypair.fromSecretKey(bs58.decode(secret));
  } catch (e) {
    throw new Error(`invalid ${label}: ${e.message}`);
  }
}

function verifyKeyMatchesPubkey(keypair, expectedPubkey, label) {
  if (!keypair || !expectedPubkey) return { ok: true };
  const actual = keypair.publicKey.toBase58();
  if (actual !== expectedPubkey) {
    return {
      ok: false,
      reason: `${label} pubkey mismatch: key=${actual.slice(0, 8)}… env=${expectedPubkey.slice(0, 8)}…`,
    };
  }
  return { ok: true };
}

export function loadLpKeypair() {
  const kp = loadKeypairFromSecret(config.lpPrivateKey, 'LP_PRIVATE_KEY');
  if (kp && !config.dryRun && !config.simulationMode) {
    const match = verifyKeyMatchesPubkey(kp, config.lpWallet, 'LP');
    if (!match.ok) throw new Error(match.reason);
  }
  return kp;
}

export function loadOperatorKeypair() {
  const kp = loadKeypairFromSecret(config.operatorPrivateKey, 'OPERATOR_PRIVATE_KEY');
  if (kp && !config.dryRun && !config.simulationMode) {
    const match = verifyKeyMatchesPubkey(kp, config.operatorWallet, 'OPERATOR');
    if (!match.ok) throw new Error(match.reason);
  }
  return kp;
}

export function verifyKeysMatchPubkeys() {
  const errors = [];
  const lpKp = loadLpKeypair();
  const opKp = loadOperatorKeypair();
  if (lpKp) {
    const m = verifyKeyMatchesPubkey(lpKp, config.lpWallet, 'LP');
    if (!m.ok) errors.push(m.reason);
  } else if (config.lpPrivateKey) {
    errors.push('LP_PRIVATE_KEY not loaded');
  }
  if (opKp) {
    const m = verifyKeyMatchesPubkey(opKp, config.operatorWallet, 'OPERATOR');
    if (!m.ok) errors.push(m.reason);
  } else if (config.operatorPrivateKey) {
    errors.push('OPERATOR_PRIVATE_KEY not loaded');
  }
  return { ok: errors.length === 0, errors };
}
