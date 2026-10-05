import db from "./config/db.js";
import bcrypt from "bcryptjs";

/**
 * Script to seed default admin accounts into PostgreSQL.
 * Run using: node seedAdmin.js
 */
const seedAdmin = async () => {
    try {
        const targetEmail = "admin@gmail.com";
        const targetPassword = "admin123";
        const targetName = "Super Admin";
        const saltRounds = 10;

        const [rows] = await db.query("SELECT * FROM admin WHERE email = ?", [targetEmail]);
        if (rows.length > 0) {
            console.log("✅ Admin already exists:", targetEmail);
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(targetPassword, saltRounds);
        await db.query("INSERT INTO admin (name, email, password) VALUES (?, ?, ?)", [
            targetName,
            targetEmail,
            hashedPassword
        ]);

        console.log("=====================================");
        console.log("Admin created successfully in Supabase PostgreSQL");
        console.log("Email:    " + targetEmail);
        console.log("Password: " + targetPassword);
        console.log("=====================================");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding admin credentials failed:", error.message);
        process.exit(1);
    }
};

seedAdmin();
