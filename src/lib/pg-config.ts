import type { PoolConfig } from "pg";

// Connection params that pg reads from the URL and that would override `ssl` below.
const SSL_URL_PARAMS = ["sslmode", "sslrootcert", "sslcert", "sslkey", "uselibpqcompat"];

/**
 * pg config from DATABASE_URL (+ optional DATABASE_CA_CERT).
 *
 * - Fails loudly on a value that isn't a postgres:// URL. pg otherwise falls back to
 *   host "base" and the error reads "Can't reach database server at base".
 * - Managed providers like Aiven sign their server cert with their own CA. Put that CA
 *   (PEM text) in DATABASE_CA_CERT to get a verified TLS connection.
 */
export function pgConfig(): PoolConfig {
  const raw = process.env.DATABASE_URL?.trim().replace(/^(['"])(.*)\1$/, "$2");
  if (!raw) throw new Error("DATABASE_URL is not set");

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("DATABASE_URL is not a valid URL. Expected postgres://user:password@host:port/db");
  }
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error(`DATABASE_URL must start with postgres:// (got "${url.protocol}//")`);
  }

  const ca = process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n").trim();
  if (!ca) return { connectionString: url.toString() };

  for (const p of SSL_URL_PARAMS) url.searchParams.delete(p);
  return { connectionString: url.toString(), ssl: { ca, rejectUnauthorized: true } };
}
