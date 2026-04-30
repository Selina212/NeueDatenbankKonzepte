import { Router } from "express";
import { ObjectId } from "mongodb";
import db from "../db/mongo.js";

const router = Router();
const collection = db.collection("lagerorte");

// Alle Lagerorte
router.get("/", async (req, res) => {
  const data = await collection.find().toArray();
  res.json(data);
});

// Einzelnen Lagerort
router.get("/:id", async (req, res) => {
  const data = await collection.findOne({ _id: new ObjectId(req.params.id) });
  res.json(data);
});

// Lagerort anlegen
router.post("/", async (req, res) => {
  const result = await collection.insertOne(req.body);
  res.json(result);
});

// Lagerort bearbeiten
router.put("/:id", async (req, res) => {
  const result = await collection.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: req.body }
  );
  res.json(result);
});

// Lagerort löschen
router.delete("/:id", async (req, res) => {
  const result = await collection.deleteOne({ _id: new ObjectId(req.params.id) });
  res.json(result);
});

export default router;
