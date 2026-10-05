import ItemModel from "../models/itemModel.js";

/**
 * Get all items
 * Route: GET /api/item
 */
export const getItems = async (req, res) => {
    try {
        const items = await ItemModel.getAll();
        return res.status(200).json({
            success: true,
            message: "Items retrieved successfully",
            data: items
        });
    } catch (error) {
        console.error("Error in getItems controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve items",
            error: error.message
        });
    }
};

/**
 * Get a specific item by ID
 * Route: GET /api/item/:id
 */
export const getItemById = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await ItemModel.getById(id);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item not found"
            });
        }
        return res.status(200).json({
            success: true,
            message: "Item retrieved successfully",
            data: item
        });
    } catch (error) {
        console.error("Error in getItemById controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve item",
            error: error.message
        });
    }
};

/**
 * Create a new item
 * Route: POST /api/item
 */
export const createItem = async (req, res) => {
    try {
        const {
            item_type,
            item_name,
            category,
            unit,
            selling_price,
            gst_percentage,
            purchase_price = 0,
            opening_stock = 0,
            minimum_stock = 0
        } = req.body;

        // Required field validations
        if (!item_type || item_type.trim() === "") {
            return res.status(400).json({ success: false, message: "Item type is required" });
        }
        if (!item_name || item_name.trim() === "") {
            return res.status(400).json({ success: false, message: "Item name is required" });
        }
        if (!category || category.trim() === "") {
            return res.status(400).json({ success: false, message: "Category is required" });
        }
        if (!unit || unit.trim() === "") {
            return res.status(400).json({ success: false, message: "Unit is required" });
        }
        if (selling_price === undefined || selling_price === null) {
            return res.status(400).json({ success: false, message: "Selling price is required" });
        }
        if (gst_percentage === undefined || gst_percentage === null || gst_percentage === "" || (typeof gst_percentage === "string" && gst_percentage.trim() === "")) {
            return res.status(400).json({ success: false, message: "GST percentage is required" });
        }

        // Numeric threshold checks
        if (parseFloat(purchase_price) < 0) {
            return res.status(400).json({ success: false, message: "Purchase price must be >= 0" });
        }
        if (parseFloat(selling_price) < 0) {
            return res.status(400).json({ success: false, message: "Selling price must be >= 0" });
        }
        if (parseFloat(opening_stock) < 0) {
            return res.status(400).json({ success: false, message: "Opening stock must be >= 0" });
        }
        if (parseFloat(minimum_stock) < 0) {
            return res.status(400).json({ success: false, message: "Minimum stock must be >= 0" });
        }

        // Sanitize numeric inputs for database types (e.g. "18%" -> 18)
        const cleanGst = typeof gst_percentage === "string"
            ? parseFloat(gst_percentage.replace(/%/g, ""))
            : gst_percentage;

        const itemData = {
            ...req.body,
            gst_percentage: cleanGst,
            purchase_price: parseFloat(purchase_price || 0),
            selling_price: parseFloat(selling_price || 0),
            opening_stock: parseFloat(opening_stock || 0),
            minimum_stock: parseFloat(minimum_stock || 0)
        };

        const insertId = await ItemModel.create(itemData);
        const newItem = await ItemModel.getById(insertId);

        return res.status(201).json({
            success: true,
            message: "Item created successfully",
            data: newItem
        });
    } catch (error) {
        console.error("Error in createItem controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create item",
            error: error.message
        });
    }
};

/**
 * Update an existing item by ID
 * Route: PUT /api/item/:id
 */
export const updateItem = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if item exists first
        const existingItem = await ItemModel.getById(id);
        if (!existingItem) {
            return res.status(404).json({
                success: false,
                message: "Item not found"
            });
        }

        const { purchase_price, selling_price, opening_stock, minimum_stock } = req.body;

        // Numeric threshold checks
        if (purchase_price !== undefined && parseFloat(purchase_price) < 0) {
            return res.status(400).json({ success: false, message: "Purchase price must be >= 0" });
        }
        if (selling_price !== undefined && parseFloat(selling_price) < 0) {
            return res.status(400).json({ success: false, message: "Selling price must be >= 0" });
        }
        if (opening_stock !== undefined && parseFloat(opening_stock) < 0) {
            return res.status(400).json({ success: false, message: "Opening stock must be >= 0" });
        }
        if (minimum_stock !== undefined && parseFloat(minimum_stock) < 0) {
            return res.status(400).json({ success: false, message: "Minimum stock must be >= 0" });
        }

        const itemData = { ...req.body };

        if (req.body.gst_percentage !== undefined) {
            itemData.gst_percentage = typeof req.body.gst_percentage === "string"
                ? parseFloat(req.body.gst_percentage.replace(/%/g, ""))
                : req.body.gst_percentage;
        }
        if (purchase_price !== undefined) itemData.purchase_price = parseFloat(purchase_price);
        if (selling_price !== undefined) itemData.selling_price = parseFloat(selling_price);
        if (opening_stock !== undefined) itemData.opening_stock = parseFloat(opening_stock);
        if (minimum_stock !== undefined) itemData.minimum_stock = parseFloat(minimum_stock);

        await ItemModel.update(id, itemData);
        const updatedItem = await ItemModel.getById(id);

        return res.status(200).json({
            success: true,
            message: "Item updated successfully",
            data: updatedItem
        });
    } catch (error) {
        console.error("Error in updateItem controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update item",
            error: error.message
        });
    }
};

/**
 * Delete an item by ID
 * Route: DELETE /api/item/:id
 */
export const deleteItem = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if item exists first
        const existingItem = await ItemModel.getById(id);
        if (!existingItem) {
            return res.status(404).json({
                success: false,
                message: "Item not found"
            });
        }

        await ItemModel.delete(id);

        return res.status(200).json({
            success: true,
            message: "Item deleted successfully"
        });
    } catch (error) {
        console.error("Error in deleteItem controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete item",
            error: error.message
        });
    }
};
