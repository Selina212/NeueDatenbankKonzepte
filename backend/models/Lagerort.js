const mongoose = require('mongoose');

const LagerortSchema = new mongoose.Schema({
  bezeichnung: { type: String, required: true, trim: true },
  halle: { type: String, required: true, trim: true },
  kapazität: { type: Number, default: 0 }
});

module.exports = mongoose.model('Lagerort', LagerortSchema, 'lagerorte');

