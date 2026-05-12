// Author: Selina Steuer
const express = require('express');
const mongoose = require('mongoose');

const Lagerbewegung = require('../models/Lagerbewegung');
const Lieferant = require('../models/Lieferant');
const Produkt = require('../models/Produkt');
const Lagerort = require('../models/Lagerort');

const router = express.Router();

/* ============================================================
   GET: Bewegungen (mit Produkt + Lieferant)
   ============================================================ */
router.get('/', async (req, res) => {
  try {
    const lagerbewegungen = await Lagerbewegung.find()
      .populate({
        path: 'produkt_id',
        model: Produkt,
        populate: { path: 'lieferant_id', model: Lieferant }
      });

    const daten = lagerbewegungen.map(bewegung => {
      const produkt = bewegung.produkt_id;
      const lieferant = produkt?.lieferant_id || null;

      return {
        _id: bewegung._id,
        datum: bewegung.datum,
        typ: bewegung.typ,
        menge: bewegung.menge,
        grund: bewegung.grund,
        produkt,
        lieferant
      };
    });

    res.json(daten);
  } catch (err) {
    res.status(500).json({ error: 'Lagerbewegungen konnten nicht geladen werden', details: err.message });
  }
});

/* ============================================================
   GET: Einzelne Bewegung
   ============================================================ */
router.get('/:id', async (req, res) => {
  try {
    const bewegung = await Lagerbewegung.findById(req.params.id)
      .populate({ path: 'produkt_id', model: Produkt });

    if (!bewegung) return res.status(404).json({ error: 'Lagerbewegung nicht gefunden' });

    res.json(bewegung);
  } catch (err) {
    res.status(400).json({ error: 'Lagerbewegung konnte nicht geladen werden', details: err.message });
  }
});

/* ============================================================
   GET: 4er-Kette (Bewegung → Produkt → Lieferant → Kontakt)
   ============================================================ */
router.get('/:id/kette', async (req, res) => {
  try {
    const bewegung = await Lagerbewegung.findById(req.params.id)
      .populate({
        path: 'produkt_id',
        model: Produkt,
        populate: { path: 'lieferant_id', model: Lieferant }
      });

    if (!bewegung) return res.status(404).json({ error: 'Lagerbewegung nicht gefunden' });

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
    });
  } catch (err) {
    res.status(400).json({ error: '4er-Kette konnte nicht geladen werden', details: err.message });
  }
});

/* ============================================================
   POST: Bewegung anlegen (atomar, mit Mongoose Transaction)
   ============================================================ */
router.post('/', async (req, res) => {
  let session = null;
  try {
    // parse & validate
    const produkt_id = req.body.produkt_id;
    const lagerort_id = req.body.lagerort_id;
    const typ = req.body.typ;
    const grund = req.body.grund || '';
    const menge = Number(req.body.menge);

    if (!produkt_id || !lagerort_id || !typ || !Number.isFinite(menge) || menge <= 0) {
      return res.status(400).json({ error: 'Ungültige Eingabedaten' });
    }
    if (!['Eingang', 'Ausgang'].includes(typ)) {
      return res.status(400).json({ error: 'Typ muss "Eingang" oder "Ausgang" sein' });
    }

    session = await mongoose.startSession();

    let createdMovement = null;

    await session.withTransaction(async () => {
      // Prüfe Lagerort
      const lagerort = await Lagerort.findById(lagerort_id).session(session);
      if (!lagerort) throw { status: 400, message: 'Lagerort existiert nicht' };

      // Lade Produkt
      const produkt = await Produkt.findById(produkt_id).session(session);
      if (!produkt) throw { status: 400, message: 'Produkt existiert nicht' };

      // Bestand prüfen
      if (typ === 'Ausgang' && produkt.bestand < menge) {
        throw { status: 400, message: 'Nicht genug Bestand' };
      }

      // Neuer Bestand berechnen und setzen (runValidators)
      const neuerBestand = typ === 'Eingang' ? produkt.bestand + menge : produkt.bestand - menge;
      await Produkt.findByIdAndUpdate(
        produkt_id,
        { $set: { bestand: neuerBestand } },
        { session, runValidators: true }
      );

      // Bewegung anlegen
      const [bewegung] = await Lagerbewegung.create([{
        typ,
        menge,
        grund,
        produkt_id,
        lagerort_id,
        datum: new Date()
      }], { session });

      createdMovement = bewegung;
    });

    // populated Antwort zurückgeben (außerhalb der Session)
    const populated = await Lagerbewegung.findById(createdMovement._id)
      .populate({ path: 'produkt_id', model: Produkt, populate: { path: 'lieferant_id', model: Lieferant } })
      .populate({ path: 'lagerort_id', model: Lagerort });

    res.status(201).json(populated);
  } catch (err) {
    if (err && err.status && err.message) {
      return res.status(err.status).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || 'Interner Serverfehler' });
  } finally {
    if (session) session.endSession();
  }
});

module.exports = router;
