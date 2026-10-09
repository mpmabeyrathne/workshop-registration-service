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

// GET /api/users - Admin only
router.get("/", async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: [
                "id",
                "name",
                "email",
                "role",
                "createdAt",
            ],
            order: [["id", "ASC"]],
        });

        return res.json(users);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Could not load users",
        });
    }
});

router.patch("/:id/role", async (req, res) => {
    const schema = z.object({
        role: z.enum(["ADMIN", "MANAGER", "STAFF"]),
    });

    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            message: "Invalid role",
        });
    }

    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        if (
            user.id === req.user.id &&
            parsed.data.role !== "ADMIN"
        ) {
            return res.status(409).json({
                message: "You cannot change your own Admin role",
            });
        }

        await user.update({ role: parsed.data.role });

        return res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Could not update user role",
        });
    }
});

export default router;