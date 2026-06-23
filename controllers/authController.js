import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "../config/firebase.js";

// REGISTER SUPER ADMIN (One-time setup route)
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email, and password required",
      });
    }

    // Check if user already exists
    const existingUser = await db
      .collection("users")
      .where("emailAddress", "==", email)
      .limit(1)
      .get();

    if (!existingUser.empty) {
      return res.status(409).json({
        error: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const user = {
      fullName: name,
      emailAddress: email,
      password: hashedPassword,
      role: "superadmin",
      employmentStatus: "Active",
      permissions: ["manage_users", "manage_tickets", "manage_settings"],
      createdAt: new Date(),
    };

    const docRef = await db.collection("users").add(user);

    res.status(201).json({
      message: "Super Admin created successfully",
      id: docRef.id,
      email,
      role: "superadmin",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const snapshot = await db
      .collection("users")
      .where("emailAddress", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    // Check if user is active
    if (user.employmentStatus !== "Active") {
      return res.status(403).json({
        error: "User account is inactive",
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        userId: userDoc.id,
        email: user.emailAddress,
        role: user.role,
        fullName: user.fullName,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      fullName: user.fullName,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};
