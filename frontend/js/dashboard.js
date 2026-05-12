function euro(value) {
  return Number(value || 0).toLocaleString('de-DE', {
    style: 'currency',
    currency: 'EUR'
  })
}

async function ladeLagerwert() {
  const result = await getLagerwert()
  if (!result.ok) return

  document.querySelector('#lagerwert').textContent = euro(result.data.gesamtwert)
}

function renderTabelle(selector, daten, leertext) {
  const body = document.querySelector(selector)
  body.innerHTML = ''

  if (!daten.length) {
    body.innerHTML = `<tr><td class="leer" colspan="2">${leertext}</td></tr>`
    return
  }

  daten.forEach(eintrag => {
    body.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${eintrag._id || '-'}</td>
        <td>${eintrag.anzahl}</td>
      </tr>
    `)
  })
}

async function ladeProdukteProKategorie() {
  const result = await getProdukteProKategorie()
  if (!result.ok) return

  const labels = result.data.map(d => d._id)
  const values = result.data.map(d => d.anzahl)
  renderTabelle('#kategorien-table tbody', result.data, 'Keine Daten vorhanden.')

  new Chart(document.getElementById('chartProdukteProKategorie'), {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  })
}

async function ladeBewegungenProLagerort() {
  const result = await getBewegungenProLagerort()
  if (!result.ok) return

  const labels = result.data.map(d => d._id)
  const values = result.data.map(d => d.anzahl)
  renderTabelle('#lagerort-table tbody', result.data, 'Keine Daten vorhanden.')

  new Chart(document.getElementById('chartBewegungenProLagerort'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Bewegungen',
        data: values,
        backgroundColor: '#4e79a7'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  })
}

async function ladeBewegungenProTag() {
  const result = await getBewegungenProTag()
  if (!result.ok) return

  const labels = result.data.map(d => d._id)
  const values = result.data.map(d => d.anzahl)

  new Chart(document.getElementById('chartBewegungenProTag'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Bewegungen pro Tag',
        data: values,
        borderColor: '#246bce',
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  })
}

async function loadDashboard() {
  await ladeLagerwert()
  await ladeProdukteProKategorie()
  await ladeBewegungenProLagerort()
  await ladeBewegungenProTag()
}

loadDashboard()
