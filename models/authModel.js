import db from "../config/db.js";
import bcrypt from "bcryptjs";

/**
 * AuthModel handles queries related to the admin credentials table.
 */
class AuthModel {
    /**
     * Set up the admin table if it does not exist, and seed a default
     * administrator user if the table is currently empty.
     */
    static async initialize() {
        try {
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS admin (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) DEFAULT 'Admin',
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            `;
            await db.query(createTableQuery);

            // Check if any admin users exist
            const [rows] = await db.query("SELECT COUNT(*) AS count FROM admin");
            const adminCount = parseInt(rows[0]?.count || 0, 10);
            if (adminCount === 0) {
                const defaultEmail = "admin@invoice.com";
                const defaultPassword = "adminpassword";
                const hashedPassword = await bcrypt.hash(defaultPassword, 10);

                await db.query("INSERT INTO admin (name, email, password) VALUES (?, ?, ?)", [
                    "Admin",
                    defaultEmail,
                    hashedPassword
                ]);
                console.log("Seeding completed. Default credentials: admin@invoice.com / adminpassword");
            }
        } catch (error) {
            console.error("❌ AuthModel initialization failed:", error.message);
        }
    }

    /**
     * Retrieve an administrator user record by its email coordinate.
     * @param {string} email - Target user email address.
     * @returns {Promise<Object|null>} Decoded user profile or null.
     */
    static async findByEmail(email) {
        // Run lazy initialization check
        await this.initialize();
        const [rows] = await db.query("SELECT * FROM admin WHERE email = ?", [email]);
        return rows[0] || null;
    }
}

export default AuthModel;
