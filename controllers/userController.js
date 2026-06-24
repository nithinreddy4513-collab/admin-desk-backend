import { db } from "../config/firebase.js";
import bcrypt from "bcryptjs";

// CREATE USER
export const createUser = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ error: "Full name, email, password, and role required" });
    }

    const validRoles = ["superadmin", "admin", "agent"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role. Must be: superadmin, admin, or agent" });
    }

    // Check if user already exists
    const existingUser = await db.collection("users").where("email", "==", email).get();
    if (!existingUser.empty) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      fullName,
      email,
      password: hashedPassword,
      role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection("users").add(user);

    res.status(201).json({
      message: "User created successfully",
      id: docRef.id,
      fullName,
      email,
      role,
      isActive: true,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET ALL USERS
export const getUsers = async (req, res) => {
  try {
    const snapshot = await db.collection("users").orderBy("createdAt", "desc").get();

    const users = snapshot.docs.map((doc) => {
      const userData = doc.data();
      // Don't send password to frontend
      delete userData.password;
      return {
        id: doc.id,
        ...userData,
      };
    });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET USER BY ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await db.collection("users").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = doc.data();
    delete userData.password;

    res.status(200).json({
      id: doc.id,
      ...userData,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE USER
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, role } = req.body;

    const userRef = db.collection("users").doc(id);
    const user = await userRef.get();

    if (!user.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const validRoles = ["superadmin", "admin", "agent"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role. Must be: superadmin, admin, or agent" });
    }

    const updateData = {
      ...(fullName && { fullName }),
      ...(email && { email }),
      ...(role && { role }),
      updatedAt: new Date(),
    };

    await userRef.update(updateData);

    res.status(200).json({
      message: "User updated successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DEACTIVATE USER (instead of deleting)
export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const userRef = db.collection("users").doc(id);
    const user = await userRef.get();

    if (!user.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    await userRef.update({
      isActive: false,
      updatedAt: new Date(),
    });

    res.status(200).json({
      message: "User deactivated successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
