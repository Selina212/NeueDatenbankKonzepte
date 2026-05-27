//Author Raphael Falk
const mongoose = require('mongoose')

// Kategorien sind eigene Dokumente, weil mehrere Produkte dieselbe Kategorie nutzen können.
const kategorieSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  beschreibung: String
})

module.exports = mongoose.model('Kategorie', kategorieSchema, 'kategorien')
