import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  return res.json({ status: "ok" });
});


// Iniciar servidor
app.listen(3333, () => {
  console.log("🚀 Server running on http://localhost:3333");
});