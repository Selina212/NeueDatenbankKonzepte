// Author: Raphael Falk
// Gibt die 4er-Kette Lagerort, Bewegung, Produkt und Kategorie zurück.

const express = require('express')
const Lagerort = require('../models/Lagerort')

const router = express.Router()

//GET: 4er-Kette mit einfacher Suche
//Lagerort -> Lagerbewegung -> PRodukt -> Kategorie

router.get('/kette', async (req, res) => {
  try {
    const q = req.query.q || ''

    // Die Pipeline verbindet die vier Collections Schritt für Schritt.
    const pipeline = [
      // Zum Lagerort werden die passenden Bewegungen gesucht.
      {
        $lookup: {
          from: 'lagerbewegungen',
          localField: '_id',
          foreignField: 'lagerort_id',
          as: 'lagerbewegung'
        }
      },
      // Nach dem lookup liegt das Ergebnis als Array vor, unwind macht daraus einzelne Zeilen.
      { $unwind: '$lagerbewegung' },

      // Zu jeder Bewegung wird das passende Produkt ergänzt.
      {
        $lookup: {
          from: 'produkte',
          localField: 'lagerbewegung.produkt_id',
          foreignField: '_id',
          as: 'produkt'
        }
      },
      // Dadurch kann danach direkt mit dem Produkt weitergearbeitet werden.
      { $unwind: '$produkt' },

      // Aus dem Produkt kommt dann noch die Kategorie dazu.
      {
        $lookup: {
          from: 'kategorien',
          localField: 'produkt.kategorie_id',
          foreignField: '_id',
          as: 'kategorie'
        }
      },
      // Am Ende steht pro Treffer genau eine Kombination aus Lagerort, Bewegung, Produkt und Kategorie.
      { $unwind: '$kategorie' }
    ]

    // Hier kann auch nach Produkt oder Kategorie gesucht werden.
    if (q.trim() !== '') {
      pipeline.push({
        $match: {
          $or: [
            { bezeichnung: { $regex: q, $options: 'i' } },
            { 'lagerbewegung.typ': { $regex: q, $options: 'i' } },
            { 'produkt.bezeichnung': { $regex: q, $options: 'i' } },
            { 'produkt.artikelnummer': { $regex: q, $options: 'i' } },
            { 'kategorie.name': { $regex: q, $options: 'i' } }
          ]
        }
      })
    }

    // Für die Tabelle werden nur die sichtbren Felder zurückgegeben.
    pipeline.push(
      {
        $project: {
          _id: 0,
          lagerort: '$bezeichnung',
          datum: '$lagerbewegung.datum',
          typ: '$lagerbewegung.typ',
          menge: '$lagerbewegung.menge',
          produkt: '$produkt.bezeichnung',
          artikelnummer: '$produkt.artikelnummer',
          kategorie: '$kategorie.name'
        }
      },
      {
        $sort: {
          datum: -1
        }
      }
    )

    const kette = await Lagerort.aggregate(pipeline)

    // Die Tabelle im Frontend liest später nur die Liste aus daten aus.
    res.json({
      suche: q || null,
      anzahl: kette.length,
      daten: kette
    })
  } catch (err) {
    res.status(500).json({
      error: '4er-Kette konnte nicht geladen werden',
      details: err.message
    })
  }
})

module.exports = router
