import jwt from "jsonwebtoken";

/**
 * Express middleware to authenticate and authorize requests using JWT.
 * Verifies Authorization header formatted as: Bearer <token>
 */
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is missing or invalid"
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_secret");

        // Attach parsed admin credentials to request object
        req.admin = {
            id: decoded.id,
            email: decoded.email
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Authentication failed: Token is invalid or expired",
            error: error.message
        });
    }
};

export default authMiddleware;
