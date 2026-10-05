import db from "../config/db.js";

/**
 * PartyModel handles all database queries related to the parties table.
 */
class PartyModel {
    /**
     * Retrieve all party records.
     * @returns {Promise<Array>} List of parties.
     */
    static async getAll() {
        const [rows] = await db.query("SELECT * FROM parties ORDER BY created_at DESC");
        return rows;
    }

    /**
     * Retrieve a specific party record by its ID.
     * @param {number|string} id - The party ID.
     * @returns {Promise<Object|null>} The party record, or null if not found.
     */
    static async getById(id) {
        const [rows] = await db.query("SELECT * FROM parties WHERE id = ?", [id]);
        return rows[0] || null;
    }

    /**
     * Create a new party record.
     * @param {Object} partyData - The party fields.
     * @returns {Promise<number>} The ID of the newly created party.
     */
    static async create(partyData) {
        const {
            party_type,
            party_name,
            company_name = null,
            gst_number = null,
            phone,
            alternate_phone = null,
            email = null,
            address = null,
            city = null,
            state = null,
            pincode = null,
            opening_balance = 0.00,
            credit_limit = 0.00,
            is_active = 1
        } = partyData;

        const query = `
            INSERT INTO parties (
                party_type, party_name, company_name, gst_number, phone, alternate_phone,
                email, address, city, state, pincode, opening_balance, credit_limit, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id
        `;

        const values = [
            party_type,
            party_name,
            company_name,
            gst_number,
            phone,
            alternate_phone,
            email,
            address,
            city,
            state,
            pincode,
            opening_balance,
            credit_limit,
            is_active
        ];

        const [result] = await db.query(query, values);
        return result.insertId;
    }

    /**
     * Update an existing party record by its ID.
     * Only updates the fields provided in partyData.
     * @param {number|string} id - The party ID to update.
     * @param {Object} partyData - The updated fields.
     * @returns {Promise<boolean>} True if the party was updated, false otherwise.
     */
    static async update(id, partyData) {
        const fields = [];
        const values = [];

        const allowedFields = [
            "party_type",
            "party_name",
            "company_name",
            "gst_number",
            "phone",
            "alternate_phone",
            "email",
            "address",
            "city",
            "state",
            "pincode",
            "opening_balance",
            "credit_limit",
            "is_active"
        ];

        for (const field of allowedFields) {
            if (partyData[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(partyData[field]);
            }
        }

        if (fields.length === 0) {
            return false;
        }

        values.push(id);
        const query = `UPDATE parties SET ${fields.join(", ")} WHERE id = ?`;
        const [result] = await db.query(query, values);
        return result.affectedRows > 0;
    }

    /**
     * Delete a party record by its ID.
     * @param {number|string} id - The party ID to delete.
     * @returns {Promise<boolean>} True if the party was deleted, false otherwise.
     */
    static async delete(id) {
        const [result] = await db.query("DELETE FROM parties WHERE id = ?", [id]);
        return result.affectedRows > 0;
    }
}

export default PartyModel;
