const express = require('express')
const Lagerbewegung = require('../models/Lagerbewegung')
const Lieferant = require('../models/Lieferant')
const Produkt = require('../models/Produkt')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const lagerbewegungen = await Lagerbewegung.find()
      .populate({
        path: 'produkt_id',
        model: Produkt,
        populate: {
          path: 'lieferant_id',
          model: Lieferant
        }
      })

    const daten = lagerbewegungen.map(bewegung => {
      const produkt = bewegung.produkt_id
      const lieferant = produkt?.lieferant_id || null

      return {
        _id: bewegung._id,
        datum: bewegung.datum,
        typ: bewegung.typ,
        menge: bewegung.menge,
        grund: bewegung.grund,
        produkt,
        lieferant
      }
    })

    res.json(daten)
  } catch (err) {
    res.status(500).json({ error: 'Lagerbewegungen konnten nicht geladen werden', details: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const bewegung = await Lagerbewegung.findById(req.params.id)
      .populate({
        path: 'produkt_id',
        model: Produkt
      })

    if (!bewegung) {
      return res.status(404).json({ error: 'Lagerbewegung nicht gefunden' })
    }

    res.json(bewegung)
  } catch (err) {
    res.status(400).json({ error: 'Lagerbewegung konnte nicht geladen werden', details: err.message })
  }
})

router.get('/:id/kette', async (req, res) => {
  try {
    const bewegung = await Lagerbewegung.findById(req.params.id)
      .populate({
        path: 'produkt_id',
        model: Produkt,
        populate: {
          path: 'lieferant_id',
          model: Lieferant
        }
      })

    if (!bewegung) {
      return res.status(404).json({ error: 'Lagerbewegung nicht gefunden' })
    }

    res.json({
      bewegung: {
        _id: bewegung._id,
        datum: bewegung.datum,
        typ: bewegung.typ,
        menge: bewegung.menge,
        grund: bewegung.grund
      },
      produkt: bewegung.produkt_id,
      lieferant: bewegung.produkt_id?.lieferant_id || null,
      kontakt: bewegung.produkt_id?.lieferant_id?.kontakt || null
    })
  } catch (err) {
    res.status(400).json({
      error: '4er-Kette konnte nicht geladen werden',
      details: err.message
    })
  }
})

module.exports = router
