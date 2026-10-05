import express from "express";
import {
    getParties,
    createParty,
    updateParty,
    deleteParty
} from "../controllers/partyController.js";

const router = express.Router();

/**
 * Route: GET /api/party
 * Description: Retrieve list of all customers and suppliers.
 */
router.get("/", getParties);

/**
 * Route: POST /api/party
 * Description: Create a new party profile.
 */
router.post("/", createParty);

/**
 * Route: PUT /api/party/:id
 * Description: Update an existing party profile by its ID.
 */
router.put("/:id", updateParty);

/**
 * Route: DELETE /api/party/:id
 * Description: Delete an existing party profile by its ID.
 */
router.delete("/:id", deleteParty);

export default router;
