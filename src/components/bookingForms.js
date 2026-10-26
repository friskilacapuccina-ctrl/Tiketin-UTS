/**
 * Tiketin-UTS — Form pemesanan BERTAHAP (stepper), ES module.
 * Satu modal, satu <form>, panel per langkah (bukan banyak halaman):
 *   1. Detail perjalanan  : ringkasan pergi/pulang + jumlah penumpang + estimasi total
 *   2. Data penumpang     : kartu dinamis per penumpang (nama, kategori, tgl lahir,
 *                           jenis kelamin, jenis + no. identitas)
 *   3. Kursi (bus)        : peta kursi data tiket, atau keterangan bila data tidak ada
 *   4. Kontak pemesan     : nama, email, telepon + kode negara, "Informasi tambahan"
 *                           yang bisa ditutup (permintaan bantuan & catatan)
 *   5. Ringkasan & konfirmasi : rincian jujur dari data tiket (tanpa biaya fiktif)
 *
 * Prinsip: DOM API saja (textContent, bukan innerHTML untuk data), validasi inline
 * dekat kolom + saat blur, data tidak hilang saat bolak-balik langkah, pengiriman
 * ganda dicegah guard flag + tombol dinonaktifkan, aturan validasi backend
 * (booking.js) tetap menjadi sumber kebenaran.
 */

import { formatRupiah } from "./ticketCard.js";
import { getLocationsForTicket, locationShortName } from "../data/locations.js";
import { createBooking, calculateTotal, isValidEmail, isValidPhone } from "../js/booking.js";
import { createSeatPicker } from "./seatPicker.js";

/** Kode negara yang ditawarkan (sesuai desain; bisa dikembangkan). */
const COUNTRY_CODES = [
  { code: "+62", label: "Indonesia (+62)" },
  { code: "+65", label: "Singapura (+65)" },
  { code: "+60", label: "Malaysia (+60)" },
  { code: "+61", label: "Australia (+61)" },
  { code: "+44", label: "Inggris (+44)" },
  { code: "+1", label: "Amerika Serikat (+1)" },
];

const IDENTITY_OPTIONS = [
  ["", "Pilih jenis identitas"],
  ["ktp", "KTP"],
  ["sim", "SIM"],
  ["passport", "Paspor"],
  ["kitas", "KITAS"],
  ["other", "Identitas lainnya"],
];

const GENDER_OPTIONS = [
  ["", "Pilih (opsional)"],
  ["male", "Laki-laki"],
  ["female", "Perempuan"],
];

const GENDER_LABELS = { male: "Laki-laki", female: "Perempuan" };
const IDENTITY_LABELS = { ktp: "KTP", sim: "SIM", passport: "Paspor", kitas: "KITAS", other: "Identitas lainnya" };
const PAX_CATEGORY_LABELS = { adult: "Dewasa", child: "Anak" };

/** Tanggal hari ini berformat YYYY-MM-DD (untuk batas input date). */
function todayIso() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

/**
 * Membangun form pemesanan bertahap.
 * @param {Object} options
 * @param {Object} options.ticket - Tiket pergi.
 * @param {Object|null} [options.returnTicket] - Tiket pulang (pulang-pergi).
 * @param {Object} [options.defaults] - { adults, children, passengers } dari pencarian.
 * @param {Function} [options.showToast] - (message, type) => void.
 * @param {Function} [options.onDone] - (order) => void setelah pesanan tersimpan.
 * @returns {HTMLFormElement}
 */
export function buildBookingForm(options = {}) {
  const { ticket, returnTicket = null, defaults = {}, showToast, onDone } = options;
  const isTrain = ticket.transportType === "train";
  const isBus = ticket.transportType === "bus";

  const form = document.createElement("form");
  form.className = "booking-form";
  form.noValidate = true;

  const maxSeats = Math.min(
    Number(ticket.availableSeats) || 1,
    returnTicket ? Number(returnTicket.availableSeats) || Infinity : Infinity,
  );

  /* ---------------- Jumlah penumpang (langkah Detail) ---------------- */
  let adultsInput = null;
  let childrenInput = null;
  let paxInput = null;
  const getPax = () => {
    if (paxInput) return Math.floor(Number(paxInput.value));
    const adults = Math.floor(Number(adultsInput?.value));
    const children = Math.floor(Number(childrenInput?.value));
    return (Number.isFinite(adults) ? adults : 0) + (Number.isFinite(children) ? children : 0);
  };
  const getAdultCount = () => (adultsInput ? Math.floor(Number(adultsInput.value)) || 0 : getPax());

  let countGroup1 = null;
  let countGroup2 = null;
  if (isBus) {
    countGroup1 = buildNumberGroup("bookingPassengers", "Jumlah Penumpang", 1, Math.min(maxSeats, 10));
    paxInput = countGroup1.querySelector("input");
    paxInput.value = String(Math.min(defaults.passengers || 1, maxSeats));
  } else {
    countGroup1 = buildNumberGroup("bookingAdults", "Penumpang Dewasa", 1, Math.min(maxSeats, 9));
    adultsInput = countGroup1.querySelector("input");
    adultsInput.value = String(Math.min(defaults.adults || 1, maxSeats));
    countGroup2 = buildNumberGroup("bookingChildren", "Penumpang Anak", 0, 9);
    childrenInput = countGroup2.querySelector("input");
    childrenInput.value = String(defaults.children || 0);
  }

  /* ---------------- Pemilih kursi (bus) ---------------- */
  const seatPicker = isBus ? createSeatPicker(ticket, { maxSelection: getPax() }) : null;

  /* ---------------- Definisi langkah ---------------- */
  const stepDefs = [
    { key: "detail", label: "Detail" },
    { key: "passengers", label: "Penumpang" },
  ];
  if (isBus) stepDefs.push({ key: "seats", label: "Kursi" });
  stepDefs.push({ key: "contact", label: "Kontak" });
  stepDefs.push({ key: "confirm", label: "Konfirmasi" });
  const idxPax = stepDefs.findIndex((s) => s.key === "passengers");
  const idxSeats = stepDefs.findIndex((s) => s.key === "seats");
  const idxConfirm = stepDefs.length - 1;

  /* ---------------- Indikator langkah (stepper) ---------------- */
  const stepperEl = document.createElement("ol");
  stepperEl.className = "booking-stepper";
  stepperEl.setAttribute("aria-label", "Tahapan pemesanan tiket");
  const stepItems = stepDefs.map((def, i) => {
    const li = document.createElement("li");
    const dot = document.createElement("span");
    dot.className = "stepper-dot";
    dot.textContent = String(i + 1);
    dot.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.className = "stepper-label";
    label.textContent = def.label;
    li.appendChild(dot);
    li.appendChild(label);
    stepperEl.appendChild(li);
    return li;
  });
  form.appendChild(stepperEl);

  /* ---------------- Panel-panel ---------------- */
  const panels = [];
  function createPanel(titleText, idKey) {
    const panel = document.createElement("section");
    panel.className = "step-panel";
    panel.id = `bookingStep-${idKey}`;
    panel.hidden = true;
    panel.tabIndex = -1;
    const h = document.createElement("h3");
    h.className = "step-title";
    h.tabIndex = -1;
    h.textContent = titleText;
    panel.appendChild(h);
    panels.push(panel);
    form.appendChild(panel);
    return panel;
  }

  // -- Panel 1: Detail perjalanan --
  const detailPanel = createPanel("Detail Perjalanan", "detail");
  detailPanel.appendChild(buildSummaryBlock(ticket, returnTicket));
  if (countGroup1) detailPanel.appendChild(countGroup1);
  if (countGroup2) detailPanel.appendChild(countGroup2);
  const countError = document.createElement("p");
  countError.className = "field-error span-all";
  countError.id = "bookingCountError";
  countError.hidden = true;
  detailPanel.appendChild(countError);
  const estGroup = document.createElement("div");
  estGroup.className = "form-group span-all booking-total-group";
  const estLabel = document.createElement("strong");
  estLabel.textContent = "Estimasi total: ";
  const totalValue = document.createElement("span");
  totalValue.id = "bookingTotal";
  totalValue.className = "booking-total";
  const totalNote = document.createElement("small");
  totalNote.className = "text-muted booking-total-note";
  estGroup.appendChild(estLabel);
  estGroup.appendChild(totalValue);
  estGroup.appendChild(totalNote);
  detailPanel.appendChild(estGroup);
  const detailNote = document.createElement("p");
  detailNote.className = "step-note text-muted span-all";
  detailNote.textContent = "Harga, jadwal, dan ketersediaan adalah data simulasi — bukan penawaran nyata.";
  detailPanel.appendChild(detailNote);

  // -- Panel 2: Data penumpang --
  const paxPanel = createPanel("Data Penumpang", "passengers");
  const paxList = document.createElement("div");
  paxList.className = "pax-list span-all";
  paxPanel.appendChild(paxList);
  const paxNote = document.createElement("p");
  paxNote.className = "step-note text-muted span-all";
  paxNote.textContent =
    "Kolom tanpa tanda “Opsional” wajib diisi. Kategori Dewasa/Anak mengikuti jumlah pada langkah sebelumnya. " +
    "Isi data sesuai identitas — ini simulasi, data tidak dikirim ke operator mana pun.";
  paxPanel.appendChild(paxNote);

  // -- Panel 3: Kursi (bus) --
  let seatError = null;
  if (isBus) {
    const seatPanel = createPanel("Pilih Kursi", "seats");
    if (seatPicker) {
      seatPanel.appendChild(seatPicker.el);
      seatError = document.createElement("p");
      seatError.className = "field-error span-all";
      seatError.id = "bookingSeatsError";
      seatError.hidden = true;
      seatPanel.appendChild(seatError);
    } else {
      const note = document.createElement("p");
      note.className = "seat-hint text-muted span-all";
      note.textContent =
        "Data nomor kursi tidak tersedia untuk jadwal ini; sistem memesankan kursi sesuai jumlah penumpang.";
      seatPanel.appendChild(note);
    }
  }

  // -- Panel: Kontak pemesan --
  const contactPanel = createPanel("Informasi Kontak Pemesan", "contact");
  const nameGroup = buildFieldGroup({
    id: "bookingContactName",
    label: "Nama Lengkap Pemesan",
    placeholder: "Sesuai kartu identitas pemesan",
  });
  const emailGroup = buildFieldGroup({
    id: "bookingEmail",
    label: "Email Aktif",
    type: "email",
    placeholder: "nama@contoh.com",
    hint: "Untuk konfirmasi simulasi — email tidak benar-benar dikirim.",
  });
  const phoneGroup = document.createElement("div");
  phoneGroup.className = "form-group span-all";
  const phoneLabel = document.createElement("label");
  phoneLabel.setAttribute("for", "bookingContactPhone");
  phoneLabel.appendChild(document.createTextNode("Nomor Telepon / WhatsApp "));
  const phoneTag = document.createElement("span");
  phoneTag.className = "field-tag";
  phoneTag.textContent = "wajib";
  phoneLabel.appendChild(phoneTag);
  const phoneRow = document.createElement("div");
  phoneRow.className = "phone-row";
  const countrySelect = document.createElement("select");
  countrySelect.className = "form-control phone-country";
  countrySelect.id = "bookingCountry";
  countrySelect.setAttribute("aria-label", "Kode negara telepon");
  for (const item of COUNTRY_CODES) {
    const opt = document.createElement("option");
    opt.value = item.code;
    opt.textContent = item.label;
    if (item.code === "+62") opt.selected = true;
    countrySelect.appendChild(opt);
  }
  const phoneInput = document.createElement("input");
  phoneInput.type = "tel";
  phoneInput.inputMode = "tel";
  phoneInput.className = "form-control";
  phoneInput.id = "bookingContactPhone";
  phoneInput.placeholder = "81234567890";
  phoneRow.appendChild(countrySelect);
  phoneRow.appendChild(phoneInput);
  phoneGroup.appendChild(phoneLabel);
  phoneGroup.appendChild(phoneRow);
  contactPanel.appendChild(nameGroup);
  contactPanel.appendChild(emailGroup);
  contactPanel.appendChild(phoneGroup);

  const nameInput = nameGroup.querySelector("input");
  const emailInput = emailGroup.querySelector("input");

  // Informasi tambahan (bisa ditutup-buka)
  const extra = document.createElement("details");
  extra.className = "extra-details span-all";
  const extraSummary = document.createElement("summary");
  extraSummary.textContent = "Informasi tambahan (opsional)";
  const extraBody = document.createElement("div");
  extraBody.className = "extra-body";
  const assistGroup = buildTextareaGroup({
    id: "bookingAssist",
    label: "Permintaan bantuan khusus",
    rows: 2,
    placeholder: "Mis. kursi roda, bantuan lansia, hewan pendamping",
  });
  const assistArea = assistGroup.querySelector("textarea");
  const assistHint = document.createElement("small");
  assistHint.className = "field-hint text-muted";
  assistHint.textContent = "Permintaan dicatat pada pesanan simulasi, bukan jaminan layanan operator.";
  assistGroup.appendChild(assistHint);
  const notesGroup = buildTextareaGroup({
    id: "bookingNotes",
    label: "Catatan perjalanan",
    rows: 2,
    placeholder: "Catatan opsional untuk perjalanan ini",
  });
  const notesArea = notesGroup.querySelector("textarea");
  const availNote = document.createElement("p");
  availNote.className = "field-hint text-muted";
  availNote.textContent = seatPicker
    ? "Preferensi nomor kursi dapat dipilih pada langkah Kursi. Pesanan makanan khusus tidak didukung data simulasi ini."
    : isBus
      ? "Pemilihan nomor kursi tidak tersedia untuk jadwal ini (data kursi tidak ada). Pesanan makanan khusus tidak didukung (simulasi)."
      : "Pemilihan nomor kursi & pesanan makanan khusus belum didukung data pada simulasi ini.";
  extraBody.appendChild(assistGroup);
  extraBody.appendChild(notesGroup);
  extraBody.appendChild(availNote);
  extra.appendChild(extraSummary);
  extra.appendChild(extraBody);
  contactPanel.appendChild(extra);

  const privacyNote = document.createElement("p");
  privacyNote.className = "privacy-note text-muted span-all";
  privacyNote.textContent =
    "Privasi: pesanan disimpan di localStorage browser Anda di perangkat ini — bukan penyimpanan terenkripsi. " +
    "Gunakan data dummy, jangan data sensitif.";
  contactPanel.appendChild(privacyNote);

  // -- Panel: Ringkasan & konfirmasi --
  const confirmPanel = createPanel("Ringkasan & Konfirmasi", "confirm");
  const confirmBody = document.createElement("div");
  confirmBody.className = "confirm-body span-all";
  confirmPanel.appendChild(confirmBody);
  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "btn btn-primary booking-confirm-btn span-all";
  submitBtn.textContent = "Konfirmasi Pesanan";
  confirmPanel.appendChild(submitBtn);

  /* ---------------- Navigasi bawah ---------------- */
  const nav = document.createElement("div");
  nav.className = "stepper-nav";
  const backBtn = document.createElement("button");
  backBtn.type = "button";
  backBtn.className = "btn btn-secondary";
  backBtn.textContent = "Kembali";
  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "btn btn-primary";
  nextBtn.textContent = "Lanjut";
  nav.appendChild(backBtn);
  nav.appendChild(nextBtn);
  form.appendChild(nav);

  /* ---------------- Mekanisme langkah ---------------- */
  let current = 0;

  function scrollFormTop() {
    form.closest(".modal-body")?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function focusStepTarget(panel) {
    const field = panel.querySelector(
      "input:not([type=hidden]):not(:disabled), select:not(:disabled), textarea:not(:disabled)",
    );
    if (field) {
      field.focus({ preventScroll: true });
      return;
    }
    panel.querySelector(".step-title")?.focus({ preventScroll: true });
  }

  function showStep(index, { focus = true } = {}) {
    current = index;
    panels.forEach((p, i) => {
      p.hidden = i !== index;
    });
    stepItems.forEach((li, i) => {
      li.classList.toggle("is-active", i === index);
      li.classList.toggle("is-done", i < index);
      if (i === index) li.setAttribute("aria-current", "step");
      else li.removeAttribute("aria-current");
    });
    backBtn.hidden = index === 0;
    nextBtn.hidden = index === idxConfirm;
    if (index === idxPax) ensurePaxCards();
    if (index === idxSeats && seatPicker) seatPicker.setMax(getPax());
    if (index === idxConfirm) renderConfirm();
    updateTotal();
    scrollFormTop();
    if (focus) focusStepTarget(panels[index]);
  }

  nextBtn.addEventListener("click", () => {
    if (!validateStep(current)) {
      const bad = panels[current].querySelector(".is-invalid, [aria-invalid='true']");
      bad?.focus({ preventScroll: true });
      return;
    }
    showStep(Math.min(current + 1, idxConfirm));
  });
  backBtn.addEventListener("click", () => showStep(Math.max(current - 1, 0)));

  /* ---------------- Penanda error inline ---------------- */
  function applyError(errEl, control, message) {
    if (!errEl) return message === "";
    if (message) {
      if (!errEl.id && control?.id) errEl.id = `${control.id}-error`;
      errEl.textContent = message;
      errEl.hidden = false;
      if (control) {
        control.classList.add("is-invalid");
        control.setAttribute("aria-invalid", "true");
        if (errEl.id) control.setAttribute("aria-describedby", errEl.id);
      }
    } else {
      errEl.textContent = "";
      errEl.hidden = true;
      if (control) {
        control.classList.remove("is-invalid");
        control.removeAttribute("aria-invalid");
        control.removeAttribute("aria-describedby");
      }
    }
    return message === "";
  }

  function setError(input, message) {
    const group = input.closest(".form-group") || input.parentElement;
    let errEl = group ? group.querySelector(":scope > .field-error") : null;
    if (!errEl && group) {
      errEl = document.createElement("p");
      errEl.className = "field-error";
      group.appendChild(errEl);
    }
    return applyError(errEl, input, message);
  }

  /** Validasi saat blur: hanya bila sudah terisi atau sedang error. */
  function wireField(input, validator) {
    const revalidate = () => {
      if (input.value.trim() !== "" || input.classList.contains("is-invalid")) validator(input);
    };
    input.addEventListener("blur", revalidate);
    input.addEventListener("input", () => {
      if (input.classList.contains("is-invalid")) validator(input);
    });
  }

  /* ---------------- Validasi per bidang ---------------- */
  function validateCountInput(input, label) {
    const raw = input.value.trim();
    if (raw === "") return applyError(countError, input, `${label} wajib diisi.`);
    const n = Math.floor(Number(raw));
    const min = Math.floor(Number(input.min));
    if (!Number.isFinite(n)) return applyError(countError, input, `${label} tidak valid.`);
    if (Number.isFinite(min) && n < min) return applyError(countError, input, `${label} minimal ${min}.`);
    const max = Math.floor(Number(input.max));
    if (Number.isFinite(max) && n > max) return applyError(countError, input, `${label} maksimal ${max}.`);
    return applyError(countError, input, "");
  }

  function validateCounts() {
    let ok = true;
    if (paxInput) {
      if (!validateCountInput(paxInput, "Jumlah penumpang")) ok = false;
    } else {
      if (!validateCountInput(adultsInput, "Penumpang dewasa")) ok = false;
      if (!validateCountInput(childrenInput, "Penumpang anak")) ok = false;
    }
    if (!ok) return false;
    const total = getPax();
    if (total < 1) {
      applyError(countError, paxInput || adultsInput, "Jumlah penumpang minimal 1.");
      return false;
    }
    if (total > maxSeats) {
      applyError(
        countError,
        paxInput || adultsInput,
        `Jumlah penumpang melebihi kursi tersisa (${maxSeats}).`,
      );
      return false;
    }
    applyError(countError, paxInput || adultsInput, "");
    return true;
  }

  function validatePaxField(input) {
    const kind = input.dataset.field;
    const value = input.value.trim();
    if (kind === "name") {
      return setError(input, value.length < 2 ? "Nama minimal 2 karakter." : "");
    }
    if (kind === "birth") {
      if (value === "") return setError(input, "Tanggal lahir wajib diisi.");
      if (Number.isNaN(new Date(`${value}T00:00:00`).getTime())) return setError(input, "Tanggal lahir tidak valid.");
      if (value > todayIso()) return setError(input, "Tanggal lahir tidak boleh melewati hari ini.");
      return setError(input, "");
    }
    if (kind === "gender") {
      return setError(input, value !== "" && !["male", "female"].includes(value) ? "Jenis kelamin tidak valid." : "");
    }
    if (kind === "idtype") {
      if (isTrain && value === "") return setError(input, "Pilih jenis identitas.");
      return setError(input, value !== "" && !IDENTITY_OPTIONS.some(([v]) => v === value) ? "Jenis identitas tidak dikenal." : "");
    }
    if (kind === "idnum") {
      if (value === "") {
        return isTrain ? setError(input, "No. identitas wajib diisi (10-20 digit angka).") : setError(input, "");
      }
      if (isTrain) return setError(input, /^[0-9]{10,20}$/.test(value) ? "" : "No. identitas harus 10-20 digit angka.");
      return setError(input, /^[0-9A-Za-z.\- ]{5,25}$/.test(value) ? "" : "No. identitas tidak valid.");
    }
    return true;
  }

  function validateContact() {
    let ok = true;
    if (!validateContactName(nameInput)) ok = false;
    if (!validateContactEmail(emailInput)) ok = false;
    if (!validateContactPhone(phoneInput)) ok = false;
    if (!ok) {
      const bad = contactPanel.querySelector(".is-invalid");
      bad?.focus({ preventScroll: true });
    }
    return ok;
  }

  function validateSeats() {
    if (!seatError || !seatPicker) return true;
    const total = getPax();
    const selected = seatPicker.getSelected().length;
    if (selected !== total) {
      return applyError(seatError, null, `Pilih tepat ${total} kursi (sudah dipilih ${selected}).`);
    }
    return applyError(seatError, null, "");
  }

  function validateStep(index) {
    const key = stepDefs[index].key;
    if (key === "detail") return validateCounts();
    if (key === "passengers") {
      ensurePaxCards();
      let ok = true;
      for (const input of paxList.querySelectorAll("[data-field]")) {
        if (!validatePaxField(input)) ok = false;
      }
      if (!ok) {
        const bad = paxList.querySelector(".is-invalid");
        bad?.focus({ preventScroll: true });
        bad?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      return ok;
    }
    if (key === "seats") return validateSeats();
    if (key === "contact") return validateContact();
    return true; // langkah konfirmasi divalidasi penuh saat submit
  }

  /* ---------------- Kartu penumpang dinamis ---------------- */
  function collectPaxValues() {
    return [...paxList.querySelectorAll(".pax-card")].map((card) => ({
      name: card.querySelector("[data-field=name]")?.value ?? "",
      birthDate: card.querySelector("[data-field=birth]")?.value ?? "",
      gender: card.querySelector("[data-field=gender]")?.value ?? "",
      identityType: card.querySelector("[data-field=idtype]")?.value ?? "",
      identityNumber: card.querySelector("[data-field=idnum]")?.value ?? "",
    }));
  }

  function ensurePaxCards() {
    const total = getPax();
    if (total < 1) return;
    if (paxList.children.length === total) return;
    const previous = collectPaxValues(); // pertahankan isian lama (per indeks)
    const adults = getAdultCount();
    paxList.replaceChildren();
    for (let i = 0; i < total; i++) {
      const category = i < adults ? "adult" : "child";
      paxList.appendChild(buildPaxCard(i, category, previous[i]));
    }
  }

  function buildPaxCard(index, category, prev = {}) {
    const card = document.createElement("div");
    card.className = "pax-card";

    const head = document.createElement("div");
    head.className = "pax-card-head";
    const title = document.createElement("h4");
    title.className = "pax-card-title";
    title.textContent = `Penumpang ${index + 1}`;
    const badge = document.createElement("span");
    badge.className = `badge pax-badge pax-${category}`;
    badge.textContent = PAX_CATEGORY_LABELS[category];
    head.appendChild(title);
    head.appendChild(badge);
    card.appendChild(head);

    const fields = document.createElement("div");
    fields.className = "pax-card-fields";

    const nameGroup = buildFieldGroup({
      id: `paxName${index}`,
      label: "Nama Lengkap (sesuai identitas)",
      placeholder: "Mis. Budi Santoso",
      value: prev.name,
    });
    nameGroup.querySelector("input").dataset.field = "name";

    const birthGroup = buildFieldGroup({
      id: `paxBirth${index}`,
      label: "Tanggal Lahir",
      type: "date",
      value: prev.birthDate,
    });
    const birthInput = birthGroup.querySelector("input");
    birthInput.dataset.field = "birth";
    birthInput.max = todayIso();

    const genderGroup = buildSelectGroup({
      id: `paxGender${index}`,
      label: "Jenis Kelamin",
      options: GENDER_OPTIONS,
      value: prev.gender,
      optional: true,
    });
    genderGroup.querySelector("select").dataset.field = "gender";

    const idTypeGroup = buildSelectGroup({
      id: `paxIdType${index}`,
      label: "Jenis Identitas",
      options: IDENTITY_OPTIONS,
      value: prev.identityType,
      optional: !isTrain,
    });
    idTypeGroup.querySelector("select").dataset.field = "idtype";

    const idNumGroup = buildFieldGroup({
      id: `paxIdNum${index}`,
      label: "No. Identitas",
      type: "text",
      inputMode: "numeric",
      placeholder: isTrain ? "10-20 digit angka" : "Opsional",
      value: prev.identityNumber,
      optional: !isTrain,
    });
    const idNumInput = idNumGroup.querySelector("input");
    idNumInput.dataset.field = "idnum";
    const idHint = document.createElement("small");
    idHint.className = "field-hint text-muted";
    idHint.textContent = isTrain
      ? "Simulasi: untuk kereta api, nomor identitas wajib 10-20 digit angka."
      : "Opsional pada perjalanan ini; bila diisi hanya disimpan untuk simulasi.";
    idNumGroup.appendChild(idHint);

    for (const group of [nameGroup, birthGroup, genderGroup, idTypeGroup, idNumGroup]) {
      fields.appendChild(group);
    }
    card.appendChild(fields);

    for (const input of fields.querySelectorAll("[data-field]")) {
      wireField(input, validatePaxField);
    }
    return card;
  }

  /* ---------------- Ringkasan konfirmasi ---------------- */
  function renderConfirm() {
    confirmBody.replaceChildren();

    confirmBody.appendChild(buildSummaryBlock(ticket, returnTicket));

    const count = getPax();
    const adults = getAdultCount();
    const values = collectPaxValues();

    const paxBlock = document.createElement("div");
    paxBlock.className = "confirm-block";
    const paxTitle = document.createElement("h4");
    paxTitle.className = "confirm-title";
    paxTitle.textContent = "Data Penumpang";
    paxBlock.appendChild(paxTitle);
    values.forEach((value, i) => {
      const category = i < adults ? "adult" : "child";
      const line = document.createElement("div");
      line.className = "confirm-line";
      const main = document.createElement("strong");
      main.textContent = `${i + 1}. ${value.name.trim()} — ${PAX_CATEGORY_LABELS[category]}`;
      const sub = document.createElement("span");
      const parts = [`Lahir: ${formatDateShort(value.birthDate)}`];
      if (value.gender) parts.push(GENDER_LABELS[value.gender] || value.gender);
      if (value.identityType || isTrain) {
        const typeLabel = IDENTITY_LABELS[value.identityType] || "Identitas";
        parts.push(
          value.identityNumber.trim()
            ? `${typeLabel} ••••${value.identityNumber.trim().slice(-4)}`
            : `${typeLabel} tercatat`,
        );
      }
      sub.textContent = parts.join(" · ");
      line.appendChild(main);
      line.appendChild(sub);
      paxBlock.appendChild(line);
    });
    confirmBody.appendChild(paxBlock);

    const contactBlock = document.createElement("div");
    contactBlock.className = "confirm-block";
    const contactTitle = document.createElement("h4");
    contactTitle.className = "confirm-title";
    contactTitle.textContent = "Kontak Pemesan";
    contactBlock.appendChild(contactTitle);
    const contactLines = [
      nameInput.value.trim(),
      emailInput.value.trim(),
      `${countrySelect.value} ${phoneInput.value.trim()}`,
    ];
    for (const text of contactLines) {
      const line = document.createElement("div");
      line.className = "confirm-line";
      line.textContent = text;
      contactBlock.appendChild(line);
    }
    confirmBody.appendChild(contactBlock);

    const priceBlock = document.createElement("div");
    priceBlock.className = "confirm-block confirm-price";
    const priceTitle = document.createElement("h4");
    priceTitle.className = "confirm-title";
    priceTitle.textContent = "Rincian Harga";
    priceBlock.appendChild(priceTitle);
    const priceLine = document.createElement("div");
    priceLine.className = "confirm-line";
    priceLine.textContent = returnTicket
      ? `Harga per orang: ${formatRupiah(ticket.price)} pergi + ${formatRupiah(returnTicket.price)} pulang`
      : `Harga per orang: ${formatRupiah(ticket.price)}`;
    priceBlock.appendChild(priceLine);
    const paxLine = document.createElement("div");
    paxLine.className = "confirm-line";
    paxLine.textContent = isBus
      ? `Jumlah penumpang: ${count} orang`
      : `Jumlah penumpang: ${count} orang (${adults} dewasa, ${count - adults} anak)`;
    priceBlock.appendChild(paxLine);
    const totalLine = document.createElement("div");
    totalLine.className = "confirm-total";
    const totalStrong = document.createElement("strong");
    totalStrong.textContent = `Total: ${formatRupiah(calculateTotal(ticket, count, returnTicket))}`;
    totalLine.appendChild(totalStrong);
    priceBlock.appendChild(totalLine);
    const priceNote = document.createElement("small");
    priceNote.className = "text-muted";
    priceNote.textContent = "Total dihitung langsung dari harga tiket × jumlah penumpang — tanpa pajak atau biaya tambahan.";
    priceBlock.appendChild(priceNote);
    confirmBody.appendChild(priceBlock);

    const simNote = document.createElement("p");
    simNote.className = "sim-note text-muted";
    simNote.textContent =
      "Proyek simulasi: tiket tidak diterbitkan oleh maskapai, kereta, atau bus manapun, dan tidak ada pembayaran nyata.";
    confirmBody.appendChild(simNote);
  }

  /* ---------------- Total ---------------- */
  function updateTotal() {
    const count = getPax();
    const valid = Number.isFinite(count) && count >= 1 && count <= maxSeats;
    totalValue.textContent = valid ? formatRupiah(calculateTotal(ticket, count, returnTicket)) : "—";
    totalNote.textContent = valid
      ? returnTicket
        ? `${count} penumpang × (${formatRupiah(ticket.price)} pergi + ${formatRupiah(returnTicket.price)} pulang)`
        : `${count} penumpang × ${formatRupiah(ticket.price)}`
      : "";
  }

  const onCountInput = () => {
    seatPicker?.setMax(getPax());
    if (!countError.hidden) validateCounts();
    updateTotal();
  };
  paxInput?.addEventListener("input", onCountInput);
  adultsInput?.addEventListener("input", onCountInput);
  childrenInput?.addEventListener("input", onCountInput);

  function validateContactName(input) {
    return setError(input, input.value.trim().length < 2 ? "Nama pemesan minimal 2 karakter." : "");
  }
  function validateContactEmail(input) {
    const value = input.value.trim();
    if (value === "") return setError(input, "Email wajib diisi.");
    return setError(input, isValidEmail(value) ? "" : "Email tidak valid (contoh: nama@domain.com).");
  }
  function validateContactPhone(input) {
    const value = input.value.trim();
    if (value === "") return setError(input, "Nomor telepon wajib diisi.");
    const combined = `${countrySelect.value} ${value}`.trim();
    return setError(input, isValidPhone(combined) ? "" : "Nomor telepon tidak valid (8-16 digit).");
  }
  wireField(nameInput, validateContactName);
  wireField(emailInput, validateContactEmail);
  wireField(phoneInput, validateContactPhone);
  countrySelect.addEventListener("change", () => {
    if (phoneInput.classList.contains("is-invalid")) validateContactPhone(phoneInput);
  });
  updateTotal();

  /* ---------------- Submit ---------------- */
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (form.dataset.submitting === "1") return; // kirim ganda -> abaikan

    // 1) Validasi seluruh langkah; bila ada yang belum valid, pindah ke langkahnya
    let firstBad = -1;
    for (let i = 0; i < stepDefs.length; i++) {
      if (!validateStep(i) && firstBad < 0) firstBad = i;
    }
    if (firstBad >= 0) {
      showStep(firstBad, { focus: false });
      const bad = panels[firstBad].querySelector(".is-invalid, [aria-invalid='true']");
      bad?.focus({ preventScroll: true });
      showToast?.("Lengkapi data yang ditandai pada langkah ini.", "warning");
      return;
    }

    const count = getPax();
    const adults = getAdultCount();
    const values = collectPaxValues();
    const passengerNames = values.map((v) => v.name.trim());
    const passengerDetails = values.map((v, i) => ({
      name: v.name.trim(),
      category: i < adults ? "adult" : "child",
      birthDate: v.birthDate,
      gender: v.gender,
      identityType: v.identityType,
      identityNumber: v.identityNumber,
    }));
    const passengerIdentities = isTrain ? values.map((v) => v.identityNumber.trim()) : undefined;
    const contactPhone = `${countrySelect.value} ${phoneInput.value.trim()}`.trim();

    // Nonaktifkan lebih dulu; aktifkan kembali bila gagal
    form.dataset.submitting = "1";
    submitBtn.disabled = true;

    try {
      const result = createBooking({
        ticket,
        returnTicket,
        passengers: count,
        passengerNames,
        contactName: nameInput.value,
        contactPhone,
        contactEmail: emailInput.value,
        passengerDetails,
        passengersAdults: adultsInput ? Math.floor(Number(adultsInput.value)) : count,
        passengersChildren: childrenInput ? Math.floor(Number(childrenInput.value)) : 0,
        passengerIdentities,
        selectedSeats: seatPicker ? seatPicker.getSelected() : undefined,
        specialRequest: assistArea.value,
        travelNotes: notesArea.value,
      });

      if (!result.ok) {
        form.dataset.submitting = "";
        submitBtn.disabled = false;
        showToast?.(result.errors[0] || "Pemesanan gagal.", "error");
        return;
      }

      onDone?.(result.order);
    } catch (err) {
      form.dataset.submitting = "";
      submitBtn.disabled = false;
      console.error("Pemesanan gagal:", err);
      showToast?.(`Pemesanan gagal: ${err.message}`, "error");
    }
  });

  // Inisialisasi tampilan awal (tanpa memindahkan fokus)
  showStep(0, { focus: false });

  return form;
}

/* ---------------- Bagian ringkasan ---------------- */
function summaryLegLines(ticket) {
  const { originLocation, destinationLocation } = getLocationsForTicket(ticket);
  const head = [ticket.operator];
  if (ticket.travelClass) head.push(ticket.travelClass);

  const route = originLocation && destinationLocation
    ? `${locationShortName(originLocation)} → ${locationShortName(destinationLocation)}`
    : `${ticket.origin} → ${ticket.destination}`;

  const extras = [];
  if (ticket.transportType === "plane") {
    if (ticket.flightNo) extras.push(`No. penerbangan ${ticket.flightNo}`);
    if (Number.isFinite(Number(ticket.baggageKg))) extras.push(`Bagasi ${ticket.baggageKg} kg`);
    extras.push(Number.isInteger(ticket.stops) && ticket.stops > 0 ? `${ticket.stops} transit` : "Langsung");
  }
  if (ticket.transportType === "bus" && Array.isArray(ticket.facilities)) {
    extras.push(...ticket.facilities);
  }

  return {
    head: head.join(" · "),
    route,
    schedule: `${formatDate(ticket.departureDate)} · ${ticket.departureTime} – ${ticket.arrivalTime} (durasi ${ticket.duration})`,
    extras: extras.join(" · "),
    price: `${formatRupiah(ticket.price)}/orang`,
  };
}

function buildSummaryBlock(ticket, returnTicket) {
  const block = document.createElement("div");
  block.className = "booking-summary span-all";

  const buildLeg = (legTicket, legTitle) => {
    const wrap = document.createElement("div");
    wrap.className = "booking-leg";
    const title = document.createElement("strong");
    title.textContent = legTitle;
    const lines = summaryLegLines(legTicket);
    wrap.appendChild(title);
    for (const [cls, text] of [["", lines.head], ["", lines.route], ["text-muted", lines.schedule], ["text-muted", lines.extras], ["", `Harga: ${lines.price}`]]) {
      if (!text) continue;
      const p = document.createElement("div");
      p.className = cls;
      p.textContent = text;
      wrap.appendChild(p);
    }
    return wrap;
  };

  block.appendChild(buildLeg(ticket, returnTicket ? "Pergi" : "Perjalanan"));
  if (returnTicket) block.appendChild(buildLeg(returnTicket, "Pulang"));
  return block;
}

/* ---------------- Builder elemen form ---------------- */
function buildNumberGroup(id, labelText, min, max) {
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
  input.max = String(Number.isFinite(max) ? max : 9);
  input.value = String(min);
  group.appendChild(label);
  group.appendChild(input);
  return group;
}

function buildFieldGroup({ id, label, type = "text", placeholder = "", value = "", hint = "", optional = false, inputMode }) {
  const group = document.createElement("div");
  group.className = "form-group";
  const labelEl = document.createElement("label");
  labelEl.setAttribute("for", id);
  labelEl.appendChild(document.createTextNode(label));
  if (optional) {
    const tag = document.createElement("span");
    tag.className = "field-tag field-tag-opt";
    tag.textContent = "Opsional";
    labelEl.appendChild(tag);
  }
  const input = document.createElement("input");
  input.type = type;
  input.className = "form-control";
  input.id = id;
  if (placeholder) input.placeholder = placeholder;
  if (value) input.value = value;
  if (inputMode) input.inputMode = inputMode;
  group.appendChild(labelEl);
  group.appendChild(input);
  if (hint) {
    const small = document.createElement("small");
    small.className = "field-hint text-muted";
    small.textContent = hint;
    group.appendChild(small);
  }
  return group;
}

function buildSelectGroup({ id, label, options, value = "", optional = false }) {
  const group = document.createElement("div");
  group.className = "form-group";
  const labelEl = document.createElement("label");
  labelEl.setAttribute("for", id);
  labelEl.appendChild(document.createTextNode(label));
  if (optional) {
    const tag = document.createElement("span");
    tag.className = "field-tag field-tag-opt";
    tag.textContent = "Opsional";
    labelEl.appendChild(tag);
  }
  const select = document.createElement("select");
  select.className = "form-control";
  select.id = id;
  for (const [optValue, optLabel] of options) {
    const opt = document.createElement("option");
    opt.value = optValue;
    opt.textContent = optLabel;
    if (optValue === value) opt.selected = true;
    select.appendChild(opt);
  }
  group.appendChild(labelEl);
  group.appendChild(select);
  return group;
}

function buildTextareaGroup({ id, label, rows = 2, placeholder = "" }) {
  const group = document.createElement("div");
  group.className = "form-group";
  const labelEl = document.createElement("label");
  labelEl.setAttribute("for", id);
  labelEl.textContent = label;
  const area = document.createElement("textarea");
  area.className = "form-control";
  area.id = id;
  area.rows = rows;
  if (placeholder) area.placeholder = placeholder;
  group.appendChild(labelEl);
  group.appendChild(area);
  return group;
}

/** Format tanggal "YYYY-MM-DD" -> "Sen, 20 Okt 2026". */
function formatDate(isoDate) {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format tanggal "YYYY-MM-DD" -> "20 Okt 2026" (tanpa hari). */
function formatDateShort(isoDate) {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate || "—";
  return parsed.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default buildBookingForm;
