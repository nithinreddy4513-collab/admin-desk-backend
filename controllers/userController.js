import { db } from "../config/firebase.js";
import bcrypt from "bcryptjs";

// CREATE USER
export const createUser = async (req, res) => {
  try {
    const { email, password, role, name } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: "Email, password, and role required" });
    }
hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      fullName: name,
      emailAddress: email,
      password: hashedPassword,
      role,
      employmentStatus: "Active",
      permissions: [],
      createdAt: new Date(),
    };

    const docRef = await db.collection("users").add(user);

    res.status(201).json({
      message: "User created successfully",
      id: docRef.id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET ALL USERS
export const getUsers = async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(users);
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

    res.json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE USER
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, role } = req.body;

    await db.collection("users").doc(id).update({
      email,
      name,
      role,
      updatedAt: new Date(),
    });

    res.json({
      message: "User updated successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CHANGE USER STATUS
export const changeUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["active", "inactive", "suspended"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be: active, inactive, or suspended",
      });
    }

    await db.collection("users").doc(id).update({
      status,
      updatedAt: new Date(),
    });

    res.json({
      message: "User status updated",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
