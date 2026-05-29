//Author Raphael Falk
// Produktseite mit Tabelle Formular und Suche
const body = document.querySelector('#produkte-body')
const meldung = document.querySelector('#meldung')
const suche = document.querySelector('#suche')
let produkte = []
let kategorien = []
let lieferanten = []

function zeigeFehler(text) {
  meldung.textContent = text
  meldung.className = 'meldung fehler'
}

function leereFehler() {
  meldung.textContent = ''
  meldung.className = 'meldung'
}

function wert(value) {
  // Keine undefined Werte in der Tabelle
  return value ?? ''
}

function zahl(value) {
  // Zahlen aus dem Formular umwandeln
  return value === '' || value === null ? undefined : Number(value)
}

function euro(value) {
  // Preis im deutschen Format anzeigen
  return Number(value || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}

async function pruefe(result) {
  // Fehler nur als Meldung anzeigen
  if (!result.ok) {
    zeigeFehler(result.error)
    return null
  }
  leereFehler()
  return result.data
}

function nameAusListe(liste, id) {
  // IDs aus dem Produkt als Namen anzeigen
  const eintrag = liste.find(item => item._id === id)
  return eintrag ? eintrag.name : ''
}

function fuelleDropdown(select, daten, platzhalter) {
  // Dropdown aus geladenen Daten füllen
  select.innerHTML = `<option value="">${platzhalter}</option>`
  daten.forEach(eintrag => {
    const option = document.createElement('option')
    option.value = eintrag._id
    option.textContent = eintrag.name
    select.appendChild(option)
  })
}

async function ladeAuswahlDaten() {
  // Kategorien und Lieferanten zuerst für die Auswahlfelder laden
  kategorien = await pruefe(await getKategorien()) || []
  lieferanten = await pruefe(await getLieferanten()) || []
  fuelleDropdown(document.querySelector('#kategorie-id'), kategorien, 'Keine Kategorie')
  fuelleDropdown(document.querySelector('#lieferant-id'), lieferanten, 'Kein Lieferant')
}

async function ladeProdukte() {
  const q = suche.value.trim()
  // Mit Suchtext die Suchroute nutzen
  // Suche liefert Objekt mit daten
  produkte = q ? (((await pruefe(await sucheProdukte(q))) || {}).daten || []) : (await pruefe(await getProdukte()) || [])
  renderProdukte()
}

function renderProdukte() {
  body.innerHTML = ''

  if (!produkte.length) {
    body.innerHTML = '<tr><td class="leer" colspan="9">Keine Produkte vorhanden.</td></tr>'
    return
  }

  produkte.forEach(produkt => {
    // Mindestbestand optisch markieren
    const kritisch = Number(produkt.bestand || 0) < Number(produkt.mindestbestand || 0)
    body.insertAdjacentHTML('beforeend', `
      <tr data-id="${produkt._id}" class="${kritisch ? 'kritisch' : ''}">
        <td>${wert(produkt.artikelnummer)}</td>
        <td>${wert(produkt.bezeichnung)}</td>
        <td>${euro(produkt.preis)}</td>
        <td>${wert(produkt.bestand)}</td>
        <td>${wert(produkt.mindestbestand)}</td>
        <td>${wert(produkt.einheit)}</td>
        <td>${nameAusListe(kategorien, produkt.kategorie_id)}</td>
        <td>${nameAusListe(lieferanten, produkt.lieferant_id)}</td>
        <td>
          <div class="aktionen">
            <button class="btn-bearbeiten" type="button" data-action="edit">Bearbeiten</button>
            <button class="btn-loeschen" type="button" data-action="delete">Löschen</button>
          </div>
        </td>
      </tr>
    `)
  })
}

function optionen(daten, aktivId, platzhalter) {
  // Optionen für die Bearbeiten-Zeile bauen
  const optionenHtml = [`<option value="">${platzhalter}</option>`]
  daten.forEach(eintrag => {
    // Aktuelle Auswahl markieren
    const selected = eintrag._id === aktivId ? 'selected' : ''
    optionenHtml.push(`<option value="${eintrag._id}" ${selected}>${eintrag.name}</option>`)
  })
  return optionenHtml.join('')
}

function datenAusZeile(row) {
  // Werte aus der Tabellenzeile einsammeln
  return {
    artikelnummer: row.querySelector('[name="artikelnummer"]').value,
    bezeichnung: row.querySelector('[name="bezeichnung"]').value,
    beschreibung: row.querySelector('[name="beschreibung"]').value,
    preis: zahl(row.querySelector('[name="preis"]').value),
    bestand: zahl(row.querySelector('[name="bestand"]').value),
    mindestbestand: zahl(row.querySelector('[name="mindestbestand"]').value),
    einheit: row.querySelector('[name="einheit"]').value,
    kategorie_id: row.querySelector('[name="kategorie_id"]').value || undefined,
    lieferant_id: row.querySelector('[name="lieferant_id"]').value || undefined
  }
}

function inlineEdit(row) {
  const produkt = produkte.find(item => item._id === row.dataset.id)

  // Tabellenzeile wird zum Bearbeiten-Formular
  row.innerHTML = `
    <td><input name="artikelnummer" required value="${wert(produkt.artikelnummer)}"></td>
    <td>
      <input name="bezeichnung" required value="${wert(produkt.bezeichnung)}">
      <textarea name="beschreibung" placeholder="Beschreibung">${wert(produkt.beschreibung)}</textarea>
    </td>
    <td><input name="preis" type="number" min="0" step="0.01" value="${wert(produkt.preis)}"></td>
    <td><input name="bestand" type="number" step="1" value="${wert(produkt.bestand)}"></td>
    <td><input name="mindestbestand" type="number" min="0" step="1" value="${wert(produkt.mindestbestand)}"></td>
    <td><input name="einheit" value="${wert(produkt.einheit)}"></td>
    <td><select name="kategorie_id">${optionen(kategorien, produkt.kategorie_id, 'Keine Kategorie')}</select></td>
    <td><select name="lieferant_id">${optionen(lieferanten, produkt.lieferant_id, 'Kein Lieferant')}</select></td>
    <td>
      <div class="aktionen">
        <button class="btn-anlegen" type="button" data-action="save">Speichern</button>
        <button class="btn-loeschen" type="button" data-action="cancel">Abbrechen</button>
      </div>
    </td>
  `
}

body.addEventListener('click', async event => {
  // Button-Aktion aus der Tabelle auslesen
  const action = event.target.dataset.action
  if (!action) return

  const row = event.target.closest('tr')
  // ID steckt an der Tabellenzeile
  const id = row.dataset.id

  if (action === 'edit') inlineEdit(row)
  if (action === 'cancel') ladeProdukte()

  if (action === 'save') {
    const result = await updateProdukt(id, datenAusZeile(row))
    if (await pruefe(result)) ladeProdukte()
  }

  if (action === 'delete' && confirm('Produkt wirklich löschen?')) {
    const result = await deleteProdukt(id)
    if (await pruefe(result)) ladeProdukte()
  }
})

document.querySelector('#produkt-form').addEventListener('submit', async event => {
  event.preventDefault()
  const form = event.currentTarget

  // Leere IDs nicht ans Backend senden
  const data = {
    artikelnummer: form.elements.artikelnummer.value,
    bezeichnung: form.elements.bezeichnung.value,
    beschreibung: form.elements.beschreibung.value,
    preis: zahl(form.elements.preis.value),
    bestand: zahl(form.elements.bestand.value),
    mindestbestand: zahl(form.elements.mindestbestand.value),
    einheit: form.elements.einheit.value,
    kategorie_id: form.elements.kategorie_id.value || undefined,
    lieferant_id: form.elements.lieferant_id.value || undefined
  }
  const result = await createProdukt(data)
  if (await pruefe(result)) {
    form.reset()
    ladeProdukte()
  }
})

suche.addEventListener('input', ladeProdukte)

async function initProdukte() {
  await ladeAuswahlDaten()
  await ladeProdukte()
}

initProdukte()
