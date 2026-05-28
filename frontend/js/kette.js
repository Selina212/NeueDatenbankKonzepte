// Author: Raphael Falk
// Lädt die 4er-Kette in die Tabelle

const body = document.querySelector('#kette-body')
const meldung = document.querySelector('#meldung')

function zeigeFehler(text) {
  meldung.textContent = text
  meldung.className = 'meldung fehler'
}

function leereFehler() {
  meldung.textContent = ''
  meldung.className = 'meldung'
}

function wert(value) {
  return value ?? ''
}

function datum(value) {
  if (!value) return ''

  // Datum als TT.MM.JJJJ anzeigen
  const date = new Date(value)
  const tag = String(date.getDate()).padStart(2, '0')
  const monat = String(date.getMonth() + 1).padStart(2, '0')

  return `${tag}.${monat}.${date.getFullYear()}`
}

async function pruefe(result) {
  // Fehler oberhalb der Tabelle anzeigen
  if (!result.ok) {
    zeigeFehler(result.error)
    return null
  }
  leereFehler()
  return result.data
}

async function ladeKette() {
  // Backend gibt Objekt mit daten zurück
  const antwort = await pruefe(await getKette())
  // Nur daten ist die Tabelle
  const daten = antwort ? antwort.daten : []
  body.innerHTML = ''

  if (!daten.length) {
    body.innerHTML = '<tr><td class="leer" colspan="7">Keine Daten vorhanden.</td></tr>'
    return
  }

  daten.forEach(eintrag => {
    // Eine Tabellenzeile pro Ketten-Treffer
    body.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${wert(eintrag.lagerort)}</td>
        <td>${datum(eintrag.datum)}</td>
        <td>${wert(eintrag.typ)}</td>
        <td>${wert(eintrag.menge)}</td>
        <td>${wert(eintrag.produkt)}</td>
        <td>${wert(eintrag.artikelnummer)}</td>
        <td>${wert(eintrag.kategorie)}</td>
      </tr>
    `)
  })
}

ladeKette()
