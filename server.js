import "dotenv/config";
import express from "express";
import cors from "cors";
import db from "./config/db.js";
import companyRoutes from "./routes/companyRoutes.js";
import partyRoutes from "./routes/partyRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";

import authRoutes from "./routes/authRoutes.js";
import authMiddleware from "./middleware/authMiddleware.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

console.log("🚀 Database: Supabase PostgreSQL");
console.log("📡 Connected via:", process.env.DATABASE_URL ? "Supabase Pooler (DATABASE_URL configured)" : "No DB configured");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// Routes (supported with and without /api prefix)
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);

app.use("/api/dashboard", authMiddleware, dashboardRoutes);
app.use("/dashboard", authMiddleware, dashboardRoutes);

app.use("/api/company", authMiddleware, companyRoutes);
app.use("/company", authMiddleware, companyRoutes);

app.use("/api/party", authMiddleware, partyRoutes);
app.use("/party", authMiddleware, partyRoutes);

app.use("/api/item", authMiddleware, itemRoutes);
app.use("/item", authMiddleware, itemRoutes);

app.use("/api/invoice", authMiddleware, invoiceRoutes);
app.use("/invoice", authMiddleware, invoiceRoutes);

// Test Route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Invoice Generator API is running 🚀",
    });
});

// Test Database Connection
app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT 1 + 1 AS result");

        res.status(200).json({
            success: true,
            message: "Database Connected Successfully",
            data: rows,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Database Connection Failed",
            error: error.message,
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});