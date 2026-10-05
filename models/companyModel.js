import db from "../config/db.js";

/**
 * CompanyModel handles all database queries related to the companies table.
 */
class CompanyModel {
    /**
     * Retrieve all company records.
     * @returns {Promise<Array>} List of companies.
     */
    static async getAll() {
        const [rows] = await db.query("SELECT * FROM companies ORDER BY created_at DESC");
        return rows;
    }

    /**
     * Retrieve a specific company record by its ID.
     * @param {number|string} id - The company ID.
     * @returns {Promise<Object|null>} The company record, or null if not found.
     */
    static async getById(id) {
        const [rows] = await db.query("SELECT * FROM companies WHERE id = ?", [id]);
        return rows[0] || null;
    }

    /**
     * Create a new company record.
     * @param {Object} companyData - The company fields.
     * @returns {Promise<number>} The ID of the newly created company.
     */
    static async create(companyData) {
        const {
            company_name,
            gst_number = null,
            phone = null,
            email = null,
            address = null,
            state = null,
            pincode = null,
            bank_name = null,
            account_holder = null,
            account_number = null,
            ifsc_code = null,
            logo = null,
            qr_code = null,
            signature = null,
            stamp = null
        } = companyData;

        const query = `
            INSERT INTO companies (
                company_name, gst_number, phone, email, address, state, pincode,
                bank_name, account_holder, account_number, ifsc_code,
                logo, qr_code, signature, stamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id
        `;

        const values = [
            company_name,
            gst_number,
            phone,
            email,
            address,
            state,
            pincode,
            bank_name,
            account_holder,
            account_number,
            ifsc_code,
            logo,
            qr_code,
            signature,
            stamp
        ];

        const [result] = await db.query(query, values);
        return result.insertId;
    }

    /**
     * Update an existing company record by its ID.
     * Only updates the fields provided in companyData.
     * @param {number|string} id - The company ID to update.
     * @param {Object} companyData - The updated fields.
     * @returns {Promise<boolean>} True if the company was updated, false otherwise.
     */
    static async update(id, companyData) {
        const fields = [];
        const values = [];

        const allowedFields = [
            "company_name",
            "gst_number",
            "phone",
            "email",
            "address",
            "state",
            "pincode",
            "bank_name",
            "account_holder",
            "account_number",
            "ifsc_code",
            "logo",
            "qr_code",
            "signature",
            "stamp"
        ];

        for (const field of allowedFields) {
            if (companyData[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(companyData[field]);
            }
        }

        if (fields.length === 0) {
            return false;
        }

        values.push(id);
        const query = `UPDATE companies SET ${fields.join(", ")} WHERE id = ?`;
        const [result] = await db.query(query, values);
        return result.affectedRows > 0;
    }
}

export default CompanyModel;
