import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "../config/firebase.js";

const findUserByEmail = async (email) => {
  let snapshot = await db.collection("users").where("email", "==", email).limit(1).get();
  if (!snapshot.empty) return snapshot.docs[0];

  snapshot = await db.collection("users").where("emailAddress", "==", email).limit(1).get();
  if (!snapshot.empty) return snapshot.docs[0];

  return null;
};

// REGISTER SUPER ADMIN (One-time setup route)
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email, and password required",
      });
    }

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({
        error: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      fullName: name,
      email,
      emailAddress: email,
      password: hashedPassword,
      role: "superadmin",
      isActive: true,
      employmentStatus: "Active",
      permissions: ["manage_users", "manage_tickets", "manage_settings"],
      createdAt: new Date(),
      updatedAt: new Date(),
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

    const userDoc = await findUserByEmail(email);

    if (!userDoc) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const user = userDoc.data();

    const isActive = user.isActive !== undefined ? user.isActive : user.employmentStatus === "Active";
    if (!isActive) {
      return res.status(403).json({
        error: "User account is inactive",
      });
    }

    console.log("LOGIN V2 - DEPLOY TEST");
    console.log("LOGIN EMAIL:", email);
    if (userDoc) {
      const user = userDoc.data();
      console.log("USER FOUND:", {
        email: user.email,
        emailAddress: user.emailAddress,
        role: user.role,
        hasPassword: !!user.password,
        passwordLength: user.password?.length,
        isActive: user.isActive,
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        userId: userDoc.id,
        email: user.email || user.emailAddress,
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
