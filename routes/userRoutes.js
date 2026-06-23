import express from "express";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  changeUserStatus,
} from "../controllers/userController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST   /api/users
router.post("/", verifyToken, createUser);

// GET    /api/users
router.get("/", verifyToken, getUsers);

// GET    /api/users/:id
router.get("/:id", verifyToken, getUserById);

// PUT    /api/users/:id
router.put("/:id", verifyToken, updateUser);

// PATCH  /api/users/:id/status
router.patch("/:id/status", verifyToken, changeUserStatus);

export default router;
