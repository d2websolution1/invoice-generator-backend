import DashboardModel from "../models/dashboardModel.js";

/**
 * Get dashboard aggregate statistics and recent invoice transactions list.
 * Route: GET /api/dashboard
 */
export const getDashboardMetrics = async (req, res) => {
    try {
        const metrics = await DashboardModel.getSummaryMetrics();
        return res.status(200).json({
            success: true,
            message: "Dashboard metrics retrieved successfully",
            data: metrics
        });
    } catch (error) {
        console.error("Error in getDashboardMetrics controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load dashboard metrics due to database error",
            error: error.message
        });
    }
};
