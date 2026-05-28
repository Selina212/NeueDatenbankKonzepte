//Author Raphael Falk
// Mongoose-Model für Lieferanten
const mongoose = require('mongoose')

// Kontakt und Adresse gehören direkt zum Lieferanten
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
