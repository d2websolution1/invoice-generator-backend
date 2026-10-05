import InvoiceModel from "../models/invoiceModel.js";

/**
 * Get all invoices
 * Route: GET /api/invoice
 */
export const getInvoices = async (req, res) => {
    try {
        const invoices = await InvoiceModel.getAll();
        return res.status(200).json({
            success: true,
            message: "Invoices retrieved successfully",
            data: invoices
        });
    } catch (error) {
        console.error("Error in getInvoices controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve invoices",
            error: error.message
        });
    }
};

/**
 * Get detailed invoice by ID
 * Route: GET /api/invoice/:id
 */
export const getInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await InvoiceModel.getById(id);
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }
        return res.status(200).json({
            success: true,
            message: "Invoice retrieved successfully",
            data: invoice
        });
    } catch (error) {
        console.error("Error in getInvoiceById controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve invoice details",
            error: error.message
        });
    }
};

/**
 * Create a new invoice
 * Route: POST /api/invoice
 */
export const createInvoice = async (req, res) => {
    try {
        const { party_id, invoice_date, items } = req.body;

        // Required validations
        if (!party_id) {
            return res.status(400).json({ success: false, message: "Party ID is required" });
        }
        if (!invoice_date) {
            return res.status(400).json({ success: false, message: "Invoice date is required" });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: "At least one invoice item is required" });
        }

        // Validate items details
        for (const item of items) {
            const { item_id } = item;
            const quantity = item.qty !== undefined ? item.qty : item.quantity;
            const unitPrice = item.price !== undefined ? item.price : item.unit_price;

            if (!item_id) {
                return res.status(400).json({ success: false, message: "Item ID is required for all line items" });
            }
            if (quantity === undefined || parseFloat(quantity) <= 0) {
                return res.status(400).json({ success: false, message: "Quantity must be greater than 0" });
            }
            if (unitPrice === undefined || parseFloat(unitPrice) < 0) {
                return res.status(400).json({ success: false, message: "Unit price must be >= 0" });
            }
        }

        const insertId = await InvoiceModel.create(req.body);
        const newInvoice = await InvoiceModel.getById(insertId);

        return res.status(201).json({
            success: true,
            message: "Invoice created successfully",
            data: newInvoice
        });
    } catch (error) {
        console.error("Error in createInvoice controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create invoice",
            error: error.message
        });
    }
};

/**
 * Update an existing invoice by ID
 * Route: PUT /api/invoice/:id
 */
export const updateInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const { party_id, invoice_date, items } = req.body;

        // Check if invoice exists first
        const existingInvoice = await InvoiceModel.getById(id);
        if (!existingInvoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }

        // Field value checks if provided in body
        if (party_id === "") {
            return res.status(400).json({ success: false, message: "Party ID cannot be empty" });
        }
        if (invoice_date === "") {
            return res.status(400).json({ success: false, message: "Invoice date cannot be empty" });
        }
        if (items !== undefined && (!Array.isArray(items) || items.length === 0)) {
            return res.status(400).json({ success: false, message: "At least one invoice item is required" });
        }

        // Validate items details
        if (items) {
            for (const item of items) {
                const { item_id } = item;
                const quantity = item.qty !== undefined ? item.qty : item.quantity;
                const unitPrice = item.price !== undefined ? item.price : item.unit_price;

                if (!item_id) {
                    return res.status(400).json({ success: false, message: "Item ID is required for all line items" });
                }
                if (quantity === undefined || parseFloat(quantity) <= 0) {
                    return res.status(400).json({ success: false, message: "Quantity must be greater than 0" });
                }
                if (unitPrice === undefined || parseFloat(unitPrice) < 0) {
                    return res.status(400).json({ success: false, message: "Unit price must be >= 0" });
                }
            }
        }

        await InvoiceModel.update(id, req.body);
        const updatedInvoice = await InvoiceModel.getById(id);

        return res.status(200).json({
            success: true,
            message: "Invoice updated successfully",
            data: updatedInvoice
        });
    } catch (error) {
        console.error("Error in updateInvoice controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update invoice",
            error: error.message
        });
    }
};

/**
 * Delete an existing invoice by ID
 * Route: DELETE /api/invoice/:id
 */
export const deleteInvoice = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if invoice exists first
        const existingInvoice = await InvoiceModel.getById(id);
        if (!existingInvoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }

        await InvoiceModel.delete(id);

        return res.status(200).json({
            success: true,
            message: "Invoice deleted successfully"
        });
    } catch (error) {
        console.error("Error in deleteInvoice controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete invoice",
            error: error.message
        });
    }
};
