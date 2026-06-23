import express from "express";
import { login, registerAdmin } from "../controllers/authController.js";

const router = express.Router();

// Setup route (unprotected) - Create first Super Admin
router.post("/register-admin", registerAdmin);

// Login route
router.post("/login", login);

export default router;
