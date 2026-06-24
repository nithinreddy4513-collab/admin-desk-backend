import { db } from "../config/firebase.js";

/**
 * Log activity to ticketActivities collection
 * @param {string} ticketId - The ticket ID
 * @param {string} action - The action type (e.g., "ticket_created", "status_changed", "assigned", "comment_added")
 * @param {string} description - Human-readable description of the activity
 * @param {string} performedById - User ID of who performed the action
 * @param {string} performedBy - User name of who performed the action
 */
export const logActivity = async (ticketId, action, description, performedById, performedBy) => {
  try {
    const activityData = {
      ticketId,
      action,
      description,
      performedById,
      performedBy,
      createdAt: new Date(),
    };

    await db.collection("ticketActivities").add(activityData);
  } catch (error) {
    console.error("Failed to log activity:", error.message);
    // Don't throw - activity logging should not break the main operation
  }
};
