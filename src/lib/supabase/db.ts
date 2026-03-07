import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

let pool: Pool | null = null;

function getRequiredDbUrl(): string {
  const url = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "Missing required environment variable: SUPABASE_DB_URL (or DATABASE_URL)."
    );
  }

  return url;
}

export function getSupabaseDbPool(): Pool {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    connectionString: getRequiredDbUrl(),
    ssl: {
      rejectUnauthorized: false
    },
    max: 5
  });

  return pool;
}

export async function queryDb<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  const db = getSupabaseDbPool();
  return db.query<T>(text, params);
}

export async function withDbClient<T>(
  operation: (client: PoolClient) => Promise<T>
): Promise<T> {
  const db = getSupabaseDbPool();
  const client = await db.connect();

  try {
    return await operation(client);
  } finally {
    client.release();
  }
}
