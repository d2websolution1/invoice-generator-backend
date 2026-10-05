import db from "../config/db.js";

/**
 * ItemModel handles all database queries related to the items table.
 */
class ItemModel {
    /**
     * Retrieve all item records.
     * @returns {Promise<Array>} List of items.
     */
    static async getAll() {
        const [rows] = await db.query("SELECT * FROM items ORDER BY created_at DESC");
        return rows;
    }

    /**
     * Retrieve a specific item record by its ID.
     * @param {number|string} id - The item ID.
     * @returns {Promise<Object|null>} The item record, or null if not found.
     */
    static async getById(id) {
        const [rows] = await db.query("SELECT * FROM items WHERE id = ?", [id]);
        return rows[0] || null;
    }

    /**
     * Create a new item record.
     * @param {Object} itemData - The item fields.
     * @returns {Promise<number>} The ID of the newly created item.
     */
    static async create(itemData) {
        const {
            item_type,
            item_name,
            category,
            unit,
            hsn_sac = null,
            sku = null,
            barcode = null,
            gst_percentage,
            purchase_price = 0.00,
            selling_price = 0.00,
            opening_stock = 0,
            minimum_stock = 0,
            description = null,
            is_active = 1
        } = itemData;

        const query = `
            INSERT INTO items (
                item_type, item_name, category, unit, hsn_sac, sku, barcode,
                gst_percentage, purchase_price, selling_price, opening_stock,
                minimum_stock, description, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id
        `;

        const values = [
            item_type,
            item_name,
            category,
            unit,
            hsn_sac,
            sku,
            barcode,
            gst_percentage,
            purchase_price,
            selling_price,
            opening_stock,
            minimum_stock,
            description,
            is_active
        ];

        const [result] = await db.query(query, values);
        return result.insertId;
    }

    /**
     * Update an existing item record by its ID.
     * Only updates the fields provided in itemData.
     * @param {number|string} id - The item ID to update.
     * @param {Object} itemData - The updated fields.
     * @returns {Promise<boolean>} True if the item was updated, false otherwise.
     */
    static async update(id, itemData) {
        const fields = [];
        const values = [];

        const allowedFields = [
            "item_type",
            "item_name",
            "category",
            "unit",
            "hsn_sac",
            "sku",
            "barcode",
            "gst_percentage",
            "purchase_price",
            "selling_price",
            "opening_stock",
            "minimum_stock",
            "description",
            "is_active"
        ];

        for (const field of allowedFields) {
            if (itemData[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(itemData[field]);
            }
        }

        if (fields.length === 0) {
            return false;
        }

        values.push(id);
        const query = `UPDATE items SET ${fields.join(", ")} WHERE id = ?`;
        const [result] = await db.query(query, values);
        return result.affectedRows > 0;
    }

    /**
     * Delete an item record by its ID.
     * @param {number|string} id - The item ID to delete.
     * @returns {Promise<boolean>} True if the item was deleted, false otherwise.
     */
    static async delete(id) {
        const [result] = await db.query("DELETE FROM items WHERE id = ?", [id]);
        return result.affectedRows > 0;
    }
}

export default ItemModel;
