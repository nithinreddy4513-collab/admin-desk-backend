import express from "express";
import {
  createTicket,
  getTickets,
  updateTicketStatus,
  deleteTicket,
  getTicketStats,
} from "../controllers/ticketController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔒 PROTECTED ROUTES
router.get("/stats", verifyToken, getTicketStats); // 📊 Analytics endpoint
router.post("/", verifyToken, createTicket);
router.get("/", verifyToken, getTickets);
router.patch("/:id/status", verifyToken, updateTicketStatus);
router.delete("/:id", verifyToken, deleteTicket);

export default router;
