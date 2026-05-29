// Author: Raphael Falk
// Gibt die 4er-Kette Lagerort Bewegung Produkt und Kategorie zurück

const express = require('express')
const Lagerort = require('../models/Lagerort')

const router = express.Router()

// GET: 4er-Kette mit einfacher Suche
// Lagerort -> Lagerbewegung -> Produkt -> Kategorie

router.get('/', async (req, res) => {
  try {
    const q = req.query.q || ''

    // Die Pipeline verbindet die vier Collections Schritt für Schritt
    const pipeline = [
      // Reverse-Lookup vom Lagerort zu den Bewegungen
      // Lagerort hat keine Bewegungsliste gespeichert
      {
        $lookup: {
          from: 'lagerbewegungen',
          localField: '_id',
          foreignField: 'lagerort_id',
          as: 'lagerbewegung'
        }
      },
      // Aus dem Array wird eine Zeile pro Bewegung
      { $unwind: '$lagerbewegung' },

      // Von der Bewegung geht es weiter zum Produkt
      {
        $lookup: {
          from: 'produkte',
          localField: 'lagerbewegung.produkt_id',
          foreignField: '_id',
          as: 'produkt'
        }
      },
      // Produkt liegt danach direkt als Objekt vor
      { $unwind: '$produkt' },

      // Kategorie kommt über das Produkt dazu
      {
        $lookup: {
          from: 'kategorien',
          localField: 'produkt.kategorie_id',
          foreignField: '_id',
          as: 'kategorie'
        }
      },
      // Am Ende steht eine Zeile pro kompletter Kette
      { $unwind: '$kategorie' }
    ]

    // Suche innerhalb der Kette
    if (q.trim() !== '') {
      pipeline.push({
        // Suche nach sichtbaren Feldern
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

    // Nur die Felder für die Tabelle zurückgeben
    pipeline.push(
      {
        // Ausgabe für die Tabelle formen
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

    // Die Liste steckt im Feld daten
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
