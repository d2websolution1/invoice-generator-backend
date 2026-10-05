import express from "express";
import { login } from "../controllers/authController.js";

const router = express.Router();

/**
 * Route: POST /api/auth/login
 * Description: Handle admin credentials authentication.
 */
router.post("/login", login);

export default router;
