/**
 * Tiketin-UTS — Komponen detail perjalanan untuk modal detail tiket (ES module).
 * Membangun isi modal (#modalBody) sesuai transportType:
 * - plane: bandara + IATA, no. penerbangan, bagasi, transit.
 * - train: stasiun asal/tujuan, nama kereta, kelas.
 * - bus : terminal naik/turun, PO bus, fasilitas, kelas layanan.
 * Untuk pulang-pergi menampilkan dua blok: Pergi dan Pulang + ringkasan harga.
 * Semua elemen memakai DOM API (textContent), bukan innerHTML.
 */

import { TRANSPORT_LABELS } from "../js/search.js";
import { getLocationsForTicket, locationShortName } from "../data/locations.js";
import { formatRupiah } from "./ticketCard.js";

/** Satu baris "Label: nilai". */
function detailRow(label, value) {
  const row = document.createElement("p");
  row.className = "mb-2";
  const strong = document.createElement("strong");
  strong.textContent = `${label}: `;
  row.appendChild(strong);
  row.appendChild(document.createTextNode(value));
  return row;
}

/** Baris-label khas transportasi untuk satu leg tiket. */
function legRows(ticket) {
  const { originLocation, destinationLocation } = getLocationsForTicket(ticket);
  const rows = [
    ["Jenis", TRANSPORT_LABELS[ticket.transportType] ?? ticket.transportType],
  ];

  if (ticket.transportType === "plane") {
    if (ticket.flightNo) rows.push(["No. Penerbangan", `${ticket.operator} ${ticket.flightNo}`]);
    rows.push(["Bandara Asal", originLocation ? locationShortName(originLocation) : ticket.origin]);
    rows.push(["Bandara Tujuan", destinationLocation ? locationShortName(destinationLocation) : ticket.destination]);
  } else if (ticket.transportType === "train") {
    rows.push(["Kereta", ticket.operator]);
    rows.push(["Stasiun Asal", originLocation ? locationShortName(originLocation) : ticket.origin]);
    rows.push(["Stasiun Tujuan", destinationLocation ? locationShortName(destinationLocation) : ticket.destination]);
  } else if (ticket.transportType === "bus") {
    rows.push(["PO Bus", ticket.operator]);
    rows.push(["Titik Naik", originLocation ? locationShortName(originLocation) : ticket.origin]);
    rows.push(["Titik Turun", destinationLocation ? locationShortName(destinationLocation) : ticket.destination]);
  } else {
    rows.push(["Operator", ticket.operator]);
    rows.push(["Rute", `${ticket.origin} → ${ticket.destination}`]);
  }

  rows.push(["Kelas", ticket.travelClass]);
  rows.push(["Tanggal", formatDate(ticket.departureDate)]);
  rows.push(["Berangkat", `${ticket.departureTime} (waktu setempat)`]);
  rows.push(["Tiba", `${ticket.arrivalTime} — durasi ${ticket.duration}`]);

  if (ticket.transportType === "plane") {
    if (Number.isFinite(Number(ticket.baggageKg))) rows.push(["Bagasi", `${ticket.baggageKg} kg`]);
    rows.push(["Transit", Number.isInteger(ticket.stops) && ticket.stops > 0 ? `${ticket.stops} transit` : "Langsung (nonstop)"]);
  }
  if (ticket.transportType === "bus" && Array.isArray(ticket.facilities) && ticket.facilities.length > 0) {
    rows.push(["Fasilitas", ticket.facilities.join(", ")]);
  }

  rows.push(["Sisa kursi", String(ticket.availableSeats)]);
  rows.push(["Harga /orang", formatRupiah(ticket.price)]);
  return rows;
}

/** Satu blok leg (pergi/pulang) pada modal detail. */
function buildLegBlock(ticket, legTitle) {
  const block = document.createElement("div");
  block.className = "detail-leg";

  const title = document.createElement("h3");
  title.className = "detail-leg-title";
  title.textContent = legTitle;
  block.appendChild(title);

  for (const [label, value] of legRows(ticket)) {
    block.appendChild(detailRow(label, value));
  }
  return block;
}

/**
 * Membangun isi modal detail untuk satu pilihan perjalanan.
 * @param {Object} selection
 * @param {Object} selection.ticket - Tiket pergi (wajib).
 * @param {Object|null} [selection.returnTicket] - Tiket pulang (pulang-pergi).
 * @returns {HTMLElement} Elemen pembungkus isi modal.
 */
export function buildTripDetailBody(selection = {}) {
  const { ticket, returnTicket = null } = selection;
  const wrap = document.createElement("div");
  wrap.className = "trip-detail";

  if (returnTicket) {
    wrap.appendChild(buildLegBlock(ticket, "Penerbangan / Perjalanan Pergi"));
    wrap.appendChild(buildLegBlock(returnTicket, "Perjalanan Pulang"));

    const summary = document.createElement("div");
    summary.className = "booking-summary";
    const line = document.createElement("strong");
    const perPax = Number(ticket.price) + Number(returnTicket.price);
    line.textContent = `Total per penumpang (pulang-pergi): ${formatRupiah(perPax)} (${formatRupiah(ticket.price)} pergi + ${formatRupiah(returnTicket.price)} pulang)`;
    summary.appendChild(line);
    wrap.appendChild(summary);
  } else {
    wrap.appendChild(buildLegBlock(ticket, "Detail Perjalanan"));
  }

  return wrap;
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

export default buildTripDetailBody;
