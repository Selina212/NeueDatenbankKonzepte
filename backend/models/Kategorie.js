const mongoose = require('mongoose')

const kategorieSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  beschreibung: String
})

module.exports = mongoose.model('Kategorie', kategorieSchema, 'kategorien')
