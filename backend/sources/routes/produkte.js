// Author: Selina Steuer
import { Router } from "express";
import { ObjectId } from "mongodb";
import db from "../db/mongo.js";

const router = Router();
const produkte = db.collection("produkte");

// Alle Produkte
router.get("/", async (req, res) => {
    const data = await produkte.find().toArray();
    res.json(data);
});

// Einzelnes Produkt
router.get("/:id", async (req, res) => {
    const data = await produkte.findOne({ _id: new ObjectId(req.params.id) });
    res.json(data);
});

// Produkt anlegen
router.post("/", async (req, res) => {
    const result = await produkte.insertOne(req.body);
    res.json(result);
});

// Produkt bearbeiten
router.put("/:id", async (req, res) => {
    const result = await produkte.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: req.body }
    );
    res.json(result);
});

// Produkt löschen
router.delete("/:id", async (req, res) => {
    const result = await produkte.deleteOne({ _id: new ObjectId(req.params.id) });
    res.json(result);
});

export default router;
