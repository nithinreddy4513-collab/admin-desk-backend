import { db } from "../config/firebase.js";
import { logActivity } from "../helpers/activityLogger.js";

// ADD COMMENT TO TICKET
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim() === "") {
      return res.status(400).json({ error: "Comment cannot be empty" });
    }

    // Verify ticket exists
    const ticketRef = db.collection("tickets").doc(id);
    const ticket = await ticketRef.get();

    if (!ticket.exists) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const commentData = {
      ticketId: id,
      userId: req.user?.userId,
      userName: req.user?.fullName || "Unknown",
      userEmail: req.user?.email || "unknown@example.com",
      comment: comment.trim(),
      createdAt: new Date(),
    };

    const docRef = await db.collection("ticketComments").add(commentData);

    // Log activity
    await logActivity(
      id,
      "comment_added",
      "Comment added",
      req.user?.userId || "system",
      req.user?.fullName || "System"
    );

    res.status(201).json({
      message: "Comment added successfully",
      id: docRef.id,
      ...commentData,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET ALL COMMENTS FOR A TICKET
export const getComments = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ticket exists
    const ticketRef = db.collection("tickets").doc(id);
    const ticket = await ticketRef.get();

    if (!ticket.exists) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const snapshot = await db
      .collection("ticketComments")
      .where("ticketId", "==", id)
      .orderBy("createdAt", "asc")
      .get();

    const comments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE COMMENT (admin only, or comment author)
export const deleteComment = async (req, res) => {
  try {
    const { ticketId, commentId } = req.params;
    const userId = req.user?.userId;

    // Get comment
    const commentRef = db.collection("ticketComments").doc(commentId);
    const comment = await commentRef.get();

    if (!comment.exists) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const commentData = comment.data();

    // Only allow author or superadmin to delete
    if (commentData.userId !== userId && req.user?.role !== "superadmin") {
      return res.status(403).json({ error: "Cannot delete other users' comments" });
    }

    await commentRef.delete();

    res.status(200).json({
      message: "Comment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
