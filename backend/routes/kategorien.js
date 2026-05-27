//Author: Raphael Falk
const express = require('express')
const Kategorie = require('../models/Kategorie')

const router = express.Router()

// Einfache CRUD-Routen für die Kategorien-Collection.
router.get('/', async (req, res) => {
  try {
    const kategorien = await Kategorie.find()
    res.json(kategorien)
  } catch (err) {
    res.status(500).json({ error: 'Kategorien konnten nicht geladen werden', details: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const kategorie = await Kategorie.findById(req.params.id)

    if (!kategorie) {
      return res.status(404).json({ error: 'Kategorie nicht gefunden' })
    }

    res.json(kategorie)
  } catch (err) {
    res.status(400).json({ error: 'Kategorie konnte nicht geladen werden', details: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const kategorie = await new Kategorie(req.body).save()
    res.status(201).json(kategorie)
  } catch (err) {
    res.status(400).json({ error: 'Kategorie konnte nicht angelegt werden', details: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    // new:true gibt direkt die geänderte Version zurück.
    const kategorie = await Kategorie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })

    if (!kategorie) {
      return res.status(404).json({ error: 'Kategorie nicht gefunden' })
    }

    res.json(kategorie)
  } catch (err) {
    res.status(400).json({ error: 'Kategorie konnte nicht aktualisiert werden', details: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const kategorie = await Kategorie.findByIdAndDelete(req.params.id)

    if (!kategorie) {
      return res.status(404).json({ error: 'Kategorie nicht gefunden' })
    }

    res.json({ message: 'Kategorie geloescht', data: kategorie })
  } catch (err) {
    res.status(400).json({ error: 'Kategorie konnte nicht geloescht werden', details: err.message })
  }
})

module.exports = router
