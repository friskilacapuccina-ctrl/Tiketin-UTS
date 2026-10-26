/**
 * Tiketin-UTS — Komponen kartu tiket (ES module).
 * Membuat elemen DOM kartu tiket memakai DOM API (textContent, bukan innerHTML)
 * untuk data dinamis yang tidak tepercaya.
 *
 * Tampilan menyesuaikan transportType:
 * - plane: bandara asal/tujuan + kode IATA, chip no. penerbangan/bagasi/transit.
 * - train: stasiun asal/tujuan.
 * - bus : terminal asal/tujuan + chip fasilitas.
 */

import { TRANSPORT_LABELS } from "../js/search.js";
import { getLocationsForTicket, locationShortName } from "../data/locations.js";

/** Format angka rupiah, contoh: 1450000 -> "Rp1.450.000". */
export function formatRupiah(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "Rp0";
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}

/** Nama Indonesia untuk jenis transportasi. */
export function transportLabel(type) {
  return TRANSPORT_LABELS[type] || type;
}

/** Ikon stroke (viewBox 24) per jenis transportasi — satu gaya visual untuk semua. */
function transportIcon(type) {
  const NS = "http://www.w3.org/2000/svg";
  const paths = {
    plane: ["M10.2 13.8 3 12l1.5-2 5 .6 3.6-3.6a1.6 1.6 0 0 1 2.3 2.3L11.8 12l.6 5-2 1.5-2-7.2z", "M14 6.5 15.5 5"],
    train: ["M7 3h10a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z", "M4 10h16", "M8.5 14h.01M15.5 14h.01", "M8 18l-2 3M16 18l2 3"],
    bus: ["M5 6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6z", "M5 11h14", "M8 15h.01M16 15h.01", "M7 18v2M17 18v2"],
  };
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.8");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  for (const d of paths[type] || []) {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", d);
    svg.appendChild(p);
  }
  return svg;
}

/** Baris chip meta khas transportasi (array string, bisa kosong). */
function metaChipsFor(ticket) {
  if (ticket.transportType === "plane") {
    const chips = [];
    if (ticket.flightNo) chips.push(`Penerbangan ${ticket.flightNo}`);
    if (Number.isFinite(Number(ticket.baggageKg))) chips.push(`Bagasi ${ticket.baggageKg} kg`);
    chips.push(Number.isInteger(ticket.stops) && ticket.stops > 0 ? `${ticket.stops} transit` : "Langsung");
    return chips;
  }
  if (ticket.transportType === "bus" && Array.isArray(ticket.facilities)) {
    return ticket.facilities.filter((f) => typeof f === "string" && f);
  }
  return [];
}

/**
 * Membuat kartu tiket.
 * @param {Object} ticket - Objek tiket (lihat src/data/tickets.js).
 * @param {Object} [options]
 * @param {Function} [options.onSelect] - Callback (ticket) => void saat tombol dipilih.
 * @param {number} [options.passengers] - Jumlah penumpang untuk info sisa kursi.
 * @param {boolean} [options.selected] - Menandai kartu sedang terpilih (pulang-pergi).
 * @param {string} [options.selectLabel] - Teks tombol pilih (mis. "Pilih Pergi").
 * @returns {HTMLElement} Elemen <article> kartu tiket.
 */
export function createTicketCard(ticket, options = {}) {
  const { onSelect, passengers = 1, selected = false, selectLabel = "Pilih Tiket" } = options;

  const card = document.createElement("article");
  card.className = "card ticket-card" + (selected ? " selected" : "");
  card.dataset.ticketId = ticket.id;
  if (selected) card.dataset.selected = "true";

  // --- Header: ikon + operator + badge transportasi + kelas ---
  const header = document.createElement("div");
  header.className = "ticket-header";

  const brand = document.createElement("div");
  brand.className = "ticket-brand";

  const operator = document.createElement("h3");
  operator.className = "ticket-operator";
  operator.textContent = ticket.operator;

  brand.appendChild(transportIcon(ticket.transportType));
  brand.appendChild(operator);

  const badges = document.createElement("div");
  badges.className = "ticket-badges";

  const typeBadge = document.createElement("span");
  typeBadge.className = "badge";
  typeBadge.textContent = transportLabel(ticket.transportType);

  const classBadge = document.createElement("span");
  classBadge.className = "badge";
  classBadge.textContent = ticket.travelClass;

  badges.appendChild(typeBadge);
  badges.appendChild(classBadge);
  header.appendChild(brand);
  header.appendChild(badges);

  // --- Rute: asal -> tujuan ---
  const route = document.createElement("div");
  route.className = "ticket-route";

  const origin = document.createElement("span");
  origin.className = "ticket-origin";
  origin.textContent = ticket.origin;

  const arrow = document.createElement("span");
  arrow.className = "ticket-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "→";

  const destination = document.createElement("span");
  destination.className = "ticket-destination";
  destination.textContent = ticket.destination;

  route.appendChild(origin);
  route.appendChild(arrow);
  route.appendChild(destination);

  // --- Lokasi rute: bandara/stasiun/terminal sesuai transportasi ---
  const { originLocation, destinationLocation } = getLocationsForTicket(ticket);
  let locationsRow = null;
  if (originLocation && destinationLocation) {
    locationsRow = document.createElement("div");
    locationsRow.className = "ticket-locations text-muted";
    locationsRow.textContent = `${locationShortName(originLocation)} → ${locationShortName(destinationLocation)}`;
  }

  // --- Chip meta (no. penerbangan, bagasi, fasilitas, ...) ---
  const chips = metaChipsFor(ticket);
  let metaRow = null;
  if (chips.length > 0) {
    metaRow = document.createElement("div");
    metaRow.className = "ticket-meta";
    for (const text of chips) {
      const chip = document.createElement("span");
      chip.className = "ticket-chip";
      chip.textContent = text;
      metaRow.appendChild(chip);
    }
  }

  // --- Jadwal: tanggal, berangkat - tiba, durasi ---
  const schedule = document.createElement("div");
  schedule.className = "ticket-schedule";

  const dateEl = document.createElement("span");
  dateEl.className = "ticket-date";
  dateEl.textContent = formatDate(ticket.departureDate);

  const timesEl = document.createElement("span");
  timesEl.className = "ticket-times";
  timesEl.textContent = `${ticket.departureTime} – ${ticket.arrivalTime}`;

  const durationEl = document.createElement("span");
  durationEl.className = "ticket-duration text-muted";
  durationEl.textContent = `Durasi ${ticket.duration}`;

  schedule.appendChild(dateEl);
  schedule.appendChild(timesEl);
  schedule.appendChild(durationEl);

  // --- Footer: sisa kursi + (harga + tombol) ---
  const footer = document.createElement("div");
  footer.className = "ticket-footer";

  const seatsEl = document.createElement("span");
  seatsEl.className = "ticket-seats text-muted";
  const seatsLeft = ticket.availableSeats;
  seatsEl.textContent =
    seatsLeft >= passengers
      ? `Sisa kursi: ${seatsLeft}`
      : `Kursi tersisa hanya ${seatsLeft}`;

  const actions = document.createElement("div");
  actions.className = "ticket-actions";

  const priceWrap = document.createElement("div");
  priceWrap.className = "ticket-price-wrap";

  const priceEl = document.createElement("span");
  priceEl.className = "ticket-price";
  priceEl.textContent = formatRupiah(ticket.price);

  const perPax = document.createElement("small");
  perPax.className = "ticket-per-seat text-muted";
  perPax.textContent = "/orang";

  priceWrap.appendChild(priceEl);
  priceWrap.appendChild(perPax);

  const selectBtn = document.createElement("button");
  selectBtn.type = "button";
  selectBtn.className = "btn btn-primary ticket-select-btn";
  selectBtn.textContent = selected ? "Terpilih" : selectLabel;
  if (selected) selectBtn.setAttribute("aria-pressed", "true");
  selectBtn.setAttribute("aria-label", `Pilih tiket ${ticket.operator} ${ticket.origin} ke ${ticket.destination}`);

  // Event + callback: keduanya tersedia agar alur pemesanan mudah dihubungkan.
  selectBtn.addEventListener("click", (event) => {
    const detail = { ticket };
    // CustomEvent agar bisa didengarkan global: document.addEventListener("ticket:select", ...)
    card.dispatchEvent(new CustomEvent("ticket:select", { detail, bubbles: true }));
    if (typeof onSelect === "function") {
      onSelect(ticket, event);
    }
  });

  actions.appendChild(priceWrap);
  actions.appendChild(selectBtn);

  footer.appendChild(seatsEl);
  footer.appendChild(actions);

  card.appendChild(header);
  card.appendChild(route);
  if (locationsRow) card.appendChild(locationsRow);
  if (metaRow) card.appendChild(metaRow);
  card.appendChild(schedule);
  card.appendChild(footer);

  return card;
}

/** Format tanggal "YYYY-MM-DD" -> "Sen, 20 Okt 2026" (locale id-ID). */
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

export default createTicketCard;
