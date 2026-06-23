import jwt from "jsonwebtoken";

const ADMIN_USER = {
  email: "admin@worka.com",
  password: "123456",
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email !== ADMIN_USER.email || password !== ADMIN_USER.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { email },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
