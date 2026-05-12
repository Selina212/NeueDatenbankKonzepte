const BASE_URL = 'http://localhost:3000/api'

async function request(path, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    })

    const text = await response.text()
    const data = text ? JSON.parse(text) : null

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || data?.details || `Anfrage fehlgeschlagen (${response.status})`
      }
    }

    return { ok: true, data }
  } catch (error) {
    return {
      ok: false,
      error: `API nicht erreichbar: ${error.message}`
    }
  }
}

function getKategorien() {
  return request('/kategorien')
}

function getKategorieById(id) {
  return request(`/kategorien/${id}`)
}

function createKategorie(data) {
  return request('/kategorien', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

function updateKategorie(id, data) {
  return request(`/kategorien/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

function deleteKategorie(id) {
  return request(`/kategorien/${id}`, { method: 'DELETE' })
}

function getLieferanten() {
  return request('/lieferanten')
}

function getLieferantById(id) {
  return request(`/lieferanten/${id}`)
}

function createLieferant(data) {
  return request('/lieferanten', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

function updateLieferant(id, data) {
  return request(`/lieferanten/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

function deleteLieferant(id) {
  return request(`/lieferanten/${id}`, { method: 'DELETE' })
}

function getProdukte() {
  return request('/produkte')
}

function sucheProdukte(q) {
  return request(`/produkte/suche?q=${encodeURIComponent(q)}`)
}

function getProduktById(id) {
  return request(`/produkte/${id}`)
}

function createProdukt(data) {
  return request('/produkte', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

function updateProdukt(id, data) {
  return request(`/produkte/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

function deleteProdukt(id) {
  return request(`/produkte/${id}`, { method: 'DELETE' })
}

function getLagerbewegungen() {
  return request('/lagerbewegungen')
}

function getLagerbewegungById(id) {
  return request(`/lagerbewegungen/${id}`)
}

function getLagerbewegungKette(id) {
  return request(`/lagerbewegungen/${id}/kette`)
}
