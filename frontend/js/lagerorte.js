const body = document.querySelector('#lagerorte-body')
const meldung = document.querySelector('#meldung')
const form = document.querySelector('#lagerort-form')
const formContainer = document.querySelector('#lagerort-form-container')
const formTitel = document.querySelector('#form-title')

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

function showCreateForm() {
  formTitel.textContent = 'Lagerort anlegen'
  form.reset()
  form.elements.id.value = ''
  formContainer.style.display = 'block'
}

function hideForm() {
  formContainer.style.display = 'none'
}

async function ladeLagerorte() {
  const lagerorte = await pruefe(await getLagerorte()) || []
  body.innerHTML = ''

  if (!lagerorte.length) {
    body.innerHTML = '<tr><td class="leer" colspan="4">Keine Lagerorte vorhanden.</td></tr>'
    return
  }

  lagerorte.forEach(lagerort => {
    body.insertAdjacentHTML('beforeend', `
      <tr data-id="${lagerort._id}">
        <td>${wert(lagerort.bezeichnung)}</td>
        <td>${wert(lagerort.halle)}</td>
        <td>${wert(lagerort.kapazitaet)}</td>
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

body.addEventListener('click', async event => {
  const action = event.target.dataset.action
  if (!action) return

  const row = event.target.closest('tr')
  const id = row.dataset.id

  if (action === 'edit') {
    const lagerort = await pruefe(await getLagerortById(id))
    if (!lagerort) return

    formTitel.textContent = 'Lagerort bearbeiten'
    form.elements.id.value = lagerort._id
    form.elements.bezeichnung.value = lagerort.bezeichnung || ''
    form.elements.halle.value = lagerort.halle || ''
    form.elements.kapazitaet.value = lagerort.kapazitaet || ''
    formContainer.style.display = 'block'
  }

  if (action === 'delete' && confirm('Diesen Lagerort wirklich loeschen?')) {
    const result = await deleteLagerort(id)
    if (await pruefe(result)) ladeLagerorte()
  }
})

document.querySelector('#show-create-form').addEventListener('click', showCreateForm)
document.querySelector('#hide-form').addEventListener('click', hideForm)

form.addEventListener('submit', async event => {
  event.preventDefault()

  const id = form.elements.id.value
  const data = {
    bezeichnung: form.elements.bezeichnung.value,
    halle: form.elements.halle.value,
    kapazitaet: Number(form.elements.kapazitaet.value)
  }

  const result = id ? await updateLagerort(id, data) : await createLagerort(data)
  if (await pruefe(result)) {
    hideForm()
    ladeLagerorte()
  }
})

ladeLagerorte()
