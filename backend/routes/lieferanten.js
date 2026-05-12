const express = require('express')
const Lieferant = require('../models/Lieferant')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const lieferanten = await Lieferant.find()
    res.json(lieferanten)
  } catch (err) {
    res.status(500).json({ error: 'Lieferanten konnten nicht geladen werden', details: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const lieferant = await Lieferant.findById(req.params.id)

    if (!lieferant) {
      return res.status(404).json({ error: 'Lieferant nicht gefunden' })
    }

    res.json(lieferant)
  } catch (err) {
    res.status(400).json({ error: 'Lieferant konnte nicht geladen werden', details: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const lieferant = await new Lieferant(req.body).save()
    res.status(201).json(lieferant)
  } catch (err) {
    res.status(400).json({ error: 'Lieferant konnte nicht angelegt werden', details: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const lieferant = await Lieferant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })

    if (!lieferant) {
      return res.status(404).json({ error: 'Lieferant nicht gefunden' })
    }

    res.json(lieferant)
  } catch (err) {
    res.status(400).json({ error: 'Lieferant konnte nicht aktualisiert werden', details: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const lieferant = await Lieferant.findByIdAndDelete(req.params.id)

    if (!lieferant) {
      return res.status(404).json({ error: 'Lieferant nicht gefunden' })
    }

    res.json({ message: 'Lieferant geloescht', data: lieferant })
  } catch (err) {
    res.status(400).json({ error: 'Lieferant konnte nicht geloescht werden', details: err.message })
  }
})

module.exports = router
