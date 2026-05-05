
//Author: Selina Steuer
const API_BASE = "http://localhost:3000/api";

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


// Bewegungen laden
async function loadBewegungen() {
    // Lagerorte und Bewegungen parallel laden
    const [bewegRes, lagerRes] = await Promise.all([
        fetch(`${API_BASE}/bewegungen`),
        fetch(`${API_BASE}/lagerorte`)
    ]);

    const bewegungen = await bewegRes.json();
    const lagerorte = await lagerRes.json();

    // Map: lagerortId -> Bezeichnung
    const lagerMap = {};
    lagerorte.forEach(l => {
        // _id kommt im JSON als String
        lagerMap[l._id] = l.bezeichnung;
    });

    const tbody = document.querySelector("#bewegungen-table tbody");
    tbody.innerHTML = "";

    bewegungen.forEach(b => {
        const lagerName = lagerMap[b.lagerort_id] || b.lagerort_id || "?";

        tbody.innerHTML += `
            <tr>
                <td>${b.typ}</td>
                <td>${b.menge}</td>
                <td>${new Date(b.datum).toLocaleDateString()}</td>
                <td>${lagerName}</td>
            </tr>
        `;
    });
}

// Dropdown für Lagerorte
async function loadLagerorteDropdown() {
    const res = await fetch(`${API_BASE}/lagerorte`);
    const data = await res.json();

    const select = document.querySelector("#lagerort-select");
    data.forEach(l => {
        select.innerHTML += `<option value="${l._id}">${l.bezeichnung}</option>`;
    });
}

// Formular absenden
function initBewegungForm() {
    const form = document.querySelector("#bewegung-form");

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

        const res = await fetch(`${API_BASE}/bewegungen`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Bewegung gespeichert!");
            window.location.href = "bewegungen.html";
        } else {
            alert("Fehler beim Speichern");
        }
    });

}
async function loadProdukteDropdown() {
    const res = await fetch(`${API_BASE}/produkte`);
    const data = await res.json();

    const select = document.querySelector("#produkt-select");
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

    const tbody = document.querySelector("#kategorien-table tbody");
    tbody.innerHTML = "";

    data.forEach(k => {
        tbody.innerHTML += `
            <tr>
                <td>${k._id}</td>
                <td>${k.anzahl}</td>
            </tr>
        `;
    });
}
async function loadBewegungenProLagerort() {
    const res = await fetch(`${API_BASE}/aggregationen/pro-lagerort`);
    const data = await res.json();

    const tbody = document.querySelector("#lagerort-table tbody");
    tbody.innerHTML = "";

    data.forEach(l => {
        tbody.innerHTML += `
            <tr>
                <td>${l._id}</td>
                <td>${l.anzahl}</td>
            </tr>
        `;
    });
}





