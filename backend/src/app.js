import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import workshopRoutes from "./routes/workshop.routes.js";
import registrationRoutes from "./routes/registration.routes.js";

const app = express();

app.use(cors({
    origin: "http://localhost:5173"
  }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/workshops", workshopRoutes);
app.use("/api", registrationRoutes);

export default app;