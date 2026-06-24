import express from "express";
import {
  createTicket,
  getTickets,
  getMyTickets,
  updateTicket,
  updateTicketStatus,
  deleteTicket,
  assignTicket,
  getTicketStats,
  getActivities,
} from "../controllers/ticketController.js";
import commentRoutes from "./commentRoutes.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔒 PROTECTED ROUTES
router.get("/stats", verifyToken, getTicketStats); // 📊 Analytics endpoint
router.get("/my", verifyToken, getMyTickets); // My tickets (must come before /:id)
router.post("/", verifyToken, createTicket); // Create ticket
router.get("/", verifyToken, getTickets); // List all tickets

// Specific subroutes with :id (must come before generic /:id routes)
router.patch("/:id/status", verifyToken, updateTicketStatus); // Status only (backward compat)
router.patch("/:id/assign", verifyToken, assignTicket); // Assign ticket to user
router.get("/:id/activities", verifyToken, getActivities); // Get activities timeline

// 💬 Comment routes: /api/tickets/:id/comments
router.use("/:id/comments", commentRoutes);

// Generic :id routes (must come last)
router.put("/:id", verifyToken, updateTicket); // Comprehensive update
router.delete("/:id", verifyToken, deleteTicket); // Delete ticket

export default router;
