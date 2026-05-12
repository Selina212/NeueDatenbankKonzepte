const mongoose = require('mongoose')

const lagerbewegungSchema = new mongoose.Schema({
  datum: {
    type: Date,
    default: Date.now
  },
  typ: {
    type: String,
    enum: ['Eingang', 'Ausgang'],
    required: true
  },
  menge: {
    type: Number,
    required: true
  },
  grund: String,
  produkt_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produkt'
  },
  lagerort_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lagerort'
  }
})

module.exports = mongoose.model('Lagerbewegung', lagerbewegungSchema, 'lagerbewegungen')
