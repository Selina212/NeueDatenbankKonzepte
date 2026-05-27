const mongoose = require('mongoose')

// Kontakt und Adresse liegen direkt im Lieferanten, weil sie zu genau diesem Lieferanten gehören.
const lieferantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  kontakt: {
    vorname: String,
    nachname: String,
    email: String,
    telefon: String
  },
  adresse: {
    stadt: String,
    plz: String,
    land: String
  }
})

module.exports = mongoose.model('Lieferant', lieferantSchema, 'lieferanten')
