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
    const match = {};

    /* -----------------------------------------
       1) ZEITRAUM-FILTER
       ----------------------------------------- */
    if (req.query.from || req.query.to) {
      match.datum = {};

      if (req.query.from) {
        match.datum.$gte = new Date(req.query.from);
      }

      if (req.query.to) {
        const end = new Date(req.query.to);
        end.setHours(23, 59, 59, 999);
        match.datum.$lte = end;
      }
    }

    /* -----------------------------------------
       2) PRODUKT-FILTER
       ----------------------------------------- */
    if (req.query.produkt) {
      match.produkt_id_str = req.query.produkt;
    }

    /* -----------------------------------------
       3) LAGERORT-FILTER
       ----------------------------------------- */
    if (req.query.lagerort) {
      match.lagerort_id_str = req.query.lagerort;
    }

    /* -----------------------------------------
       4) AGGREGATION
       ----------------------------------------- */
    const result = await Lagerbewegung.aggregate([
      // IDs in Strings umwandeln (wegen Mischung!)
      {
        $addFields: {
          produkt_id_str: { $toString: "$produkt_id" },
          lagerort_id_str: { $toString: "$lagerort_id" }
        }
      },

      // Filter anwenden
      { $match: match },

      // Gruppieren pro Tag
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$datum" }
          },
          anzahl: { $sum: 1 }
        }
      },

      // Sortieren nach Datum
      { $sort: { _id: 1 } }
    ]);

    res.json(result);

  } catch (err) {
    console.error(err);
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

    // -----------------------------
    // FILTER SAMMELN
    // -----------------------------
    const match = {};

// Zeitraum
if (req.query.from || req.query.to) {
  match.datum = {};

  if (req.query.from) {
    match.datum.$gte = new Date(req.query.from);
  }

  if (req.query.to) {
    const end = new Date(req.query.to);
    end.setHours(23, 59, 59, 999);
    match.datum.$lte = end;
  }
}

// Produkt
if (req.query.produkt) {
  match.produkt_id_str = req.query.produkt;
}

// Lagerort
if (req.query.lagerort) {
  match.lagerort_id_str = req.query.lagerort;
}

const result = await Lagerbewegung.aggregate([
  // IDs in Strings umwandeln
  {
    $addFields: {
      produkt_id_str: { $toString: "$produkt_id" },
      lagerort_id_str: { $toString: "$lagerort_id" }
    }
  },

  // Filter anwenden
  { $match: match },

  // ObjectId für Lookup
  {
    $addFields: {
      lagerort_id_obj: { $toObjectId: "$lagerort_id" }
    }
  },

  // Gruppieren
  {
    $group: {
      _id: "$lagerort_id_obj",
      anzahl: { $sum: 1 }
    }
  },

  // Lookup
  {
    $lookup: {
      from: "lagerorte",
      localField: "_id",
      foreignField: "_id",
      as: "lagerort"
    }
  },

  {
    $project: {
      anzahl: 1,
      bezeichnung: {
        $ifNull: [
          { $arrayElemAt: ["$lagerort.bezeichnung", 0] },
          "Unbekannt"
        ]
      }
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
