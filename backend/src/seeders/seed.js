import "dotenv/config";
import bcrypt from "bcryptjs";
import { sequelize } from "../config/database.js";
import { User, Workshop } from "../models/index.js";

try {
  await sequelize.authenticate();
  await sequelize.sync();

  const passwordHash = await bcrypt.hash("Admin@12345", 12);

  await User.findOrCreate({
    where: { email: "admin@workshop.local" },
    defaults: {
      name: "System Admin",
      email: "admin@workshop.local",
      passwordHash,
      role: "ADMIN"
    }
  });

  const workshops = [
    {
      code: "WS001",
      title: "JavaScript Basics",
      instructor: "John Silva",
      startsAt: new Date("2026-10-15T09:00:00+05:30"),
      capacity: 20,
      location: "Colombo"
    },
    {
      code: "WS002",
      title: "Pottery Workshop",
      instructor: "Nimal Perera",
      startsAt: new Date("2026-10-16T10:00:00+05:30"),
      capacity: 15,
      location: "Kandy"
    },
    {
      code: "WS003",
      title: "Fitness Workshop",
      instructor: "Sarah Fernando",
      startsAt: new Date("2026-10-17T08:00:00+05:30"),
      capacity: 10,
      location: "Galle"
    }
  ];

  for (const workshop of workshops) {
    await Workshop.findOrCreate({
      where: { code: workshop.code },
      defaults: workshop
    });
  }

  console.log("Database seeded successfully");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}