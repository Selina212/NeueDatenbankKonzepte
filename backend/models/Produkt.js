const mongoose = require('mongoose')

const produktSchema = new mongoose.Schema({
  artikelnummer: {
    type: String,
    required: true,
    unique: true
  },
  bezeichnung: {
    type: String,
    required: true
  },
  beschreibung: String,
  preis: Number,
  bestand: {
    type: Number,
    default: 0
  },
  mindestbestand: {
    type: Number,
    default: 0
  },
  einheit: String,
  kategorie_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Kategorie'
  },
  lieferant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lieferant'
  }
})

module.exports = mongoose.model('Produkt', produktSchema, 'produkte')
