import express from "express";
import {
    getInvoices,
    getInvoiceById,
    createInvoice,
    updateInvoice,
    deleteInvoice
} from "../controllers/invoiceController.js";

const router = express.Router();

/**
 * Route: GET /api/invoice
 * Description: Retrieve list of all invoices with party coordinates.
 */
router.get("/", getInvoices);

/**
 * Route: GET /api/invoice/:id
 * Description: Retrieve detailed invoice attributes by its ID.
 */
router.get("/:id", getInvoiceById);

/**
 * Route: POST /api/invoice
 * Description: Create a new invoice with line items and initial payments.
 */
router.post("/", createInvoice);

/**
 * Route: PUT /api/invoice/:id
 * Description: Update an existing invoice header and replace line items.
 */
router.put("/:id", updateInvoice);

/**
 * Route: DELETE /api/invoice/:id
 * Description: Delete an existing invoice record by its ID.
 */
router.delete("/:id", deleteInvoice);

export default router;
