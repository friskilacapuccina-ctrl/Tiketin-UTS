/**
 * Tiketin-UTS — Riwayat & pembatalan pesanan (ES module).
 * Membaca pesanan dari localStorage (skema lama & baru dari booking.js),
 * menampilkan detail sesuai jenis transportasi (bandara/stasiun/terminal,
 * no. penerbangan, fasilitas, kursi terpilih, dan leg pulang bila ada),
 * lalu membatalkan pesanan simulasi.
 * Menangani localStorage kosong / JSON rusak tanpa membuat aplikasi crash.
 */

import { readStoredOrders, writeStoredOrders, STORAGE_KEY } from "./booking.js";
import { formatRupiah, transportLabel } from "../components/ticketCard.js";

export { STORAGE_KEY };

/** Label status konsisten dengan skema booking.js. */
const STATUS_LABELS = {
  confirmed: "Dikonfirmasi",
  cancelled: "Dibatalkan",
};

const STATUS_BADGES = {
  confirmed: "badge badge-success",
  cancelled: "badge badge-danger",
};

/** Membaca seluruh pesanan dari localStorage (aman terhadap data rusak). */
export function getAllOrders() {
  return readStoredOrders();
}

/** Mencari satu pesanan berdasarkan kode. */
export function getOrderByCode(code) {
  if (typeof code !== "string") return null;
  return readStoredOrders().find((o) => o.code === code) ?? null;
}

/**
 * Membatalkan pesanan simulasi: memperbarui status menjadi "cancelled".
 * @param {string} code - Kode pesanan.
 * @returns {{ok: boolean, order?: Object, error?: string}}
 */
export function cancelOrder(code) {
  const orders = readStoredOrders();
  const order = orders.find((o) => o.code === code);

  if (!order) return { ok: false, error: `Pesanan ${code} tidak ditemukan.` };
  if (order.status === "cancelled") {
    return { ok: false, error: `Pesanan ${code} sudah dibatalkan sebelumnya.` };
  }

  order.status = "cancelled";
  order.cancelledAt = new Date().toISOString();

  if (!writeStoredOrders(orders)) {
    return { ok: false, error: "Gagal menyimpan perubahan ke penyimpanan browser." };
  }
  return { ok: true, order };
}

/**
 * Merender daftar pesanan ke dalam elemen DOM (textContent, tanpa innerHTML).
 * @param {HTMLElement} container - Elemen wadah.
 * @param {Object} [options]
 * @param {Function} [options.onCancel] - Callback (code, result) setelah membatalkan.
 * @returns {HTMLElement} Container.
 */
export function renderOrders(container, options = {}) {
  const { onCancel } = options;
  container.replaceChildren();

  let orders;
  try {
    orders = getAllOrders();
  } catch {
    orders = [];
  }

  if (!Array.isArray(orders) || orders.length === 0) {
    container.appendChild(
      buildEmptyState(
        "Belum ada pesanan",
        "Pesanan yang Anda buat akan muncul di sini.",
      ),
    );
    return container;
  }

  const list = document.createElement("div");
  list.className = "orders-list";

  for (const order of orders) {
    list.appendChild(buildOrderCard(order, onCancel));
  }

  container.appendChild(list);

  // Catatan privasi: jujur soal mekanisme penyimpanan yang dipakai
  const privacy = document.createElement("p");
  privacy.className = "orders-privacy-note text-muted";
  privacy.textContent =
    "Pesanan disimpan di localStorage browser Anda (perangkat ini) — bukan penyimpanan terenkripsi. " +
    "Bila perlu, hapus dengan membatalkan pesanan dan membersihkan data situs.";
  container.appendChild(privacy);
  return container;
}

/** Satu baris teks detail. */
function infoLine(text) {
  const line = document.createElement("div");
  line.textContent = text;
  return line;
}

/** Membuat kartu satu pesanan. */
function buildOrderCard(order, onCancel) {
  const card = document.createElement("article");
  card.className = "card order-card" + (order.status === "cancelled" ? " cancelled" : "");
  card.dataset.orderCode = order.code;

  // Header: kode pesanan + status
  const header = document.createElement("div");
  header.className = "order-header";

  const code = document.createElement("h3");
  code.className = "order-code";
  code.textContent = `Kode: ${order.code}`;

  const status = document.createElement("span");
  status.className = STATUS_BADGES[order.status] || "badge";
  status.textContent = STATUS_LABELS[order.status] || order.status;

  header.appendChild(code);
  header.appendChild(status);

  // Rute (kota, konsisten dengan data lama)
  const route = document.createElement("p");
  route.className = "order-route";
  route.textContent = `${order.origin} → ${order.destination}`;

  // Lokasi rute (bandara/stasiun/terminal) bila tersedia pada skema baru
  if (order.originLocationName || order.destinationLocationName) {
    const locLine = document.createElement("p");
    locLine.className = "order-loc-line text-muted";
    const transportWord = order.transportType === "plane" ? "Bandara" : order.transportType === "train" ? "Stasiun" : "Terminal";
    locLine.textContent = `${transportWord}: ${order.originLocationName || order.origin} → ${order.destinationLocationName || order.destination}`;
    card.appendChild(header);
    card.appendChild(route);
    card.appendChild(locLine);
  } else {
    card.appendChild(header);
    card.appendChild(route);
  }

  // Detail perjalanan menyesuaikan transportasi
  const details = document.createElement("div");
  details.className = "order-details text-muted";

  const info = [];
  info.push(`Operator: ${order.operator}`);
  info.push(`Jenis: ${transportLabel(order.transportType)}`);
  if (order.transportType === "plane" && order.flightNo) {
    info.push(`No. Penerbangan: ${order.operator} ${order.flightNo}`);
  }
  info.push(`Kelas: ${order.travelClass}`);
  info.push(`Berangkat: ${formatDate(order.departureDate)} ${order.departureTime}`);
  info.push(`Tiba: ${order.arrivalTime} (Durasi ${order.duration})`);
  if (order.transportType === "plane" && Number.isFinite(Number(order.baggageKg))) {
    info.push(`Bagasi: ${order.baggageKg} kg`);
  }
  if (order.transportType === "plane" && Number.isInteger(order.stops)) {
    info.push(`Transit: ${order.stops > 0 ? `${order.stops} transit` : "Langsung"}`);
  }
  if (order.transportType === "bus" && Array.isArray(order.facilities) && order.facilities.length > 0) {
    info.push(`Fasilitas: ${order.facilities.join(", ")}`);
  }
  if (Array.isArray(order.selectedSeats) && order.selectedSeats.length > 0) {
    info.push(`Kursi: ${order.selectedSeats.join(", ")}`);
  }
  if (order.specialRequest) info.push(`Permintaan bantuan: ${order.specialRequest}`);
  if (order.travelNotes) info.push(`Catatan perjalanan: ${order.travelNotes}`);
  for (const text of info) details.appendChild(infoLine(text));

  // Leg pulang bila pesanan pulang-pergi
  if (order.roundTrip && order.returnLeg) {
    const retWrap = document.createElement("div");
    retWrap.className = "order-leg-return";
    const retTitle = document.createElement("strong");
    retTitle.textContent = "Pulang:";
    retWrap.appendChild(retTitle);
    retWrap.appendChild(infoLine(`${order.returnLeg.origin} → ${order.returnLeg.destination}`));
    if (order.returnLeg.originLocationName || order.returnLeg.destinationLocationName) {
      retWrap.appendChild(infoLine(`Lokasi: ${order.returnLeg.originLocationName || order.returnLeg.origin} → ${order.returnLeg.destinationLocationName || order.returnLeg.destination}`));
    }
    retWrap.appendChild(infoLine(`Operator: ${order.returnLeg.operator} · Kelas: ${order.returnLeg.travelClass}`));
    retWrap.appendChild(infoLine(`Berangkat: ${formatDate(order.returnLeg.departureDate)} ${order.returnLeg.departureTime} — tiba ${order.returnLeg.arrivalTime} (Durasi ${order.returnLeg.duration})`));
    if (order.returnLeg.flightNo) {
      retWrap.appendChild(infoLine(`No. Penerbangan: ${order.returnLeg.operator} ${order.returnLeg.flightNo}`));
    }
    details.appendChild(retWrap);
  }

  // Penumpang
  const pax = document.createElement("div");
  pax.className = "order-passengers";
  const paxTitle = document.createElement("strong");
  const hasBreakdown = Number.isFinite(Number(order.adults)) && Number.isFinite(Number(order.children));
  paxTitle.textContent = hasBreakdown
    ? `Penumpang (${order.passengers}: ${order.adults} dewasa, ${order.children} anak):`
    : `Penumpang (${order.passengers}):`;
  pax.appendChild(paxTitle);
  const names = Array.isArray(order.passengerNames) ? order.passengerNames : [];
  const paxDetails = Array.isArray(order.passengerDetails) ? order.passengerDetails : [];
  names.forEach((name, index) => {
    const detail = paxDetails[index];
    const category = detail ? (detail.category === "child" ? "Anak" : "Dewasa") : "";
    const line = document.createElement("div");
    line.className = "text-muted";
    line.textContent = `• ${name}${category ? ` (${category})` : ""}`;
    pax.appendChild(line);
  });
  if (Array.isArray(order.passengerIdentities) && order.passengerIdentities.length > 0) {
    const idLine = document.createElement("div");
    idLine.className = "text-muted";
    idLine.textContent = `Identitas tercatat untuk ${order.passengerIdentities.length} penumpang.`;
    pax.appendChild(idLine);
  }

  // Kontak pemesan (skema baru; pesanan lama tanpa field ini dilewati)
  let contactEl = null;
  if (order.contactName || order.contactPhone || order.contactEmail) {
    const contact = document.createElement("div");
    contact.className = "order-contact";
    const contactTitle = document.createElement("strong");
    contactTitle.textContent = "Pemesan:";
    contact.appendChild(contactTitle);
    const contactLine = document.createElement("div");
    contactLine.className = "text-muted";
    contactLine.textContent =
      [order.contactName, order.contactPhone, order.contactEmail].filter(Boolean).join(" · ") || "—";
    contact.appendChild(contactLine);
    contactEl = contact;
  }

  // Total
  const total = document.createElement("div");
  total.className = "order-total";
  const totalLabel = document.createElement("span");
  totalLabel.textContent = "Total: ";
  const totalValue = document.createElement("strong");
  totalValue.textContent = formatRupiah(order.totalPrice);
  total.appendChild(totalLabel);
  total.appendChild(totalValue);

  card.appendChild(details);
  card.appendChild(pax);
  if (contactEl) card.appendChild(contactEl);
  card.appendChild(total);

  // Tombol batal: konfirmasi dua langkah agar pesanan tidak terhapus tidak sengaja
  if (order.status !== "cancelled") {
    const actions = document.createElement("div");
    actions.className = "order-actions";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn btn-secondary order-cancel-btn";
    cancelBtn.textContent = "Batalkan Pesanan";
    cancelBtn.setAttribute("aria-label", `Batalkan pesanan ${order.code}`);

    const confirmWrap = document.createElement("div");
    confirmWrap.className = "order-cancel-confirm";
    confirmWrap.hidden = true;

    const confirmText = document.createElement("span");
    confirmText.className = "order-cancel-text";
    confirmText.textContent = "Yakin membatalkan pesanan ini? Tindakan tidak dapat dibatalkan.";

    const yesBtn = document.createElement("button");
    yesBtn.type = "button";
    yesBtn.className = "btn btn-danger order-cancel-yes";
    yesBtn.textContent = "Ya, Batalkan";
    yesBtn.setAttribute("aria-label", `Konfirmasi membatalkan pesanan ${order.code}`);

    const noBtn = document.createElement("button");
    noBtn.type = "button";
    noBtn.className = "btn btn-secondary order-cancel-no";
    noBtn.textContent = "Tidak";

    confirmWrap.appendChild(confirmText);
    confirmWrap.appendChild(yesBtn);
    confirmWrap.appendChild(noBtn);

    cancelBtn.addEventListener("click", () => {
      cancelBtn.hidden = true;
      confirmWrap.hidden = false;
      yesBtn.focus();
    });
    noBtn.addEventListener("click", () => {
      confirmWrap.hidden = true;
      cancelBtn.hidden = false;
      cancelBtn.focus();
    });
    yesBtn.addEventListener("click", () => {
      const result = cancelOrder(order.code);
      if (typeof onCancel === "function") {
        onCancel(order.code, result);
      }
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmWrap);
    card.appendChild(actions);
  }

  return card;
}

/** Elemen status kosong. */
function buildEmptyState(title, message) {
  const wrap = document.createElement("div");
  wrap.className = "empty-state";
  const h = document.createElement("h3");
  h.textContent = title;
  const p = document.createElement("p");
  p.textContent = message;
  wrap.appendChild(h);
  wrap.appendChild(p);
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
