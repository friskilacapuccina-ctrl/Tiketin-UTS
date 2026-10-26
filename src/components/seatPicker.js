/**
 * Tiketin-UTS — Komponen pemilihan kursi bus (ES module).
 * Peta kursi diambil dari data tiket (ticket.capacity + ticket.bookedSeats),
 * sehingga nomor kursi TIDAK mengarang di runtime. Bila sebuah tiket bus tidak
 * punya data kapasitas/kursi, createSeatPicker mengembalikan null dan pemesanan
 * tetap berjalan tanpa pemilihan nomor kursi.
 *
 * Tata letak simulasi: 4 kursi per baris (A, B, lorong, C, D),
 * nomor baris 1..n, id kursi seperti "1A", "10D".
 */

const ROW_LETTERS = ["A", "B", "C", "D"];

/** Semua id kursi yang mungkin untuk sebuah kapasitas. */
function allSeatIds(capacity) {
  const ids = [];
  const rows = Math.ceil(capacity / ROW_LETTERS.length);
  for (let row = 1; row <= rows; row++) {
    for (const letter of ROW_LETTERS) {
      if (ids.length >= capacity) break;
      ids.push(`${row}${letter}`);
    }
  }
  return ids;
}

/**
 * Membuat pemilih kursi untuk satu tiket bus.
 * @param {Object} ticket - Tiket bus (butuh capacity & bookedSeats).
 * @param {Object} [options]
 * @param {number} [options.maxSelection] - Jumlah kursi yang harus dipilih.
 * @param {Function} [options.onChange] - Callback (selectedSeats: string[]) setiap perubahan.
 * @returns {{el: HTMLElement, getSelected: Function, setMax: Function}|null}
 */
export function createSeatPicker(ticket, options = {}) {
  const capacity = Number(ticket?.capacity);
  const booked = Array.isArray(ticket?.bookedSeats) ? new Set(ticket.bookedSeats) : null;
  if (!Number.isInteger(capacity) || capacity < 1 || !booked) return null;

  let maxSelection = Math.max(1, Math.floor(Number(options.maxSelection) || 1));
  const selected = new Set();

  const wrap = document.createElement("div");
  wrap.className = "form-group seat-picker span-all";

  const label = document.createElement("span");
  label.className = "form-caption";
  label.textContent = "Pilih Kursi";
  wrap.appendChild(label);

  const hint = document.createElement("p");
  hint.className = "seat-hint text-muted";
  wrap.appendChild(hint);

  const map = document.createElement("div");
  map.className = "seat-map";
  map.setAttribute("role", "group");
  map.setAttribute("aria-label", "Peta kursi bus");

  const seatButtons = new Map();
  const validSeats = new Set(allSeatIds(capacity));

  const rows = Math.ceil(capacity / ROW_LETTERS.length);
  for (let row = 1; row <= rows; row++) {
    const rowEl = document.createElement("div");
    rowEl.className = "seat-row";

    const rowLabel = document.createElement("span");
    rowLabel.className = "seat-row-label text-muted";
    rowLabel.textContent = String(row);
    rowEl.appendChild(rowLabel);

    ROW_LETTERS.forEach((letter, index) => {
      if (index === 2) {
        const aisle = document.createElement("span");
        aisle.className = "seat-aisle";
        aisle.setAttribute("aria-hidden", "true");
        rowEl.appendChild(aisle);
      }
      const seatId = `${row}${letter}`;
      if (!validSeats.has(seatId)) {
        // Kursi di luar kapasitas: tampilkan sebagai ruang kosong
        const spacer = document.createElement("span");
        spacer.className = "seat-spacer";
        rowEl.appendChild(spacer);
        return;
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "seat";
      btn.textContent = seatId;
      if (booked.has(seatId)) {
        btn.classList.add("seat-occupied");
        btn.disabled = true;
        btn.setAttribute("aria-label", `Kursi ${seatId} sudah terisi`);
      } else {
        btn.setAttribute("aria-label", `Kursi ${seatId}`);
        btn.setAttribute("aria-pressed", "false");
        btn.addEventListener("click", () => {
          if (selected.has(seatId)) {
            selected.delete(seatId);
          } else if (selected.size < maxSelection) {
            selected.add(seatId);
          }
          refresh();
          options.onChange?.(getSelected());
        });
        seatButtons.set(seatId, btn);
      }
      rowEl.appendChild(btn);
    });

    map.appendChild(rowEl);
  }

  wrap.appendChild(map);

  // Legenda
  const legend = document.createElement("div");
  legend.className = "seat-legend text-muted";
  const entries = [
    ["swatch-free", "Tersedia"],
    ["swatch-occupied", "Terisi"],
    ["swatch-selected", "Terpilih"],
  ];
  for (const [swatchClass, text] of entries) {
    const item = document.createElement("span");
    const swatch = document.createElement("span");
    swatch.className = `seat-legend-swatch ${swatchClass}`;
    item.appendChild(swatch);
    item.appendChild(document.createTextNode(text));
    legend.appendChild(item);
  }
  wrap.appendChild(legend);

  function getSelected() {
    return [...selected];
  }

  function refresh() {
    for (const [seatId, btn] of seatButtons) {
      const isSelected = selected.has(seatId);
      btn.classList.toggle("selected", isSelected);
      btn.setAttribute("aria-pressed", String(isSelected));
    }
    const count = selected.size;
    hint.textContent =
      count < maxSelection
        ? `Pilih tepat ${maxSelection} kursi (sudah dipilih ${count}).`
        : `${count} kursi dipilih: ${getSelected().join(", ")}. Klik kursi untuk melepas.`;
  }

  function setMax(value) {
    const next = Math.max(1, Math.floor(Number(value) || 1));
    maxSelection = next;
    refresh();
  }

  refresh();
  return { el: wrap, getSelected, setMax };
}

export default createSeatPicker;
