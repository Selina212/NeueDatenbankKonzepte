const mongoose = require('mongoose')
const { ObjectId } = require('mongodb')

function collection() {
  // Es wird keine zweite Datenbankverbindung geöffnet.
  // Hier greife ich direkt auf die Produkt-Collection zu.
  return mongoose.connection.db.collection('produkte')
}

function idIstGueltig(id) {
  return ObjectId.isValid(id)
}

function objektId(id) {
  return new ObjectId(id)
}

function produktAusRequest(data, istNeu = false) {
  const produkt = {}

  if (data.artikelnummer !== undefined) produkt.artikelnummer = data.artikelnummer.trim()
  if (data.bezeichnung !== undefined) produkt.bezeichnung = data.bezeichnung.trim()
  if (data.beschreibung !== undefined) produkt.beschreibung = data.beschreibung
  if (data.preis !== undefined) produkt.preis = Number(data.preis)
  if (data.bestand !== undefined) produkt.bestand = Number(data.bestand)
  if (data.mindestbestand !== undefined) produkt.mindestbestand = Number(data.mindestbestand)
  if (data.einheit !== undefined) produkt.einheit = data.einheit

  // Die IDs werden als ObjectId gespeichert, weil sie auf andere Collections zeigen.
  if (data.kategorie_id !== undefined && data.kategorie_id !== '') {
    produkt.kategorie_id = new ObjectId(data.kategorie_id)
  }

  if (data.lieferant_id !== undefined && data.lieferant_id !== '') {
    produkt.lieferant_id = new ObjectId(data.lieferant_id)
  }

  if (istNeu) {
    produkt.bestand = produkt.bestand ?? 0
    produkt.mindestbestand = produkt.mindestbestand ?? 0
    produkt.createdAt = new Date()
  }

  produkt.updatedAt = new Date()

  return produkt
}

async function alleHolen() {
  return collection().find().toArray()
}

async function suchen(filter) {
  return collection()
    .find(filter)
    .sort({ bezeichnung: 1 })
    .limit(50)
    .toArray()
}

async function einsHolen(id) {
  return collection().findOne({ _id: new ObjectId(id) })
}

async function anlegen(data) {
  const produkt = produktAusRequest(data, true)
  const result = await collection().insertOne(produkt)
  return collection().findOne({ _id: result.insertedId })
}

async function aendern(id, data) {
  const produkt = produktAusRequest(data)

  const result = await collection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: produkt },
    { returnDocument: 'after' }
  )

  return result
}

async function loeschen(id) {
  return collection().findOneAndDelete({ _id: new ObjectId(id) })
}

module.exports = {
  idIstGueltig,
  objektId,
  alleHolen,
  suchen,
  einsHolen,
  anlegen,
  aendern,
  loeschen
}
