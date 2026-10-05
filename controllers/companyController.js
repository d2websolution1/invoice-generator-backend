import CompanyModel from "../models/companyModel.js";

/**
 * Get all companies
 * Route: GET /api/company
 */
export const getCompanies = async (req, res) => {
    try {
        const companies = await CompanyModel.getAll();
        return res.status(200).json({
            success: true,
            message: "Companies retrieved successfully",
            data: companies
        });
    } catch (error) {
        console.error("Error in getCompanies controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve companies",
            error: error.message
        });
    }
};

/**
 * Create a new company (handles multipart/form-data with file fields)
 * Route: POST /api/company
 */
export const createCompany = async (req, res) => {
    try {
        const { company_name } = req.body;

        // Validation: Company name is mandatory
        if (!company_name || company_name.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Company name is required"
            });
        }

        // Initialize companyData with other text fields
        const companyData = { ...req.body };

        // Process uploaded image files and append paths to companyData
        const fileFields = ["logo", "qr_code", "signature", "stamp"];
        for (const field of fileFields) {
            if (req.files?.[field]?.[0]) {
                // Save path using unified forward slash convention
                companyData[field] = `uploads/companies/${req.files[field][0].filename}`;
            } else {
                // If not uploaded, pass null to database for insert
                companyData[field] = null;
            }
        }

        const insertId = await CompanyModel.create(companyData);
        const newCompany = await CompanyModel.getById(insertId);

        return res.status(201).json({
            success: true,
            message: "Company created successfully",
            data: newCompany
        });
    } catch (error) {
        console.error("Error in createCompany controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create company",
            error: error.message
        });
    }
};

/**
 * Update an existing company (handles multipart/form-data with optional file fields)
 * Route: PUT /api/company/:id
 */
export const updateCompany = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if company exists first
        const existingCompany = await CompanyModel.getById(id);
        if (!existingCompany) {
            return res.status(404).json({
                success: false,
                message: "Company not found"
            });
        }

        // Initialize companyData with other text fields from update
        const companyData = { ...req.body };

        // Process uploaded files and handle replacements
        const fileFields = ["logo", "qr_code", "signature", "stamp"];
        for (const field of fileFields) {
            if (req.files?.[field]?.[0]) {
                // Set path if a new image was uploaded
                companyData[field] = `uploads/companies/${req.files[field][0].filename}`;
            } else {
                // If no new image was uploaded, completely remove the field from companyData
                // This ensures companyModel.update ignores the field and keeps the DB value unchanged
                delete companyData[field];
            }
        }

        await CompanyModel.update(id, companyData);
        const updatedCompany = await CompanyModel.getById(id);

        return res.status(200).json({
            success: true,
            message: "Company updated successfully",
            data: updatedCompany
        });
    } catch (error) {
        console.error("Error in updateCompany controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update company",
            error: error.message
        });
    }
};
