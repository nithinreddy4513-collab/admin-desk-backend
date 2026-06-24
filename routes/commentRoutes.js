import express from "express";
import {
  addComment,
  getComments,
  deleteComment,
} from "../controllers/commentController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router({ mergeParams: true });

// POST /api/tickets/:id/comments - Add comment
router.post("/", verifyToken, addComment);

// GET /api/tickets/:id/comments - Get all comments
router.get("/", verifyToken, getComments);

// DELETE /api/tickets/:ticketId/comments/:commentId - Delete comment
router.delete("/:commentId", verifyToken, deleteComment);

export default router;
