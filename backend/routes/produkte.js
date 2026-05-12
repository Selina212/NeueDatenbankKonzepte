const express = require('express')
const Produkt = require('../models/Produkt')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const produkte = await Produkt.find()
    res.json(produkte)
  } catch (err) {
    res.status(500).json({ error: 'Produkte konnten nicht geladen werden', details: err.message })
  }
})

router.get('/suche', async (req, res) => {
  try {
    const q = req.query.q || ''
    const produkte = await Produkt.find({
      $or: [
        { artikelnummer: { $regex: q, $options: 'i' } },
        { bezeichnung: { $regex: q, $options: 'i' } },
        { beschreibung: { $regex: q, $options: 'i' } }
      ]
    })

    res.json(produkte)
  } catch (err) {
    res.status(500).json({ error: 'Produktsuche fehlgeschlagen', details: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const produkt = await Produkt.findById(req.params.id)

    if (!produkt) {
      return res.status(404).json({ error: 'Produkt nicht gefunden' })
    }

    res.json(produkt)
  } catch (err) {
    res.status(400).json({ error: 'Produkt konnte nicht geladen werden', details: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const produkt = await new Produkt(req.body).save()
    res.status(201).json(produkt)
  } catch (err) {
    res.status(400).json({ error: 'Produkt konnte nicht angelegt werden', details: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const produkt = await Produkt.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })

    if (!produkt) {
      return res.status(404).json({ error: 'Produkt nicht gefunden' })
    }

    res.json(produkt)
  } catch (err) {
    res.status(400).json({ error: 'Produkt konnte nicht aktualisiert werden', details: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const produkt = await Produkt.findByIdAndDelete(req.params.id)

    if (!produkt) {
      return res.status(404).json({ error: 'Produkt nicht gefunden' })
    }

    res.json({ message: 'Produkt geloescht', data: produkt })
  } catch (err) {
    res.status(400).json({ error: 'Produkt konnte nicht geloescht werden', details: err.message })
  }
})

module.exports = router
