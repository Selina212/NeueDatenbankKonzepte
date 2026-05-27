// Author: Selina Steuer
// Diese Datei enthält alle Aggregations-Endpunkte für das Dashboard.
console.log("Aggregationen geladen!");

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Mongoose Models
const Lagerbewegung = require('../models/Lagerbewegung');
const Lagerort = require('../models/Lagerort');
const Kategorie = require('../models/Kategorie');

//HILFSFUNKTION: Produkte-Collection (native)
function produkteCollection() {
  return mongoose.connection.db.collection("produkte");
}

//1) Bewegungen pro Tag ( Liefert: Anzahl der Lagerbewegungen pro Datum.
// Unterstützt Filter: Zeitraum, Produkt, Lagerort.)
router.get('/pro-tag', async (req, res) => {
  try {
    const match = {};//alle Filterbedingungen sammeln

    // Zeitraum
    if (req.query.from || req.query.to) {
      match.datum = {};
      //Startdatum
      if (req.query.from) match.datum.$gte = new Date(req.query.from);
      //Enddatum(inklusive)
      if (req.query.to) {
        const end = new Date(req.query.to);
        end.setHours(23, 59, 59, 999);
        match.datum.$lte = end;
      }
    }

    // Produktfilter
    //Da Produkt und LagerortId sowohl string als auch ObjectId sein können, werden sie als Strings verglichen.
    if (req.query.produkt) match.produkt_id_str = req.query.produkt;

    // Lagerortfilter
    if (req.query.lagerort) match.lagerort_id_str = req.query.lagerort;
    //Aggregation Pipeline
    const result = await Lagerbewegung.aggregate([
      {
        //IDs in Strings umwandeln
        $addFields: {
          produkt_id_str: { $toString: "$produkt_id" },
          lagerort_id_str: { $toString: "$lagerort_id" }
        }
      },
      //Filter anwenden
      { $match: match },
      {
        //Gruppieren nach Datum
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$datum" } },
          anzahl: { $sum: 1 }
        }
      },
      //Sortieren nach Datum
      { $sort: { _id: 1 } }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//3) Bewegungen pro Lagerort
router.get('/pro-lagerort', async (req, res) => {
  try {
    const match = {};

    // Zeitraum
    if (req.query.from || req.query.to) {
      match.datum = {};
      if (req.query.from) match.datum.$gte = new Date(req.query.from);
      if (req.query.to) {
        const end = new Date(req.query.to);
        end.setHours(23, 59, 59, 999);
        match.datum.$lte = end;
      }
    }

    // Produkt
    if (req.query.produkt) match.produkt_id_str = req.query.produkt;

    // Lagerort
    if (req.query.lagerort) match.lagerort_id_str = req.query.lagerort;

    const result = await Lagerbewegung.aggregate([
      {
        $addFields: {
          produkt_id_str: { $toString: "$produkt_id" },
          lagerort_id_str: { $toString: "$lagerort_id" }
        }
      },
      { $match: match },
      {
        //Für Lookup brauchen wir die ObjectID
        $addFields: {
          lagerort_id_obj: { $toObjectId: "$lagerort_id" }
        }
      },
      {
        //Gruppieren nach LAgerort
        $group: {
          _id: "$lagerort_id_obj",
          anzahl: { $sum: 1 }
        }
      },
      {
        //Join mit Lagerort-Collection, um die Bezeichnung zu bekommen
        $lookup: {
          from: "lagerorte",
          localField: "_id",
          foreignField: "_id",
          as: "lagerort"
        }
      },
      {
        //Ausgabe formatieren: Bezeichnung + Anzahl. Wenn kein Lagerort gefunden wird, "Unbekannt" anzeigen.
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
      //Sortieren nach Anzahl 
      { $sort: { anzahl: -1 } }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//4) Gesamtwert des Lagers
// Berechnet: Summe aus (Preis * Bestand) aller Produkte.
router.get('/lagerwert', async (req, res) => {
  try {
    const result = await produkteCollection()
      .aggregate([
        {
          //Wert pro Produkt berechnen
          $project: {
            wert: { $multiply: ["$bestand", "$preis"] }
          }
        },
        {
          //Gesamtwert berechnen
          $group: {
            _id: null,
            gesamtwert: { $sum: "$wert" }
          }
        }
      ])
      .toArray();

    res.json(result[0] || { gesamtwert: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//5) Produkte pro Kategorie (native Produkte)
// Gruppiert alle Produkte nach ihrer Kategorie.
router.get('/produkte-pro-kategorie', async (req, res) => {
  try {
    const result = await produkteCollection()
      .aggregate([
        {
          //Join mit Kategorie-Collection, um die Kategoriebezeichnung zu bekommen
          $lookup: {
            from: "kategorien",
            localField: "kategorie_id",
            foreignField: "_id",
            as: "kategorie"
          }
        },
        //Katgoie Array auflösen
        { $unwind: "$kategorie" },
        {
          //Gruppieren nach Kategoriename
          $group: {
            _id: "$kategorie.name",
            anzahl: { $sum: 1 }
          }
        },
        //Sortieren nach Anzahl
        { $sort: { anzahl: -1 } }
      ])
      .toArray();

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
