/**
 * Tiketin-UTS — Komponen section pencarian (ES module).
 * Menyediakan tab jenis transportasi dengan FORM khas masing-masing:
 * - "Semua" : pencarian kota (autocomplete nama kota).
 * - Pesawat : autocomplete kota -> pilih bandara pada kota itu, pulang-pergi /
 *             sekali jalan, tanggal pulang, dewasa + anak, kelas penerbangan.
 * - Kereta  : autocomplete kota -> pilih stasiun pada kota itu, pulang-pergi /
 *             sekali jalan, tanggal pulang, dewasa + anak, kelas kereta.
 * - Bus     : autocomplete kota -> pilih terminal pada kota itu, tanggal
 *             berangkat, jumlah penumpang, kelas layanan bus (satu arah).
 *
 * Pemilihan asal/tujuan memakai pola DUA LANGKAH agar pengguna tidak disajikan
 * seluruh pilihan lokasi sekaligus:
 *   1) mengetik nama kota -> daftar saran muncul HANYA saat mengetik (maks. 8),
 *   2) kota dipilih -> <select> lokasi berisi HANYA bandara/stasiun/terminal
 *      yang tersedia di kota tersebut (mis. Jakarta -> CGK & HLP).
 * Pencarian selalu memakai id lokasi spesifik yang dipilih pengguna.
 * Semua elemen dibuat dengan DOM API (textContent), bukan innerHTML.
 */

import { cities } from "../data/cities.js";
import { tickets } from "../data/tickets.js";
import { locationsForTransport, locationShortName, getLocationById } from "../data/locations.js";
import { TRANSPORT_LABELS as SEARCH_TRANSPORT_LABELS } from "../js/search.js";

const TAB_TYPES = ["all", "plane", "train", "bus"];

/** Jumlah saran kota maksimum yang ditampilkan autocomplete. */
const MAX_SUGGESTIONS = 8;

const LOCATION_PLACEHOLDERS = {
  plane: "— Pilih bandara —",
  train: "— Pilih stasiun —",
  bus: "— Pilih terminal —",
};

const LOCATION_LABELS = {
  plane: ["Bandara Asal", "Bandara Tujuan"],
  train: ["Stasiun Asal", "Stasiun Tujuan"],
  bus: ["Titik Keberangkatan", "Titik Kedatangan"],
};

const CITY_LABELS = ["Kota Asal", "Kota Tujuan"];

/** Satuan lokasi tiap transportasi (untuk placeholder & label saran kota). */
const LOCATION_UNITS = {
  plane: "bandara",
  train: "stasiun",
  bus: "terminal",
};

const CLASS_LABELS = {
  plane: "Kelas Penerbangan",
  train: "Kelas Kereta",
  bus: "Kelas Layanan Bus",
};

/**
 * Controller field asal/tujuan per input. WeakMap agar fillSearchForm bisa
 * mengisi nilai field apa pun jenis bentuknya (autocomplete maupun select)
 * tanpa kebocoran referensi.
 */
const FIELD_CONTROLLERS = new WeakMap();

/** Opsi kelas unik per transportasi, diambil dari data tiket yang ada. */
function classOptionsFor(transportType) {
  const seen = [];
  for (const ticket of tickets) {
    if (ticket.transportType === transportType && typeof ticket.travelClass === "string" && ticket.travelClass && !seen.includes(ticket.travelClass)) {
      seen.push(ticket.travelClass);
    }
  }
  return seen;
}

/**
 * Membangun section pencarian lengkap (tabs + form aktif + wadah hasil).
 * @param {Object} options
 * @param {Function} options.onSearch - Callback (criteria) => void saat form disubmit.
 * @returns {{section: HTMLElement, setActiveType: Function, getActiveType: Function,
 *            getForm: Function, getResultsMount: Function}}
 */
export function buildSearchSection(options = {}) {
  const { onSearch } = options;

  const section = document.createElement("section");
  section.className = "search-section";

  const card = document.createElement("div");
  card.className = "search-card";

  // Tab jenis transportasi
  const tabs = document.createElement("div");
  tabs.className = "search-tabs";
  // role="group" (bukan "tablist") agar tidak ada ARIA role yang anaknya tidak sesuai
  tabs.setAttribute("role", "group");
  tabs.setAttribute("aria-label", "Jenis transportasi");
  const typeButtons = [];
  for (const type of TAB_TYPES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "search-tab";
    btn.dataset.tabType = type;
    btn.textContent = type === "all" ? "Semua" : SEARCH_TRANSPORT_LABELS[type];
    btn.addEventListener("click", () => setActiveType(type));
    typeButtons.push(btn);
    tabs.appendChild(btn);
  }

  // Host form (diganti sesuai tab aktif) + wadah hasil
  const formHost = document.createElement("div");
  const resultsMount = document.createElement("div");
  resultsMount.id = "searchResults";
  resultsMount.className = "mt-3";

  card.appendChild(tabs);
  card.appendChild(formHost);
  section.appendChild(card);
  section.appendChild(resultsMount);

  let activeType = "all";
  let currentForm = null;

  function setActiveType(type) {
    const nextType = TAB_TYPES.includes(type) ? type : "all";
    activeType = nextType;
    typeButtons.forEach((b) => b.classList.toggle("active", b.dataset.tabType === nextType));
    formHost.replaceChildren();
    currentForm =
      nextType === "all"
        ? buildGenericForm({ onSearch })
        : buildTransportForm(nextType, { onSearch });
    formHost.appendChild(currentForm);
  }

  setActiveType("all");

  return {
    section,
    setActiveType,
    getActiveType: () => activeType,
    getForm: () => currentForm,
    getResultsMount: () => resultsMount,
  };
}

/* ---------------- Form generik "Semua" (kota) ---------------- */
function buildGenericForm({ onSearch }) {
  const form = document.createElement("form");
  form.className = "search-form";
  form.noValidate = true;
  form.dataset.formKind = "all";

  const originField = buildCityField("searchOrigin", CITY_LABELS[0]);
  const destField = buildCityField("searchDestination", CITY_LABELS[1]);
  const swapBtn = buildSwapButton(originField, destField);

  const dateGroup = buildDateGroup("searchDate", "Tanggal Berangkat", "searchDateInput");
  const paxGroup = buildPassengerGroup("searchPassengers", "Penumpang", 1, 10);
  const submitBtn = buildSubmitButton("Cari Tiket");

  form.appendChild(originField.group);
  form.appendChild(swapBtn);
  form.appendChild(destField.group);
  form.appendChild(dateGroup);
  form.appendChild(paxGroup);
  form.appendChild(submitBtn);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const pax = Math.floor(Number(paxGroup.querySelector("input").value));
    onSearch?.({
      kind: "all",
      transportType: null,
      origin: canonicalCityName(originField.getCity()),
      destination: canonicalCityName(destField.getCity()),
      originLocationId: null,
      destinationLocationId: null,
      departureDate: dateGroup.querySelector("input").value,
      tripType: "oneway",
      returnDate: null,
      travelClass: null,
      passengers: Number.isFinite(pax) ? pax : 0,
      adults: Number.isFinite(pax) ? pax : 0,
      children: 0,
    });
  });

  return form;
}

/* ---------------- Form khas transportasi ---------------- */
function buildTransportForm(type, { onSearch }) {
  const isBus = type === "bus";
  const supportsReturn = !isBus; // bus antarkota simulasi: satu arah

  const form = document.createElement("form");
  form.className = "search-form";
  form.noValidate = true;
  form.dataset.formKind = type;

  const [originLabel, destLabel] = LOCATION_LABELS[type] ?? ["Lokasi Asal", "Lokasi Tujuan"];
  const originField = buildCityLocationField({
    idBase: "searchOrigin",
    cityLabelText: CITY_LABELS[0],
    locationLabelText: originLabel,
    transportType: type,
  });
  const destField = buildCityLocationField({
    idBase: "searchDestination",
    cityLabelText: CITY_LABELS[1],
    locationLabelText: destLabel,
    transportType: type,
  });
  const swapBtn = buildSwapButton(originField, destField);

  form.appendChild(originField.group);
  form.appendChild(swapBtn);
  form.appendChild(destField.group);

  // Tipe perjalanan (pesawat & kereta): sekali jalan / pulang-pergi
  let tripTypeGroup = null;
  let returnDateGroup = null;
  const returnDateInput = () => returnDateGroup?.querySelector("input");
  if (supportsReturn) {
    tripTypeGroup = buildTripTypeGroup();
    form.appendChild(tripTypeGroup.group);
    returnDateGroup = buildDateGroup("searchReturnDate", "Tanggal Pulang", "searchReturnDateInput");
    returnDateGroup.hidden = true;
    returnDateGroup.querySelector("input").disabled = true;
    form.appendChild(returnDateGroup);

    tripTypeGroup.setOnChange((tripType) => {
      const input = returnDateInput();
      const show = tripType === "roundtrip";
      returnDateGroup.hidden = !show;
      input.disabled = !show;
      if (!show) input.value = "";
    });
  }

  const dateGroup = buildDateGroup("searchDate", "Tanggal Berangkat", "searchDateInput");
  form.appendChild(dateGroup);

  // Penumpang
  let adultsGroup = null;
  let childrenGroup = null;
  let paxGroup = null;
  if (isBus) {
    paxGroup = buildPassengerGroup("searchPassengers", "Jumlah Penumpang", 1, 10);
    form.appendChild(paxGroup);
  } else {
    adultsGroup = buildPassengerGroup("searchAdults", "Penumpang Dewasa", 1, 9);
    childrenGroup = buildPassengerGroup("searchChildren", "Penumpang Anak", 0, 9);
    form.appendChild(adultsGroup);
    form.appendChild(childrenGroup);
  }

  // Kelas
  const classGroup = buildClassSelect(type, CLASS_LABELS[type] ?? "Kelas");
  form.appendChild(classGroup);

  const submitBtn = buildSubmitButton("Cari Tiket");
  form.appendChild(submitBtn);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    // Sumber kebenaran = lokasi spesifik yang dipilih pengguna (bukan teks kota bebas)
    const originLoc = getLocationById(originField.getLocation());
    const destLoc = getLocationById(destField.getLocation());
    const tripType = supportsReturn ? tripTypeGroup.getValue() : "oneway";

    let adults = 0;
    let children = 0;
    let passengers = 0;
    if (isBus) {
      passengers = Math.floor(Number(paxGroup.querySelector("input").value));
      adults = Number.isFinite(passengers) ? passengers : 0;
    } else {
      adults = Math.floor(Number(adultsGroup.querySelector("input").value));
      children = Math.floor(Number(childrenGroup.querySelector("input").value));
      if (!Number.isFinite(adults)) adults = 0;
      if (!Number.isFinite(children)) children = 0;
      passengers = adults + children;
    }

    onSearch?.({
      kind: type,
      transportType: type,
      origin: originLoc?.city ?? "",
      destination: destLoc?.city ?? "",
      originLocationId: originLoc?.id ?? null,
      destinationLocationId: destLoc?.id ?? null,
      departureDate: dateGroup.querySelector("input").value,
      tripType,
      returnDate: tripType === "roundtrip" ? returnDateInput().value : null,
      travelClass: classGroup.querySelector("select").value || null,
      passengers,
      adults,
      children,
    });
  });

  return form;
}

/* ---------------- Builder elemen form ---------------- */

/**
 * Field form "Semua": input teks dengan autocomplete nama kota.
 * Daftar saran hanya muncul saat pengguna mengetik (maks. MAX_SUGGESTIONS),
 * bukan menampilkan seluruh kota sekaligus.
 */
function buildCityField(id, labelText) {
  const group = document.createElement("div");
  group.className = "form-group";

  const label = document.createElement("label");
  label.setAttribute("for", id);
  label.textContent = labelText;

  const wrapper = document.createElement("div");
  wrapper.className = "autocomplete";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "form-control";
  input.id = id;
  input.placeholder = "Ketik nama kota…";

  wrapper.appendChild(input);
  group.appendChild(label);
  group.appendChild(wrapper);

  const controller = {
    group,
    input,
    locationSelect: null,
    getCity: () => input.value.trim(),
    getLocation: () => null,
    setValue: (cityName) => {
      input.value = cityName || "";
    },
  };

  attachAutocomplete(wrapper, input, {
    fetchItems: (query) => matchCityItems(query, cityPoolGeneric()),
    emptyText: "Tidak ada kota yang cocok. Coba kata kunci lain.",
  });

  FIELD_CONTROLLERS.set(input, controller);
  return controller;
}

/**
 * Field dua langkah untuk form transportasi:
 * 1) input kota (autocomplete) — hanya kota yang punya lokasi transportasi tsb,
 * 2) <select> lokasi yang hanya berisi bandara/stasiun/terminal kota terpilih.
 * Select dikunci ("Pilih kota terlebih dahulu") sampai kota dipilih.
 */
function buildCityLocationField({ idBase, cityLabelText, locationLabelText, transportType }) {
  const cityId = `${idBase}City`;
  const unit = LOCATION_UNITS[transportType] ?? "lokasi";

  const group = document.createElement("div");
  group.className = "form-group";

  const cityLabel = document.createElement("label");
  cityLabel.setAttribute("for", cityId);
  cityLabel.textContent = cityLabelText;

  const wrapper = document.createElement("div");
  wrapper.className = "autocomplete";

  const cityInput = document.createElement("input");
  cityInput.type = "text";
  cityInput.className = "form-control";
  cityInput.id = cityId;
  cityInput.placeholder = "Ketik nama kota…";
  wrapper.appendChild(cityInput);

  const locLabel = document.createElement("label");
  locLabel.setAttribute("for", idBase);
  locLabel.textContent = locationLabelText;

  const locationSelect = document.createElement("select");
  locationSelect.className = "form-control";
  locationSelect.id = idBase;

  group.appendChild(cityLabel);
  group.appendChild(wrapper);
  group.appendChild(locLabel);
  group.appendChild(locationSelect);

  /** Isi select lokasi HANYA untuk kota terpilih; kota kosong -> dikunci. */
  function populateLocations(cityName, keepLocationId) {
    const placeholder = document.createElement("option");
    placeholder.value = "";
    locationSelect.replaceChildren(placeholder);

    if (!cityName) {
      placeholder.textContent = "— Pilih kota terlebih dahulu —";
      locationSelect.disabled = true;
      return;
    }

    const locs = locationsForTransport(transportType).filter((loc) => loc.city === cityName);
    placeholder.textContent = `— Pilih ${unit} di ${cityName} —`;
    for (const loc of locs) {
      const opt = document.createElement("option");
      opt.value = loc.id;
      opt.textContent = locationShortName(loc);
      locationSelect.appendChild(opt);
    }
    locationSelect.disabled = locs.length === 0;
    locationSelect.value =
      keepLocationId && locs.some((loc) => loc.id === keepLocationId) ? keepLocationId : "";
  }

  // Status awal: belum ada kota -> select lokasi terkunci
  populateLocations("", null);

  let pickedCity = "";

  const controller = {
    group,
    input: cityInput,
    locationSelect,
    getCity: () => cityInput.value.trim(),
    getLocation: () => locationSelect.value || null,
    setValue: (cityName, locationId) => {
      const city = cityName || "";
      cityInput.value = city;
      pickedCity = city;
      populateLocations(city, locationId || null);
      // Pra-isi tanpa id (mis. destinasi populer / kriteria lama): pilih lokasi
      // pertama kota itu — sama seperti perilaku select form sebelumnya.
      if (city && !locationId && !locationSelect.disabled && locationSelect.value === "") {
        const first = locationSelect.options[1];
        if (first) locationSelect.value = first.value;
      }
    },
  };

  attachAutocomplete(wrapper, cityInput, {
    fetchItems: (query) => matchCityItems(query, cityPoolForTransport(transportType)),
    emptyText: `Tidak ada kota dengan ${unit} pada data simulasi.`,
    onPick: (item) => {
      pickedCity = item.value;
      populateLocations(pickedCity, null);
      if (!locationSelect.disabled) locationSelect.focus(); // lanjut ke langkah 2
    },
  });

  // Mengetik ulang tanpa memilih saran -> pilihan lokasi direset (kunci lagi)
  cityInput.addEventListener("input", () => {
    if (cityInput.value.trim() !== pickedCity) {
      pickedCity = "";
      populateLocations("", null);
    }
  });

  FIELD_CONTROLLERS.set(cityInput, controller);
  FIELD_CONTROLLERS.set(locationSelect, controller);
  return controller;
}

/**
 * Menempelkan autocomplete (role=combobox + role=listbox) pada sebuah input.
 * Daftar hanya muncul saat ada teks yang diketik; navigasi Arrow/Enter/Escape.
 * @param {HTMLElement} wrapper - Wadah posisi-relative di sekitar input.
 * @param {HTMLInputElement} input
 * @param {Object} options
 * @param {Function} options.fetchItems - (query) => [{value,label,sublabel}]
 * @param {Function} [options.onPick] - (item) => void, setelah saran dipilih.
 * @param {string} [options.emptyText] - Pesan bila tidak ada saran yang cocok.
 */
function attachAutocomplete(wrapper, input, { fetchItems, onPick, emptyText }) {
  const listId = `${input.id}-suggestions`;
  const list = document.createElement("ul");
  list.className = "autocomplete-list";
  list.id = listId;
  list.setAttribute("role", "listbox");
  list.hidden = true;
  wrapper.appendChild(list);

  input.setAttribute("role", "combobox");
  input.setAttribute("aria-expanded", "false");
  input.setAttribute("aria-controls", listId);
  input.setAttribute("aria-autocomplete", "list");
  input.autocomplete = "off";

  let items = [];
  let activeIndex = -1;
  let blurTimer = null;

  function closeList() {
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    activeIndex = -1;
  }

  function highlight(index) {
    const options = list.querySelectorAll(".autocomplete-option");
    options.forEach((el, i) => {
      const active = i === index;
      el.classList.toggle("active", active);
      el.setAttribute("aria-selected", active ? "true" : "false");
      if (active) {
        input.setAttribute("aria-activedescendant", el.id);
        el.scrollIntoView({ block: "nearest" });
      }
    });
    activeIndex = index;
  }

  function pick(index) {
    const item = items[index];
    if (!item) return;
    input.value = item.label;
    closeList();
    list.replaceChildren();
    onPick?.(item);
  }

  function renderList() {
    const query = input.value.trim();
    if (!query) {
      closeList();
      list.replaceChildren();
      return;
    }

    items = fetchItems(query);
    list.replaceChildren();

    if (items.length === 0) {
      const empty = document.createElement("li");
      empty.className = "autocomplete-empty";
      empty.setAttribute("role", "presentation");
      empty.textContent = emptyText ?? "Tidak ada saran yang cocok.";
      list.appendChild(empty);
    } else {
      items.forEach((item, index) => {
        const option = document.createElement("li");
        option.className = "autocomplete-option";
        option.id = `${listId}-option-${index}`;
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", "false");

        const main = document.createElement("span");
        main.className = "autocomplete-main";
        main.textContent = item.label;

        const sub = document.createElement("span");
        sub.className = "autocomplete-sub";
        sub.textContent = item.sublabel ?? "";

        option.appendChild(main);
        option.appendChild(sub);
        // Tahan fokus input supaya blur tidak menutup daftar sebelum klik terjadi
        option.addEventListener("mousedown", (event) => event.preventDefault());
        option.addEventListener("click", () => pick(index));
        list.appendChild(option);
      });
    }

    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
    activeIndex = -1;
    input.removeAttribute("aria-activedescendant");
  }

  input.addEventListener("input", renderList);
  input.addEventListener("focus", () => {
    if (blurTimer) window.clearTimeout(blurTimer);
    if (input.value.trim()) renderList();
  });
  input.addEventListener("blur", () => {
    blurTimer = window.setTimeout(closeList, 120);
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeList();
      return;
    }
    if (list.hidden || items.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      highlight((activeIndex + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      highlight((activeIndex - 1 + items.length) % items.length);
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      pick(activeIndex);
    }
  });
}

/** Pasangan {name, sublabel} untuk semua kota (form "Semua"). */
function cityPoolGeneric() {
  return cities.map((city) => ({ name: city.name, sublabel: city.province }));
}

/**
 * Pasangan {name, sublabel} kota yang punya lokasi transportasi tertentu,
 * dengan jumlah lokasinya (mis. "DKI Jakarta · 2 bandara").
 */
function cityPoolForTransport(transportType) {
  const unit = LOCATION_UNITS[transportType] ?? "lokasi";
  const locs = locationsForTransport(transportType);
  const pool = [];
  for (const city of cities) {
    const count = locs.filter((loc) => loc.city === city.name).length;
    if (count === 0) continue;
    pool.push({ name: city.name, sublabel: `${city.province} · ${count} ${unit}` });
  }
  return pool;
}

/** Filter teks ketik terhadap pool kota; hasil dibatasi MAX_SUGGESTIONS. */
function matchCityItems(query, pool) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out = [];
  for (const city of pool) {
    const name = city.name.toLowerCase();
    const sub = (city.sublabel ?? "").toLowerCase();
    if (!name.includes(q) && !sub.includes(q)) continue;
    out.push({ value: city.name, label: city.name, sublabel: city.sublabel });
    if (out.length >= MAX_SUGGESTIONS) break;
  }
  return out;
}

/** Samakan kapitalisasi nama kota dengan data kota bila cocok persis (case-insensitive). */
function canonicalCityName(value) {
  const text = (value ?? "").trim();
  if (!text) return "";
  const lower = text.toLowerCase();
  const match = cities.find((city) => city.name.toLowerCase() === lower);
  return match ? match.name : text;
}

/**
 * Tombol tukar ⇄ yang bekerja untuk dua field (kota + lokasi terpilih ikut bertukar).
 * @param {{getCity: Function, getLocation: Function, setValue: Function}} originField
 * @param {Object|null} destField
 */
function buildSwapButton(originField, destField) {
  const swapBtn = document.createElement("button");
  swapBtn.type = "button";
  swapBtn.className = "swap-btn";
  swapBtn.setAttribute("aria-label", "Tukar lokasi asal dan tujuan");
  swapBtn.textContent = "⇄";
  swapBtn.addEventListener("click", () => {
    if (!destField) return;
    const origin = { city: originField.getCity(), loc: originField.getLocation() };
    const dest = { city: destField.getCity(), loc: destField.getLocation() };
    originField.setValue(dest.city, dest.loc);
    destField.setValue(origin.city, origin.loc);
  });
  return swapBtn;
}

function buildDateGroup(id, labelText, inputId) {
  const group = document.createElement("div");
  group.className = "form-group";
  const label = document.createElement("label");
  label.setAttribute("for", inputId);
  label.textContent = labelText;
  const input = document.createElement("input");
  input.type = "date";
  input.className = "form-control";
  input.id = inputId;
  group.appendChild(label);
  group.appendChild(input);
  return group;
}

function buildPassengerGroup(id, labelText, min, max) {
  const group = document.createElement("div");
  group.className = "form-group";
  const label = document.createElement("label");
  label.setAttribute("for", id);
  label.textContent = labelText;
  const input = document.createElement("input");
  input.type = "number";
  input.className = "form-control";
  input.id = id;
  input.min = String(min);
  input.max = String(max);
  input.value = String(min);
  group.appendChild(label);
  group.appendChild(input);
  return group;
}

/** Group radio sekali jalan / pulang-pergi (native radio = aksesibel). */
function buildTripTypeGroup() {
  const wrap = document.createElement("div");
  wrap.className = "form-group trip-type-group-wrap";

  const caption = document.createElement("span");
  caption.className = "form-caption";
  caption.textContent = "Tipe Perjalanan";
  wrap.appendChild(caption);

  const row = document.createElement("div");
  row.className = "trip-type-group";

  let current = "oneway";
  const onChangeCallbacks = [];
  const makeOption = (value, labelText, checked) => {
    const labelEl = document.createElement("label");
    labelEl.className = "trip-type-option";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "searchTripType";
    input.value = value;
    input.checked = checked;
    input.addEventListener("change", () => {
      if (!input.checked) return;
      current = value;
      onChangeCallbacks.forEach((cb) => cb(value));
    });
    const text = document.createElement("span");
    text.textContent = labelText;
    labelEl.appendChild(input);
    labelEl.appendChild(text);
    return labelEl;
  };

  row.appendChild(makeOption("oneway", "Sekali Jalan", true));
  row.appendChild(makeOption("roundtrip", "Pulang-Pergi", false));
  wrap.appendChild(row);

  return {
    group: wrap,
    getValue: () => current,
    setOnChange: (cb) => onChangeCallbacks.push(cb),
  };
}

function buildClassSelect(transportType, labelText) {
  const group = document.createElement("div");
  group.className = "form-group";
  const label = document.createElement("label");
  label.setAttribute("for", "searchClass");
  label.textContent = labelText;
  const select = document.createElement("select");
  select.className = "form-control";
  select.id = "searchClass";

  const allOpt = document.createElement("option");
  allOpt.value = "";
  allOpt.textContent = "Semua Kelas";
  select.appendChild(allOpt);

  for (const cls of classOptionsFor(transportType)) {
    const opt = document.createElement("option");
    opt.value = cls;
    opt.textContent = cls;
    select.appendChild(opt);
  }

  group.appendChild(label);
  group.appendChild(select);
  return group;
}

function buildSubmitButton(text) {
  const btn = document.createElement("button");
  btn.type = "submit";
  btn.className = "btn btn-primary search-submit";
  btn.textContent = text;
  return btn;
}

/**
 * Mengisi kembali nilai form aktif dari kriteria tersimpan (pencarian terakhir
 * & pra-isi destinasi populer). Untuk field dua langkah, kota dan lokasi terisi
 * bersamaan sehingga select lokasi ikut terisi (opsi tetap hanya milik kota itu).
 * @param {HTMLFormElement} form - Form aktif.
 * @param {Object} criteria - Kriteria tersimpan.
 */
export function fillSearchForm(form, criteria = {}) {
  if (!form) return;

  fillField(form.querySelector("#searchOrigin"), criteria.originLocationId, criteria.origin);
  fillField(form.querySelector("#searchDestination"), criteria.destinationLocationId, criteria.destination);

  const dateInput = form.querySelector("#searchDateInput");
  if (dateInput) dateInput.value = criteria.departureDate || "";

  const returnInput = form.querySelector("#searchReturnDateInput");
  if (returnInput) returnInput.value = criteria.returnDate || "";

  if (criteria.tripType === "roundtrip" && form.dataset.formKind !== "all") {
    const radio = form.querySelector('input[name="searchTripType"][value="roundtrip"]');
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event("change"));
    }
  }

  const classSelect = form.querySelector("#searchClass");
  if (classSelect) classSelect.value = criteria.travelClass || "";

  const paxInput = form.querySelector("#searchPassengers");
  if (paxInput && criteria.passengers != null) paxInput.value = String(criteria.passengers);

  const adultsInput = form.querySelector("#searchAdults");
  if (adultsInput && criteria.adults != null) adultsInput.value = String(criteria.adults);

  const childrenInput = form.querySelector("#searchChildren");
  if (childrenInput && criteria.children != null) childrenInput.value = String(criteria.children);
}

/** Isi satu field asal/tujuan dari kriteria (id lokasi atau nama kota). */
function fillField(element, locationId, cityName) {
  if (!element) return;
  const controller = FIELD_CONTROLLERS.get(element);
  if (controller) {
    const location = locationId ? getLocationById(locationId) : null;
    controller.setValue(location ? location.city : (cityName || ""), locationId || null);
    return;
  }
  // fallback untuk elemen select polos (tidak ada pada form baru)
  if (element instanceof HTMLSelectElement) fillLocationSelect(element, locationId, cityName);
}

function fillLocationSelect(select, locationId, cityName) {
  if (locationId) {
    const byId = Array.from(select.options).find((opt) => opt.value === locationId);
    if (byId) {
      select.value = byId.value;
      return;
    }
  }
  if (cityName) {
    const byCity = Array.from(select.options).find((opt) => opt.dataset.city === cityName);
    if (byCity) {
      select.value = byCity.value;
      return;
    }
  }
  // fallback: select dengan value = nama kota
  const direct = Array.from(select.options).find((opt) => opt.value === cityName);
  select.value = direct ? cityName : "";
}

export default buildSearchSection;
