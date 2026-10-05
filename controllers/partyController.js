import PartyModel from "../models/partyModel.js";

/**
 * Get all parties
 * Route: GET /api/party
 */
export const getParties = async (req, res) => {
    try {
        const parties = await PartyModel.getAll();
        return res.status(200).json({
            success: true,
            message: "Parties retrieved successfully",
            data: parties
        });
    } catch (error) {
        console.error("Error in getParties controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve parties",
            error: error.message
        });
    }
};

/**
 * Create a new party
 * Route: POST /api/party
 */
export const createParty = async (req, res) => {
    try {
        const { party_type, party_name, phone } = req.body;

        // Validation: Required fields
        if (!party_type || party_type.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Party type is required"
            });
        }

        if (!party_name || party_name.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Party name is required"
            });
        }

        if (!phone || phone.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Phone number is required"
            });
        }

        const insertId = await PartyModel.create(req.body);
        const newParty = await PartyModel.getById(insertId);

        return res.status(201).json({
            success: true,
            message: "Party created successfully",
            data: newParty
        });
    } catch (error) {
        console.error("Error in createParty controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create party",
            error: error.message
        });
    }
};

/**
 * Update an existing party by ID
 * Route: PUT /api/party/:id
 */
export const updateParty = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if party profile exists first
        const existingParty = await PartyModel.getById(id);
        if (!existingParty) {
            return res.status(404).json({
                success: false,
                message: "Party not found"
            });
        }

        await PartyModel.update(id, req.body);
        const updatedParty = await PartyModel.getById(id);

        return res.status(200).json({
            success: true,
            message: "Party updated successfully",
            data: updatedParty
        });
    } catch (error) {
        console.error("Error in updateParty controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update party",
            error: error.message
        });
    }
};

/**
 * Delete a party profile by ID
 * Route: DELETE /api/party/:id
 */
export const deleteParty = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if party profile exists first
        const existingParty = await PartyModel.getById(id);
        if (!existingParty) {
            return res.status(404).json({
                success: false,
                message: "Party not found"
            });
        }

        await PartyModel.delete(id);

        return res.status(200).json({
            success: true,
            message: "Party deleted successfully"
        });
    } catch (error) {
        console.error("Error in deleteParty controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete party",
            error: error.message
        });
    }
};
