import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL!, // connection string for the PostgreSQL database (duh)
    max: 20, // maximum number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 2000, // how long to wait for a connection to be established before timing out
});
export const db = drizzle(pool);
