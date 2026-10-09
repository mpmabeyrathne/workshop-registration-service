import { Router } from "express";
import { Op, literal } from "sequelize";
import { z } from "zod";
import { sequelize } from "../config/database.js";

import {
  Workshop,
  Registration
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

const workshopSchema = z.object({
  code: z.string().trim().min(2),
  title: z.string().trim().min(2),
  instructor: z.string().trim().min(2),
  startsAt: z.iso.datetime({ offset: true }),
  capacity: z.number().int().positive(),
  location: z.string().trim().min(2),
  status: z.enum([
    "SCHEDULED",
    "CANCELLED",
    "COMPLETED"
  ]).optional()
});


router.get("/", async (req, res) => {
  try {
    const querySchema = z.object({
      status: z.enum([
        "SCHEDULED",
        "CANCELLED",
        "COMPLETED"
      ]).optional(),
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
      hasSeats: z.enum(["true", "false"]).optional()
    });

    const parsed = querySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid filters"
      });
    }

    const { status, from, to, hasSeats } = parsed.data;

    if (from && to && from > to) {
      return res.status(400).json({
        message: "Invalid date range"
      });
    }

    const where = {};

    if (status) {
      where.status = status;
    }

    if (from || to) {
      where.startsAt = {};

      if (from) where.startsAt[Op.gte] = from;
      if (to) where.startsAt[Op.lte] = to;
    }

    const workshops = await Workshop.findAll({
      where,
      order: [["startsAt", "ASC"]]
    });

    const results = await Promise.all(
      workshops.map(async (workshop) => {
        const activeCount = await Registration.count({
          where: {
            workshopId: workshop.id,
            status: "ACTIVE"
          }
        });

        return {
          ...workshop.toJSON(),
          registeredCount: activeCount,
          availableSeats: workshop.capacity - activeCount
        };
      })
    );

    const filtered = results.filter((workshop) => {
      if (hasSeats === "true") {
        return workshop.availableSeats > 0;
      }

      if (hasSeats === "false") {
        return workshop.availableSeats === 0;
      }

      return true;
    });

    return res.json(filtered);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Could not load workshops"
    });
  }
});


router.post(
  "/",
  authorize("MANAGER"),
  async (req, res) => {
    const parsed = workshopSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid workshop data",
        errors: parsed.error.flatten()
      });
    }

    try {
      const workshop = await Workshop.create({
        ...parsed.data,
        startsAt: new Date(parsed.data.startsAt)
      });

      return res.status(201).json(workshop);
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({
          message: "Workshop code already exists"
        });
      }

      console.error(error);
      return res.status(500).json({
        message: "Could not create workshop"
      });
    }
  }
);


router.put(
    "/:id",
    authorize("MANAGER"),
    async (req, res) => {
      const parsed = workshopSchema.partial().safeParse(req.body);
  
      if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
        return res.status(400).json({ message: "Invalid workshop data" });
      }
  
      try {
        const updated = await sequelize.transaction(async (transaction) => {
          const workshop = await Workshop.findByPk(req.params.id, {
            transaction,
            lock: transaction.LOCK.UPDATE
          });
  
          if (!workshop) {
            return null;
          }
  
          if (parsed.data.capacity !== undefined) {
            const activeCount = await Registration.count({
              where: {
                workshopId: workshop.id,
                status: "ACTIVE"
              },
              transaction
            });
  
            if (parsed.data.capacity < activeCount) {
              const error = new Error("Capacity below active registrations");
              error.status = 409;
              throw error;
            }
          }
  
          const changes = { ...parsed.data };
  
          if (changes.startsAt) {
            changes.startsAt = new Date(changes.startsAt);
          }
  
          await workshop.update(changes, { transaction });
  
          return workshop;
        });
  
        if (!updated) {
          return res.status(404).json({ message: "Workshop not found" });
        }
  
        return res.json(updated);
      } catch (error) {
        if (error.status === 409) {
          return res.status(409).json({ message: error.message });
        }
  
        if (error.name === "SequelizeUniqueConstraintError") {
          return res.status(409).json({
            message: "Workshop code already exists"
          });
        }
  
        console.error(error);
        return res.status(500).json({ message: "Could not update workshop" });
      }
    }
  );

export default router;