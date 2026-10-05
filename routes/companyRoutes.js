import express from "express";
import {
    getCompanies,
    createCompany,
    updateCompany
} from "../controllers/companyController.js";
import upload from "../middleware/multer/companyUpload.js";

const router = express.Router();

// Middleware wrapper to parse company upload fields and handle upload validation errors gracefully
const companyUploads = (req, res, next) => {
    upload.fields([
        { name: "logo", maxCount: 1 },
        { name: "qr_code", maxCount: 1 },
        { name: "signature", maxCount: 1 },
        { name: "stamp", maxCount: 1 }
    ])(req, res, (err) => {
        if (err) {
            // Catches invalid file types (fileFilter) and size limit errors (limits)
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        next();
    });
};

/**
 * Route: GET /api/company
 * Description: Retrieve list of all companies.
 */
router.get("/", getCompanies);

/**
 * Route: POST /api/company
 * Description: Create a new company profile.
 */
router.post("/", companyUploads, createCompany);

/**
 * Route: PUT /api/company/:id
 * Description: Update an existing company profile by its ID.
 */
router.put("/:id", companyUploads, updateCompany);

export default router;
