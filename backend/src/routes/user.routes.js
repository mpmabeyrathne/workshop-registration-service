import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { User } from "../models/index.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

const createUserSchema = z.object({
  name: z.string().trim().min(2),
  email: z.email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "MANAGER", "STAFF"])
});

router.use(authenticate, authorize("ADMIN"));

router.post("/", async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid user data" });
  }

  try {
    const { name, email, password, role } = parsed.data;

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role
    });

    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Email already exists" });
    }

    return res.status(500).json({ message: "Could not create user" });
  }
});

export default router;