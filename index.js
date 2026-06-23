import "./config/firebase.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import ticketRoutes from "./routes/ticketRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

console.log("Firebase loaded successfully 🚀");
console.log("Ticket routes imported");

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Admin Desk Backend Running 🚀");
});

// Test logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Test simple route
app.get("/test", (req, res) => {
  res.json({ message: "Test route works" });
});

// � Auth APIs
app.use("/api/auth", authRoutes);
console.log("Auth routes registered");

// 👥 User Management APIs
app.use("/api/users", userRoutes);
console.log("User routes registered");

// 🎫 Ticket APIs
app.use("/api/tickets", ticketRoutes);
console.log("Ticket routes registered");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});