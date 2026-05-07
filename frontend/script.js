
//Author: Selina Steuer
const API_BASE = "http://localhost:3000/api";
document.addEventListener("DOMContentLoaded", () => {
    loadBewegungen();
    loadProdukteDropdown();
    loadLagerorteDropdown();
    initBewegungForm();

    document.getElementById("toggleFormBtn").addEventListener("click", () => {
        const form = document.getElementById("bewegung-form-container");
        form.style.display = form.style.display === "none" ? "block" : "none";
    });
});


// Lagerorte laden
async function loadLagerorte() {
    const res = await fetch(`${API_BASE}/lagerorte`);
    const data = await res.json();

    const tbody = document.querySelector("#lagerorte-table tbody");
    tbody.innerHTML = "";

    data.forEach(l => {
        tbody.innerHTML += `
            <tr>
                <td>${l.bezeichnung}</td>
                <td>${l.halle}</td>
                <td>${l.kapazität}</td>
                <td>
                    <button onclick="editLagerort('${l._id}')">Bearbeiten</button>
                    <button onclick="deleteLagerort('${l._id}')">Löschen</button>
                </td>
            </tr>
        `;
    });
}


// Formular absenden
function initBewegungForm() {
    const form = document.getElementById("bewegung-form");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(form);

        const payload = {
            typ: formData.get("typ"),
            menge: Number(formData.get("menge")),
            grund: formData.get("grund"),
            produkt_id: formData.get("produkt_id"),
            lagerort_id: formData.get("lagerort_id"),
            datum: new Date().toISOString()
        };

        await fetch(`${API_BASE}/bewegungen`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        loadBewegungen();
        form.reset();
    });
}

async function loadProdukteDropdown() {
    const res = await fetch(`${API_BASE}/produkte`);
    const data = await res.json();

    const select = document.getElementById("produkt-select");
    select.innerHTML = "";

    data.forEach(p => {
        select.innerHTML += `<option value="${p._id}">${p.bezeichnung}</option>`;
    });
}

function showCreateForm() {
    document.querySelector("#form-title").textContent = "Lagerort anlegen";
    document.querySelector("#lagerort-form").reset();
    document.querySelector("input[name=id]").value = "";
    document.querySelector("#lagerort-form-container").style.display = "block";
}
async function editLagerort(id) {
    const res = await fetch(`${API_BASE}/lagerorte/${id}`);
    const data = await res.json();

    document.querySelector("#form-title").textContent = "Lagerort bearbeiten";

    document.querySelector("input[name=id]").value = data._id;
    document.querySelector("input[name=bezeichnung]").value = data.bezeichnung;
    document.querySelector("input[name=halle]").value = data.halle;
    document.querySelector("input[name=kapazität]").value = data.kapazität;

    document.querySelector("#lagerort-form-container").style.display = "block";
}
document.querySelector("#lagerort-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const id = formData.get("id");

    const payload = {
        bezeichnung: formData.get("bezeichnung"),
        halle: formData.get("halle"),
        kapazität: Number(formData.get("kapazität"))
    };

    let url = `${API_BASE}/lagerorte`;
    let method = "POST";

    if (id) {
        url += `/${id}`;
        method = "PUT";
    }

    await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    hideForm();
    loadLagerorte();
});
async function deleteLagerort(id) {
    if (!confirm("Diesen Lagerort wirklich löschen?")) return;

    await fetch(`${API_BASE}/lagerorte/${id}`, {
        method: "DELETE"
    });

    loadLagerorte();
}
function hideForm() {
    document.querySelector("#lagerort-form-container").style.display = "none";
}
async function loadDashboard() {
    loadLagerwert();
    loadProdukteProKategorie();
    loadBewegungenProLagerort();
        loadBewegungenProTag();
}
async function loadLagerwert() {
    const res = await fetch(`${API_BASE}/aggregationen/lagerwert`);
    const data = await res.json();

    document.querySelector("#lagerwert").textContent =
        data.gesamtwert.toLocaleString("de-DE", {
            style: "currency",
            currency: "EUR"
        });
}
async function loadProdukteProKategorie() {
    const res = await fetch(`${API_BASE}/aggregationen/produkte-pro-kategorie`);
    const data = await res.json();

    const labels = data.map(d => d._id);
    const values = data.map(d => d.anzahl);

    new Chart(document.getElementById("chartProdukteProKategorie"), {
        type: "pie",
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: ["#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f"]
            }]
        },
        options: {
    responsive: false,
    maintainAspectRatio: false
}

    });
}

async function loadBewegungenProLagerort() {
    const res = await fetch(`${API_BASE}/aggregationen/pro-lagerort`);
    const data = await res.json();

    const labels = data.map(d => d._id);
    const values = data.map(d => d.anzahl);

    new Chart(document.getElementById("chartBewegungenProLagerort"), {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Bewegungen",
                data: values,
                backgroundColor: "#4e79a7"
            }]
        },
        options: {
    responsive: false,
    maintainAspectRatio: false
}

    });
}
 
async function loadBewegungenProTag() {
    const res = await fetch(`${API_BASE}/aggregationen/pro-tag`);
    const data = await res.json();

    const labels = data.map(d => d._id);
    const values = data.map(d => d.anzahl);

    new Chart(document.getElementById("chartBewegungenProTag"), {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Bewegungen pro Tag",
                data: values,
                borderColor: "blue",
                fill: false
            }]
        },
        options: {
    responsive: false,
    maintainAspectRatio: false
}

    });
}
document.getElementById("toggleFormBtn").addEventListener("click", () => {
    const form = document.getElementById("bewegung-form-container");
    form.style.display = form.style.display === "none" ? "block" : "none";
});

async function loadLagerorteDropdown() {
    const res = await fetch(`${API_BASE}/lagerorte`);
    const data = await res.json();

    const select = document.getElementById("lagerort-select");
    select.innerHTML = "";

    data.forEach(l => {
        select.innerHTML += `<option value="${l._id}">${l.bezeichnung}</option>`;
    });
}

async function loadBewegungen() {
    const res = await fetch(`${API_BASE}/bewegungen`);
    const data = await res.json();

    const tbody = document.querySelector("#bewegungen-table tbody");
    tbody.innerHTML = "";

    data.forEach(b => {
        tbody.innerHTML += `
            <tr>
                <td>${new Date(b.datum).toLocaleDateString()}</td>
                <td>${b.typ}</td>
                <td>${b.menge}</td>
                <td>${b.grund}</td>
                <td>${b.produkt_bezeichnung || "-"}</td>
                <td>${b.lagerort_bezeichnung || "-"}</td>
            </tr>
        `;
    });
}






