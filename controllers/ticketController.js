import { db } from "../config/firebase.js";
import { logActivity } from "../helpers/activityLogger.js";
import {
  sendTicketAssignedEmail,
  sendTicketReassignedEmail,
  sendTicketResolvedEmail,
} from "../utils/emailService.js";

// CREATE TICKET
export const createTicket = async (req, res) => {
  try {
    const { title, description, priority } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description required" });
    }

    const ticket = {
      title,
      description,
      status: "open",
      priority: priority || "low",
      assignedTo: null,
      createdBy: req.user?.email || "superadmin",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection("tickets").add(ticket);

    // Log activity
    await logActivity(
      docRef.id,
      "ticket_created",
      "Ticket Created",
      req.user?.userId || "system",
      req.user?.fullName || "System"
    );

    res.status(201).json({
      message: "Ticket created successfully",
      id: docRef.id,
      ...ticket,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET ALL TICKETS
export const getTickets = async (req, res) => {
  try {
    const snapshot = await db
      .collection("tickets")
      .orderBy("createdAt", "desc")
      .get();

    const tickets = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET MY TICKETS (logged-in user's assigned tickets)
export const getMyTickets = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const snapshot = await db
      .collection("tickets")
      .where("assignedTo", "==", userId)
      .get();

    const tickets = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => {
        const getTime = (ticket) => {
          if (!ticket.createdAt) return 0;
          if (typeof ticket.createdAt.toMillis === "function") {
            return ticket.createdAt.toMillis();
          }
          if (ticket.createdAt.seconds !== undefined) {
            return ticket.createdAt.seconds * 1000 + (ticket.createdAt.nanoseconds || 0) / 1e6;
          }
          return 0;
        };
        return getTime(b) - getTime(a);
      });

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE TICKET (comprehensive)
export const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, title, description, priority, assignedTo } = req.body;

    const ticketRef = db.collection("tickets").doc(id);
    const ticket = await ticketRef.get();

    if (!ticket.exists) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const ticketData = ticket.data();
    const validStatuses = ["open", "in-progress", "resolved"];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be: open, in-progress, or resolved",
      });
    }

    const updateData = {
      ...(status && { status }),
      ...(title && { title }),
      ...(description && { description }),
      ...(priority && { priority }),
      ...(assignedTo !== undefined && { assignedTo }),
      updatedAt: new Date(),
    };

    await ticketRef.update(updateData);

    // Log activity if status changed
    if (status && status !== ticketData.status) {
      const oldStatus = ticketData.status;
      const description = `Status changed from ${oldStatus} to ${status}`;
      await logActivity(
        id,
        "status_changed",
        description,
        req.user?.userId || "system",
        req.user?.fullName || "System"
      );

      // Send resolved email if status changed to resolved
      if (status === "resolved") {
        try {
          // Get ticket creator's email from the createdBy field
          const creatorEmail = ticketData.createdBy;
          
          // Try to get creator's full name from users collection
          let creatorName = "User";
          try {
            // First, find the user by email
            const usersSnapshot = await db
              .collection("users")
              .where("email", "==", creatorEmail)
              .limit(1)
              .get();

            if (!usersSnapshot.empty) {
              creatorName = usersSnapshot.docs[0].data().fullName || creatorEmail;
            } else {
              creatorName = creatorEmail;
            }
          } catch (err) {
            console.error("Error fetching creator name:", err.message);
          }

          const ticketForEmail = {
            id,
            title: ticketData.title,
            priority: ticketData.priority,
            createdAt: ticketData.createdAt,
          };

          await sendTicketResolvedEmail(
            creatorEmail,
            creatorName,
            ticketForEmail,
            req.user?.fullName || "System"
          );
        } catch (err) {
          console.error("Error sending resolved email:", err.message);
        }
      }
    }

    res.status(200).json({
      message: "Ticket updated successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE TICKET STATUS (backwards compatibility)
export const updateTicketStatus = updateTicket;

// DELETE TICKET
export const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const ticketRef = db.collection("tickets").doc(id);
    const ticket = await ticketRef.get();

    if (!ticket.exists) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    await ticketRef.delete();

    res.status(200).json({
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ASSIGN TICKET TO USER
export const assignTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    // Validate ticket exists
    const ticketRef = db.collection("tickets").doc(id);
    const ticket = await ticketRef.get();

    if (!ticket.exists) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const ticketData = ticket.data();
    const previousAssignee = ticketData.assignedTo;

    // If assignedTo is null, unassign the ticket
    if (assignedTo === null) {
      await ticketRef.update({
        assignedTo: null,
        assignedToName: null,
        updatedAt: new Date(),
      });

      // Log activity
      await logActivity(
        id,
        "unassigned",
        "Ticket unassigned",
        req.user?.userId || "system",
        req.user?.fullName || "System"
      );

      return res.status(200).json({
        message: "Ticket unassigned successfully",
      });
    }

    // Validate user exists
    const userRef = db.collection("users").doc(assignedTo);
    const user = await userRef.get();

    if (!user.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = user.data();

    // Validate user is active
    if (!userData.isActive) {
      return res.status(400).json({ error: "Cannot assign to inactive user" });
    }

    // Validate user role is agent or admin
    const validRoles = ["agent", "admin"];
    if (!validRoles.includes(userData.role)) {
      return res.status(400).json({ error: "Can only assign to agents or admins" });
    }

    // Update ticket with assignment
    await ticketRef.update({
      assignedTo,
      assignedToName: userData.fullName,
      updatedAt: new Date(),
    });

    // Log activity
    await logActivity(
      id,
      "assigned",
      `Assigned to ${userData.fullName}`,
      req.user?.userId || "system",
      req.user?.fullName || "System"
    );

    // Send email notification
    const ticketForEmail = {
      id,
      title: ticketData.title,
      priority: ticketData.priority,
      status: ticketData.status,
      createdAt: ticketData.createdAt,
    };

    if (previousAssignee && previousAssignee !== assignedTo) {
      // Reassignment case - get previous assignee info
      try {
        const previousUserRef = db.collection("users").doc(previousAssignee);
        const previousUserDoc = await previousUserRef.get();
        const previousUserData = previousUserDoc.data();

        await sendTicketReassignedEmail(
          userData.email,
          userData.fullName,
          previousUserData?.fullName || "Unknown",
          ticketForEmail,
          req.user?.fullName || "System"
        );
      } catch (err) {
        console.error("Error sending reassignment email:", err.message);
      }
    } else {
      // New assignment
      await sendTicketAssignedEmail(
        userData.email,
        userData.fullName,
        ticketForEmail,
        req.user?.fullName || "System"
      );
    }

    res.status(200).json({
      message: "Ticket assigned successfully",
      assignedTo,
      assignedToName: userData.fullName,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DASHBOARD ANALYTICS
export const getTicketStats = async (req, res) => {
  try {
    const snapshot = await db.collection("tickets").get();
    const userSnapshot = await db.collection("users").get();

    let totalTickets = 0;
    let openTickets = 0;
    let inProgressTickets = 0;
    let resolvedTickets = 0;
    let assignedTickets = 0;
    let unassignedTickets = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      totalTickets++;
      if (data.status === "open") openTickets++;
      else if (data.status === "in-progress") inProgressTickets++;
      else if (data.status === "resolved") resolvedTickets++;

      if (data.assignedTo) assignedTickets++;
      else unassignedTickets++;
    });

    let totalUsers = 0;
    let activeUsers = 0;

    userSnapshot.forEach((doc) => {
      const data = doc.data();
      totalUsers++;
      if (data.isActive) activeUsers++;
    });

    res.json({
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      assignedTickets,
      unassignedTickets,
      totalUsers,
      activeUsers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET ACTIVITIES FOR A TICKET
export const getActivities = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ticket exists
    const ticketRef = db.collection("tickets").doc(id);
    const ticket = await ticketRef.get();

    if (!ticket.exists) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const snapshot = await db
      .collection("ticketActivities")
      .where("ticketId", "==", id)
      .orderBy("createdAt", "asc")
      .get();

    const activities = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
