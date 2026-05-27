//Author: Selina Steuer
const express = require('express');
const router = express.Router();
const Lagerort = require('../models/Lagerort');

// Alle Lagerorte
router.get('/', async (req, res) => {
  try {
    const list = await Lagerort.find().sort({ bezeichnung: 1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Einzelner Lagerort
router.get('/:id', async (req, res) => {
  try {
    const l = await Lagerort.findById(req.params.id);
    if (!l) return res.status(404).json({ error: 'Nicht gefunden' });
    res.json(l);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Anlegen
router.post('/', async (req, res) => {
  try {
    const neu = await Lagerort.create(req.body);
    res.status(201).json(neu);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Bearbeiten
router.put('/:id', async (req, res) => {
  try {
    const updated = await Lagerort.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Löschen
router.delete('/:id', async (req, res) => {
  try {
    await Lagerort.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
