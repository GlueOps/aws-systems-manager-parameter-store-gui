import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import apiRoutes from "./routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API routes
app.use("/api", apiRoutes);

// Serve static files from the built client in production
const clientDistPath = path.join(__dirname, "../client");
app.use(express.static(clientDistPath));

// SPA fallback — serve index.html for any non-API route
app.get("/{*splat}", (_req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`SSM Parameter Store GUI running at http://localhost:${PORT}`);
  console.log(`AWS Region: ${process.env.AWS_REGION || "us-east-1"}`);
});
