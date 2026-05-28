
//Author Raphael Falk
// Native Funktionen für die Produkt-Collection
const mongoose = require('mongoose')
// ObjectId aus dem nativen Treiber
const { ObjectId } = require('mongodb')

function collection() {
  // Keine zweite Datenbankverbindung
  // Zugriff direkt auf die Collection produkte
  return mongoose.connection.db.collection('produkte')
}

function idIstGueltig(id) {
  // Verhindert Fehler beim Umwandeln in ObjectId
  return ObjectId.isValid(id)
}

function objektId(id) {
  // MongoDB arbeitet intern mit ObjectId statt normalem Text
  return new ObjectId(id)
}

function produktAusRequest(data, istNeu = false) {
  // Aus den Formulardaten wird ein Produkt-Dokument gebaut
  const produkt = {}

  if (data.artikelnummer !== undefined) produkt.artikelnummer = data.artikelnummer.trim()
  if (data.bezeichnung !== undefined) produkt.bezeichnung = data.bezeichnung.trim()
  if (data.beschreibung !== undefined) produkt.beschreibung = data.beschreibung
  // Zahlen aus Formularwerten
  if (data.preis !== undefined) produkt.preis = Number(data.preis)
  if (data.bestand !== undefined) produkt.bestand = Number(data.bestand)
  if (data.mindestbestand !== undefined) produkt.mindestbestand = Number(data.mindestbestand)
  if (data.einheit !== undefined) produkt.einheit = data.einheit

  // Referenzen werden als ObjectId gespeichert
  if (data.kategorie_id !== undefined && data.kategorie_id !== '') {
    produkt.kategorie_id = new ObjectId(data.kategorie_id)
  }

  if (data.lieferant_id !== undefined && data.lieferant_id !== '') {
    produkt.lieferant_id = new ObjectId(data.lieferant_id)
  }

  if (istNeu) {
    // Neue Produkte bekommen Startwerte falls nichts eingegeben wurde
    produkt.bestand = produkt.bestand ?? 0
    produkt.mindestbestand = produkt.mindestbestand ?? 0
    produkt.createdAt = new Date()
  }

  produkt.updatedAt = new Date()

  return produkt
}

async function alleHolen() {
  // find ohne Filter holt alle Produkte
  return collection().find().toArray()
}

async function suchen(filter) {
  // Der Filter kommt aus der Suchroute
  return collection()
    .find(filter)
    // Alphabetisch nach Bezeichnung
    .sort({ bezeichnung: 1 })
    // Treffer begrenzen
    .limit(50)
    .toArray()
}

async function einsHolen(id) {
  // Ein Produkt über seine MongoDB-ID laden
  return collection().findOne({ _id: new ObjectId(id) })
}

async function anlegen(data) {
  const produkt = produktAusRequest(data, true)
  const result = await collection().insertOne(produkt)
  // insertOne gibt zuerst nur die neue ID zurück
  return collection().findOne({ _id: result.insertedId })
}

async function aendern(id, data) {
  const produkt = produktAusRequest(data)

  // $set ändert nur die übergebenen Felder
  const result = await collection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: produkt },
    // Geänderte Version zurückgeben
    { returnDocument: 'after' }
  )

  return result
}

async function loeschen(id) {
  // Das gelöschte Dokument kommt als Antwort zurück
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
