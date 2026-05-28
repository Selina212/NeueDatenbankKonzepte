//Author: Selina Steuer
// Routen für Lagerbewegungen und Bestandsänderungen
const express = require('express');
const mongoose = require('mongoose');

const Lagerbewegung = require('../models/Lagerbewegung');
const Lagerort = require('../models/Lagerort');

const router = express.Router();

function produkteCollection() {
  return mongoose.connection.db.collection("produkte");
}

async function bewegungMitDetails(bewegung) {
  const produkt = await produkteCollection().findOne({ _id: new mongoose.Types.ObjectId(bewegung.produkt_id) });
  const lagerort = await Lagerort.findById(bewegung.lagerort_id);

  return {
    ...bewegung,
    produkt,
    lagerort
  };
}

// Alle Bewegungen laden
router.get('/', async (req, res) => {
  try {
    const bewegungen = await Lagerbewegung.find().lean();
    const daten = [];

    for (const bewegung of bewegungen) {
      daten.push(await bewegungMitDetails(bewegung));
    }

    res.json(daten);
  } catch (err) {
    res.status(500).json({ error: 'Lagerbewegungen konnten nicht geladen werden', details: err.message });
  }
});

// Einzelne Bewegung laden
router.get('/:id', async (req, res) => {
  try {
    const bewegung = await Lagerbewegung.findById(req.params.id).lean();
    if (!bewegung) return res.status(404).json({ error: 'Lagerbewegung nicht gefunden' });

    res.json(await bewegungMitDetails(bewegung));
  } catch (err) {
    res.status(400).json({ error: 'Lagerbewegung konnte nicht geladen werden', details: err.message });
  }
});

// Bewegung anlegen und Produktbestand anpassen
router.post('/', async (req, res) => {
  let session = null;
  try {
    const { produkt_id, lagerort_id, typ, grund, menge } = req.body;

    if (!produkt_id || !lagerort_id || !typ || !menge) {
      return res.status(400).json({ error: 'Ungültige Eingabedaten' });
    }

    session = await mongoose.startSession();
    let neueBewegung = null;

    await session.withTransaction(async () => {
      const lagerort = await Lagerort.findById(lagerort_id).session(session);
      if (!lagerort) throw { status: 400, message: 'Lagerort existiert nicht' };

      const produkt = await produkteCollection().findOne({ _id: new mongoose.Types.ObjectId(produkt_id) });
      if (!produkt) throw { status: 400, message: 'Produkt existiert nicht' };

      if (typ === 'Ausgang' && produkt.bestand < menge) {
        throw { status: 400, message: 'Nicht genug Bestand' };
      }

      const neuerBestand = typ === 'Eingang'
        ? produkt.bestand + menge
        : produkt.bestand - menge;

      await produkteCollection().updateOne(
        { _id: new mongoose.Types.ObjectId(produkt_id) },
        { $set: { bestand: neuerBestand } },
        { session }
      );

      const [bewegung] = await Lagerbewegung.create([{
        typ,
        menge,
        grund,
        produkt_id,
        lagerort_id,
        datum: new Date()
      }], { session });

      neueBewegung = bewegung;
    });

    res.status(201).json(await bewegungMitDetails(neueBewegung.toObject()));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Interner Serverfehler' });
  } finally {
    if (session) session.endSession();
  }
});

// Bewegung bearbeiten
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

    res.json(await bewegungMitDetails(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bewegung löschen
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
