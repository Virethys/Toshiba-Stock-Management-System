document.addEventListener("DOMContentLoaded", function () {
  // Modal close on outside click
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  });

  // Modal close on Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal").forEach((modal) => {
        modal.style.display = "none";
      });
    }
  });
});

// Listen for image upload
document.addEventListener("DOMContentLoaded", function () {
  const input = document.getElementById("profile-image-input");
  const filename = document.getElementById("profile-image-filename");
  if (input && filename) {
    input.addEventListener("change", function (e) {
      filename.textContent = input.files[0] ? input.files[0].name : "";
    });
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const input = document.getElementById("profile-image-input");
  if (input) {
    input.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (evt) {
        const user = localStorage.getItem("loggedInUser");
        if (user) {
          localStorage.setItem("profileImage-" + user, evt.target.result);
          updateProfileImages(evt.target.result);
        }
      };
      reader.readAsDataURL(file);
    });
  }
});

function updateProfileImages(imgSrc) {
  if (imgSrc) {
    document.getElementById("profile-avatar").src = imgSrc;
    document.getElementById("nav-user-avatar").src = imgSrc;
  }
}

function showRegister() {
  document.getElementById("login-container").style.display = "none";
  document.getElementById("register-container").style.display = "block";
}

function showLogin() {
  document.getElementById("register-container").style.display = "none";
  document.getElementById("login-container").style.display = "block";
}

function register() {
  let username = document.getElementById("register-username").value;
  let password = document.getElementById("register-password").value;

  if (localStorage.getItem(username)) {
    alert("User already exists!");
    return;
  }

  localStorage.setItem(username, password);
  alert("Registered successfully! Please log in.");
  showLogin();
}

function login() {
  let username = document.getElementById("login-username").value;
  let password = document.getElementById("login-password").value;

  if (localStorage.getItem(username) === password) {
    localStorage.setItem("loggedInUser", username);
    checkLogin();
  } else {
    alert("Invalid login credentials.");
  }
}

function checkLogin() {
  let user = localStorage.getItem("loggedInUser");
  if (user) {
    document.getElementById("login-container").style.display = "none";
    document.getElementById("register-container").style.display = "none";
    // Hide old main-container if present
    let oldMain = document.getElementById("main-container");
    if (oldMain) oldMain.style.display = "none";
    document.querySelector(".app-layout").style.display = "flex";
    loadItems();
  }
}

function logout() {
  localStorage.removeItem("loggedInUser");
  location.reload();
}

function showAddItemModal() {
  document.getElementById("add-item-modal").style.display = "block";
}

function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

function addItem() {
  let itemNameInput = document.getElementById("item-name");
  let itemName = itemNameInput.value.trim();
  if (!itemName) {
    alert("Please enter an item name.");
    return;
  }

  // Prevent duplicate item names (case-insensitive)
  let items = JSON.parse(localStorage.getItem("stockItems") || "[]");
  if (items.some((name) => name.toLowerCase() === itemName.toLowerCase())) {
    alert("Item with this name already exists.");
    return;
  }

  // Save to localStorage
  items.push(itemName);
  localStorage.setItem("stockItems", JSON.stringify(items));
  addAuditLog("Add Item", `Added item "${itemName}"`);
  loadItems();

  // Clear input after adding
  itemNameInput.value = "";

  closeModal("add-item-modal");
}

document.getElementById("add-item-form").onsubmit = function (e) {
  e.preventDefault();
  addItem();
};

function updateSidebarQuickAccess(items) {
  const sidebar = document.getElementById("item-quick-access");
  sidebar.innerHTML = "";
  items.forEach((itemName) => {
    const li = document.createElement("li");
    li.textContent = itemName;
    li.onclick = () => {
      // Scroll to the corresponding card
      const safeItemName = itemName.replace(/[^a-zA-Z0-9_-]/g, "_");
      const card = document.getElementById("card-" + safeItemName);
      if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    sidebar.appendChild(li);
  });
}

function loadItems() {
  let items = JSON.parse(localStorage.getItem("stockItems") || "[]");
  updateSidebarQuickAccess(items);
  let itemContainer = document.getElementById("items-container");
  itemContainer.innerHTML = "";
  items.forEach((itemName) => {
    let safeItemName = itemName.replace(/[^a-zA-Z0-9_-]/g, "_");
    let itemSection = document.createElement("div");
    itemSection.id = "card-" + safeItemName;
    itemSection.innerHTML = `
      <div class="item-header">
        <h3>
          <span class="item-title-link" data-item="${itemName}">${itemName}</span>
        </h3>
        <div class="stock-actions">
          <button onclick="showStockModal('${safeItemName}', 'in')">Stock In</button>
          <button onclick="showStockModal('${safeItemName}', 'out')">Stock Out</button>
        </div>
      </div>
      <div class="export-actions">
        <button onclick="exportTableToExcel('${safeItemName}')">Export Excel</button>
        <button onclick="exportTableToPDF('${safeItemName}')">Export PDF</button>
      </div>
      <div class="scrollable-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Stock In</th>
              <th>Stock Out</th>
              <th>Description</th>
              <th>Total Stocks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="table-${safeItemName}">
            <!-- rows here -->
          </tbody>
        </table>
      </div>
      <div class="delete-table-actions">
        <button onclick="deleteStockTable(this)">Delete Stock Table</button>
      </div>
    `;
    itemContainer.appendChild(itemSection);
    renderStockTable(safeItemName);

    itemSection.querySelector("table").onclick = function (e) {
      if (e.target.tagName !== "BUTTON") {
        showTableModal(itemName);
      }
    };

    const titleLink = itemSection.querySelector(".item-title-link");
    if (titleLink) {
      titleLink.style.cursor = "pointer";
      titleLink.onclick = function (e) {
        showTableModal(itemName);
        e.stopPropagation();
      };
    }
  });
}

function showStockModal(item, type, idx = null) {
  // Reset form
  document.getElementById("stock-modal-form").reset();
  document.getElementById("stock-modal-item").value = item;
  document.getElementById("stock-modal-index").value = idx !== null ? idx : "";
  document.getElementById("stock-modal-title").textContent =
    idx !== null
      ? "Edit Stock Entry"
      : type === "in"
      ? "Stock In"
      : "Stock Out";

  // Set date to today by default
  document.getElementById("stock-modal-date").valueAsDate = new Date();

  // If editing, fill fields with existing data
  if (idx !== null) {
    let stocks = JSON.parse(localStorage.getItem("stocks-" + item) || "[]");
    let entry = stocks[idx];
    document.getElementById("stock-modal-date").value = entry.date;
    document.getElementById("stock-modal-in").value =
      entry.stockIn !== "-" ? entry.stockIn : "";
    document.getElementById("stock-modal-out").value =
      entry.stockOut !== "-" ? entry.stockOut : "";
    document.getElementById("stock-modal-desc").value = entry.description;
  } else {
    // For Stock In/Out, set only one field enabled
    document.getElementById("stock-modal-in").disabled = type === "out";
    document.getElementById("stock-modal-out").disabled = type === "in";
    document.getElementById("stock-modal-in").value = "";
    document.getElementById("stock-modal-out").value = "";
    document.getElementById("stock-modal-desc").value = "";
  }

  document.getElementById("stock-modal").style.display = "flex";
}

// Handle form submit for add/edit stock
document.getElementById("stock-modal-form").onsubmit = function (e) {
  e.preventDefault();
  const item = document.getElementById("stock-modal-item").value;
  const idx = document.getElementById("stock-modal-index").value;
  const date = document.getElementById("stock-modal-date").value;
  const stockIn = document.getElementById("stock-modal-in").value || "-";
  const stockOut = document.getElementById("stock-modal-out").value || "-";
  const description = document.getElementById("stock-modal-desc").value;

  if (!date || (stockIn === "-" && stockOut === "-")) {
    alert("Please fill in the required fields.");
    return;
  }

  let stocks = JSON.parse(localStorage.getItem("stocks-" + item) || "[]");

  if (idx !== "") {
    // Edit
    stocks[idx].date = date;
    stocks[idx].stockIn = stockIn !== "" ? stockIn : "-";
    stocks[idx].stockOut = stockOut !== "" ? stockOut : "-";
    stocks[idx].description = description;
  } else {
    // Add
    let totalStock =
      stocks.length > 0 ? stocks[stocks.length - 1].totalStock : 0;
    totalStock += stockIn !== "-" ? parseInt(stockIn) : 0;
    totalStock -= stockOut !== "-" ? parseInt(stockOut) : 0;
    stocks.push({
      date,
      stockIn: stockIn !== "" ? stockIn : "-",
      stockOut: stockOut !== "" ? stockOut : "-",
      description,
      totalStock,
    });
  }

  // Recalculate totalStock for all entries
  let total = 0;
  for (let i = 0; i < stocks.length; i++) {
    let inVal = stocks[i].stockIn !== "-" ? parseInt(stocks[i].stockIn) : 0;
    let outVal = stocks[i].stockOut !== "-" ? parseInt(stocks[i].stockOut) : 0;
    total += inVal - outVal;
    stocks[i].totalStock = total;
  }

  localStorage.setItem("stocks-" + item, JSON.stringify(stocks));
  renderStockTable(item);
  closeModal("stock-modal");

  // After adding a stock entry
  addAuditLog("Add Stock", `Added stock entry to "${item}" on ${date}`);

  // After editing a stock entry
  addAuditLog(
    "Edit Stock",
    `Edited stock entry #${idx} in "${item}" on ${date}`
  );
};

// Update your renderStockTable to use the modal for edit
function renderStockTable(item) {
  let stocks = JSON.parse(localStorage.getItem("stocks-" + item) || "[]");
  let tbody = document.getElementById(`table-${item}`);
  if (!tbody) return;
  tbody.innerHTML = "";
  stocks.forEach((entry, idx) => {
    let row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.date}</td>
      <td>${entry.stockIn}</td>
      <td>${entry.stockOut}</td>
      <td>${entry.description}</td>
      <td>${entry.totalStock}</td>
      <td>
        <button onclick="showStockModal('${item}', '', ${idx})">Edit</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function deleteStockRow(item, idx) {
  let stocks = JSON.parse(localStorage.getItem("stocks-" + item) || "[]");
  stocks.splice(idx, 1);
  localStorage.setItem("stocks-" + item, JSON.stringify(stocks));
  renderStockTable(item);
}

function deleteStockTable(btn) {
  if (confirm("Are you sure you want to delete this stock table?")) {
    const itemSection = btn.closest('div[id^="card-"]');
    // Get the item name from the data attribute
    const itemName = itemSection
      .querySelector(".item-title-link")
      .getAttribute("data-item");
    const safeItemName = itemName.replace(/[^a-zA-Z0-9_-]/g, "_");

    // Remove from localStorage
    let items = JSON.parse(localStorage.getItem("stockItems") || "[]");
    items = items.filter((name) => name !== itemName);
    localStorage.setItem("stockItems", JSON.stringify(items));
    localStorage.removeItem("stocks-" + safeItemName); // Remove stock entries

    // Remove from DOM
    itemSection.remove();
    loadItems(); // Refresh sidebar

    // After deleting a stock table
    addAuditLog(
      "Delete Item",
      `Deleted item "${itemName}" and its stock table`
    );
  }
}

function showUserProfile() {
  const user = localStorage.getItem("loggedInUser");
  if (!user) return;
  document.getElementById("profile-username").textContent = user;
  document.getElementById("nav-username").textContent = user;
  document.getElementById("profile-email").textContent = user + "@example.com";
  document.getElementById("profile-password").textContent =
    localStorage.getItem(user) || "(hidden)";
  // Load custom avatar if exists
  const img = localStorage.getItem("profileImage-" + user);
  if (img) {
    document.getElementById("profile-avatar").src = img;
    document.getElementById("nav-user-avatar").src = img;
  } else {
    document.getElementById("profile-avatar").src =
      "https://ui-avatars.com/api/?name=" + encodeURIComponent(user);
    document.getElementById("nav-user-avatar").src =
      "https://ui-avatars.com/api/?name=" + encodeURIComponent(user);
  }
  document.getElementById("user-profile-modal").style.display = "flex";
}

function deleteProfileImage() {
  const user = localStorage.getItem("loggedInUser");
  if (!user) return;
  localStorage.removeItem("profileImage-" + user);
  // Set default avatar
  const defaultAvatar =
    "https://ui-avatars.com/api/?name=" + encodeURIComponent(user);
  document.getElementById("profile-avatar").src = defaultAvatar;
  document.getElementById("nav-user-avatar").src = defaultAvatar;
}

function showTableModal(itemName) {
  const safeItemName = itemName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const stocks = JSON.parse(
    localStorage.getItem("stocks-" + safeItemName) || "[]"
  );
  let html = `
    <div class="scrollable-table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Stock In</th>
            <th>Stock Out</th>
            <th>Description</th>
            <th>Total Stocks</th>
          </tr>
        </thead>
        <tbody>
          ${stocks
            .map(
              (entry) => `
            <tr>
              <td>${entry.date}</td>
              <td>${entry.stockIn}</td>
              <td>${entry.stockOut}</td>
              <td>${entry.description}</td>
              <td>${entry.totalStock}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
  document.getElementById("table-modal-title").textContent = itemName;
  document.getElementById("table-modal-body").innerHTML = html;
  document.getElementById("table-modal").style.display = "flex";
}

// On load, hide app-layout if not logged in
window.onload = function () {
  let user = localStorage.getItem("loggedInUser");
  document.querySelector(".app-layout").style.display = user ? "flex" : "none";
  if (user) {
    checkLogin();
    document.getElementById("nav-username").textContent = user;
    const img = localStorage.getItem("profileImage-" + user);
    if (img) {
      document.getElementById("nav-user-avatar").src = img;
    } else {
      document.getElementById("nav-user-avatar").src =
        "https://ui-avatars.com/api/?name=" + encodeURIComponent(user);
    }
  }
};

document.getElementById("stock-modal-delete-btn").onclick = function () {
  const item = document.getElementById("stock-modal-item").value;
  const idx = document.getElementById("stock-modal-index").value;
  // Only delete if editing (idx is not empty)
  if (idx !== "") {
    if (confirm("Are you sure you want to delete this entry?")) {
      deleteStockRow(item, idx);
      closeModal("stock-modal");
    }
  } else {
    // If adding, just close the modal
    closeModal("stock-modal");
  }
};

document.getElementById("stock-modal-delete-btn").style.display =
  idx !== null && idx !== "" ? "inline-block" : "none";

function exportTableToExcel(item) {
  const table = document.querySelector(`#table-${item}`).closest("table");
  let tableHTML = table.outerHTML.replace(/ /g, "%20");
  const filename = `stocks-${item}.xls`;

  let downloadLink = document.createElement("a");
  document.body.appendChild(downloadLink);
  downloadLink.href = "data:application/vnd.ms-excel," + tableHTML;
  downloadLink.download = filename;
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

// Requires jsPDF (already in your project as jsPDF.min.js)
function exportTableToPDF(item) {
  const table = document.querySelector(`#table-${item}`).closest("table");
  const doc = new jsPDF("l", "pt", "a4");
  doc.text("Stock Table: " + item, 40, 40);

  // Collect table data
  const rows = [];
  const headers = [];
  table
    .querySelectorAll("thead th")
    .forEach((th) => headers.push(th.innerText));
  table.querySelectorAll("tbody tr").forEach((tr) => {
    const row = [];
    tr.querySelectorAll("td").forEach((td) => row.push(td.innerText));
    rows.push(row);
  });

  // Use autoTable if available, else fallback
  if (doc.autoTable) {
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 60,
      styles: { fontSize: 10 },
    });
  } else {
    // Simple fallback: just print as text
    let y = 60;
    doc.text(headers.join(" | "), 40, y);
    y += 20;
    rows.forEach((row) => {
      doc.text(row.join(" | "), 40, y);
      y += 16;
    });
  }

  doc.save(`stocks-${item}.pdf`);
}

function addAuditLog(action, details) {
  const user = localStorage.getItem("loggedInUser") || "Unknown";
  const logs = JSON.parse(localStorage.getItem("auditLogs") || "[]");
  logs.unshift({
    user,
    action,
    details,
    date: new Date().toLocaleString(),
  });
  localStorage.setItem("auditLogs", JSON.stringify(logs));
}

function showAuditLog() {
  const logs = JSON.parse(localStorage.getItem("auditLogs") || "[]");
  let html = `<table style="width:100%;font-size:0.98rem;">
    <thead>
      <tr>
        <th>Date</th>
        <th>User</th>
        <th>Action</th>
        <th>Details</th>
      </tr>
    </thead>
    <tbody>
      ${
        logs.length === 0
          ? `<tr><td colspan="4" style="text-align:center;">No logs yet.</td></tr>`
          : ""
      }
      ${logs
        .map(
          (log) => `
        <tr>
          <td>${log.date}</td>
          <td>${log.user}</td>
          <td>${log.action}</td>
          <td>${log.details}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>`;
  document.getElementById("audit-log-body").innerHTML = html;
  document.getElementById("audit-log-modal").style.display = "flex";
}
