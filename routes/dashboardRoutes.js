import express from "express";
import { getDashboardMetrics } from "../controllers/dashboardController.js";

const router = express.Router();

/**
 * Route: GET /api/dashboard
 * Description: Retrieve aggregated counts, sales totals, and recent invoices.
 */
router.get("/", getDashboardMetrics);

export default router;
