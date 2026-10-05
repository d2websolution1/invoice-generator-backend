import express from "express";
import {
    getItems,
    getItemById,
    createItem,
    updateItem,
    deleteItem
} from "../controllers/itemController.js";

const router = express.Router();

/**
 * Route: GET /api/item
 * Description: Retrieve list of all inventory items (products and services).
 */
router.get("/", getItems);

/**
 * Route: GET /api/item/:id
 * Description: Retrieve specific item details by its ID.
 */
router.get("/:id", getItemById);

/**
 * Route: POST /api/item
 * Description: Create a new inventory item.
 */
router.post("/", createItem);

/**
 * Route: PUT /api/item/:id
 * Description: Update an existing inventory item by its ID.
 */
router.put("/:id", updateItem);

/**
 * Route: DELETE /api/item/:id
 * Description: Delete an existing inventory item by its ID.
 */
router.delete("/:id", deleteItem);

export default router;
