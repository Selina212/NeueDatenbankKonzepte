// Author: Selina Steuer

/* global Chart */ // Hinweis für Linter
//Debug-Ausgaben, um sicherzustellen, dass die API-Funktionen verfügbar sind und korrekt antworten
console.log('api functions:', typeof getLagerwert, typeof getProdukteProKategorie);
getLagerwert().then(r => console.log('lagerwert response', r)).catch(e => console.error('lagerwert error', e));
getProdukteProKategorie().then(r => console.log('produkte response', r)).catch(e => console.error('produkte error', e));
//Speicher für Chart-Instanzen, damit sie bei Bedarf zerstört werden können (z.B. vor dem Neuzeichnen)
const _charts = {};
//Dashboard laden
async function loadDashboard() {
  try {
    //mehrere API-Aufrufe parallel, damit die Seite schneller lädt. Sobald alle Daten da sind, werden die entsprechenden Funktionen aufgerufen, um die Tabellen und Charts zu füllen.
    await Promise.all([
      loadLagerwert(),
      loadProdukteProKategorie(),
      loadBewegungenProLagerort(),
      loadBewegungenProTag(),
      loadFilterDropdowns()

    ]);
    //Gesamtanzahl Bewegungen wird separat geladen, da sie nicht direkt von einem eigenen Endpunkt kommt, sondern aus der Summe der Bewegungen pro Tag berechnet wird.
    await loadBewegungenCount();
  } catch (err) {
    console.error('Dashboard laden fehlgeschlagen:', err);
  }
}
//Filter-Parameter aus den Eingabefeldern lesen und als Query-String zurückgeben
function getFilterParams() {
  const params = new URLSearchParams();
//Werte aus den Filterfeldern holen
  const from = document.getElementById("filter-from")?.value;
  const to = document.getElementById("filter-to")?.value;
  const lagerort = document.getElementById("filter-lagerort")?.value;
  const produkt = document.getElementById("filter-produkt")?.value;
//Nur vorhandene Filter anhängen
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  if (lagerort) params.append("lagerort", lagerort);
  if (produkt) params.append("produkt", produkt);

  return params.toString();
}
//Dropdowns für Filter laden
async function loadFilterDropdowns() {
    // aktuelle Auswahl merken
    const selectedLagerort = document.getElementById("filter-lagerort")?.value || "";
    const selectedProdukt = document.getElementById("filter-produkt")?.value || "";

    const lagerorteRes = await getLagerorte();
    const produkteRes = await getProdukte();

    const lagerorte = lagerorteRes.data ?? [];
    const produkte = produkteRes.data ?? [];

    const lagerortSelect = document.getElementById("filter-lagerort");
    const produktSelect = document.getElementById("filter-produkt");

    // Dropdowns leeren
    lagerortSelect.innerHTML = '<option value="">Alle</option>';
    produktSelect.innerHTML = '<option value="">Alle</option>';

    // Lagerorte einfügen
    lagerorte.forEach(l => {
        const opt = document.createElement("option");
        opt.value = l._id;
        opt.textContent = l.bezeichnung;
        lagerortSelect.appendChild(opt);
    });

    // Produkte einfügen
    produkte.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p._id;
        opt.textContent = p.bezeichnung;
        produktSelect.appendChild(opt);
    });

    // Auswahl wiederherstellen
    lagerortSelect.value = selectedLagerort;
    produktSelect.value = selectedProdukt;
}
//Filter zurücksetzen und Dashboard neu laden
function resetFilters() {
  document.getElementById("filter-from").value = "";
  document.getElementById("filter-to").value = "";
  document.getElementById("filter-lagerort").value = "";
  document.getElementById("filter-produkt").value = "";

  loadDashboard();
}

//KPI: Lagerwert laden
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

//Tabellen + Chart: Produkte pro Kategorie
async function loadProdukteProKategorie() {
  try {
    const res = await getProdukteProKategorie(getFilterParams());
    if (!res.ok) throw new Error(res.error || 'Keine Daten');

    const data = res.data ?? res;
    //Tabelle füllen
    populateTable('#kategorien-table tbody', data, row => {
      return `<td>${escapeHtml(row._id ?? 'Unbekannt')}</td><td>${Number(row.anzahl ?? 0)}</td>`;
    });
//Diagramm rendern
    const labels = data.map(r => r._id ?? 'Unbekannt');
    const values = data.map(r => r.anzahl ?? 0);
    renderPie('chartProdukteProKategorie', labels, values);
  } catch (err) {
    console.error('Produkte pro Kategorie Fehler:', err);
  }
}

//Tabellen + Chart: Bewegungen pro Lagerort
async function loadBewegungenProLagerort() {
  try {
    const res = await getBewegungenProLagerort(getFilterParams());
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

//Chart: Bewegungen pro Tag
async function loadBewegungenProTag() {
  try {
    const res = await getBewegungenProTag(getFilterParams());
    if (!res.ok) throw new Error(res.error || 'Keine Daten');
//Daten sortieren, damit die Linie im Chart korrekt dargestellt wird (chronologisch)
    const data = (res.data ?? res).slice().sort((a, b) => String(a._id).localeCompare(String(b._id)));
    const labels = data.map(d => d._id);
    const values = data.map(d => d.anzahl ?? 0);
    renderLine('chartBewegungenProTag', labels, values, 'Bewegungen pro Tag');
  } catch (err) {
    console.error('Bewegungen pro Tag Fehler:', err);
  }
}

//KPI: Gesamtanzahl Bewegungen
async function loadBewegungenCount() {
  try {
    const res = await getBewegungenProTag(getFilterParams());
    if (!res.ok) return;
    const data = res.data ?? res;
    //Summe aller Bewegungen über alle Tage berechnen
    const total = (Array.isArray(data) ? data : []).reduce((s, r) => s + (r.anzahl ?? 0), 0);
    const el = document.getElementById('bewegungen-count');
    if (el) el.textContent = total;
  } catch (err) {
    console.error('Bewegungen Count Fehler:', err);
  }
}

//Helper: Tabelle füllen
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

//Chart Rendering
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
//Chart-Helper: Canvas-Kontext holen und Chart-Instanz zerstören
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

//Utility Funktionen
function generateColors(n) {
  const palette = ['#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#edc949','#af7aa1','#ff9da7','#9c755f','#bab0ac'];
  return Array.from({ length: n }, (_, i) => palette[i % palette.length]);
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, s => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s]));
}
//Filter Buttons aktivieren
document.getElementById("filter-apply").addEventListener("click", loadDashboard);
document.addEventListener("DOMContentLoaded", () => {
  const applyBtn = document.getElementById("filter-apply");
  const resetBtn = document.getElementById("filter-reset");

  if (applyBtn) {
    applyBtn.disabled = false;
    applyBtn.addEventListener("click", loadDashboard);
  }

  if (resetBtn) {
    resetBtn.disabled = false;
    resetBtn.addEventListener("click", resetFilters);
  }
});

//Export for older HTML that calls loadDashboard() directly
window.loadDashboard = loadDashboard;
