// dashboard.js — Author: Selina Steuer
// Erwartet: api.js im selben Scope mit Funktionen:
// getLagerwert(), getProdukteProKategorie(), getBewegungenProLagerort(), getBewegungenProTag()

/* global Chart */ // Hinweis für Linter
console.log('api functions:', typeof getLagerwert, typeof getProdukteProKategorie);
getLagerwert().then(r => console.log('lagerwert response', r)).catch(e => console.error('lagerwert error', e));
getProdukteProKategorie().then(r => console.log('produkte response', r)).catch(e => console.error('produkte error', e));

const _charts = {};

/**
 * Public entry used in deinem HTML: <script>loadDashboard();</script>
 */
async function loadDashboard() {
  try {
    await Promise.all([
      loadLagerwert(),
      loadProdukteProKategorie(),
      loadBewegungenProLagerort(),
      loadBewegungenProTag()
    ]);
    await loadBewegungenCount();
  } catch (err) {
    console.error('Dashboard laden fehlgeschlagen:', err);
  }
}

/* ---------------- KPI: Lagerwert ---------------- */
async function loadLagerwert() {
  try {
    const res = await getLagerwert();
    if (!res.ok) throw new Error(res.error || 'Keine Daten');

    // Backend kann { gesamtwert: X } oder [{ gesamtwert: X }] liefern
    const payload = res.data ?? res;
    const wert = payload.gesamtwert ?? (Array.isArray(payload) && payload[0]?.gesamtwert) ?? 0;

    const el = document.getElementById('lagerwert');
    if (el) el.textContent = Number(wert).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  } catch (err) {
    console.error('Lagerwert Fehler:', err);
    const el = document.getElementById('lagerwert');
    if (el) el.textContent = 'Fehler';
  }
}

/* ---------------- Tabellen + Chart: Produkte pro Kategorie ---------------- */
async function loadProdukteProKategorie() {
  try {
    const res = await getProdukteProKategorie();
    if (!res.ok) throw new Error(res.error || 'Keine Daten');

    const data = res.data ?? res;
    populateTable('#kategorien-table tbody', data, row => {
      return `<td>${escapeHtml(row.bezeichnung ?? 'Unbekannt')}</td><td>${Number(row.anzahl ?? 0)}</td>`;
    });

    const labels = data.map(r => r.bezeichnung ?? 'Unbekannt');
    const values = data.map(r => r.anzahl ?? 0);
    renderPie('chartProdukteProKategorie', labels, values);
  } catch (err) {
    console.error('Produkte pro Kategorie Fehler:', err);
  }
}

/* ---------------- Tabellen + Chart: Bewegungen pro Lagerort ---------------- */
async function loadBewegungenProLagerort() {
  try {
    const res = await getBewegungenProLagerort();
    if (!res.ok) throw new Error(res.error || 'Keine Daten');

    const data = res.data ?? res;
    populateTable('#lagerort-table tbody', data, row => {
      return `<td>${escapeHtml(row.bezeichnung ?? 'Unbekannt')}</td><td>${Number(row.anzahl ?? 0)}</td>`;
    });

    const labels = data.map(r => r.bezeichnung ?? 'Unbekannt');
    const values = data.map(r => r.anzahl ?? 0);
    renderBar('chartBewegungenProLagerort', labels, values, 'Bewegungen');
  } catch (err) {
    console.error('Bewegungen pro Lagerort Fehler:', err);
  }
}

/* ---------------- Chart: Bewegungen pro Tag ---------------- */
async function loadBewegungenProTag() {
  try {
    const res = await getBewegungenProTag();
    if (!res.ok) throw new Error(res.error || 'Keine Daten');

    const data = (res.data ?? res).slice().sort((a, b) => String(a._id).localeCompare(String(b._id)));
    const labels = data.map(d => d._id);
    const values = data.map(d => d.anzahl ?? 0);
    renderLine('chartBewegungenProTag', labels, values, 'Bewegungen pro Tag');
  } catch (err) {
    console.error('Bewegungen pro Tag Fehler:', err);
  }
}

/* ---------------- KPI: Gesamtanzahl Bewegungen ---------------- */
async function loadBewegungenCount() {
  try {
    const res = await getBewegungenProTag();
    if (!res.ok) return;
    const data = res.data ?? res;
    const total = (Array.isArray(data) ? data : []).reduce((s, r) => s + (r.anzahl ?? 0), 0);
    const el = document.getElementById('bewegungen-count');
    if (el) el.textContent = total;
  } catch (err) {
    console.error('Bewegungen Count Fehler:', err);
  }
}

/* ---------------- Helpers: Tabelle füllen ---------------- */
function populateTable(selector, rows, rowRenderer) {
  const tbody = document.querySelector(selector);
  if (!tbody) return;
  tbody.innerHTML = '';
  (rows || []).forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = rowRenderer(row);
    tbody.appendChild(tr);
  });
}

/* ---------------- Chart Rendering ---------------- */
function renderPie(id, labels, data) {
  destroyChart(id);
  const ctx = getCanvasContext(id);
  if (!ctx) return;
  _charts[id] = new Chart(ctx, {
    type: 'pie',
    data: { labels, datasets: [{ data, backgroundColor: generateColors(data.length) }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
  });
}

function renderBar(id, labels, data, label = '') {
  destroyChart(id);
  const ctx = getCanvasContext(id);
  if (!ctx) return;
  _charts[id] = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label, data, backgroundColor: '#4e79a7' }] },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
  });
}

function renderLine(id, labels, data, label = '') {
  destroyChart(id);
  const ctx = getCanvasContext(id);
  if (!ctx) return;
  _charts[id] = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ label, data, borderColor: '#2b7cff', backgroundColor: 'rgba(43,124,255,0.08)', fill: true }] },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
  });
}

function getCanvasContext(id) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn('Canvas nicht gefunden:', id);
    return null;
  }
  return el.getContext('2d');
}

function destroyChart(id) {
  if (_charts[id]) {
    try { _charts[id].destroy(); } catch (e) { /* ignore */ }
    delete _charts[id];
  }
}

/* ---------------- Utility ---------------- */
function generateColors(n) {
  const palette = ['#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#edc949','#af7aa1','#ff9da7','#9c755f','#bab0ac'];
  return Array.from({ length: n }, (_, i) => palette[i % palette.length]);
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, s => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s]));
}

/* ---------------- Export for older HTML that calls loadDashboard() directly ---------------- */
window.loadDashboard = loadDashboard;
