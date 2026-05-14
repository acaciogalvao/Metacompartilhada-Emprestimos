import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import goalRoutes from "./routes/goalRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import { migrateGoalsCollection } from "./lib/migrate.js";
import path from "path";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Rotas de metas (suporte singular e plural)
app.use("/api/goals", goalRoutes);
app.use("/api/goal", goalRoutes);

// Rotas de pagamento
app.use("/api", paymentRoutes);

async function start() {
  await connectDB();
  await migrateGoalsCollection();

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });

  process.on("SIGTERM", () => server.close(() => process.exit(0)));
  process.on("SIGINT", () => server.close(() => process.exit(0)));
}

start();
