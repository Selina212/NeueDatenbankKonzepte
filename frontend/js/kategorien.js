//Author: Raphael Falk
const body = document.querySelector('#kategorien-body')
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

async function pruefe(result) {
  // Die API-Funktionen geben immer ok:true oder ok:false zurück.
  if (!result.ok) {
    zeigeFehler(result.error)
    return null
  }
  leereFehler()
  return result.data
}

async function ladeKategorien() {
  const kategorien = await pruefe(await getKategorien())
  body.innerHTML = ''

  if (!kategorien) return
  if (!kategorien.length) {
    body.innerHTML = '<tr><td class="leer" colspan="3">Keine Kategorien vorhanden.</td></tr>'
    return
  }

  kategorien.forEach(kategorie => {
    // Die Tabelle wird aus den geladenen Dokumenten neu aufgebaut.
    body.insertAdjacentHTML('beforeend', `
      <tr data-id="${kategorie._id}">
        <td>${wert(kategorie.name)}</td>
        <td>${wert(kategorie.beschreibung)}</td>
        <td>
          <div class="aktionen">
            <button class="btn-bearbeiten" type="button" data-action="edit">Bearbeiten</button>
            <button class="btn-loeschen" type="button" data-action="delete">Loeschen</button>
          </div>
        </td>
      </tr>
    `)
  })
}

function inlineEdit(row) {
  const name = row.children[0].textContent
  const beschreibung = row.children[1].textContent

  // Die Anzeigezeile wird kurzzeitig durch Eingabefelder ersetzt.
  row.innerHTML = `
    <td><input name="name" required value="${name}"></td>
    <td><textarea name="beschreibung">${beschreibung}</textarea></td>
    <td>
      <div class="aktionen">
        <button class="btn-anlegen" type="button" data-action="save">Speichern</button>
        <button class="btn-loeschen" type="button" data-action="cancel">Abbrechen</button>
      </div>
    </td>
  `
}

body.addEventListener('click', async event => {
  // Alle Tabellenbuttons werden über einen gemeinsamen Klick-Handler behandelt.
  const action = event.target.dataset.action
  if (!action) return

  const row = event.target.closest('tr')
  const id = row.dataset.id

  if (action === 'edit') inlineEdit(row)
  if (action === 'cancel') ladeKategorien()

  if (action === 'save') {
    const data = {
      name: row.querySelector('[name="name"]').value,
      beschreibung: row.querySelector('[name="beschreibung"]').value
    }
    const result = await updateKategorie(id, data)
    if (await pruefe(result)) ladeKategorien()
  }

  if (action === 'delete' && confirm('Kategorie wirklich loeschen?')) {
    const result = await deleteKategorie(id)
    if (await pruefe(result)) ladeKategorien()
  }
})

document.querySelector('#kategorie-form').addEventListener('submit', async event => {
  event.preventDefault()
  const form = event.currentTarget
  // Die Formulardaten entsprechen direkt den Feldern im Kategorie-Dokument.
  const data = {
    name: form.elements.name.value,
    beschreibung: form.elements.beschreibung.value
  }
  const result = await createKategorie(data)
  if (await pruefe(result)) {
    form.reset()
    ladeKategorien()
  }
})

ladeKategorien()
