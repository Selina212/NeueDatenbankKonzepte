//Author: Raphael Falk
const express = require('express')
const Produkt = require('../models/Produkt')

const router = express.Router()

function zahlIstUngueltig(value) {
  return value !== undefined && (Number.isNaN(Number(value)) || Number(value) < 0)
}

function pruefePflichtfelder(data) {
  if (!data.artikelnummer || !data.bezeichnung || !data.kategorie_id) {
    return 'Artikelnummer, Bezeichnung und Kategorie sind Pflichtfelder'
  }

  return null
}

function pruefeProduktdaten(data, istNeu = false) {
  // Bei Produkten prüfe ich die wichtigsten Eingaben selbst.
  if (istNeu) {
    const pflichtFehler = pruefePflichtfelder(data)
    if (pflichtFehler) return pflichtFehler
  }

  if (data.kategorie_id && !Produkt.idIstGueltig(data.kategorie_id)) {
    return 'Ungültige Kategorie-ID'
  }

  if (data.lieferant_id && !Produkt.idIstGueltig(data.lieferant_id)) {
    return 'Ungültige Lieferant-ID'
  }

  if (zahlIstUngueltig(data.preis)) return 'Preis darf nicht negativ sein'
  if (zahlIstUngueltig(data.bestand)) return 'Bestand darf nicht negativ sein'
  if (zahlIstUngueltig(data.mindestbestand)) return 'Mindestbestand darf nicht negativ sein'

  return null
}

router.get('/', async (req, res) => {
  try {
    const produkte = await Produkt.alleHolen()
    res.json(produkte)
  } catch (err) {
    res.status(500).json({
      error: 'Produkte konnten nicht geladen werden',
      details: err.message
    })
  }
})

/* ============================================================
   GET: Produktsuche
   Die Filter werden direkt als MongoDB-Filterobjekt gebaut.
   ============================================================ */
router.get('/suche', async (req, res) => {
  try {
    const q = req.query.q || ''
    const kategorieId = req.query.kategorieId || ''
    const kritisch = req.query.kritisch === 'true'

    const filter = {}

    // So findet die Suche auch Teile von Artikelnummer, Name oder Beschreibung.
    if (q.trim() !== '') {
      filter.$or = [
        { artikelnummer: { $regex: q, $options: 'i' } },
        { bezeichnung: { $regex: q, $options: 'i' } },
        { beschreibung: { $regex: q, $options: 'i' } }
      ]
    }

    if (kategorieId !== '') {
      if (!Produkt.idIstGueltig(kategorieId)) {
        return res.status(400).json({ error: 'Ungültige Kategorie-ID' })
      }

      // Die Kategorie-ID muss zum Format in der Datenbank passen.
      filter.kategorie_id = Produkt.objektId(kategorieId)
    }

    if (kritisch) {
      // Damit werden Produkte unter oder am Mindestbestand gefunden.
      filter.$expr = {
        $lte: ['$bestand', '$mindestbestand']
      }
    }

    const produkte = await Produkt.suchen(filter)

    res.json({
      suche: {
        suchbegriff: q || null,
        kategorieId: kategorieId || null,
        kritisch
      },
      anzahl: produkte.length,
      daten: produkte
    })
  } catch (err) {
    res.status(500).json({
      error: 'Suche konnte nicht ausgeführt werden',
      details: err.message
    })
  }
})

router.get('/:id', async (req, res) => {
  try {
    if (!Produkt.idIstGueltig(req.params.id)) {
      return res.status(400).json({ error: 'Ungültige Produkt-ID' })
    }

    const produkt = await Produkt.einsHolen(req.params.id)

    if (!produkt) {
      return res.status(404).json({ error: 'Produkt nicht gefunden' })
    }

    res.json(produkt)
  } catch (err) {
    res.status(400).json({
      error: 'Produkt konnte nicht geladen werden',
      details: err.message
    })
  }
})

router.post('/', async (req, res) => {
  try {
    const fehler = pruefeProduktdaten(req.body, true)
    if (fehler) {
      return res.status(400).json({ error: fehler })
    }

    const produkt = await Produkt.anlegen(req.body)
    res.status(201).json(produkt)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        error: 'Artikelnummer existiert bereits'
      })
    }

    res.status(400).json({
      error: 'Produkt konnte nicht angelegt werden',
      details: err.message
    })
  }
})

async function produktAendern(req, res) {
  try {
    if (!Produkt.idIstGueltig(req.params.id)) {
      return res.status(400).json({ error: 'Ungültige Produkt-ID' })
    }

    const fehler = pruefeProduktdaten(req.body)
    if (fehler) {
      return res.status(400).json({ error: fehler })
    }

    const produkt = await Produkt.aendern(req.params.id, req.body)

    if (!produkt) {
      return res.status(404).json({ error: 'Produkt nicht gefunden' })
    }

    res.json(produkt)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        error: 'Artikelnummer existiert bereits'
      })
    }

    res.status(400).json({
      error: 'Produkt konnte nicht aktualisiert werden',
      details: err.message
    })
  }
}

router.put('/:id', produktAendern)
router.patch('/:id', produktAendern)

router.delete('/:id', async (req, res) => {
  try {
    if (!Produkt.idIstGueltig(req.params.id)) {
      return res.status(400).json({ error: 'Ungültige Produkt-ID' })
    }

    const produkt = await Produkt.loeschen(req.params.id)

    if (!produkt) {
      return res.status(404).json({ error: 'Produkt nicht gefunden' })
    }

    res.json({
      message: 'Produkt gelöscht',
      data: produkt
    })
  } catch (err) {
    res.status(400).json({
      error: 'Produkt konnte nicht gelöscht werden',
      details: err.message
    })
  }
})

module.exports = router
