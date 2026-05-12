const body = document.querySelector('#bewegungen-body')
const meldung = document.querySelector('#meldung')
let bewegungen = []
async function ladeProduktDropdown() {
  const result = await getProdukte()
  const produkte = await pruefe(result) || []

  const select = document.querySelector('#produkt_id')
  select.innerHTML = '<option value="">Bitte wählen…</option>'

  produkte.forEach(p => {
    select.insertAdjacentHTML('beforeend', `
      <option value="${p._id}">${p.bezeichnung}</option>
    `)
  })
}


async function ladeLagerortDropdown() {
  const result = await getLagerorte()
  const lagerorte = await pruefe(result) || []

  const select = document.querySelector('#lagerort_id')
  select.innerHTML = '<option value="">Bitte wählen…</option>'

  lagerorte.forEach(l => {
    select.insertAdjacentHTML('beforeend', `
      <option value="${l._id}">${l.bezeichnung}</option>
    `)
  })
}



function zeigeFehler(text) {
  meldung.textContent = text
  meldung.className = 'meldung fehler'
}

function leereFehler() {
  meldung.textContent = ''
  meldung.className = 'meldung'
}

function wert(v) {
  return v ?? ''
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
    datum: row.querySelector('[name="datum"]').value,
    typ: row.querySelector('[name="typ"]').value,
    menge: Number(row.querySelector('[name="menge"]').value),
    grund: row.querySelector('[name="grund"]').value,
    produkt_id: row.querySelector('[name="produkt_id"]').value,
    lagerort_id: row.querySelector('[name="lagerort_id"]').value
  }
}

async function ladeBewegungen() {
  bewegungen = await pruefe(await getLagerbewegungen()) || []
  body.innerHTML = ''

  if (!bewegungen.length) {
    body.innerHTML = '<tr><td class="leer" colspan="7">Keine Bewegungen vorhanden.</td></tr>'
    return
  }

  bewegungen.forEach(b => {
    const produkt = b.produkt || b.produkt_id || {}
    const lieferant = b.lieferant || {}
    const lagerort = b.lagerort || b.lagerort_id || {}

    body.insertAdjacentHTML('beforeend', `
      <tr data-id="${b._id}">
        <td>${wert(new Date(b.datum).toLocaleDateString())}</td>
        <td>${wert(b.typ)}</td>
        <td>${wert(b.menge)}</td>
        <td>${wert(b.grund)}</td>
        <td>${wert(produkt.name || produkt.bezeichnung || '–')}</td>
        <td>${wert(lagerort.bezeichnung || '–')}</td>
        <td>
          <div class="aktionen">
            <button data-action="edit">Bearbeiten</button>
            <button data-action="delete">Löschen</button>
          </div>
        </td>
      </tr>
    `)
  })
}

function inlineEdit(row) {
  const b = bewegungen.find(x => x._id === row.dataset.id)

  row.innerHTML = `
    <td><input name="datum" type="date" value="${wert(b.datum?.substring(0,10))}"></td>

    <td>
      <select name="typ">
        <option value="">Bitte wählen…</option>
        <option value="Eingang" ${b.typ === 'Eingang' ? 'selected' : ''}>Eingang</option>
        <option value="Ausgang" ${b.typ === 'Ausgang' ? 'selected' : ''}>Ausgang</option>
      </select>
    </td>

    <td><input name="menge" type="number" value="${wert(b.menge)}"></td>
    <td><input name="grund" value="${wert(b.grund)}"></td>

    <td>
      <select name="produkt_id" id="edit-produkt-${b._id}">
        <option value="">Bitte wählen…</option>
      </select>
    </td>

    <td>
      <select name="lagerort_id" id="edit-lagerort-${b._id}">
        <option value="">Bitte wählen…</option>
      </select>
    </td>

    <td>
      <button data-action="save">Speichern</button>
      <button data-action="cancel">Abbrechen</button>
    </td>
  `

  // Dropdowns laden
  ladeProduktDropdownInline(`edit-produkt-${b._id}`, b.produkt?._id || b.produkt_id)
  ladeLagerortDropdownInline(`edit-lagerort-${b._id}`, b.lagerort?._id || b.lagerort_id)
}


 
async function ladeProduktDropdownInline(id, selected) {
  const result = await getProdukte()
  const produkte = await pruefe(result) || []

  const select = document.getElementById(id)
  select.innerHTML = '<option value="">Bitte wählen…</option>'

  produkte.forEach(p => {
    select.insertAdjacentHTML('beforeend', `
      <option value="${p._id}" ${p._id === selected ? 'selected' : ''}>
        ${p.bezeichnung}
      </option>
    `)
  })
}


async function ladeLagerortDropdownInline(id, selected) {
  const result = await getLagerorte()
  const lagerorte = await pruefe(result) || []

  const select = document.getElementById(id)
  select.innerHTML = '<option value="">Bitte wählen…</option>'

  lagerorte.forEach(l => {
    select.insertAdjacentHTML('beforeend', `
      <option value="${l._id}" ${l._id === selected ? 'selected' : ''}>
        ${l.bezeichnung}
      </option>
    `)
  })
}

body.addEventListener('click', async event => {
  const action = event.target.dataset.action
  if (!action) return

  const row = event.target.closest('tr')
  const id = row.dataset.id

  if (action === 'edit') inlineEdit(row)
  if (action === 'cancel') ladeBewegungen()

  if (action === 'save') {
    const result = await updateLagerbewegung(id, datenAusZeile(row))
    if (await pruefe(result)) ladeBewegungen()
  }

  if (action === 'delete' && confirm('Bewegung wirklich löschen?')) {
    const result = await deleteLagerbewegung(id)
    if (await pruefe(result)) ladeBewegungen()
  }
})

document.querySelector('#bewegung-form').addEventListener('submit', async event => {
  event.preventDefault()
  const form = event.currentTarget

  const data = {
    datum: form.elements.datum.value,
    typ: form.elements.typ.value,
    menge: Number(form.elements.menge.value),
    grund: form.elements.grund.value,
    produkt_id: form.elements.produkt_id.value,
    lagerort_id: form.elements.lagerort_id.value
  }

  const result = await createLagerbewegung(data)
  if (await pruefe(result)) {
    form.reset()
    ladeBewegungen()
  }
})
ladeProduktDropdown()
ladeLagerortDropdown()

ladeBewegungen()
