import { Pool } from 'pg';
import { CvDomainError } from '../../domain/shared/app-error';

let pool: Pool | null = null;

/**
 * Create (or reuse) a PostgreSQL connection pool.
 */
export function getPostgresPool(databaseUrl: string): Pool {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000
  });

  pool.on('error', (error) => {
    console.error('PostgreSQL pool error', error);
  });

  return pool;
}

/**
 * Verify the database connection is healthy.
 */
export async function checkDatabaseConnection(databaseUrl: string): Promise<void> {
  const client = await getPostgresPool(databaseUrl).connect();
  try {
    await client.query('SELECT 1');
  } catch (error) {
    throw CvDomainError.storageError(error);
  } finally {
    client.release();
  }
}
