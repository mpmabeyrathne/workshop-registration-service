import { Router } from "express";
import { z } from "zod";

import { sequelize } from "../config/database.js";
import {
    Workshop,
    Registration,
    User
  } from "../models/index.js";

import {
  authenticate,
  authorize
} from "../middleware/auth.js";

const router = Router();

router.use(
  authenticate,
  authorize("MANAGER", "STAFF")
);

const registrationSchema = z.object({
  attendeeName: z.string().trim().min(2),
  attendeeEmail: z.email()
});

// POST /api/workshops/:id/registrations
router.post("/workshops/:id/registrations", async (req, res) => {
  const parsed = registrationSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid attendee data"
    });
  }

  try {
    const registration = await sequelize.transaction(
      async (transaction) => {

        // Lock workshop row to serialize registrations.
        const workshop = await Workshop.findByPk(
          req.params.id,
          {
            transaction,
            lock: transaction.LOCK.UPDATE
          }
        );

        if (!workshop) {
          const error = new Error("Workshop not found");
          error.status = 404;
          throw error;
        }

        if (workshop.status !== "SCHEDULED") {
          const error = new Error(
            "Workshop is not open for registration"
          );
          error.status = 409;
          throw error;
        }

        const activeCount = await Registration.count({
          where: {
            workshopId: workshop.id,
            status: "ACTIVE"
          },
          transaction
        });

        if (activeCount >= workshop.capacity) {
          const error = new Error("Workshop is full");
          error.status = 409;
          throw error;
        }

        return Registration.create(
          {
            workshopId: workshop.id,
            attendeeName: parsed.data.attendeeName,
            attendeeEmail: parsed.data.attendeeEmail,
            status: "ACTIVE",
            registeredBy: req.user.id,
            registeredAt: new Date()
          },
          { transaction }
        );
      }
    );

    return res.status(201).json({
      message: "Registration successful",
      registration
    });

  } catch (error) {
    console.error(error);

    return res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : "Could not register attendee"
    });
  }
});

// GET /api/workshops/:id/registrations
router.get("/workshops/:id/registrations", async (req, res) => {
  try {
    const workshop = await Workshop.findByPk(req.params.id);

    if (!workshop) {
      return res.status(404).json({
        message: "Workshop not found"
      });
    }

    const registrations = await Registration.findAll({
        where: { workshopId: workshop.id },
        include: [
          {
            model: User,
            as: "registeredByUser",
            attributes: ["id", "name", "email"]
          },
          {
            model: User,
            as: "cancelledByUser",
            attributes: ["id", "name", "email"]
          }
        ],
        order: [["registeredAt", "DESC"]]
      });

    return res.json(registrations);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Could not load registrations"
    });
  }
});

// PATCH /api/registrations/:id/cancel
router.patch("/registrations/:id/cancel", async (req, res) => {
  try {
    const registration = await sequelize.transaction(
      async (transaction) => {

        // First read the workshopId to establish lock order.
        const existing = await Registration.findByPk(req.params.id, {
          attributes: ["workshopId"],
          transaction
        });

        if (!existing) {
          const error = new Error("Registration not found");
          error.status = 404;
          throw error;
        }

        // Lock workshop first, as registration creation does.
        await Workshop.findByPk(existing.workshopId, {
          transaction,
          lock: transaction.LOCK.UPDATE
        });

        const record = await Registration.findByPk(req.params.id, {
          transaction,
          lock: transaction.LOCK.UPDATE
        });

        if (!record) {
          const error = new Error("Registration not found");
          error.status = 404;
          throw error;
        }

        if (record.status === "CANCELLED") {
          const error = new Error("Already cancelled");
          error.status = 409;
          throw error;
        }

        await record.update(
          {
            status: "CANCELLED",
            cancelledBy: req.user.id,
            cancelledAt: new Date()
          },
          { transaction }
        );

        return record;
      }
    );

    return res.json({
      message: "Registration cancelled",
      registration
    });

  } catch (error) {
    console.error(error);

    return res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : "Could not cancel registration"
    });
  }
});

export default router;