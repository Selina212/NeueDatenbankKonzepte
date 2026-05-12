const body = document.querySelector('#lieferanten-body')
const meldung = document.querySelector('#meldung')
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
    name: row.querySelector('[name="name"]').value,
    kontakt: {
      vorname: row.querySelector('[name="kontakt.vorname"]').value,
      nachname: row.querySelector('[name="kontakt.nachname"]').value,
      email: row.querySelector('[name="kontakt.email"]').value,
      telefon: row.querySelector('[name="kontakt.telefon"]').value
    },
    adresse: {
      stadt: row.querySelector('[name="adresse.stadt"]').value,
      plz: row.querySelector('[name="adresse.plz"]').value,
      land: row.querySelector('[name="adresse.land"]').value
    }
  }
}

async function ladeLieferanten() {
  lieferanten = await pruefe(await getLieferanten()) || []
  body.innerHTML = ''

  if (!lieferanten.length) {
    body.innerHTML = '<tr><td class="leer" colspan="6">Keine Lieferanten vorhanden.</td></tr>'
    return
  }

  lieferanten.forEach(lieferant => {
    const kontakt = lieferant.kontakt || {}
    const adresse = lieferant.adresse || {}

    body.insertAdjacentHTML('beforeend', `
      <tr data-id="${lieferant._id}">
        <td>${wert(lieferant.name)}</td>
        <td>${wert(kontakt.vorname)} ${wert(kontakt.nachname)}</td>
        <td>${wert(kontakt.email)}</td>
        <td>${wert(kontakt.telefon)}</td>
        <td>${wert(adresse.stadt)}</td>
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
  const lieferant = lieferanten.find(item => item._id === row.dataset.id)
  const kontakt = lieferant.kontakt || {}
  const adresse = lieferant.adresse || {}

  row.innerHTML = `
    <td><input name="name" required value="${wert(lieferant.name)}"></td>
    <td>
      <input name="kontakt.vorname" placeholder="Vorname" value="${wert(kontakt.vorname)}">
      <input name="kontakt.nachname" placeholder="Nachname" value="${wert(kontakt.nachname)}">
    </td>
    <td><input name="kontakt.email" type="email" value="${wert(kontakt.email)}"></td>
    <td><input name="kontakt.telefon" value="${wert(kontakt.telefon)}"></td>
    <td>
      <input name="adresse.stadt" placeholder="Stadt" value="${wert(adresse.stadt)}">
      <input name="adresse.plz" placeholder="PLZ" value="${wert(adresse.plz)}">
      <input name="adresse.land" placeholder="Land" value="${wert(adresse.land)}">
    </td>
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
  if (action === 'cancel') ladeLieferanten()

  if (action === 'save') {
    const result = await updateLieferant(id, datenAusZeile(row))
    if (await pruefe(result)) ladeLieferanten()
  }

  if (action === 'delete' && confirm('Lieferant wirklich loeschen?')) {
    const result = await deleteLieferant(id)
    if (await pruefe(result)) ladeLieferanten()
  }
})

document.querySelector('#lieferant-form').addEventListener('submit', async event => {
  event.preventDefault()
  const form = event.currentTarget
  const data = {
    name: form.elements.name.value,
    kontakt: {
      vorname: form.elements['kontakt.vorname'].value,
      nachname: form.elements['kontakt.nachname'].value,
      email: form.elements['kontakt.email'].value,
      telefon: form.elements['kontakt.telefon'].value
    },
    adresse: {
      stadt: form.elements['adresse.stadt'].value,
      plz: form.elements['adresse.plz'].value,
      land: form.elements['adresse.land'].value
    }
  }
  const result = await createLieferant(data)
  if (await pruefe(result)) {
    form.reset()
    ladeLieferanten()
  }
})

ladeLieferanten()
