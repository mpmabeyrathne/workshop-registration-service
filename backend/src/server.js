import "dotenv/config";
import app from "./app.js";
import { sequelize } from "./config/database.js";
import "./models/index.js";

const PORT = Number(process.env.PORT) || 5000;

try {
  await sequelize.authenticate();
  console.log("Database connected");

  app.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`);
  });
} catch (error) {
  console.error("Database connection failed", error);
  process.exit(1);
}