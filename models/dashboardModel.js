import db from "../config/db.js";

/**
 * DashboardModel handles database aggregations for dashboard summary metrics.
 */
class DashboardModel {
    /**
     * Retrieve aggregated stats and recent invoice transaction lists.
     * Runs optimized SQL aggregate queries.
     * @returns {Promise<Object>} Object containing counts, sums, and lists.
     */
    static async getSummaryMetrics() {
        // 1. Get total parties count
        const partiesQuery = "SELECT COUNT(*) AS totalparties FROM parties";
        const [partiesRows] = await db.query(partiesQuery);
        const totalParties = parseInt(partiesRows[0]?.totalparties || 0, 10);

        // 2. Get total items count
        const itemsQuery = "SELECT COUNT(*) AS totalitems FROM items";
        const [itemsRows] = await db.query(itemsQuery);
        const totalItems = parseInt(itemsRows[0]?.totalitems || 0, 10);

        // 3. Get total invoices count
        const invoicesQuery = "SELECT COUNT(*) AS totalinvoices FROM invoices";
        const [invoicesRows] = await db.query(invoicesQuery);
        const totalInvoices = parseInt(invoicesRows[0]?.totalinvoices || 0, 10);

        // 4. Get today's sales (PostgreSQL: CURRENT_DATE instead of CURDATE())
        const todayQuery = `
            SELECT COALESCE(SUM(grand_total), 0.00) AS todaysales 
            FROM invoices 
            WHERE DATE(invoice_date) = CURRENT_DATE
        `;
        const [todayRows] = await db.query(todayQuery);
        const todaySales = parseFloat(todayRows[0]?.todaysales || 0);

        // 5. Get current month's sales (PostgreSQL: date_trunc)
        const monthlyQuery = `
            SELECT COALESCE(SUM(grand_total), 0.00) AS monthlysales 
            FROM invoices 
            WHERE EXTRACT(YEAR FROM invoice_date) = EXTRACT(YEAR FROM CURRENT_DATE)
              AND EXTRACT(MONTH FROM invoice_date) = EXTRACT(MONTH FROM CURRENT_DATE)
        `;
        const [monthlyRows] = await db.query(monthlyQuery);
        const monthlySales = parseFloat(monthlyRows[0]?.monthlysales || 0);

        // 6. Get latest 5 invoices ordered by newest first
        const recentInvoicesQuery = `
            SELECT 
                i.id,
                i.invoice_number, 
                i.invoice_date, 
                i.grand_total, 
                i.status,
                p.party_name,
                p.company_name
            FROM invoices i
            LEFT JOIN parties p ON i.party_id = p.id
            ORDER BY i.created_at DESC 
            LIMIT 5
        `;
        const [recentInvoicesRows] = await db.query(recentInvoicesQuery);

        return {
            totalParties,
            totalItems,
            totalInvoices,
            todaySales,
            monthlySales,
            recentInvoices: recentInvoicesRows
        };
    }
}

export default DashboardModel;
