/**
 * Tiketin-UTS — Bootstrap aplikasi (ES module).
 * Menghubungkan index.html dengan modul data, pencarian, kartu tiket,
 * pemesanan, dan riwayat pesanan. Semua selector memakai ID yang benar-benar
 * ada di index.html (#mainContent, #themeToggle, #userBtn, #userDropdown,
 * #mobileMenuBtn, #mobileMenuOverlay, #ticketDetailModal, #bookingModal,
 * #successModal, #toastContainer, dll). Halaman (termasuk form pencarian)
 * dirender dinamis ke #mainContent karena index.html hanya menyediakan wadahnya.
 */

import { cities } from "../data/cities.js";
import { tickets } from "../data/tickets.js";
import {
  searchTickets,
  filterTicketsByPrice,
  validateSearchCriteria,
  buildReturnCriteria,
  isValidReturnLeg,
  sortTickets,
  findAvailableDates,
  findAlternativeRoutes,
  sortDatesByProximity,
  formatShortDate,
  formatLongDate,
  TRANSPORT_LABELS,
} from "./search.js";
import { SORT_OPTIONS } from "./algorithms.js";
import { THEME_STORAGE_KEY, normalizeTheme, toggleThemeName } from "./theme.js";
import { createTicketCard, formatRupiah } from "../components/ticketCard.js";
import { buildSearchSection, fillSearchForm } from "../components/searchForms.js";
import { buildTripDetailBody } from "../components/tripDetails.js";
import { buildBookingForm } from "../components/bookingForms.js";
import { getLocationById, locationShortName } from "../data/locations.js";
import { renderOrders } from "./orders.js";

const BASE_URL = import.meta.env.BASE_URL;

/** State aplikasi (module scope, aman dari listener ganda). */
const state = {
  currentPage: "home",
  lastCriteria: null,
  lastResults: { outbound: [], returning: [] },
  selectedTicket: null,
  selectedReturnTicket: null,
  tripSelection: { outbound: null, returning: null },
  pendingPassengers: 1,
  pendingAdults: 1,
  pendingChildren: 0,
  prefillDestination: null,
  prefillTransportType: null,
};

/**
 * Membuat elemen <svg> stroke-based (gaya ikon seragam) dari daftar path D.
 * Semua ikon memakai viewBox 24, stroke currentColor, garis membulat.
 */
function iconSvg(paths, size = 22) {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  for (const d of paths) {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", d);
    svg.appendChild(p);
  }
  return svg;
}

const els = {};

function cacheElements() {
  els.app = document.getElementById("app");
  els.mainContent = document.getElementById("mainContent");
  els.themeToggle = document.getElementById("themeToggle");
  els.userBtn = document.getElementById("userBtn");
  els.userDropdown = document.getElementById("userDropdown");
  els.mobileMenuBtn = document.getElementById("mobileMenuBtn");
  els.mobileMenuOverlay = document.getElementById("mobileMenuOverlay");
  els.ticketDetailModal = document.getElementById("ticketDetailModal");
  els.modalTitle = document.getElementById("modalTitle");
  els.modalBody = document.getElementById("modalBody");
  els.modalCloseBtn = document.getElementById("modalCloseBtn");
  els.closeTicketModal = document.getElementById("closeTicketModal");
  els.modalBookBtn = document.getElementById("modalBookBtn");
  els.bookingModal = document.getElementById("bookingModal");
  els.bookingModalTitle = document.getElementById("bookingModalTitle");
  els.bookingModalBody = document.getElementById("bookingModalBody");
  els.closeBookingModal = document.getElementById("closeBookingModal");
  els.successModal = document.getElementById("successModal");
  els.successModalBody = document.getElementById("successModalBody");
  els.successCloseBtn = document.getElementById("successCloseBtn");
  els.successOrdersBtn = document.getElementById("successOrdersBtn");
  els.toastContainer = document.getElementById("toastContainer");
}

/* ---------------- Toast ---------------- */
function showToast(message, type = "info") {
  if (!els.toastContainer) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.setAttribute("role", "status");
  toast.textContent = message;
  els.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("hide");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  }, 3500);
}

/* ---------------- Navigasi halaman ---------------- */
const PAGES = ["home", "search", "orders", "profile", "settings"];

function navigate(page) {
  if (!PAGES.includes(page)) {
    showToast("Halaman tidak dikenal.", "error");
    return;
  }
  state.currentPage = page;
  updateActiveNav(page);
  closeMobileMenu();
  closeUserDropdown();

  try {
    switch (page) {
      case "home":
        renderHomePage();
        break;
      case "search":
        renderSearchPage();
        break;
      case "orders":
        renderOrdersPage();
        break;
      default:
        renderSimplePage(page);
    }
  } catch (err) {
    console.error("Gagal merender halaman:", err);
    showToast(`Terjadi kesalahan saat membuka halaman: ${err.message}`, "error");
  }
}

function updateActiveNav(page) {
  document.querySelectorAll("[data-page]").forEach((link) => {
    link.classList.toggle("active", link.dataset.page === page);
  });
}

/* ---------------- Halaman: Beranda & Cari Tiket ---------------- */
function renderHomePage() {
  els.mainContent.replaceChildren();

  const hero = document.createElement("section");
  hero.className = "hero";

  // Foto latar hero. Bila gambar gagal dimuat, elemen dihapus sehingga
  // gradien biru pada .hero tetap tampil sebagai fallback.
  const heroBg = document.createElement("img");
  heroBg.className = "hero-bg";
  heroBg.src = `${BASE_URL}images/hero-travel.webp`;
  heroBg.alt = "Kereta cepat Whoosh melintasi jembatan di atas persawahan hijau Indonesia";
  heroBg.loading = "eager";
  heroBg.decoding = "async";
  heroBg.addEventListener("error", () => heroBg.remove());
  hero.appendChild(heroBg);

  const heroContent = document.createElement("div");
  heroContent.className = "container hero-content";

  // Mark logo Tiketin pada halaman utama (berbentuk maskot; lihat public/images/).
  const heroLogo = document.createElement("img");
  heroLogo.className = "hero-logo";
  heroLogo.src = `${BASE_URL}images/logo-icon.svg`;
  heroLogo.width = 72;
  heroLogo.height = 72;
  heroLogo.alt = "";
  heroLogo.setAttribute("aria-hidden", "true");
  heroContent.appendChild(heroLogo);

  const title = document.createElement("h1");
  title.className = "hero-title";
  title.textContent = "Perjalanan Seru, Semudah Itu.";

  const subtitle = document.createElement("p");
  subtitle.className = "hero-subtitle";
  subtitle.textContent =
    "Temukan tiket pesawat, kereta api, dan bus untuk perjalananmu di berbagai kota Indonesia.";

  // Kategori transportasi: dapat diklik -> membuka pencarian dengan tab aktif.
  const badges = document.createElement("div");
  badges.className = "hero-badges";
  for (const [label, type] of [
    ["Pesawat", "plane"],
    ["Kereta Api", "train"],
    ["Bus", "bus"],
  ]) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "hero-badge";
    b.textContent = label;
    b.setAttribute("aria-label", `Cari tiket ${label}`);
    b.addEventListener("click", () => {
      state.prefillTransportType = type;
      navigate("search");
    });
    badges.appendChild(b);
  }

  heroContent.appendChild(title);
  heroContent.appendChild(subtitle);
  heroContent.appendChild(badges);
  hero.appendChild(heroContent);

  const searchSection = buildSearchSection({ onSearch: runSearch });
  const destSection = buildDestinationSection();

  const infoSection = document.createElement("section");
  infoSection.className = "section";
  const infoHeader = document.createElement("div");
  infoHeader.className = "section-header";
  const infoTitle = document.createElement("h2");
  infoTitle.className = "section-title";
  infoTitle.textContent = "Mengapa Tiketin?";
  const infoSub = document.createElement("p");
  infoSub.className = "section-subtitle";
  infoSub.textContent = "Simulasi pemesanan untuk tugas UTS Struktur Data.";
  infoHeader.appendChild(infoTitle);
  infoHeader.appendChild(infoSub);

  const grid = document.createElement("div");
  grid.className = "container grid grid-4";
  const benefits = [
    [
      iconSvg([
        "M4 6h16M4 12h16M4 18h10",
        "M18.5 16.5l2 2 3-3.5",
      ]),
      "Banyak Pilihan",
      `${tickets.length} jadwal simulasi dari ${cities.length} kota di Indonesia.`,
    ],
    [
      iconSvg(["M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z", "M21 21l-4.3-4.3"]),
      "Pencarian Praktis",
      "Cari berdasarkan kota, tanggal, jenis transportasi, dan jumlah penumpang.",
    ],
    [
      iconSvg(["M6 3h12v18l-3-2-3 2-3-2-3 2z", "M9 8h6M9 12h6"]),
      "Pesanan Tersimpan",
      "Lihat riwayat pemesanan dan batalkan kapan saja.",
    ],
    [
      iconSvg(["M3.5 12.5 12 4h7.5V11.5L11 20a2 2 0 0 1-2.8 0l-4.7-4.7a2 2 0 0 1 0-2.8z", "M16 8h.01"]),
      "Harga Transparan",
      "Harga per penumpang dan total tagihan ditampilkan sejak awal.",
    ],
  ];
  for (const [icon, h, p] of benefits) {
    const card = document.createElement("div");
    card.className = "card benefit-card";
    const iconWrap = document.createElement("span");
    iconWrap.className = "benefit-icon";
    iconWrap.setAttribute("aria-hidden", "true");
    iconWrap.appendChild(icon);
    const ch = document.createElement("h3");
    ch.textContent = h;
    const cp = document.createElement("p");
    cp.className = "text-muted";
    cp.textContent = p;
    card.appendChild(iconWrap);
    card.appendChild(ch);
    card.appendChild(cp);
    grid.appendChild(card);
  }

  infoSection.appendChild(infoHeader);
  infoSection.appendChild(grid);

  els.mainContent.appendChild(hero);
  els.mainContent.appendChild(searchSection.section);
  els.mainContent.appendChild(destSection);
  els.mainContent.appendChild(infoSection);
}

/** Destinasi populer: kartu gambar yang membuka halaman pencarian (tujuan terisi). */
const DESTINATIONS = [
  { name: "Bali", city: "Denpasar", image: "bali.webp", blurb: "Pantai & pura di pulau dewata" },
  { name: "Yogyakarta", city: "Yogyakarta", image: "yogyakarta.webp", blurb: "Candi & budaya Jawa" },
  { name: "Bandung", city: "Bandung", image: "bandung.webp", blurb: "Perbukitan teh yang sejuk" },
  { name: "Danau Toba", city: "Medan", image: "danau-toba.webp", blurb: "Danau vulkanik terbesar" },
];

function buildDestinationSection() {
  const section = document.createElement("section");
  section.className = "section section-alt";

  const header = document.createElement("div");
  header.className = "section-header";
  const h = document.createElement("h2");
  h.className = "section-title";
  h.textContent = "Destinasi Populer";
  const p = document.createElement("p");
  p.className = "section-subtitle";
  p.textContent = "Pilih destinasi favoritmu, kami tampilkan jadwal yang tersedia.";
  header.appendChild(h);
  header.appendChild(p);

  const grid = document.createElement("div");
  grid.className = "container dest-grid";

  for (const dest of DESTINATIONS) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "dest-card";
    // Nama tombol diambil dari teks yang terlihat (nama destinasi + keterangan),
    // jadi aria-label terpisah tidak dipasang agar cocok dengan teks terlihat.

    const img = document.createElement("img");
    img.className = "dest-img";
    img.src = `${BASE_URL}images/${dest.image}`;
    img.alt = `Pemandangan ${dest.name} di Indonesia`;
    img.loading = "lazy";
    img.decoding = "async";
    // Fallback: bila gambar gagal, kartu tetap tampil dengan latar gradien.
    img.addEventListener("error", () => img.remove());

    const body = document.createElement("div");
    body.className = "dest-body";
    const name = document.createElement("span");
    name.className = "dest-name";
    name.textContent = dest.name;
    const blurb = document.createElement("span");
    blurb.className = "dest-blurb";
    blurb.textContent = dest.blurb;
    const cta = document.createElement("span");
    cta.className = "dest-cta";
    cta.textContent = "Cari jadwal \u2192";
    body.appendChild(name);
    body.appendChild(blurb);
    body.appendChild(cta);

    card.appendChild(img);
    card.appendChild(body);
    card.addEventListener("click", () => {
      state.prefillDestination = dest.city;
      navigate("search");
    });

    grid.appendChild(card);
  }

  section.appendChild(header);
  section.appendChild(grid);
  return section;
}

function renderSearchPage() {
  els.mainContent.replaceChildren();
  const section = document.createElement("section");
  section.className = "section";

  const header = document.createElement("div");
  header.className = "section-header";
  const h = document.createElement("h2");
  h.className = "section-title";
  h.textContent = "Cari Tiket";
  const p = document.createElement("p");
  p.className = "section-subtitle";
  p.textContent = "Temukan jadwal perjalanan sesuai kebutuhan Anda.";
  header.appendChild(h);
  header.appendChild(p);

  const container = document.createElement("div");
  container.className = "container";

  section.appendChild(header);
  section.appendChild(container);

  const search = buildSearchSection({ onSearch: runSearch });
  container.appendChild(search.section);

  els.mainContent.appendChild(section);

  // Pra-isi tab jenis transportasi (mis. dari tautan footer "Pesan Tiket Kereta")
  if (state.prefillTransportType) {
    search.setActiveType(state.prefillTransportType);
    state.prefillTransportType = null;
  }

  // Tampilkan kembali hasil pencarian terakhir bila ada
  if (state.lastCriteria) {
    search.setActiveType(state.lastCriteria.kind || "all");
    fillSearchForm(search.getForm(), state.lastCriteria);
    renderResults(search.getResultsMount());
  }

  // Pra-isi kota tujuan saat pengguna datang dari kartu destinasi populer
  if (state.prefillDestination) {
    fillSearchForm(search.getForm(), { destination: state.prefillDestination });
    state.prefillDestination = null;
  }
}

/* ---------------- Pencarian & hasil (khas transportasi) ---------------- */

/** Menjalankan pencarian dari kriteria form (dipanggil buildSearchSection). */
function runSearch(criteria) {
  const validationError = validateSearchCriteria(criteria);
  if (validationError) {
    showToast(validationError, "warning");
    return;
  }

  const pax = Math.floor(Number(criteria.passengers));
  state.pendingPassengers = pax;
  state.pendingAdults = Number.isFinite(Number(criteria.adults)) ? Number(criteria.adults) : pax;
  state.pendingChildren = Number.isFinite(Number(criteria.children)) ? Number(criteria.children) : 0;
  state.tripSelection = { outbound: null, returning: null };

  try {
    // Jalankan Linear Search untuk tiket pergi.
    const outbound = searchTickets({ ...criteria, passengers: pax }, tickets);

    let returning = [];
    if (criteria.tripType === "roundtrip") {
      const returnResults = searchTickets({ ...buildReturnCriteria(criteria), passengers: pax }, tickets);
      // Jadwal pulang harus valid terhadap setiap jadwal pergi yang mungkin dipilih
      returning = returnResults.filter((ret) => outbound.some((out) => isValidReturnLeg(out, ret)));
    }

    state.lastCriteria = criteria;
    state.lastResults = { outbound, returning };

    let resultsWrap = document.getElementById("searchResults");
    if (!resultsWrap) {
      resultsWrap = document.createElement("div");
      resultsWrap.id = "searchResults";
      resultsWrap.className = "mt-3";
      els.mainContent.appendChild(resultsWrap);
    }
    renderResults(resultsWrap);

    if (criteria.tripType === "roundtrip") {
      const found = outbound.length > 0 || returning.length > 0;
      showToast(
        found
          ? `Ditemukan ${outbound.length} tiket pergi dan ${returning.length} tiket pulang.`
          : "Tidak ada tiket yang cocok dengan pencarian Anda.",
        found ? "success" : "warning",
      );
    } else {
      showToast(
        outbound.length > 0
          ? `Ditemukan ${outbound.length} tiket.`
          : "Tidak ada tiket yang cocok dengan pencarian Anda.",
        outbound.length > 0 ? "success" : "warning",
      );
    }
  } catch (err) {
    console.error("Pencarian gagal:", err);
    showToast(`Pencarian gagal: ${err.message}`, "error");
  }
}

/** Judul hasil: memakai label bandara/stasiun/terminal bila pencarian per lokasi. */
function resultsTitle(criteria) {
  const originLoc = criteria.originLocationId ? getLocationById(criteria.originLocationId) : null;
  const destLoc = criteria.destinationLocationId ? getLocationById(criteria.destinationLocationId) : null;
  const originLabel = locationShortName(originLoc) || criteria.origin;
  const destLabel = locationShortName(destLoc) || criteria.destination;
  const datePart = criteria.departureDate ? ` · ${formatDate(criteria.departureDate)}` : "";
  const tripPart = criteria.tripType === "roundtrip" ? " (Pulang-pergi)" : "";
  return `Hasil: ${originLabel} → ${destLabel}${datePart}${tripPart}`;
}

/** Elemen empty-state ringkas (untuk grid yang terfilter). */
function buildInlineEmpty(message) {
  const empty = document.createElement("div");
  empty.className = "empty-state";
  const p = document.createElement("p");
  p.textContent = message;
  empty.appendChild(p);
  return empty;
}

/* ---------------- Empty-state pencarian tanpa hasil ---------------- */

/**
 * Menjalankan ulang pencarian dengan tanggal (pergi ATAU pulang) yang baru
 * dipilih dari chip tanggal alternatif. Input tanggal pada form pencarian ikut
 * diperbarui agar form tetap konsisten dengan hasil yang ditampilkan.
 */
function rerunSearchWithDate(criteria, patch) {
  if (patch.departureDate) {
    const dateInput = document.getElementById("searchDateInput");
    if (dateInput) dateInput.value = patch.departureDate;
  }
  if (patch.returnDate) {
    const returnInput = document.getElementById("searchReturnDateInput");
    if (returnInput) returnInput.value = patch.returnDate;
  }
  runSearch({ ...criteria, ...patch });
}

/**
 * Deretan chip tanggal alternatif (dapat diklik): tanggal diurutkan dari yang
 * paling dekat dengan tanggal pilihan pengguna; memilih salah satunya langsung
 * menjalankan pencarian ulang dengan tanggal tersebut.
 */
function buildDateChips({ label, dates, preferredDate, criteria, field }) {
  const wrap = document.createElement("div");
  wrap.className = "date-chips-block";

  const heading = document.createElement("p");
  heading.className = "date-chips-label";
  heading.textContent = label;
  wrap.appendChild(heading);

  const row = document.createElement("div");
  row.className = "date-chips";
  const ordered = sortDatesByProximity(dates, preferredDate);
  for (const date of ordered) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "date-chip";
    chip.textContent = formatShortDate(date);
    chip.setAttribute("aria-label", `Cari tiket pada ${formatLongDate(date)}`);
    chip.addEventListener("click", () => rerunSearchWithDate(criteria, { [field]: date }));
    row.appendChild(chip);
  }
  wrap.appendChild(row);
  return wrap;
}

/** Label rute untuk pesan empty-state ("Bandara Halim → Bandara Juanda"). */
function routeLabel(criteria) {
  const originLoc = criteria.originLocationId ? getLocationById(criteria.originLocationId) : null;
  const destLoc = criteria.destinationLocationId ? getLocationById(criteria.destinationLocationId) : null;
  const originLabel = locationShortName(originLoc) || criteria.origin || "lokasi asal";
  const destLabel = locationShortName(destLoc) || criteria.destination || "lokasi tujuan";
  return `${originLabel} → ${destLabel}`;
}

/**
 * Blok "Rute lain yang tersedia" — informatif, ditampilkan ketika rute yang
 * dicari tidak punya jadwal sama sekali (bukan hasil pencocokan pencarian).
 */
function buildAlternativeRoutesBlock(criteria) {
  const routes = findAlternativeRoutes(criteria);
  if (routes.length === 0) return null;

  const wrap = document.createElement("div");
  wrap.className = "alt-routes";
  const heading = document.createElement("p");
  heading.className = "date-chips-label";
  heading.textContent = "Rute lain yang tersedia (bukan hasil pencarian Anda):";
  wrap.appendChild(heading);

  const list = document.createElement("ul");
  list.className = "alt-route-list";
  for (const route of routes) {
    const item = document.createElement("li");
    item.className = "alt-route-item";

    const originLoc = getLocationById(route.originLocationId);
    const destLoc = getLocationById(route.destinationLocationId);
    const name = document.createElement("span");
    name.className = "alt-route-name";
    const typeLabel = TRANSPORT_LABELS[route.transportType] || route.transportType;
    name.textContent =
      `${locationShortName(originLoc) || route.origin} → ${locationShortName(destLoc) || route.destination}` +
      ` (${typeLabel})`;

    const info = document.createElement("span");
    info.className = "alt-route-info";
    let preview = "";
    for (let i = 0; i < route.dates.length && i < 4; i += 1) {
      preview += (i > 0 ? ", " : "") + formatShortDate(route.dates[i]);
    }
    const more = route.dates.length > 4 ? ` +${route.dates.length - 4} lainnya` : "";
    info.textContent = `${route.dates.length} tanggal: ${preview}${more}`;

    item.appendChild(name);
    item.appendChild(info);
    list.appendChild(item);
  }
  wrap.appendChild(list);
  return wrap;
}

/**
 * Empty-state pencarian 0 hasil: judul tanggal + chip tanggal alternatif yang
 * dapat diklik (terurut kedekatan), ATAU penjelasan rute tanpa jadwal +
 * daftar rute lain yang tersedia.
 */
function buildEmptyState(criteria, isRoundTrip) {
  const empty = document.createElement("div");
  empty.className = "empty-state";

  const heading = document.createElement("h3");
  heading.textContent = criteria.departureDate
    ? `Tidak ada tiket untuk tanggal ${formatLongDate(criteria.departureDate)}.`
    : "Tidak ada tiket ditemukan";
  empty.appendChild(heading);

  const advice = document.createElement("p");
  advice.textContent = isRoundTrip
    ? "Coba ubah lokasi, tanggal berangkat/pulang, kelas, atau jumlah penumpang. Pastikan tersedia jadwal pergi DAN pulang pada tanggal yang dipilih."
    : "Coba ubah lokasi, tanggal, kelas, jenis transportasi, atau jumlah penumpang.";
  empty.appendChild(advice);

  // Chip tanggal alternatif: hanya tanggal yang benar-benar punya jadwal
  // (cek kelas & kursi), diurutkan dari yang paling dekat tanggal pilihan.
  const availableDates = findAvailableDates(criteria);
  if (availableDates.length > 0) {
    empty.appendChild(
      buildDateChips({
        label: "Tanggal lain yang tersedia untuk rute ini:",
        dates: availableDates,
        preferredDate: criteria.departureDate,
        criteria,
        field: "departureDate",
      }),
    );
  }

  let returnDates = [];
  if (isRoundTrip) {
    returnDates = findAvailableDates(buildReturnCriteria(criteria));
    if (returnDates.length > 0) {
      empty.appendChild(
        buildDateChips({
          label: "Tanggal pulang lain yang tersedia:",
          dates: returnDates,
          preferredDate: criteria.returnDate || criteria.departureDate,
          criteria,
          field: "returnDate",
        }),
      );
    }
  }

  // Rute tanpa jadwal sama sekali -> jelaskan + tawarkan rute lain yang ada.
  const typePart = TRANSPORT_LABELS[criteria.transportType] ? ` (${TRANSPORT_LABELS[criteria.transportType]})` : "";
  if (availableDates.length === 0) {
    const none = document.createElement("p");
    none.className = "empty-hint";
    none.textContent = `Belum ada jadwal simulasi untuk rute ${routeLabel(criteria)}${typePart}.`;
    empty.appendChild(none);

    const alt = buildAlternativeRoutesBlock(criteria);
    if (alt) empty.appendChild(alt);
  }
  if (isRoundTrip && returnDates.length === 0) {
    const noneRet = document.createElement("p");
    noneRet.className = "empty-hint";
    noneRet.textContent = `Belum ada jadwal simulasi untuk rute pulang ${routeLabel(buildReturnCriteria(criteria))}${typePart}.`;
    empty.appendChild(noneRet);
  }

  return empty;
}

/**
 * Merender hasil pencarian + kontrol urutkan/filter harga.
 * Mendukung satu arah (satu grid) dan pulang-pergi (grid pergi + grid pulang
 * dengan baris ringkasan pilihan & tombol lanjut).
 */
function renderResults(container) {
  const criteria = state.lastCriteria || {};
  const results = state.lastResults || { outbound: [], returning: [] };
  const outbound = Array.isArray(results.outbound) ? results.outbound : [];
  const returning = Array.isArray(results.returning) ? results.returning : [];
  const isRoundTrip = criteria.tripType === "roundtrip";
  const pax = state.pendingPassengers || 1;

  container.replaceChildren();

  const title = document.createElement("h3");
  title.className = "mb-2";
  title.textContent = resultsTitle(criteria);
  container.appendChild(title);

  // Jumlah hasil pencarian (berdampingan dengan judul & kontrol urutkan)
  const countLine = document.createElement("p");
  countLine.className = "results-count text-muted mb-2";
  countLine.textContent = isRoundTrip
    ? `${outbound.length} jadwal pergi · ${returning.length} jadwal pulang ditemukan`
    : `${outbound.length} jadwal ditemukan`;
  container.appendChild(countLine);

  if (outbound.length === 0 && returning.length === 0) {
    // Fokus hasil: pesan tanggal + chip tanggal alternatif yang dapat diklik,
    // atau penjelasan rute tanpa jadwal + rute lain yang tersedia.
    container.appendChild(buildEmptyState(criteria, isRoundTrip));
    return;
  }

  // Kontrol urutkan & filter harga (toolbar ringkas dekat jumlah hasil)
  const controls = document.createElement("div");
  controls.className = "results-toolbar mb-3";
  const controlForm = document.createElement("form");
  controlForm.className = "results-toolbar-form";
  controlForm.noValidate = true;

  const sortGroup = document.createElement("div");
  sortGroup.className = "form-group";
  const sortLabel = document.createElement("label");
  sortLabel.setAttribute("for", "sortSelect");
  sortLabel.textContent = "Urutkan berdasarkan";
  const sortSelect = document.createElement("select");
  sortSelect.className = "form-control";
  sortSelect.id = "sortSelect";
  for (const option of SORT_OPTIONS) {
    const opt = document.createElement("option");
    opt.value = option.value;
    opt.textContent = option.label;
    sortSelect.appendChild(opt);
  }
  sortGroup.appendChild(sortLabel);
  sortGroup.appendChild(sortSelect);

  const minGroup = buildNumberGroup("minPrice", "Harga Minimum", "0");
  const maxGroup = buildNumberGroup("maxPrice", "Harga Maksimum", "");

  const applyBtn = document.createElement("button");
  applyBtn.type = "submit";
  applyBtn.className = "btn btn-primary search-submit";
  applyBtn.textContent = "Terapkan";

  controlForm.appendChild(sortGroup);
  controlForm.appendChild(minGroup);
  controlForm.appendChild(maxGroup);
  controlForm.appendChild(applyBtn);
  controls.appendChild(controlForm);
  container.appendChild(controls);

  // Filter harga aktif (diperbarui saat "Terapkan") + kriteria sorting aktif
  let activeFilter = { min: null, max: null };
  let activeSort = SORT_OPTIONS[0].value; // default: harga termurah
  sortSelect.value = activeSort;

  /**
   * Filter harga lalu jalankan BUBBLE SORT terhadap hasil pencarian yang
   * sedang ditampilkan. Array sumber tidak dimodifikasi (sort bekerja pada
   * salinan).
   */
  const applyFilterSort = (list) => {
    const filtered = filterTicketsByPrice(list, activeFilter.min, activeFilter.max);
    const { sorted } = sortTickets(filtered, activeSort);
    return sorted;
  };

  let gridOut = null;
  let gridRet = null;
  let summaryInfo = null;
  let summaryTotal = null;
  let continueBtn = null;

  if (isRoundTrip) {
    summaryInfo = document.createElement("span");
    summaryTotal = document.createElement("strong");
    const summaryText = document.createElement("div");
    summaryText.className = "trip-summary-text";
    summaryText.appendChild(summaryInfo);
    summaryText.appendChild(summaryTotal);

    continueBtn = document.createElement("button");
    continueBtn.type = "button";
    continueBtn.className = "btn btn-primary";
    continueBtn.textContent = "Lanjutkan ke Detail";
    continueBtn.disabled = true;
    continueBtn.addEventListener("click", () => {
      const sel = state.tripSelection;
      if (sel.outbound && sel.returning) {
        openTripDetail({ outbound: sel.outbound, returning: sel.returning });
      }
    });

    const summaryBar = document.createElement("div");
    summaryBar.className = "trip-summary-bar";
    summaryBar.appendChild(summaryText);
    summaryBar.appendChild(continueBtn);
    container.appendChild(summaryBar);

    const outTitle = document.createElement("h4");
    outTitle.className = "results-leg-title";
    outTitle.textContent = "Pilih Jadwal Pergi";
    gridOut = document.createElement("div");
    gridOut.className = "grid grid-3 results-leg";

    const retTitle = document.createElement("h4");
    retTitle.className = "results-leg-title";
    retTitle.textContent = "Pilih Jadwal Pulang";
    gridRet = document.createElement("div");
    gridRet.className = "grid grid-3 results-leg";

    container.appendChild(outTitle);
    container.appendChild(gridOut);
    container.appendChild(retTitle);
    container.appendChild(gridRet);
  } else {
    gridOut = document.createElement("div");
    gridOut.className = "grid grid-3";
    container.appendChild(gridOut);
  }

  /** Pergantian pilihan leg pulang-pergi (toggle; validasi arah jadwal). */
  const toggleLegSelection = (legKey, ticket) => {
    const current = state.tripSelection[legKey];
    if (current && current.id === ticket.id) {
      state.tripSelection[legKey] = null;
      return;
    }
    const other = legKey === "outbound" ? state.tripSelection.returning : state.tripSelection.outbound;
    if (other) {
      const valid = legKey === "outbound" ? isValidReturnLeg(ticket, other) : isValidReturnLeg(other, ticket);
      if (!valid) {
        showToast("Jadwal pulang mendahului jadwal pergi. Pilih jadwal lain.", "warning");
        return;
      }
    }
    state.tripSelection[legKey] = ticket;
  };

  const drawLeg = (grid, list, legKey, selectLabel) => {
    grid.replaceChildren();
    if (list.length === 0) {
      grid.appendChild(buildInlineEmpty("Tidak ada tiket pada rentang harga ini."));
      return;
    }
    for (const ticket of list) {
      const isSelected = legKey ? Boolean(state.tripSelection[legKey]?.id === ticket.id) : false;
      grid.appendChild(
        createTicketCard(ticket, {
          passengers: pax,
          selected: isSelected,
          selectLabel,
          onSelect: (picked) => {
            if (!legKey) {
              // Satu arah: langsung ke detail perjalanan
              openTripDetail({ outbound: picked, returning: null });
              return;
            }
            toggleLegSelection(legKey, picked);
            redraw();
          },
        }),
      );
    }
  };

  const updateSummary = () => {
    if (!summaryInfo) return;
    const sel = state.tripSelection;
    if (sel.outbound && sel.returning) {
      const perPax = Number(sel.outbound.price) + Number(sel.returning.price);
      summaryInfo.textContent =
        `Pergi: ${sel.outbound.operator} ${sel.outbound.departureTime} · ` +
        `Pulang: ${sel.returning.operator} ${sel.returning.departureTime}`;
      summaryTotal.textContent = `Total per penumpang ${formatRupiah(perPax)} · ${pax} penumpang = ${formatRupiah(perPax * pax)}`;
      continueBtn.disabled = false;
    } else {
      summaryInfo.textContent = sel.outbound
        ? "Jadwal pergi dipilih. Silakan pilih jadwal pulang."
        : sel.returning
          ? "Jadwal pulang dipilih. Silakan pilih jadwal pergi."
          : "Pilih jadwal pergi dan pulang untuk melanjutkan.";
      summaryTotal.textContent = "";
      continueBtn.disabled = true;
    }
  };

  const redraw = () => {
    const shownOut = applyFilterSort(outbound);
    if (isRoundTrip) {
      drawLeg(gridOut, shownOut, "outbound", "Pilih Pergi");
      const shownRet = applyFilterSort(returning);
      if (shownRet.length === 0) {
        if (returning.length === 0) {
          // Jadwal pulang kosong -> tawarkan chip tanggal pulang yang
          // benar-benar punya data (dapat diklik untuk pencarian ulang).
          const block = document.createElement("div");
          block.className = "empty-state";
          const msg = document.createElement("p");
          msg.textContent = "Tidak ada jadwal pulang pada tanggal yang dipilih.";
          block.appendChild(msg);

          const returnDates = findAvailableDates(buildReturnCriteria(criteria));
          if (returnDates.length > 0) {
            block.appendChild(
              buildDateChips({
                label: "Tanggal pulang lain yang tersedia:",
                dates: returnDates,
                preferredDate: criteria.returnDate || criteria.departureDate,
                criteria,
                field: "returnDate",
              }),
            );
          }
          const foot = document.createElement("p");
          foot.className = "empty-hint";
          foot.textContent = "Pilih tanggal lain di atas atau ubah pencarian ke sekali jalan.";
          block.appendChild(foot);
          gridRet.replaceChildren(block);
        } else {
          gridRet.replaceChildren(buildInlineEmpty("Tidak ada tiket pulang pada rentang harga tersebut."));
        }
      } else {
        drawLeg(gridRet, shownRet, "returning", "Pilih Pulang");
      }
      updateSummary();
    } else {
      drawLeg(gridOut, shownOut, null, "Pilih Tiket");
    }
  };

  // Ganti kriteria sorting -> urutan kartu langsung diperbarui
  sortSelect.addEventListener("change", () => {
    activeSort = sortSelect.value;
    redraw();
  });

  controlForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const minVal = minGroup.querySelector("input").value;
    const maxVal = maxGroup.querySelector("input").value;

    if (minVal !== "" && maxVal !== "" && Number(minVal) > Number(maxVal)) {
      showToast("Harga minimum tidak boleh lebih besar dari maksimum.", "warning");
      return;
    }

    activeFilter = {
      min: minVal === "" ? null : Number(minVal),
      max: maxVal === "" ? null : Number(maxVal),
    };

    const shownOut = filterTicketsByPrice(outbound, activeFilter.min, activeFilter.max);
    const shownRet = isRoundTrip ? filterTicketsByPrice(returning, activeFilter.min, activeFilter.max) : null;
    if (shownOut.length === 0 && (!isRoundTrip || shownRet.length === 0)) {
      showToast("Tidak ada tiket pada rentang harga tersebut.", "warning");
    }
    redraw();
  });

  // Gambar hasil awal
  redraw();
}

function buildNumberGroup(id, labelText, placeholder) {
  const group = document.createElement("div");
  group.className = "form-group";
  const label = document.createElement("label");
  label.setAttribute("for", id);
  label.textContent = labelText;
  const input = document.createElement("input");
  input.type = "number";
  input.className = "form-control";
  input.id = id;
  input.min = "0";
  input.placeholder = placeholder;
  group.appendChild(label);
  group.appendChild(input);
  return group;
}

/* ---------------- Halaman: Pesanan Saya ---------------- */
function renderOrdersPage() {
  els.mainContent.replaceChildren();

  const section = document.createElement("section");
  section.className = "section";

  const header = document.createElement("div");
  header.className = "section-header";
  const h = document.createElement("h2");
  h.className = "section-title";
  h.textContent = "Pesanan Saya";
  const p = document.createElement("p");
  p.className = "section-subtitle";
  p.textContent = "Riwayat pemesanan tersimpan di browser Anda.";
  header.appendChild(h);
  header.appendChild(p);

  const container = document.createElement("div");
  container.className = "container";

  section.appendChild(header);
  section.appendChild(container);
  els.mainContent.appendChild(section);

  renderOrders(container, {
    onCancel: (code, result) => {
      if (result.ok) {
        showToast(`Pesanan ${code} berhasil dibatalkan.`, "success");
        renderOrdersPage(); // render ulang dengan status terbaru
      } else {
        showToast(result.error || "Gagal membatalkan pesanan.", "error");
      }
    },
  });
}

/* ---------------- Halaman Sederhana ---------------- */
function renderSimplePage(page, customTitle, customText) {
  els.mainContent.replaceChildren();
  const section = document.createElement("section");
  section.className = "section";

  const container = document.createElement("div");
  container.className = "container";

  const card = document.createElement("div");
  card.className = "card";

  const h = document.createElement("h2");
  h.className = "section-title";
  h.textContent = customTitle || page.charAt(0).toUpperCase() + page.slice(1);

  const p = document.createElement("p");
  p.className = "text-muted";
  p.textContent =
    customText ||
    "Halaman ini belum tersedia pada tahap pengembangan saat ini.";

  const backBtn = document.createElement("button");
  backBtn.type = "button";
  backBtn.className = "btn btn-secondary mt-2";
  backBtn.textContent = "Kembali ke Beranda";
  backBtn.addEventListener("click", () => navigate("home"));

  card.appendChild(h);
  card.appendChild(p);
  card.appendChild(backBtn);
  container.appendChild(card);
  section.appendChild(container);
  els.mainContent.appendChild(section);
}

/* ---------------- Modal detail tiket ---------------- */
function openTripDetail(selection = {}) {
  const ticket = selection.outbound ?? selection.ticket ?? null;
  const returnTicket = selection.returning ?? null;
  if (!ticket) {
    showToast("Pilih tiket terlebih dahulu.", "warning");
    return;
  }
  state.tripSelection = { outbound: ticket, returning: returnTicket };
  state.selectedTicket = ticket;
  state.selectedReturnTicket = returnTicket;

  const originLoc = ticket.originLocationId ? getLocationById(ticket.originLocationId) : null;
  const destLoc = ticket.destinationLocationId ? getLocationById(ticket.destinationLocationId) : null;
  els.modalTitle.textContent =
    `${ticket.operator} — ${locationShortName(originLoc) || ticket.origin} → ` +
    `${locationShortName(destLoc) || ticket.destination}${returnTicket ? " (Pulang-pergi)" : ""}`;

  els.modalBody.replaceChildren(buildTripDetailBody({ ticket, returnTicket }));
  openModal(els.ticketDetailModal);
}

/* ---------------- Modal pemesanan ---------------- */
function openBookingModal(selection = {}) {
  const ticket = selection.outbound ?? state.selectedTicket ?? null;
  const returnTicket = selection.returning ?? state.selectedReturnTicket ?? null;
  if (!ticket) {
    showToast("Pilih tiket terlebih dahulu.", "warning");
    return;
  }

  els.bookingModalTitle.textContent = returnTicket
    ? `Pemesanan Pulang-Pergi — ${ticket.operator}`
    : `Pemesanan — ${ticket.operator}`;

  els.bookingModalBody.replaceChildren(
    buildBookingForm({
      ticket,
      returnTicket,
      defaults: {
        adults: state.pendingAdults,
        children: state.pendingChildren,
        passengers: state.pendingPassengers,
      },
      showToast,
      onDone: (order) => {
        closeModal(els.bookingModal);
        openSuccessModal(order);
      },
    }),
  );
  openModal(els.bookingModal);
}

/**
 * Menyelaraskan varian warna logo horizontal (.success-brand) pada modal sukses
 * dengan tema yang sedang aktif. Dipanggil saat modal dibuka dan saat tema
 * diganti (toggleTheme) agar logo ikut berubah tanpa perlu membuka ulang modal.
 */
function syncSuccessBrand() {
  const brand = els.successModalBody?.querySelector(".success-brand");
  if (!brand) return; // modal sukses tidak sedang terbuka
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  brand.src = `${BASE_URL}images/${isDark ? "logo-full-light.svg" : "logo-full.svg"}`;
}

function openSuccessModal(order) {
  els.successModalBody.replaceChildren();

  // Mark horizontal Tiketin sebagai penutup identitas pada modal sukses;
  // variannya disesuaikan tema lewat syncSuccessBrand() (lihat §7 no.11).
  const brand = document.createElement("img");
  brand.className = "success-brand";
  brand.width = 150;
  brand.height = 46;
  brand.alt = "Tiketin";
  els.successModalBody.appendChild(brand);
  syncSuccessBrand();

  const lines = [
    `Kode pesanan: ${order.code}`,
    `Rute: ${order.origin} → ${order.destination}`,
  ];
  if (order.originLocationName || order.destinationLocationName) {
    lines.push(`Lokasi: ${order.originLocationName || order.origin} → ${order.destinationLocationName || order.destination}`);
  }
  lines.push(`Berangkat: ${formatDate(order.departureDate)} pukul ${order.departureTime}`);
  if (order.roundTrip && order.returnLeg) {
    lines.push(`Pulang: ${order.returnLeg.origin} → ${order.returnLeg.destination} — ${formatDate(order.returnLeg.departureDate)} pukul ${order.returnLeg.departureTime}`);
  }
  if (Array.isArray(order.selectedSeats) && order.selectedSeats.length > 0) {
    lines.push(`Kursi: ${order.selectedSeats.join(", ")}`);
  }
  const hasBreakdown = Number.isFinite(Number(order.adults)) && Number.isFinite(Number(order.children));
  lines.push(
    hasBreakdown
      ? `Penumpang: ${order.passengers} orang (${order.adults} dewasa, ${order.children} anak)`
      : `Penumpang: ${order.passengers} orang`,
  );
  lines.push(`Total: ${formatRupiah(order.totalPrice)}`);

  for (const text of lines) {
    const p = document.createElement("p");
    p.className = "mb-2";
    p.textContent = text;
    els.successModalBody.appendChild(p);
  }
  openModal(els.successModal);
  showToast(`Pesanan ${order.code} berhasil dibuat.`, "success");
}

/* ---------------- Utilitas modal ---------------- */
function openModal(modal) {
  if (!modal) return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

/* ---------------- Menu mobile & dropdown user ---------------- */
function closeMobileMenu() {
  els.mobileMenuOverlay?.classList.remove("open");
  els.mobileMenuOverlay?.setAttribute("aria-hidden", "true");
  els.mobileMenuBtn?.setAttribute("aria-expanded", "false");
}

function closeUserDropdown() {
  els.userDropdown?.classList.remove("open");
  els.userDropdown?.setAttribute("aria-hidden", "true");
  els.userBtn?.setAttribute("aria-expanded", "false");
}

/* ---------------- Tema gelap/terang ---------------- */
function initTheme() {
  let stored = null;
  try {
    stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    /* abaikan */
  }
  document.documentElement.setAttribute("data-theme", normalizeTheme(stored));
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = toggleThemeName(current);
  document.documentElement.setAttribute("data-theme", next);
  // Modal sukses mungkin sedang terbuka: varian logo horizontal ikut disesuaikan
  syncSuccessBrand();
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    /* abaikan */
  }
  showToast(next === "dark" ? "Mode gelap aktif." : "Mode terang aktif.");
}

/* ---------------- Bind event (sekali saja) ---------------- */
function bindEvents() {
  // Navigasi: satu delegated listener untuk semua link [data-page]
  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-page]");
    if (link) {
      event.preventDefault();
      // Tautan layanan (mis. footer) dapat menentukan tab transportasi aktif
      if (link.dataset.transport) {
        state.prefillTransportType = link.dataset.transport;
      }
      navigate(link.dataset.page);
    }
  });

  els.themeToggle?.addEventListener("click", toggleTheme);

  els.userBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = els.userDropdown.classList.toggle("open");
    els.userDropdown.setAttribute("aria-hidden", String(!isOpen));
    els.userBtn.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".user-menu")) closeUserDropdown();
  });

  els.mobileMenuBtn?.addEventListener("click", () => {
    const isOpen = els.mobileMenuOverlay.classList.toggle("open");
    els.mobileMenuOverlay.setAttribute("aria-hidden", String(!isOpen));
    els.mobileMenuBtn.setAttribute("aria-expanded", String(isOpen));
  });

  els.mobileMenuOverlay?.addEventListener("click", (event) => {
    if (event.target === els.mobileMenuOverlay) closeMobileMenu();
  });

  // Modal detail tiket
  els.closeTicketModal?.addEventListener("click", () => closeModal(els.ticketDetailModal));
  els.modalCloseBtn?.addEventListener("click", () => closeModal(els.ticketDetailModal));
  els.modalBookBtn?.addEventListener("click", () => {
    if (!state.selectedTicket) {
      showToast("Pilih tiket terlebih dahulu.", "warning");
      return;
    }
    closeModal(els.ticketDetailModal);
    openBookingModal({ outbound: state.selectedTicket, returning: state.selectedReturnTicket });
  });

  // Modal pemesanan & sukses
  els.closeBookingModal?.addEventListener("click", () => closeModal(els.bookingModal));
  els.successCloseBtn?.addEventListener("click", () => {
    closeModal(els.successModal);
    navigate("home");
  });
  els.successOrdersBtn?.addEventListener("click", () => {
    closeModal(els.successModal);
    navigate("orders");
  });

  // Klik backdrop & tombol Escape
  [els.ticketDetailModal, els.bookingModal, els.successModal].forEach((modal) => {
    modal?.addEventListener("click", (event) => {
      if (event.target === modal) closeModal(modal);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      [els.ticketDetailModal, els.bookingModal, els.successModal].forEach(closeModal);
      closeMobileMenu();
      closeUserDropdown();
    }
  });
}

/* ---------------- Bootstrap ---------------- */
function init() {
  cacheElements();
  if (!els.mainContent) {
    console.error("Elemen #mainContent tidak ditemukan di index.html.");
    return;
  }
  initTheme();
  bindEvents();
  navigate("home");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}

/** Format tanggal "YYYY-MM-DD" -> locale id-ID. */
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
