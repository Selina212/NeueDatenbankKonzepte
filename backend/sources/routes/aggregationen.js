//Author: Selina Steuer
console.log("Aggregationen geladen!");

import { Router } from "express";
import { ObjectId } from "mongodb";
import db from "../db/mongo.js";

const router = Router();

// Collections
const bewegungen = db.collection("lagerbewegungen");
const produkte = db.collection("produkte");

/* ============================================================
   1) Bewegungen pro Tag
   ============================================================ */
router.get("/pro-tag", async (req, res) => {
  try {
    const result = await bewegungen.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$datum" }
          },
          anzahl: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   2) Anzahl Zugänge vs. Abgänge
   ============================================================ */
router.get("/typ-anzahl", async (req, res) => {
  try {
    const result = await bewegungen.aggregate([
      {
        $group: {
          _id: "$typ",
          anzahl: { $sum: 1 }
        }
      }
    ]).toArray();

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/pro-lagerort", async (req, res) => {
  try {
    const result = await bewegungen.aggregate([
      {
        $addFields: {
          lagerort_id: { $toObjectId: "$lagerort_id" }
        }
      },
      {
        $lookup: {
          from: "lagerorte",
          localField: "lagerort_id",
          foreignField: "_id",
          as: "lagerort"
        }
      },
      { $unwind: "$lagerort" },
      {
        $group: {
          _id: "$lagerort.bezeichnung",
          anzahl: { $sum: 1 }
        }
      },
      { $sort: { anzahl: -1 } }
    ]).toArray();

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   4) Gesamtwert des Lagers
   ============================================================ */
router.get("/lagerwert", async (req, res) => {
  try {
    const result = await produkte.aggregate([
      {
        $project: {
          wert: { $multiply: ["$bestand", "$preis"] }
        }
      },
      {
        $group: {
          _id: null,
          gesamtwert: { $sum: "$wert" }
        }
      }
    ]).toArray();

    res.json(result[0] || { gesamtwert: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/produkte-pro-kategorie", async (req, res) => {
  try {
    const result = await produkte.aggregate([
      {
        $addFields: {
          kategorie_id: { $toObjectId: "$kategorie_id" }
        }
      },
      {
        $lookup: {
          from: "kategorien",
          localField: "kategorie_id",
          foreignField: "_id",
          as: "kategorie"
        }
      },
      { $unwind: "$kategorie" },
      {
        $group: {
          _id: "$kategorie.name",
          anzahl: { $sum: 1 }
        }
      },
      { $sort: { anzahl: -1 } }
    ]).toArray();

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



export default router;
