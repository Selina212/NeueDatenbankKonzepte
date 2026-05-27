//Author: Raphael Falk
const express = require('express');
const mongoose = require('mongoose');

const Lagerbewegung = require('../models/Lagerbewegung');
const Lieferant = require('../models/Lieferant');
const Lagerort = require('../models/Lagerort');

const router = express.Router();

/* ============================================================
   Native Produkte-Collection
   ============================================================ */
function produkteCollection() {
  return mongoose.connection.db.collection("produkte");
}

/* ============================================================
   Hilfsfunktion: Produkt + Lieferant laden
   ============================================================ */
async function produktMitLieferant(produktId) {
  const produkt = await produkteCollection().findOne({ _id: new mongoose.Types.ObjectId(produktId) });
  if (!produkt) return null;

  let lieferant = null;
  if (produkt.lieferant_id) {
    lieferant = await Lieferant.findById(produkt.lieferant_id);
  }

  return { produkt, lieferant };
}

/* ============================================================
   GET: Alle Bewegungen (mit Produkt + Lieferant + Lagerort)
   ============================================================ */
router.get('/', async (req, res) => {
  try {
    const bewegungen = await Lagerbewegung.find().lean();

    const daten = [];
    for (const b of bewegungen) {
      const { produkt, lieferant } = await produktMitLieferant(b.produkt_id);
      const lagerort = await Lagerort.findById(b.lagerort_id);

      daten.push({
        _id: b._id,
        datum: b.datum,
        typ: b.typ,
        menge: b.menge,
        grund: b.grund,
        produkt,
        lieferant,
        lagerort
      });
    }

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
    const b = await Lagerbewegung.findById(req.params.id).lean();
    if (!b) return res.status(404).json({ error: 'Lagerbewegung nicht gefunden' });

    const { produkt, lieferant } = await produktMitLieferant(b.produkt_id);
    const lagerort = await Lagerort.findById(b.lagerort_id);

    res.json({ ...b, produkt, lieferant, lagerort });
  } catch (err) {
    res.status(400).json({ error: 'Lagerbewegung konnte nicht geladen werden', details: err.message });
  }
});

/* ============================================================
   GET: 4er-Kette
   ============================================================ */
router.get('/:id/kette', async (req, res) => {
  try {
    const b = await Lagerbewegung.findById(req.params.id).lean();
    if (!b) return res.status(404).json({ error: 'Lagerbewegung nicht gefunden' });

    const { produkt, lieferant } = await produktMitLieferant(b.produkt_id);

    res.json({
      bewegung: b,
      produkt,
      lieferant,
      kontakt: lieferant?.kontakt || null
    });
  } catch (err) {
    res.status(400).json({ error: '4er-Kette konnte nicht geladen werden', details: err.message });
  }
});
//Author: Selina Steuer

//POST: Bewegung anlegen (mit Transaktion)
router.post('/', async (req, res) => {
  let session = null;
  try {
    const { produkt_id, lagerort_id, typ, grund, menge } = req.body;
//Eingaben prüfen
    if (!produkt_id || !lagerort_id || !typ || !menge) {
      return res.status(400).json({ error: 'Ungültige Eingabedaten' });
    }
//Transaktion starten
    session = await mongoose.startSession();

    let createdMovement = null;

    await session.withTransaction(async () => {
      //Lagerort prüfen
      const lagerort = await Lagerort.findById(lagerort_id).session(session);
      if (!lagerort) throw { status: 400, message: 'Lagerort existiert nicht' };
//Produkt prüfen
      const produkt = await produkteCollection().findOne({ _id: new mongoose.Types.ObjectId(produkt_id) });
      if (!produkt) throw { status: 400, message: 'Produkt existiert nicht' };
//Bestand prüfen
      if (typ === 'Ausgang' && produkt.bestand < menge) {
        throw { status: 400, message: 'Nicht genug Bestand' };
      }
//Bestand aktualisieren
      const neuerBestand = typ === 'Eingang'
        ? produkt.bestand + menge
        : produkt.bestand - menge;

      await produkteCollection().updateOne(
        { _id: new mongoose.Types.ObjectId(produkt_id) },
        { $set: { bestand: neuerBestand } },
        { session }
      );
      
      //Bewegung anlegen
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

    const { produkt, lieferant } = await produktMitLieferant(createdMovement.produkt_id);
    const lagerort = await Lagerort.findById(createdMovement.lagerort_id);

    res.status(201).json({
      ...createdMovement.toObject(),
      produkt,
      lieferant,
      lagerort
    });

  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Interner Serverfehler' });
  } finally {
    if (session) session.endSession();
  }
});

//PUT: Bewegung aktualisieren

router.put('/:id', async (req, res) => {
  try {
    const { datum, typ, menge, grund, produkt_id, lagerort_id } = req.body;

    const updated = await Lagerbewegung.findByIdAndUpdate(
      req.params.id,
      { datum, typ, menge, grund, produkt_id, lagerort_id },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: 'Lagerbewegung nicht gefunden' });
    }
//Produkt, Lieferant und Lagerort für die Antwort laden
    const { produkt, lieferant } = await produktMitLieferant(updated.produkt_id);
    const lagerort = await Lagerort.findById(updated.lagerort_id);

    res.json({ ...updated, produkt, lieferant, lagerort });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//DELETE: Bewegung löschen
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Lagerbewegung.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Lagerbewegung nicht gefunden' });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
