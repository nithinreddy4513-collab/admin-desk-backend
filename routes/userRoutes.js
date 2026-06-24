import express from "express";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deactivateUser,
} from "../controllers/userController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔒 PROTECTED ROUTES
router.post("/", verifyToken, createUser);           // Create user
router.get("/", verifyToken, getUsers);              // Get all users
router.get("/:id", verifyToken, getUserById);        // Get user by ID
router.put("/:id", verifyToken, updateUser);         // Update user
router.patch("/:id/deactivate", verifyToken, deactivateUser); // Deactivate user

export default router;
