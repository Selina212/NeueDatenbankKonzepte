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
        const payload = Object.fromEntries(formData.entries());

        await fetch(`${API_BASE}/bewegungen`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        alert("Bewegung gespeichert!");
        form.reset();
    });
}
