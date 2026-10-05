import pg from "pg";
import dotenv from "dotenv";
import { initializeDatabase } from "./initDb.js";

dotenv.config();

// Initialize tables on startup
await initializeDatabase();

/**
 * PostgreSQL connection pool (Supabase).
 * Uses DATABASE_URL from .env with SSL required for Supabase.
 */
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
});

try {
    const client = await pool.connect();
    console.log("✅ PostgreSQL Connected Successfully to Supabase");
    client.release();
} catch (error) {
    console.error("❌ PostgreSQL Connection Error:", error.message);
}

/**
 * Wrapper that mimics the mysql2 interface used throughout the codebase:
 *   const [rows] = await db.query(sql, params)
 *   const [result] = await db.query(sql, params)  — for INSERT/UPDATE/DELETE
 *
 * For SELECT  → returns [ rows[], {} ]
 * For INSERT with RETURNING id → returns [ { insertId }, {} ]
 * For UPDATE/DELETE → returns [ { affectedRows }, {} ]
 */
const db = {
    /**
     * Execute a query on the pool.
     * Returns [rows/result, {}] to match mysql2 destructuring patterns.
     */
    async query(sql, params = []) {
        // Convert mysql2 ? placeholders to PostgreSQL $1, $2 … 
        let pgSql = sql;
        let i = 0;
        pgSql = pgSql.replace(/\?/g, () => `$${++i}`);

        const result = await pool.query(pgSql, params);

        // If the query uses RETURNING id, expose insertId
        if (result.rows && result.rows[0]?.id !== undefined && result.command === "INSERT") {
            return [{ insertId: result.rows[0].id, affectedRows: result.rowCount }, {}];
        }

        if (result.command === "INSERT" || result.command === "UPDATE" || result.command === "DELETE") {
            return [{ affectedRows: result.rowCount, insertId: result.rows?.[0]?.id }, {}];
        }

        // SELECT — return rows directly
        return [result.rows, {}];
    },

    /**
     * Get a client from the pool for transaction support.
     * The returned client has beginTransaction / commit / rollback helpers
     * and a query() method with the same ? → $N conversion.
     */
    async getConnection() {
        const client = await pool.connect();

        const wrappedClient = {
            async beginTransaction() {
                await client.query("BEGIN");
            },
            async commit() {
                await client.query("COMMIT");
            },
            async rollback() {
                await client.query("ROLLBACK");
            },
            async query(sql, params = []) {
                let pgSql = sql;
                let i = 0;
                pgSql = pgSql.replace(/\?/g, () => `$${++i}`);

                const result = await client.query(pgSql, params);

                if (result.rows && result.rows[0]?.id !== undefined && result.command === "INSERT") {
                    return [{ insertId: result.rows[0].id, affectedRows: result.rowCount }, {}];
                }
                if (result.command === "INSERT" || result.command === "UPDATE" || result.command === "DELETE") {
                    return [{ affectedRows: result.rowCount, insertId: result.rows?.[0]?.id }, {}];
                }
                return [result.rows, {}];
            },
            release() {
                client.release();
            }
        };

        return wrappedClient;
    }
};

export default db;