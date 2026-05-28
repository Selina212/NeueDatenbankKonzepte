//Author Raphael Falk
// Mongoose-Model für Lagerorte
const mongoose = require('mongoose');

const LagerortSchema = new mongoose.Schema({
  bezeichnung: { type: String, required: true, trim: true },
  halle: { type: String, required: true, trim: true },
  kapazität: { type: Number, required: true,
  min: [1, 'Kapazität muss mindestens 1 sein']
}
});

module.exports = mongoose.model('Lagerort', LagerortSchema, 'lagerorte');
