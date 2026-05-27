//Author: Selina Steuer
const body = document.querySelector('#lagerorte-body')
const meldung = document.querySelector('#meldung')
let lagerorte = []

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
  if (!result.ok) {
    zeigeFehler(result.error)
    return null
  }
  leereFehler()
  return result.data
}

function datenAusZeile(row) {
  return {
    bezeichnung: row.querySelector('[name="bezeichnung"]').value,
    halle: row.querySelector('[name="halle"]').value,
    kapazität: Number(row.querySelector('[name="kapazität"]').value)
  }
}

async function ladeLagerorte() {
  lagerorte = await pruefe(await getLagerorte()) || []
  body.innerHTML = ''

  if (!lagerorte.length) {
    body.innerHTML = '<tr><td class="leer" colspan="4">Keine Lagerorte vorhanden.</td></tr>'
    return
  }

  lagerorte.forEach(item => {
    body.insertAdjacentHTML('beforeend', `
      <tr data-id="${item._id}">
        <td>${wert(item.bezeichnung)}</td>
        <td>${wert(item.halle)}</td>
        <td>${wert(item.kapazität)}</td>
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

function inlineEdit(row) {
  const item = lagerorte.find(x => x._id === row.dataset.id)

  row.innerHTML = `
    <td><input name="bezeichnung" required value="${wert(item.bezeichnung)}"></td>
    <td><input name="halle" required value="${wert(item.halle)}"></td>
    <td><input name="kapazität" type="number" required value="${wert(item.kapazität)}"></td>
    <td>
      <div class="aktionen">
        <button class="btn-anlegen" type="button" data-action="save">Speichern</button>
        <button class="btn-loeschen" type="button" data-action="cancel">Abbrechen</button>
      </div>
    </td>
  `
}

body.addEventListener('click', async event => {
  const action = event.target.dataset.action
  if (!action) return

  const row = event.target.closest('tr')
  const id = row.dataset.id

  if (action === 'edit') inlineEdit(row)
  if (action === 'cancel') ladeLagerorte()

  if (action === 'save') {
    const result = await updateLagerort(id, datenAusZeile(row))
    if (await pruefe(result)) ladeLagerorte()
  }

  if (action === 'delete' && confirm('Lagerort wirklich löschen?')) {
    const result = await deleteLagerort(id)
    if (await pruefe(result)) ladeLagerorte()
  }
})

document.querySelector('#lagerort-form').addEventListener('submit', async event => {
  event.preventDefault()
  const form = event.currentTarget

  const data = {
    bezeichnung: form.elements.bezeichnung.value,
    halle: form.elements.halle.value,
    kapazität: Number(form.elements.kapazität.value)
  }

  const result = await createLagerort(data)
  if (await pruefe(result)) {
    form.reset()
    ladeLagerorte()
  }
})

ladeLagerorte()
