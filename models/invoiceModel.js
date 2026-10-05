import db from "../config/db.js";

/**
 * InvoiceModel handles database operations for invoices, line items, and payments.
 * All write operations run inside MySQL transactions.
 */
class InvoiceModel {
    /**
     * Retrieve all invoices for list views.
     * Joins with parties to fetch customer names.
     * @returns {Promise<Array>} List of invoice summaries.
     */
    static async getAll() {
        const query = `
            SELECT 
                i.*, 
                p.party_name,
                p.company_name
            FROM invoices i
            LEFT JOIN parties p ON i.party_id = p.id
            ORDER BY i.created_at DESC
        `;
        const [rows] = await db.query(query);
        return rows;
    }

    /**
     * Retrieve a detailed invoice view by ID.
     * Fetches invoice headers, party coordinates, items list, and payments table.
     * @param {number|string} id - Invoice ID.
     * @returns {Promise<Object|null>} Detailed invoice record or null.
     */
    static async getById(id) {
        // 1. Fetch header details
        const headerQuery = `
            SELECT 
                i.*,
                p.party_name,
                p.company_name,
                p.gst_number AS customer_gstin,
                p.phone AS customer_phone,
                p.email AS customer_email,
                p.address AS customer_address,
                p.state AS customer_state,
                p.pincode AS customer_pincode
            FROM invoices i
            LEFT JOIN parties p ON i.party_id = p.id
            WHERE i.id = ?
        `;
        const [headerRows] = await db.query(headerQuery, [id]);
        const invoice = headerRows[0];
        
        if (!invoice) return null;

        // 2. Fetch invoice line items
        const itemsQuery = `
            SELECT 
                ii.*,
                it.item_name,
                it.unit,
                it.gst_percentage AS catalog_gst_pct,
                it.sku,
                it.hsn_sac,
                it.description
            FROM invoice_items ii
            LEFT JOIN items it ON ii.item_id = it.id
            WHERE ii.invoice_id = ?
        `;
        const [itemsRows] = await db.query(itemsQuery, [id]);
        invoice.items = itemsRows;

        // 3. Fetch invoice payments
        const paymentsQuery = `
            SELECT * FROM invoice_payments 
            WHERE invoice_id = ? 
            ORDER BY created_at DESC
        `;
        const [paymentsRows] = await db.query(paymentsQuery, [id]);
        invoice.payments = paymentsRows;

        // Map received_amount for frontend compatibility if there are payment records
        invoice.received_amount = paymentsRows.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

        return invoice;
    }

    /**
     * Create a new invoice header, line items, and optional initial payment.
     * Run within a MySQL Transaction.
     * @param {Object} invoiceData - Payload representing header + line items.
     * @returns {Promise<number>} New Invoice ID.
     */
    static async create(invoiceData) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const {
                invoice_number,
                invoice_date,
                party_id,
                payment_mode = "Cash",
                subtotal = 0.00,
                discount = 0.00,
                cgst = 0.00,
                sgst = 0.00,
                igst = 0.00,
                round_off = 0.00,
                grand_total = 0.00,
                notes = null,
                terms = null,
                transport_name = null,
                vehicle_number = null,
                eway_bill_no = null,
                shipping_address = null,
                shipping_city = null,
                irn = null,
                ack_no = null,
                items = [],
                received_amount = 0.00
            } = invoiceData;

            // Normalize empty string dates to null to avoid MySQL strict mode errors
            const dueDateVal = invoiceData.due_date ? invoiceData.due_date : null;
            const deliveryDateVal = invoiceData.delivery_date ? invoiceData.delivery_date : null;
            const ackDtVal = invoiceData.ack_dt ? invoiceData.ack_dt : null;
            const resolvedStatus = invoiceData.status || invoiceData.payment_status || "Unpaid";

            // 1. Insert header
            const invoiceQuery = `
                INSERT INTO invoices (
                    invoice_number, invoice_date, due_date, delivery_date, party_id, payment_mode,
                    subtotal, discount, cgst, sgst, igst, round_off, grand_total,
                    notes, terms, transport_name, vehicle_number, eway_bill_no,
                    shipping_address, shipping_city, irn, ack_no, ack_dt, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING id
            `;

            const invoiceValues = [
                invoice_number,
                invoice_date,
                dueDateVal,
                deliveryDateVal,
                party_id,
                payment_mode,
                subtotal,
                discount,
                cgst,
                sgst,
                igst,
                round_off,
                grand_total,
                notes,
                terms,
                transport_name,
                vehicle_number,
                eway_bill_no,
                shipping_address,
                shipping_city,
                irn,
                ack_no,
                ackDtVal,
                resolvedStatus
            ];

            const [invoiceResult] = await connection.query(invoiceQuery, invoiceValues);
            const invoiceId = invoiceResult.insertId;

            // 2. Insert line items
            const itemQuery = `
                INSERT INTO invoice_items (
                    invoice_id, item_id, quantity, unit_price, discount,
                    gst_percentage, gst_amount, total
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING id
            `;

            for (const item of items) {
                const {
                    item_id,
                    qty = 1,
                    price = 0.00,
                    discount_pct = 0.00,
                    gst_pct = 18.00
                } = item;

                const itemQty = parseFloat(qty || 0);
                const itemPrice = parseFloat(price || 0);
                const itemDiscPct = parseFloat(discount_pct || 0);
                const itemGstPct = parseFloat(gst_pct || 0);

                const grossAmount = itemQty * itemPrice;
                const lineDiscount = grossAmount * (itemDiscPct / 100);
                const taxableAmount = grossAmount - lineDiscount;
                const lineGst = taxableAmount * (itemGstPct / 100);
                const total = taxableAmount + lineGst;

                const itemValues = [
                    invoiceId,
                    item_id,
                    itemQty,
                    itemPrice,
                    lineDiscount,
                    itemGstPct,
                    lineGst,
                    total
                ];

                await connection.query(itemQuery, itemValues);
            }

            // 3. Insert payment record if received_amount > 0
            const received = parseFloat(received_amount || 0);
            if (received > 0) {
                const paymentQuery = `
                    INSERT INTO invoice_payments (
                        invoice_id, payment_date, amount, payment_mode, reference_number, remarks
                    ) VALUES (?, ?, ?, ?, ?, ?)
                    RETURNING id
                `;
                const paymentValues = [
                    invoiceId,
                    invoice_date,
                    received,
                    payment_mode,
                    null,
                    "Initial invoice payment"
                ];

                await connection.query(paymentQuery, paymentValues);
            }

            await connection.commit();
            return invoiceId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Update invoice records, line items, and payment receipts.
     * Runs inside a MySQL Transaction.
     * @param {number|string} id - Target invoice ID.
     * @param {Object} invoiceData - Updated invoice attributes.
     * @returns {Promise<boolean>} True if update commits.
     */
    static async update(id, invoiceData) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const {
                invoice_number,
                invoice_date,
                party_id,
                payment_mode = "Cash",
                subtotal = 0.00,
                discount = 0.00,
                cgst = 0.00,
                sgst = 0.00,
                igst = 0.00,
                round_off = 0.00,
                grand_total = 0.00,
                notes = null,
                terms = null,
                transport_name = null,
                vehicle_number = null,
                eway_bill_no = null,
                shipping_address = null,
                shipping_city = null,
                irn = null,
                ack_no = null,
                items = [],
                received_amount = 0.00
            } = invoiceData;

            // Normalize empty string dates to null to avoid MySQL strict mode errors
            const dueDateVal = invoiceData.due_date ? invoiceData.due_date : null;
            const deliveryDateVal = invoiceData.delivery_date ? invoiceData.delivery_date : null;
            const ackDtVal = invoiceData.ack_dt ? invoiceData.ack_dt : null;
            const resolvedStatus = invoiceData.status || invoiceData.payment_status || "Unpaid";

            // 1. Update invoice header columns
            const updateQuery = `
                UPDATE invoices SET
                    invoice_number = ?,
                    invoice_date = ?,
                    due_date = ?,
                    delivery_date = ?,
                    party_id = ?,
                    payment_mode = ?,
                    subtotal = ?,
                    discount = ?,
                    cgst = ?,
                    sgst = ?,
                    igst = ?,
                    round_off = ?,
                    grand_total = ?,
                    notes = ?,
                    terms = ?,
                    transport_name = ?,
                    vehicle_number = ?,
                    eway_bill_no = ?,
                    shipping_address = ?,
                    shipping_city = ?,
                    irn = ?,
                    ack_no = ?,
                    ack_dt = ?,
                    status = ?
                WHERE id = ?
            `;

            const updateValues = [
                invoice_number,
                invoice_date,
                dueDateVal,
                deliveryDateVal,
                party_id,
                payment_mode,
                subtotal,
                discount,
                cgst,
                sgst,
                igst,
                round_off,
                grand_total,
                notes,
                terms,
                transport_name,
                vehicle_number,
                eway_bill_no,
                shipping_address,
                shipping_city,
                irn,
                ack_no,
                ackDtVal,
                resolvedStatus,
                id
            ];

            await connection.query(updateQuery, updateValues);

            // 2. Delete old invoice line items
            await connection.query("DELETE FROM invoice_items WHERE invoice_id = ?", [id]);

            // 3. Re-insert new line items
            const itemQuery = `
                INSERT INTO invoice_items (
                    invoice_id, item_id, quantity, unit_price, discount,
                    gst_percentage, gst_amount, total
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING id
            `;

            for (const item of items) {
                const {
                    item_id,
                    qty = 1,
                    price = 0.00,
                    discount_pct = 0.00,
                    gst_pct = 18.00
                } = item;

                const itemQty = parseFloat(qty || 0);
                const itemPrice = parseFloat(price || 0);
                const itemDiscPct = parseFloat(discount_pct || 0);
                const itemGstPct = parseFloat(gst_pct || 0);

                const grossAmount = itemQty * itemPrice;
                const lineDiscount = grossAmount * (itemDiscPct / 100);
                const taxableAmount = grossAmount - lineDiscount;
                const lineGst = taxableAmount * (itemGstPct / 100);
                const total = taxableAmount + lineGst;

                const itemValues = [
                    id,
                    item_id,
                    itemQty,
                    itemPrice,
                    lineDiscount,
                    itemGstPct,
                    lineGst,
                    total
                ];

                await connection.query(itemQuery, itemValues);
            }

            // 4. Update matching payment row if received_amount is supplied
            const received = parseFloat(received_amount || 0);
            const [existingPayments] = await connection.query("SELECT * FROM invoice_payments WHERE invoice_id = ?", [id]);
            
            if (existingPayments.length > 0) {
                await connection.query("UPDATE invoice_payments SET amount = ?, payment_mode = ? WHERE id = ?", [
                    received,
                    payment_mode,
                    existingPayments[existingPayments.length - 1].id
                ]);
            } else if (received > 0) {
                const paymentQuery = `
                    INSERT INTO invoice_payments (
                        invoice_id, payment_date, amount, payment_mode, reference_number, remarks
                    ) VALUES (?, ?, ?, ?, ?, ?)
                    RETURNING id
                `;
                await connection.query(paymentQuery, [id, invoice_date, received, payment_mode, null, "Updated invoice payment"]);
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Delete an invoice header. Associated line items cascade automatically.
     * @param {number|string} id - Target invoice ID.
     * @returns {Promise<boolean>} True if any rows are deleted.
     */
    static async delete(id) {
        const [result] = await db.query("DELETE FROM invoices WHERE id = ?", [id]);
        return result.affectedRows > 0;
    }
}

export default InvoiceModel;
