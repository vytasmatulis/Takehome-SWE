import "dotenv/config";
import express from "express";
import cors from "cors";
import { initDb } from "./db.js";
import chatsRouter from "./routes/chats.js";

// Validate required env vars
if (!process.env.OPENAI_API_KEY) {
  console.error("ERROR: OPENAI_API_KEY is required in .env file");
  console.error("Copy .env.example to .env and add your API key");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Initialize database
initDb();

// Routes
app.use("/api/chats", chatsRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  },
);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
