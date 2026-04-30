import express from "express";
import cors from "cors";

import db from "./mongo.js"; // Verbindung wird hergestellt

import lagerorteRoutes from "../routes/lagerorte.js";
import bewegungenRoutes from "../routes/bewegungen.js";
import aggregationRoutes from "../routes/aggregationen.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/lagerorte", lagerorteRoutes);
app.use("/api/bewegungen", bewegungenRoutes);
app.use("/api/aggregationen", aggregationRoutes);

app.listen(3000, () => console.log("Server läuft auf Port 3000"));
