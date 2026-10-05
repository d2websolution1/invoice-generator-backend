import db from "./config/db.js";
import bcrypt from "bcryptjs";

/**
 * Script to FORCE RESET the password for a given admin email.
 * Run using: node resetAdminPassword.js
 */
const resetAdminPassword = async () => {
    try {
        const targetEmail = "admin@gmail.com";
        const newPassword = "admin123";
        const saltRounds = 10;

        // 1. Generate a fresh bcrypt hash
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // 2. Check if the user exists
        const [rows] = await db.query("SELECT * FROM admin WHERE email = ?", [targetEmail]);

        if (rows.length === 0) {
            console.log("❌ No admin found with email:", targetEmail);
            process.exit(1);
        }

        // 3. Force update the password
        await db.query("UPDATE admin SET password = ? WHERE email = ?", [hashedPassword, targetEmail]);

        console.log("✅ Password reset successful for:", targetEmail);
        console.log("👉 New login credentials:");
        console.log("   Email:", targetEmail);
        console.log("   Password:", newPassword);

        process.exit(0);
    } catch (error) {
        console.error("❌ Error resetting password:", error.message);
        process.exit(1);
    }
};

resetAdminPassword();