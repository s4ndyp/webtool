/** PocketBase API via dezelfde origin (proxy in Node / Docker). */
const pbBase = window.location.origin;

function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function iconUrl(record) {
  if (!record.icon) return null;
  return `${pbBase}/api/files/subsites/${record.id}/${record.icon}`;
}

function subsiteHref(slug) {
  return `/s/${encodeURIComponent(slug)}/`;
}

const tilesEl = document.getElementById("tiles");
const emptyState = document.getElementById("empty-state");
const loadError = document.getElementById("load-error");
const editHint = document.getElementById("edit-hint");
const dialog = document.getElementById("dialog-create");
const form = document.getElementById("form-create");
const inputName = document.getElementById("input-name");
const inputSlug = document.getElementById("input-slug");
const inputFolder = document.getElementById("input-folder");
const inputIcon = document.getElementById("input-icon");
const formError = document.getElementById("form-error");
const uploadProgress = document.getElementById("upload-progress");
const uploadStatus = document.getElementById("upload-status");
const btnSubmit = document.getElementById("btn-submit");
const btnEdit = document.getElementById("btn-edit");

const dialogEdit = document.getElementById("dialog-edit");
const formEdit = document.getElementById("form-edit");
const editName = document.getElementById("edit-name");
const editSlug = document.getElementById("edit-slug");
const editIcon = document.getElementById("edit-icon");
const editFolder = document.getElementById("edit-folder");
const editFormError = document.getElementById("edit-form-error");
const editUploadProgress = document.getElementById("edit-upload-progress");
const editUploadStatus = document.getElementById("edit-upload-status");
const btnEditSave = document.getElementById("btn-edit-save");

let slugManual = false;
let editMode = false;
let subsiteItems = [];
/** @type {object | null} */
let editingSubsite = null;

inputName.addEventListener("input", () => {
  if (!slugManual) {
    inputSlug.value = slugify(inputName.value);
  }
});

inputSlug.addEventListener("input", () => {
  slugManual = inputSlug.value.length > 0;
});

document.getElementById("btn-new").addEventListener("click", () => {
  form.reset();
  slugManual = false;
  hideFormError();
  uploadProgress.classList.add("hidden");
  uploadStatus.classList.add("hidden");
  dialog.showModal();
});

document.getElementById("btn-close").addEventListener("click", () => dialog.close());
document.getElementById("btn-cancel").addEventListener("click", () => dialog.close());

document.getElementById("btn-edit-close").addEventListener("click", () =>
  dialogEdit.close()
);
document.getElementById("btn-edit-cancel").addEventListener("click", () =>
  dialogEdit.close()
);

btnEdit.addEventListener("click", () => {
  editMode = !editMode;
  btnEdit.setAttribute("aria-pressed", editMode ? "true" : "false");
  btnEdit.textContent = editMode ? "Klaar" : "Bewerken";
  editHint.classList.toggle("hidden", !editMode);
  renderTiles();
});

function hideFormError() {
  formError.classList.add("hidden");
  formError.textContent = "";
}

function showFormError(message) {
  formError.textContent = message;
  formError.classList.remove("hidden");
}

function hideEditFormError() {
  editFormError.classList.add("hidden");
  editFormError.textContent = "";
}

function showEditFormError(message) {
  editFormError.textContent = message;
  editFormError.classList.remove("hidden");
}

function normalizeRelativePath(webkitRelativePath) {
  const parts = webkitRelativePath.split("/").filter(Boolean);
  if (parts.length <= 1) return parts[0] || webkitRelativePath;
  return parts.slice(1).join("/");
}

async function deleteSubsite(item) {
  const ok = window.confirm(
    `"${item.name}" en alle bijbehorende bestanden verwijderen?`
  );
  if (!ok) return;

  const res = await fetch(
    `${pbBase}/api/collections/subsites/records/${item.id}`,
    { method: "DELETE" }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Verwijderen mislukt.");
  }
}

function openEditDialog(item) {
  editingSubsite = item;
  formEdit.reset();
  hideEditFormError();
  editUploadProgress.classList.add("hidden");
  editUploadStatus.classList.add("hidden");
  editName.value = item.name || "";
  editSlug.value = item.slug || "";
  dialogEdit.showModal();
}

async function fetchSiteFilesForSubsite(subsiteId) {
  const filter = encodeURIComponent(`subsite="${subsiteId}"`);
  const res = await fetch(
    `${pbBase}/api/collections/site_files/records?filter=${filter}&perPage=500`
  );
  if (!res.ok) {
    throw new Error("Kon bestandenlijst niet laden.");
  }
  const data = await res.json();
  return data.items || [];
}

async function deleteAllSiteFiles(subsiteId) {
  const files = await fetchSiteFilesForSubsite(subsiteId);
  for (const record of files) {
    const res = await fetch(
      `${pbBase}/api/collections/site_files/records/${record.id}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      throw new Error("Kon oude bestanden niet verwijderen.");
    }
  }
}

async function updateSubsiteRecord(id, name, slug, iconFile) {
  const body = new FormData();
  body.append("name", name);
  body.append("slug", slug);
  if (iconFile) body.append("icon", iconFile);

  const res = await fetch(`${pbBase}/api/collections/subsites/records/${id}`, {
    method: "PATCH",
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg =
      err?.data?.slug?.message ||
      err?.message ||
      "Opslaan mislukt (bestaat slug al?).";
    throw new Error(msg);
  }

  return res.json();
}

function renderTiles() {
  tilesEl.innerHTML = "";
  tilesEl.classList.toggle("tiles--edit", editMode);

  if (subsiteItems.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  for (const item of subsiteItems) {
    const wrap = document.createElement("div");
    wrap.className = "tile-wrap";

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "tile-delete";
    deleteBtn.title = `${item.name} verwijderen`;
    deleteBtn.setAttribute("aria-label", `${item.name} verwijderen`);
    deleteBtn.textContent = "×";
    deleteBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      try {
        deleteBtn.disabled = true;
        await deleteSubsite(item);
        subsiteItems = subsiteItems.filter((s) => s.id !== item.id);
        renderTiles();
      } catch (err) {
        loadError.textContent =
          err instanceof Error ? err.message : "Verwijderen mislukt.";
        loadError.classList.remove("hidden");
        deleteBtn.disabled = false;
      }
    });
    wrap.appendChild(deleteBtn);

    const tile = document.createElement(editMode ? "button" : "a");
    tile.className = "tile";
    tile.title = item.name;

    if (editMode) {
      tile.type = "button";
      tile.addEventListener("click", () => openEditDialog(item));
    } else {
      tile.href = subsiteHref(item.slug);
      tile.target = "_blank";
      tile.rel = "noopener noreferrer";
    }

    const iconSrc = iconUrl(item);
    if (iconSrc) {
      const img = document.createElement("img");
      img.className = "tile-icon";
      img.src = iconSrc;
      img.alt = "";
      tile.appendChild(img);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "tile-icon placeholder";
      placeholder.textContent = (item.name || "?").charAt(0).toUpperCase();
      tile.appendChild(placeholder);
    }

    const name = document.createElement("span");
    name.className = "tile-name";
    name.textContent = item.name;
    tile.appendChild(name);

    wrap.appendChild(tile);
    tilesEl.appendChild(wrap);
  }
}

async function loadSubsites() {
  loadError.classList.add("hidden");

  try {
    const res = await fetch(
      `${pbBase}/api/collections/subsites/records?sort=-created&perPage=200`
    );
    if (res.status === 404) {
      throw new Error(
        "Database-tabellen ontbreken. Herstart de container (migraties) of controleer PocketBase."
      );
    }
    if (!res.ok) throw new Error("Kon subsites niet laden.");
    const data = await res.json();
    subsiteItems = data.items || [];
    renderTiles();
  } catch (err) {
    loadError.textContent =
      err instanceof Error ? err.message : "Onbekende fout bij laden.";
    loadError.classList.remove("hidden");
    emptyState.classList.add("hidden");
    tilesEl.innerHTML = "";
  }
}

async function createSubsiteRecord(name, slug, iconFile) {
  const body = new FormData();
  body.append("name", name);
  body.append("slug", slug);
  if (iconFile) body.append("icon", iconFile);

  const res = await fetch(`${pbBase}/api/collections/subsites/records`, {
    method: "POST",
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg =
      err?.data?.slug?.message ||
      err?.message ||
      "Subsite kon niet worden aangemaakt (bestaat slug al?).";
    throw new Error(msg);
  }

  return res.json();
}

async function uploadSiteFile(subsiteId, path, file) {
  const body = new FormData();
  body.append("subsite", subsiteId);
  body.append("path", path);
  body.append("file", file, file.name);

  const res = await fetch(`${pbBase}/api/collections/site_files/records`, {
    method: "POST",
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `Upload mislukt voor ${path}`);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideFormError();

  const name = inputName.value.trim();
  const slug = inputSlug.value.trim();
  const files = [...(inputFolder.files || [])];
  const iconFile = inputIcon.files?.[0] || null;

  if (!name || !slug) {
    showFormError("Vul naam en slug in.");
    return;
  }

  if (files.length === 0) {
    showFormError("Selecteer een map met bestanden.");
    return;
  }

  btnSubmit.disabled = true;
  uploadProgress.classList.remove("hidden");
  uploadStatus.classList.remove("hidden");
  uploadProgress.value = 0;

  try {
    uploadStatus.textContent = "Subsite aanmaken…";
    const subsite = await createSubsiteRecord(name, slug, iconFile);

    let done = 0;
    const total = files.length;

    for (const file of files) {
      const relPath = normalizeRelativePath(file.webkitRelativePath || file.name);
      if (!relPath) continue;
      uploadStatus.textContent = `Uploaden: ${relPath} (${done + 1}/${total})`;
      await uploadSiteFile(subsite.id, relPath, file);
      done += 1;
      uploadProgress.value = Math.round((done / total) * 100);
    }

    dialog.close();
    await loadSubsites();
  } catch (err) {
    showFormError(err instanceof Error ? err.message : "Upload mislukt.");
  } finally {
    btnSubmit.disabled = false;
    uploadProgress.classList.add("hidden");
    uploadStatus.classList.add("hidden");
  }
});

formEdit.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideEditFormError();

  if (!editingSubsite) return;

  const name = editName.value.trim();
  const slug = editSlug.value.trim();
  const iconFile = editIcon.files?.[0] || null;
  const files = [...(editFolder.files || [])];

  if (!name || !slug) {
    showEditFormError("Vul naam en slug in.");
    return;
  }

  btnEditSave.disabled = true;
  editUploadProgress.classList.toggle("hidden", files.length === 0);
  editUploadStatus.classList.toggle("hidden", files.length === 0);
  editUploadProgress.value = 0;

  try {
    editUploadStatus.textContent = "Gegevens opslaan…";
    const updated = await updateSubsiteRecord(
      editingSubsite.id,
      name,
      slug,
      iconFile
    );

    if (files.length > 0) {
      editUploadStatus.textContent = "Oude bestanden verwijderen…";
      await deleteAllSiteFiles(editingSubsite.id);
      let done = 0;
      for (const file of files) {
        const relPath = normalizeRelativePath(
          file.webkitRelativePath || file.name
        );
        if (!relPath) continue;
        editUploadStatus.textContent = `Uploaden: ${relPath} (${done + 1}/${files.length})`;
        await uploadSiteFile(editingSubsite.id, relPath, file);
        done += 1;
        editUploadProgress.value = Math.round((done / files.length) * 100);
      }
    }

    subsiteItems = subsiteItems.map((s) =>
      s.id === updated.id ? updated : s
    );
    dialogEdit.close();
    editingSubsite = null;
    renderTiles();
  } catch (err) {
    showEditFormError(err instanceof Error ? err.message : "Opslaan mislukt.");
  } finally {
    btnEditSave.disabled = false;
    editUploadProgress.classList.add("hidden");
    editUploadStatus.classList.add("hidden");
  }
});

await loadSubsites();
