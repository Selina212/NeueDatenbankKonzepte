// Author: Selina Steuer
console.log("Aggregationen geladen!");

const express = require('express');
const router = express.Router();

// Mongoose Models
const Lagerbewegung = require('../models/Lagerbewegung');
const Produkt = require('../models/Produkt');
const Lagerort = require('../models/Lagerort');
const Kategorie = require('../models/Kategorie');

/* ============================================================
   1) Bewegungen pro Tag
   ============================================================ */
router.get('/pro-tag', async (req, res) => {
  try {
    const result = await Lagerbewegung.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$datum" }
          },
          anzahl: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   2) Anzahl Zugänge vs. Abgänge
   ============================================================ */
router.get('/typ-anzahl', async (req, res) => {
  try {
    const result = await Lagerbewegung.aggregate([
      {
        $group: {
          _id: "$typ",
          anzahl: { $sum: 1 }
        }
      }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   3) Bewegungen pro Lagerort
   ============================================================ */
router.get('/pro-lagerort', async (req, res) => {
  try {
    const result = await Lagerbewegung.aggregate([
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
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   4) Gesamtwert des Lagers
   ============================================================ */
router.get('/lagerwert', async (req, res) => {
  try {
    const result = await Produkt.aggregate([
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
    ]);

    res.json(result[0] || { gesamtwert: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   5) Produkte pro Kategorie
   ============================================================ */
router.get('/produkte-pro-kategorie', async (req, res) => {
  try {
    const result = await Produkt.aggregate([
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
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
