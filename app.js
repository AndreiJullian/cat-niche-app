const state = {
  breeds: [],
  currentCats: [],
  favorites: JSON.parse(localStorage.getItem("catExplorerFavorites") || "[]")
};

const els = {
  breedCount: document.querySelector("#breedCount"),
  heroImage: document.querySelector("#heroCatImage"),
  heroName: document.querySelector("#heroCatName"),
  breedSearch: document.querySelector("#breedSearch"),
  breedSelect: document.querySelector("#breedSelect"),
  clearSearch: document.querySelector("#clearSearch"),
  randomBtn: document.querySelector("#randomBtn"),
  results: document.querySelector("#results"),
  status: document.querySelector("#status"),
  favorites: document.querySelector("#favorites"),
  clearFavorites: document.querySelector("#clearFavorites"),
  modal: document.querySelector("#modal"),
  modalBody: document.querySelector("#modalBody"),
  closeModal: document.querySelector("#closeModal")
};

const api = {
  async get(path) {
    const response = await fetch(`/.netlify/functions/cats${path}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "The API request failed.");
    return data;
  }
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindEvents();
  renderFavorites();
  showStatus("Loading cat breeds...");
  try {
    state.breeds = await api.get("/breeds");
    state.breeds.sort((a, b) => a.name.localeCompare(b.name));
    els.breedCount.textContent = state.breeds.length;
    populateBreedSelect();
    await loadRandomCats();
  } catch (error) {
    showError(error);
  }
}

function bindEvents() {
  els.breedSearch.addEventListener("input", debounce(handleSearch, 350));
  els.breedSelect.addEventListener("change", () => {
    els.breedSearch.value = "";
    if (els.breedSelect.value) {
      searchBreed(els.breedSelect.value);
    } else {
      loadRandomCats();
    }
  });

  els.clearSearch.addEventListener("click", () => {
    els.breedSearch.value = "";
    els.breedSelect.value = "";
    loadRandomCats();
  });

  els.randomBtn.addEventListener("click", loadRandomCats);
  els.clearFavorites.addEventListener("click", () => {
    state.favorites = [];
    saveFavorites();
    renderFavorites();
    document.querySelectorAll(".favorite-btn.active").forEach(btn => btn.classList.remove("active"));
  });

  els.closeModal.addEventListener("click", closeModal);
  els.modal.querySelector(".modal-backdrop").addEventListener("click", closeModal);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
  });
}

function populateBreedSelect() {
  const options = state.breeds.map(breed =>
    `<option value="${escapeHtml(breed.id)}">${escapeHtml(breed.name)}</option>`
  ).join("");
  els.breedSelect.insertAdjacentHTML("beforeend", options);
}

async function handleSearch() {
  const query = els.breedSearch.value.trim();
  els.breedSelect.value = "";

  if (!query) {
    await loadRandomCats();
    return;
  }
  if (query.length < 2) return;

  const matches = state.breeds.filter(b =>
    b.name.toLowerCase().includes(query.toLowerCase())
  );

  if (!matches.length) {
    els.results.innerHTML = `<div class="empty-favorites"><strong>No breed found</strong>Try another breed name.</div>`;
    showStatus("");
    return;
  }

  await renderBreedMatches(matches.slice(0, 6));
}

async function renderBreedMatches(matches) {
  showStatus(`Found ${matches.length} breed${matches.length === 1 ? "" : "s"} matching your search.`);
  els.results.innerHTML = "";

  const cats = await Promise.all(matches.map(async breed => {
    try {
      const images = await api.get(`/images?breed_id=${encodeURIComponent(breed.id)}&limit=1`);
      return { ...breed, image: images[0] || null };
    } catch {
      return { ...breed, image: null };
    }
  }));

  state.currentCats = cats;
  renderCards(cats);
}

async function searchBreed(breedId) {
  showStatus("Finding cats from this breed...");
  showSkeletons(3);
  try {
    const breed = state.breeds.find(b => b.id === breedId);
    const images = await api.get(`/images?breed_id=${encodeURIComponent(breedId)}&limit=3`);
    const cats = images.length
      ? images.map(image => ({ ...breed, image }))
      : [{ ...breed, image: null }];
    state.currentCats = cats;
    renderCards(cats);
    showStatus(`${breed.name} · ${images.length || 0} photo${images.length === 1 ? "" : "s"} found.`);
    if (cats[0].image) updateHero(cats[0]);
  } catch (error) {
    showError(error);
  }
}

async function loadRandomCats() {
  showStatus("Finding some adorable cats...");
  showSkeletons(3);
  try {
    const cats = await api.get("/random?limit=3");
    state.currentCats = cats;
    renderCards(cats);
    showStatus("Showing three random cats. Pick a breed above to explore further.");
    if (cats[0]) updateHero(cats[0]);
  } catch (error) {
    showError(error);
  }
}

function renderCards(cats) {
  els.results.innerHTML = "";
  cats.forEach((cat, index) => {
    const template = document.querySelector("#catCardTemplate").content.cloneNode(true);
    const card = template.querySelector(".cat-card");
    const image = template.querySelector(".cat-image");
    const name = template.querySelector(".cat-name");
    const origin = template.querySelector(".origin-badge");
    const temperament = template.querySelector(".cat-temperament");
    const traits = template.querySelector(".traits");
    const favoriteBtn = template.querySelector(".favorite-btn");
    const detailsBtn = template.querySelector(".details-btn");

    const breed = cat.breeds?.[0] || cat;
    const imageData = cat.image || cat;

    image.src = imageData?.url || fallbackImage();
    image.alt = breed?.name ? `${breed.name} cat` : "Random cat";
    image.loading = index > 0 ? "lazy" : "eager";
    name.textContent = breed?.name || "Random cat";
    origin.textContent = breed?.origin || "Cat";
    temperament.textContent = breed?.temperament || "A lovely mystery cat waiting to be discovered.";

    const traitList = [
      breed?.life_span ? `Life ${breed.life_span} yrs` : null,
      breed?.energy_level ? `Energy ${ratingLabel(breed.energy_level)}` : null,
      breed?.affection_level ? `Affection ${ratingLabel(breed.affection_level)}` : null
    ].filter(Boolean);

    traits.innerHTML = traitList.map(t => `<span class="trait">${escapeHtml(t)}</span>`).join("");

    const favoriteId = imageData?.id || breed?.id;
    favoriteBtn.classList.toggle("active", state.favorites.some(f => f.id === favoriteId));
    favoriteBtn.textContent = favoriteBtn.classList.contains("active") ? "♥" : "♡";

    favoriteBtn.addEventListener("click", () => toggleFavorite({
      id: favoriteId,
      url: imageData?.url || fallbackImage(),
      name: breed?.name || "Random cat"
    }));

    detailsBtn.addEventListener("click", () => openDetails(breed, imageData));
    card.querySelector(".cat-image-wrap").addEventListener("click", e => {
      if (!e.target.closest("button")) openDetails(breed, imageData);
    });

    els.results.appendChild(card);
  });
}

function openDetails(breed, image) {
  if (!breed || !breed.name) return;

  const traits = [
    ["Origin", breed.origin || "Unknown"],
    ["Life span", breed.life_span ? `${breed.life_span} years` : "Unknown"],
    ["Weight", breed.weight?.metric ? `${breed.weight.metric} kg` : "Unknown"],
    ["Adaptability", ratingLabel(breed.adaptability)],
    ["Affection", ratingLabel(breed.affection_level)],
    ["Energy", ratingLabel(breed.energy_level)]
  ];

  els.modalBody.innerHTML = `
    <div class="modal-layout">
      <img src="${escapeAttribute(image?.url || fallbackImage())}" alt="${escapeAttribute(breed.name)} cat">
      <div>
        <p class="eyebrow">CAT BREED</p>
        <h2 id="modalTitle">${escapeHtml(breed.name)}</h2>
        <p>${escapeHtml(breed.description || "No description is available for this breed.")}</p>
        <p><strong>Temperament:</strong> ${escapeHtml(breed.temperament || "Not listed.")}</p>
        <div class="modal-info">
          ${traits.map(([label, value]) => `
            <div class="info-box">
              <small>${escapeHtml(label)}</small>
              <strong>${escapeHtml(value)}</strong>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
  els.modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  els.modal.classList.add("hidden");
  document.body.style.overflow = "";
}

function toggleFavorite(item) {
  const exists = state.favorites.some(f => f.id === item.id);
  state.favorites = exists
    ? state.favorites.filter(f => f.id !== item.id)
    : [item, ...state.favorites].slice(0, 12);

  saveFavorites();
  renderFavorites();
  renderCards(state.currentCats);
}

function renderFavorites() {
  if (!state.favorites.length) {
    els.favorites.innerHTML = `
      <div class="empty-favorites">
        <strong>No favorites yet 🐾</strong>
        Tap the heart on a cat card to save it here.
      </div>
    `;
    return;
  }

  els.favorites.innerHTML = state.favorites.map(item => `
    <div class="favorite-mini">
      <img src="${escapeAttribute(item.url)}" alt="${escapeAttribute(item.name)}" loading="lazy">
      <button type="button" data-id="${escapeAttribute(item.id)}" aria-label="Remove ${escapeAttribute(item.name)}">♥</button>
    </div>
  `).join("");

  els.favorites.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      state.favorites = state.favorites.filter(f => f.id !== btn.dataset.id);
      saveFavorites();
      renderFavorites();
      renderCards(state.currentCats);
    });
  });
}

function saveFavorites() {
  localStorage.setItem("catExplorerFavorites", JSON.stringify(state.favorites));
}

function updateHero(cat) {
  const breed = cat.breeds?.[0] || cat;
  const image = cat.image || cat;
  if (!image?.url) return;
  els.heroImage.src = image.url;
  els.heroImage.alt = breed?.name ? `${breed.name} cat` : "Featured cat";
  els.heroName.textContent = breed?.name || "Random cat";
}

function showSkeletons(count) {
  els.results.innerHTML = Array.from({ length: count }, () => `
    <article class="cat-card">
      <div class="cat-image-wrap skeleton"></div>
      <div class="cat-card-body">
        <div class="skeleton" style="height:25px;width:60%;border-radius:8px"></div>
        <div class="skeleton" style="height:38px;margin-top:14px;border-radius:8px"></div>
      </div>
    </article>
  `).join("");
}

function showStatus(message) {
  els.status.textContent = message;
  els.status.className = "status";
}

function showError(error) {
  console.error(error);
  els.status.textContent = error.message || "Something went wrong. Please try again.";
  els.status.className = "status error";
  els.results.innerHTML = `
    <div class="empty-favorites">
      <strong>😿 Couldn't load the cats</strong>
      Check your Netlify function/API key configuration, then refresh the page.
    </div>
  `;
}

function ratingLabel(value) {
  if (!value) return "—";
  return `${value}/5`;
}

function fallbackImage() {
  return "https://cdn2.thecatapi.com/images/MTY3ODIyMQ.jpg";
}

function debounce(fn, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
