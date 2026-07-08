import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;
let migratePromise: Promise<void> | null = null;

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool(): pg.Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL required");
    pool = new Pool({
      connectionString: url,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return pool;
}

export async function query<T extends pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const res = await getPool().query<T>(text, params);
  return res.rows;
}

export async function queryOne<T extends pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** Apply migrations/*.sql once (idempotent). Safe to call on every request. */
export async function ensureMigrated(): Promise<void> {
  if (!hasDatabase()) return;
  if (!migratePromise) {
    migratePromise = runMigrations().catch((err) => {
      migratePromise = null;
      throw err;
    });
  }
  await migratePromise;
}

async function runMigrations(): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const dir = join(process.cwd(), "migrations");
    let files: string[] = [];
    try {
      files = readdirSync(dir)
        .filter((f) => f.endsWith(".sql"))
        .sort();
    } catch {
      console.warn("[db] no migrations/ directory at", dir);
      return;
    }

    for (const file of files) {
      const applied = await client.query(
        `SELECT 1 FROM schema_migrations WHERE id = $1`,
        [file],
      );
      if (applied.rowCount) continue;

      const sql = readFileSync(join(dir, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          `INSERT INTO schema_migrations (id) VALUES ($1) ON CONFLICT DO NOTHING`,
          [file],
        );
        await client.query("COMMIT");
        console.info("[db] applied", file);
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      }
    }
  } finally {
    client.release();
  }
}

export type ProjectRow = {
  id: string;
  symbol: string;
  name: string;
  mint: string;
};

export async function getPrimaryProject(): Promise<ProjectRow | null> {
  return queryOne<ProjectRow>(
    `SELECT id, symbol, name, mint FROM projects ORDER BY created_at ASC LIMIT 1`,
  );
}
