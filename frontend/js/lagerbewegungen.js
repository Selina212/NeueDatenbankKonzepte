//Author: Raphael Falk
const body = document.querySelector('#lagerbewegungen-body')
const meldung = document.querySelector('#meldung')
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

async function ladeLagerbewegungen() {
  const bewegungen = await pruefe(await getLagerbewegungen()) || []
  body.innerHTML = ''

  if (!bewegungen.length) {
    body.innerHTML = '<tr><td class="leer" colspan="8">Keine Lagerbewegungen vorhanden.</td></tr>'
    return
  }

  bewegungen.forEach(bewegung => {
    const produkt = bewegung.produkt || {}
    const lieferant = bewegung.lieferant || {}
    const kontakt = lieferant.kontakt || {}

    body.insertAdjacentHTML('beforeend', `
      <tr data-id="${bewegung._id}">
        <td>${datum(bewegung.datum)}</td>
        <td>${wert(bewegung.typ)}</td>
        <td>${wert(bewegung.menge)}</td>
        <td>${wert(bewegung.grund)}</td>
        <td>${wert(produkt.bezeichnung)}</td>
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

async function initLagerbewegungen() {
  await ladeLagerbewegungen()
}

initLagerbewegungen()
