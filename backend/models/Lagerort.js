const mongoose = require('mongoose')

const lagerortSchema = new mongoose.Schema({
  bezeichnung: {
    type: String,
    required: true
  },
  halle: String,
  kapazitaet: Number
})

module.exports = mongoose.model('Lagerort', lagerortSchema, 'lagerorte')
