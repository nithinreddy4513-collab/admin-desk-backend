import { db } from "../config/firebase.js";

// CREATE TICKET
export const createTicket = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description required" });
    }

    const ticket = {
      title,
      description,
      status: "Open",
      createdAt: new Date(),
    };

    const docRef = await db.collection("tickets").add(ticket);

    res.status(201).json({
      message: "Ticket created successfully",
      id: docRef.id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET ALL TICKETS
export const getTickets = async (req, res) => {
  try {
    const snapshot = await db.collection("tickets").get();

    const tickets = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE TICKET STATUS
export const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Open", "In Progress", "Resolved"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be: Open, In Progress, or Resolved",
      });
    }

    await db.collection("tickets").doc(id).update({
      status,
      updatedAt: new Date(),
    });

    res.json({
      message: "Ticket status updated",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE TICKET
export const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const docRef = db.collection("tickets").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        error: "Ticket not found",
      });
    }

    await docRef.delete();

    res.json({
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DASHBOARD ANALYTICS
export const getTicketStats = async (req, res) => {
  try {
    const snapshot = await db.collection("tickets").get();

    let total = 0;
    let open = 0;
    let inProgress = 0;
    let resolved = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      total++;
      if (data.status === "Open") open++;
      else if (data.status === "In Progress") inProgress++;
      else if (data.status === "Resolved") resolved++;
    });

    res.json({
      total,
      open,
      inProgress,
      resolved,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
