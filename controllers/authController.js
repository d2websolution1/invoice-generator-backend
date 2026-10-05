import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import AuthModel from "../models/authModel.js";

/**
 * Handle admin login credentials and issue JWT tokens on verification.
 * Route: POST /api/auth/login
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Inputs validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // 2. Fetch admin user profile
        const admin = await AuthModel.findByEmail(email.trim().toLowerCase());
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // 3. Compare password using bcrypt
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // 4. Generate JWT auth token
        const token = jwt.sign(
            { id: admin.id, email: admin.email },
            process.env.JWT_SECRET || "your_secret",
            { expiresIn: "24h" }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                token,
                admin: {
                    id: admin.id,
                    email: admin.email
                }
            }
        });
    } catch (error) {
        console.error("Error in login controller:", error);
        return res.status(500).json({
            success: false,
            message: "Login request failed due to server error",
            error: error.message
        });
    }
};
