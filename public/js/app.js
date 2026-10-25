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

let slugManual = false;

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

function hideFormError() {
  formError.classList.add("hidden");
  formError.textContent = "";
}

function showFormError(message) {
  formError.textContent = message;
  formError.classList.remove("hidden");
}

function normalizeRelativePath(webkitRelativePath) {
  const parts = webkitRelativePath.split("/").filter(Boolean);
  if (parts.length <= 1) return parts[0] || webkitRelativePath;
  return parts.slice(1).join("/");
}

async function loadSubsites() {
  loadError.classList.add("hidden");
  tilesEl.innerHTML = "";

  try {
    const res = await fetch(
      `${pbBase}/api/collections/subsites/records?sort=-created&perPage=200`
    );
    if (!res.ok) throw new Error("Kon subsites niet laden.");
    const data = await res.json();
    const items = data.items || [];

    if (items.length === 0) {
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");

    for (const item of items) {
      const link = document.createElement("a");
      link.className = "tile";
      link.href = subsiteHref(item.slug);
      link.title = item.name;

      const iconSrc = iconUrl(item);
      if (iconSrc) {
        const img = document.createElement("img");
        img.className = "tile-icon";
        img.src = iconSrc;
        img.alt = "";
        link.appendChild(img);
      } else {
        const placeholder = document.createElement("div");
        placeholder.className = "tile-icon placeholder";
        placeholder.textContent = (item.name || "?").charAt(0).toUpperCase();
        link.appendChild(placeholder);
      }

      const name = document.createElement("span");
      name.className = "tile-name";
      name.textContent = item.name;
      link.appendChild(name);

      tilesEl.appendChild(link);
    }
  } catch (err) {
    loadError.textContent =
      err instanceof Error ? err.message : "Onbekende fout bij laden.";
    loadError.classList.remove("hidden");
    emptyState.classList.add("hidden");
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
    throw new Error(
      err?.message || `Upload mislukt voor ${path}`
    );
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

await loadSubsites();
