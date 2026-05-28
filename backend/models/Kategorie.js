//Author Raphael Falk
// Mongoose-Model für Kategorien
const mongoose = require('mongoose')

// Mehrere Produkte können dieselbe Kategorie nutzen
const kategorieSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  beschreibung: String
})

module.exports = mongoose.model('Kategorie', kategorieSchema, 'kategorien')
