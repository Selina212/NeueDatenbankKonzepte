const body = document.querySelector('#lagerbewegungen-body')
const meldung = document.querySelector('#meldung')
const form = document.querySelector('#bewegung-form')
const formContainer = document.querySelector('#bewegung-form-container')
const ketteContainer = document.querySelector('#kette-details')

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
  return value ? new Date(value).toLocaleDateString('de-DE') : ''
}

async function pruefe(result) {
  if (!result.ok) {
    zeigeFehler(result.error)
    return null
  }
  leereFehler()
  return result.data
}

async function ladeDropdowns() {
  const produkte = await pruefe(await getProdukte()) || []
  const lagerorte = await pruefe(await getLagerorte()) || []

  const produktSelect = document.querySelector('#produkt-select')
  const lagerortSelect = document.querySelector('#lagerort-select')

  produktSelect.innerHTML = ''
  lagerortSelect.innerHTML = ''

  produkte.forEach(produkt => {
    produktSelect.insertAdjacentHTML('beforeend', `<option value="${produkt._id}">${wert(produkt.bezeichnung)}</option>`)
  })

  lagerorte.forEach(lagerort => {
    lagerortSelect.insertAdjacentHTML('beforeend', `<option value="${lagerort._id}">${wert(lagerort.bezeichnung)}</option>`)
  })
}

async function ladeLagerbewegungen() {
  const bewegungen = await pruefe(await getLagerbewegungen()) || []
  body.innerHTML = ''

  if (!bewegungen.length) {
    body.innerHTML = '<tr><td class="leer" colspan="9">Keine Lagerbewegungen vorhanden.</td></tr>'
    return
  }

  bewegungen.forEach(bewegung => {
    const produkt = bewegung.produkt || {}
    const lieferant = bewegung.lieferant || {}
    const kontakt = lieferant.kontakt || {}
    const lagerort = bewegung.lagerort || {}

    body.insertAdjacentHTML('beforeend', `
      <tr data-id="${bewegung._id}">
        <td>${datum(bewegung.datum)}</td>
        <td>${wert(bewegung.typ)}</td>
        <td>${wert(bewegung.menge)}</td>
        <td>${wert(bewegung.grund)}</td>
        <td>${wert(produkt.bezeichnung)}</td>
        <td>${wert(lagerort.bezeichnung)}</td>
        <td>${wert(lieferant.name)}</td>
        <td>${wert(kontakt.email)}</td>
        <td>
          <div class="aktionen">
            <button class="btn-bearbeiten" type="button" data-action="kette">Kette</button>
          </div>
        </td>
      </tr>
    `)
  })
}

async function zeigeKette(id) {
  const kette = await pruefe(await getLagerbewegungKette(id))
  if (!kette) return

  ketteContainer.innerHTML = `
    <h3>4er-Kette</h3>
    <p><strong>Lagerbewegung:</strong> ${wert(kette.bewegung.typ)} ${wert(kette.bewegung.menge)} am ${datum(kette.bewegung.datum)}</p>
    <p><strong>Produkt:</strong> ${wert(kette.produkt?.bezeichnung)}</p>
    <p><strong>Lieferant:</strong> ${wert(kette.lieferant?.name)}</p>
    <p><strong>Kontakt:</strong> ${wert(kette.kontakt?.vorname)} ${wert(kette.kontakt?.nachname)} ${wert(kette.kontakt?.email)}</p>
    <p><strong>Lagerort:</strong> ${wert(kette.lagerort?.bezeichnung)}</p>
  `
}

body.addEventListener('click', async event => {
  const action = event.target.dataset.action
  if (!action) return

  const row = event.target.closest('tr')
  const id = row.dataset.id

  if (action === 'kette') {
    zeigeKette(id)
  }

})

document.querySelector('#toggleFormBtn').addEventListener('click', () => {
  formContainer.style.display = formContainer.style.display === 'none' ? 'block' : 'none'
})

form.addEventListener('submit', async event => {
  event.preventDefault()

  const data = {
    typ: form.elements.typ.value,
    menge: Number(form.elements.menge.value),
    grund: form.elements.grund.value,
    produkt_id: form.elements.produkt_id.value,
    lagerort_id: form.elements.lagerort_id.value
  }

  const result = await createLagerbewegung(data)
  if (await pruefe(result)) {
    form.reset()
    formContainer.style.display = 'none'
    await ladeDropdowns()
    await ladeLagerbewegungen()
  }
})

async function initLagerbewegungen() {
  await ladeDropdowns()
  await ladeLagerbewegungen()
}

initLagerbewegungen()
