/**
 * Tiketin-UTS — Modul pencarian tiket (ES module).
 * Pencarian memakai LINEAR SEARCH (src/js/algorithms.js) yang menelusuri array
 * `tickets` dari awal sampai akhir dan memeriksa SELURUH kriteria: lokasi
 * (kota ATAU id bandara/stasiun/terminal), tanggal, jenis transportasi,
 * kelas layanan, harga valid, dan ketersediaan kursi.
 * Pengurutan hasil memakai BUBBLE SORT (lihat sortTickets di bagian bawah).
 * Nilai kota & transportType konsisten dengan src/data/cities.js,
 * src/data/tickets.js, dan src/data/locations.js.
 *
 * Kriteria pencarian (semua opsional kecuali origin & destination):
 * {
 *   origin, destination,              // nama kota (form "Semua")
 *   originLocationId, destinationLocationId, // id lokasi (form khusus transportasi)
 *   departureDate,                    // "YYYY-MM-DD" atau ""
 *   transportType,                    // "plane" | "train" | "bus" | null
 *   travelClass,                      // "Ekonomi" | "Eksekutif" | "Bisnis" | null
 *   passengers,                       // jumlah total penumpang (dewasa + anak)
 *   tripType,                         // "oneway" | "roundtrip" (opsional)
 *   returnDate,                       // "YYYY-MM-DD" bila roundtrip
 *   adults, children,                 // dipakai UI, tidak memengaruhi filter
 * }
 *
 * Ekspor pendukung untuk empty-state pencarian (hasil 0):
 * - findAvailableDates()      : tanggal yang punya jadwal sesuai kriteria.
 * - availableDatesHintText()  : kalimat petunjuk tanggal untuk log.
 * - sortDatesByProximity()    : urutkan tanggal berdasarkan kedekatan dengan
 *                               tanggal pilihan pengguna (Bubble Sort manual).
 * - findAlternativeRoutes()   : rute LAIN yang tersedia (informatif, bukan
 *                               hasil pencocokan) ketika rute tanpa jadwal.
 * - formatLongDate()          : tanggal panjang "28 Oktober 2026" untuk pesan.
 */

import { tickets } from "../data/tickets.js";
import { getLocationById, locationShortName } from "../data/locations.js";
import { linearSearch, bubbleSort, getSortSpec } from "./algorithms.js";

/** Nilai transportType yang valid (konsisten dengan cities.js). */
export const TRANSPORT_TYPES = ["plane", "train", "bus"];

/** Label tampilan untuk setiap jenis transportasi. */
export const TRANSPORT_LABELS = {
  plane: "Pesawat",
  train: "Kereta Api",
  bus: "Bus",
};

/** Normalisasi pembanding kota: trim + huruf kecil, tanpa stasiun/bandara. */
function normalizeCity(value) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

/** Validasi format tanggal "YYYY-MM-DD" yang benar-benar valid. */
export function isValidDateString(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return false;
  const parsed = new Date(`${value.trim()}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}

/**
 * Memvalidasi kriteria pencarian sebelum pencarian dijalankan.
 * @param {Object} criteria - Lihat komentar modul di atas.
 * @returns {string|null} Pesan error, atau null bila valid.
 */
export function validateSearchCriteria(criteria = {}) {
  const hasOriginLoc = typeof criteria.originLocationId === "string" && criteria.originLocationId !== "";
  const hasDestLoc = typeof criteria.destinationLocationId === "string" && criteria.destinationLocationId !== "";

  if (!hasOriginLoc && !normalizeCity(criteria.origin)) {
    return "Pilih lokasi keberangkatan terlebih dahulu.";
  }
  if (!hasDestLoc && !normalizeCity(criteria.destination)) {
    return "Pilih lokasi tujuan terlebih dahulu.";
  }
  if (hasOriginLoc && hasDestLoc && criteria.originLocationId === criteria.destinationLocationId) {
    return "Lokasi keberangkatan dan tujuan tidak boleh sama.";
  }
  if (!hasOriginLoc && !hasDestLoc && normalizeCity(criteria.origin) === normalizeCity(criteria.destination)) {
    return "Kota asal dan tujuan tidak boleh sama.";
  }

  const passengers = Math.floor(Number(criteria.passengers));
  if (!Number.isFinite(passengers) || passengers < 1) {
    return "Jumlah penumpang minimal 1.";
  }

  if (criteria.departureDate && !isValidDateString(criteria.departureDate)) {
    return "Tanggal berangkat tidak valid.";
  }

  if (criteria.tripType === "roundtrip") {
    if (!criteria.departureDate) {
      return "Tanggal berangkat wajib diisi untuk perjalanan pulang-pergi.";
    }
    if (!criteria.returnDate) {
      return "Tanggal pulang wajib diisi untuk perjalanan pulang-pergi.";
    }
    if (!isValidDateString(criteria.returnDate)) {
      return "Tanggal pulang tidak valid.";
    }
    if (criteria.returnDate < criteria.departureDate) {
      return "Tanggal pulang tidak boleh sebelum tanggal berangkat.";
    }
  }

  return null;
}

/**
 * Membuat kriteria pencarian tiket PULANG dari kriteria pergi
 * (rute dibalik, tanggal diganti tanggal pulang).
 * @param {Object} criteria - Kriteria pergi (lihat komentar modul).
 * @returns {Object} Kriteria pencarian tiket pulang.
 */
export function buildReturnCriteria(criteria = {}) {
  return {
    ...criteria,
    origin: criteria.destination,
    destination: criteria.origin,
    originLocationId: criteria.destinationLocationId,
    destinationLocationId: criteria.originLocationId,
    departureDate: criteria.returnDate ?? "",
  };
}

/**
 * Memvalidasi pasangan tiket pulang-pergi: tiket pulang tidak boleh
 * mendahului perjalanan pergi (tanggal, dan bila tanggal sama, jam
 * keberangkatan pulang tidak boleh sebelum jam tiba pergi).
 * @param {Object} outbound - Tiket pergi.
 * @param {Object} returning - Tiket pulang.
 * @returns {boolean}
 */
export function isValidReturnLeg(outbound, returning) {
  if (!outbound || !returning) return false;
  const outDate = String(outbound.departureDate ?? "");
  const retDate = String(returning.departureDate ?? "");
  if (!outDate || !retDate) return false;
  if (retDate < outDate) return false;
  if (retDate === outDate) {
    const retTime = String(returning.departureTime ?? "");
    const outArrival = String(outbound.arrivalTime ?? "");
    if (retTime && outArrival && retTime < outArrival) return false;
  }
  return true;
}

/** Label lokasi asal/tujuan pada log pencarian (bandara/stasiun/terminal/kota). */
function criteriaLocationLabel(locationId, cityName, fallback) {
  if (locationId) {
    const loc = getLocationById(locationId);
    const label = locationShortName(loc);
    if (label) return label;
  }
  return cityName || fallback || "-";
}

/** Teks tanggal "YYYY-MM-DD" -> locale id-ID untuk log (fallback: teks asli). */
function logDateLabel(isoDate) {
  if (typeof isoDate !== "string" || isoDate.trim() === "") return "-";
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

/** Menyusun teks kriteria pencarian untuk log. */
function describeCriteria(criteria, passengers) {
  const typeLabel = TRANSPORT_TYPES.includes(criteria.transportType)
    ? TRANSPORT_LABELS[criteria.transportType]
    : "Semua jenis";
  const originLabel = criteriaLocationLabel(criteria.originLocationId, criteria.origin, "Asal belum dipilih");
  const destLabel = criteriaLocationLabel(criteria.destinationLocationId, criteria.destination, "Tujuan belum dipilih");
  return [
    `Jenis: ${typeLabel}`,
    `Asal: ${originLabel}`,
    `Tujuan: ${destLabel}`,
    `Tanggal: ${logDateLabel(criteria.departureDate)}`,
    `Kelas: ${criteria.travelClass || "Semua kelas"}`,
    `Penumpang: ${passengers}`,
  ].join(" · ");
}

/** Ringkasan hasil pencarian untuk log (maks. 3 tiket pertama). */
function summarizeResults(results) {
  if (results.length === 0) {
    return "Tidak ada tiket yang cocok dengan seluruh kriteria pencarian.";
  }
  const head = results
    .slice(0, 3)
    .map((t) => `${t.operator} ${t.departureTime} — Rp${Number(t.price).toLocaleString("id-ID")}`)
    .join("; ");
  const more = results.length > 3 ? `; +${results.length - 3} tiket lainnya` : "";
  return `${results.length} tiket ditemukan: ${head}${more}`;
}

/**
 * Teks tanggal log "20 Okt 2026" dari ISO "YYYY-MM-DD" (fallback: teks asli).
 * @param {string} isoDate
 * @returns {string}
 */
export function formatShortDate(isoDate) {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Teks tanggal panjang "28 Oktober 2026" dari ISO "YYYY-MM-DD" (fallback: teks asli).
 * @param {string} isoDate
 * @returns {string}
 */
export function formatLongDate(isoDate) {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate || "";
  return parsed.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Mengumpulkan tanggal keberangkatan yang TERSEDIA untuk rute/kriteria tertentu,
 * TANPA memperhatikan filter tanggal, memakai loop manual (linear scan).
 *
 * Dipakai saat hasil pencarian 0 agar pengguna diarahkan ke tanggal yang memang
 * punya data ("tanggal yang sesuai dengan data"), bukan menebak-tebak.
 *
 * Kriteria yang ikut diperiksa: lokasi (id bandara/stasiun/terminal ATAU nama
 * kota), jenis transportasi, kelas, harga valid, dan kursi >= jumlah penumpang.
 *
 * @param {Object} criteria - Lihat komentar modul di atas.
 * @param {Object[]} [source] - Sumber tiket (default: semua tiket).
 * @returns {string[]} Tanggal "YYYY-MM-DD" unik, terurut menaik.
 */
export function findAvailableDates(criteria = {}, source = tickets) {
  const dataset = Array.isArray(source) ? source : [];

  const originKey = normalizeCity(criteria.origin);
  const destinationKey = normalizeCity(criteria.destination);
  const hasOriginLoc = typeof criteria.originLocationId === "string" && criteria.originLocationId !== "";
  const hasDestLoc = typeof criteria.destinationLocationId === "string" && criteria.destinationLocationId !== "";

  if ((!hasOriginLoc && !originKey) || (!hasDestLoc && !destinationKey)) return [];

  const typeFilter =
    typeof criteria.transportType === "string" && TRANSPORT_TYPES.includes(criteria.transportType)
      ? criteria.transportType
      : null;
  const classFilter =
    typeof criteria.travelClass === "string" && criteria.travelClass.trim() !== ""
      ? criteria.travelClass.trim()
      : null;
  const passengers = normalizePassengerCount(criteria.passengers) ?? 1;

  const dates = [];
  for (let i = 0; i < dataset.length; i += 1) {
    const ticket = dataset[i];

    if (hasOriginLoc) {
      if (ticket.originLocationId !== criteria.originLocationId) continue;
    } else if (normalizeCity(ticket.origin) !== originKey) continue;

    if (hasDestLoc) {
      if (ticket.destinationLocationId !== criteria.destinationLocationId) continue;
    } else if (normalizeCity(ticket.destination) !== destinationKey) continue;

    if (typeFilter && ticket.transportType !== typeFilter) continue;
    if (classFilter && ticket.travelClass !== classFilter) continue;
    if (!Number.isFinite(Number(ticket.price)) || ticket.price < 0) continue;
    if (ticket.availableSeats < passengers) continue;
    if (typeof ticket.departureDate !== "string" || ticket.departureDate === "") continue;

    const date = ticket.departureDate;
    let already = false;
    for (let j = 0; j < dates.length; j += 1) {
      if (dates[j] === date) {
        already = true;
        break;
      }
    }
    if (already) continue;

    // Sisipkan pada posisi terurut (urutan menaik tanpa Array.sort()).
    let pos = 0;
    while (pos < dates.length && dates[pos] < date) pos += 1;
    dates.splice(pos, 0, date);
  }
  return dates;
}

/**
 * Kalimat petunjuk untuk log/empty-state ketika hasil pencarian 0.
 * @param {string[]} dates - Hasil findAvailableDates().
 * @returns {string} "" bila tidak ada jadwal sama sekali.
 */
export function availableDatesHintText(dates) {
  if (!Array.isArray(dates) || dates.length === 0) return "";
  let label = "";
  for (let i = 0; i < dates.length; i += 1) {
    label += (i > 0 ? ", " : "") + formatShortDate(dates[i]);
  }
  return ` Rute/kriteria ini memiliki jadwal pada tanggal: ${label}.`;
}

/**
 * Mengurutkan daftar tanggal berdasarkan KEDEKATAN (selisih hari terkecil)
 * dengan tanggal pilihan pengguna, memakai BUBBLE SORT manual — tanpa
 * Array.sort(). Bila tanggal pilihan kosong/tidak valid, urutan asli
 * (menaik) dipertahankan. Tanggal dengan selisih sama (mis. H-1 dan H+1)
 * mempertahankan urutan menaik (yang lebih awal di depan) berkat sifat stabil
 * bubble sort ini.
 *
 * @param {string[]} dates - Tanggal "YYYY-MM-DD" (mis. hasil findAvailableDates).
 * @param {string} preferredDate - Tanggal pilihan pengguna "YYYY-MM-DD".
 * @returns {string[]} Salinan terurut (array masukan tidak diubah).
 */
export function sortDatesByProximity(dates, preferredDate) {
  const list = [];
  if (Array.isArray(dates)) {
    for (let i = 0; i < dates.length; i += 1) list.push(dates[i]);
  }
  if (!isValidDateString(preferredDate)) return list;

  const target = new Date(`${preferredDate}T00:00:00`).getTime();
  const distance = (iso) => Math.abs(new Date(`${iso}T00:00:00`).getTime() - target);

  for (let i = 0; i < list.length - 1; i += 1) {
    let swapped = false;
    for (let j = 0; j < list.length - 1 - i; j += 1) {
      if (distance(list[j]) > distance(list[j + 1])) {
        const tmp = list[j];
        list[j] = list[j + 1];
        list[j + 1] = tmp;
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return list;
}

/**
 * Mencari RUTE LAIN yang tersedia sebagai alternatif ketika rute yang dicari
 * tidak punya jadwal sama sekali. Dipakai pada empty-state pencarian —
 * hasilnya ditampilkan sebagai informasi, BUKAN sebagai hasil pencocokan.
 *
 * Kandidat: rute yang berbagi kota asal ATAU kota tujuan dengan pencarian
 * (menghormati jenis transportasi bila dipilih). Rute yang persis dicari
 * (lokasi asal + tujuan + tipe sama) tidak disertakan. Ketersediaan tanggal
 * tiap kandidat diperiksa dengan kriteria yang sama seperti pencarian biasa
 * (kelas & kursi >= penumpang).
 *
 * Pengumpulan & pengurutan memakai loop manual (tanpa Array.filter/Array.sort).
 *
 * @param {Object} criteria - Lihat komentar modul di atas.
 * @param {Object[]} [source] - Sumber tiket (default: semua tiket).
 * @param {number} [limit] - Maksimal rute yang dikembalikan (default 5).
 * @returns {Object[]} Daftar {origin, destination, originLocationId,
 *   destinationLocationId, transportType, dates} terurut: kecocokan kota
 *   (asal+tujuan, lalu asal saja, lalu tujuan saja), lalu jumlah tanggal
 *   tersedia menaik.
 */
export function findAlternativeRoutes(criteria = {}, source = tickets, limit = 5) {
  const dataset = Array.isArray(source) ? source : [];
  const typeFilter = TRANSPORT_TYPES.includes(criteria.transportType) ? criteria.transportType : null;

  const hasOriginLoc = typeof criteria.originLocationId === "string" && criteria.originLocationId !== "";
  const hasDestLoc = typeof criteria.destinationLocationId === "string" && criteria.destinationLocationId !== "";

  const criteriaOriginCity = hasOriginLoc
    ? normalizeCity(getLocationById(criteria.originLocationId)?.city)
    : normalizeCity(criteria.origin);
  const criteriaDestCity = hasDestLoc
    ? normalizeCity(getLocationById(criteria.destinationLocationId)?.city)
    : normalizeCity(criteria.destination);

  /** Kumpulkan rute kandidat unik (skor terbaik dipertahankan). */
  const candidates = [];
  for (const ticket of dataset) {
    if (typeFilter && ticket.transportType !== typeFilter) continue;

    // Lewati rute yang persis sedang dicari (memang sedang ditanyakan statusnya).
    if (
      hasOriginLoc &&
      hasDestLoc &&
      ticket.originLocationId === criteria.originLocationId &&
      ticket.destinationLocationId === criteria.destinationLocationId &&
      (!typeFilter || ticket.transportType === typeFilter)
    ) {
      continue;
    }

    const originMatch = criteriaOriginCity !== "" && normalizeCity(ticket.origin) === criteriaOriginCity;
    const destMatch = criteriaDestCity !== "" && normalizeCity(ticket.destination) === criteriaDestCity;
    if (!originMatch && !destMatch) continue;

    // Skor kecocokan: 0 = kota asal & tujuan sama, 1 = asal saja, 2 = tujuan saja.
    const score = originMatch && destMatch ? 0 : originMatch ? 1 : 2;

    let existing = null;
    for (let i = 0; i < candidates.length; i += 1) {
      const c = candidates[i];
      if (
        c.originLocationId === ticket.originLocationId &&
        c.destinationLocationId === ticket.destinationLocationId &&
        c.transportType === ticket.transportType
      ) {
        existing = c;
        break;
      }
    }
    if (existing) {
      if (score < existing.score) existing.score = score;
      continue;
    }

    candidates.push({
      origin: ticket.origin,
      destination: ticket.destination,
      originLocationId: ticket.originLocationId,
      destinationLocationId: ticket.destinationLocationId,
      transportType: ticket.transportType,
      score,
    });
  }

  /** Hitung tanggal tersedia tiap kandidat (cek kelas & kursi seperti biasa). */
  const routes = [];
  for (const candidate of candidates) {
    const dates = findAvailableDates(
      {
        ...criteria,
        origin: candidate.origin,
        destination: candidate.destination,
        originLocationId: candidate.originLocationId,
        destinationLocationId: candidate.destinationLocationId,
        transportType: candidate.transportType,
      },
      dataset,
    );
    if (dates.length === 0) continue;
    candidate.dates = dates;
    routes.push(candidate);
  }

  // Bubble Sort manual: skor kecocokan menaik, lalu jumlah tanggal menurun.
  for (let i = 0; i < routes.length - 1; i += 1) {
    let swapped = false;
    for (let j = 0; j < routes.length - 1 - i; j += 1) {
      const a = routes[j];
      const b = routes[j + 1];
      const aRank = a.score * 10000 - a.dates.length;
      const bRank = b.score * 10000 - b.dates.length;
      if (aRank > bRank) {
        routes[j] = b;
        routes[j + 1] = a;
        swapped = true;
      }
    }
    if (!swapped) break;
  }

  const max = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 5;
  const out = [];
  for (let i = 0; i < routes.length && i < max; i += 1) out.push(routes[i]);
  return out;
}

/**
 * Mencari tiket sesuai kriteria dengan LINEAR SEARCH, lengkap dengan log
 * eksekusi (metode, kriteria, data diperiksa, perbandingan, hasil).
 *
 * Seluruh kriteria wajib terpenuhi: jenis transportasi, asal, tujuan, tanggal,
 * kelas, harga valid, dan ketersediaan kursi. Tidak ada tiket yang dibuat
 * untuk mengisi hasil kosong.
 *
 * @param {Object} criteria - Lihat komentar modul di atas.
 * @param {Object[]} [source] - Sumber tiket (default: semua tiket).
 * @returns {{results: Object[], log: Object}}
 */
export function searchTicketsWithLog(criteria = {}, source = tickets) {
  const { origin, destination, originLocationId, destinationLocationId, departureDate, transportType, travelClass } = criteria;
  const dataset = Array.isArray(source) ? source : [];

  const makeEmptyLog = (note) => ({
    method: "Linear Search",
    criteriaText: describeCriteria(criteria, criteria.passengers ?? 1),
    dataCount: dataset.length,
    visited: 0,
    comparisons: 0,
    found: 0,
    steps: [],
    summary: note,
  });

  const hasOriginLoc = typeof originLocationId === "string" && originLocationId !== "";
  const hasDestLoc = typeof destinationLocationId === "string" && destinationLocationId !== "";

  // Validasi input kosong
  if (!hasOriginLoc && !normalizeCity(origin)) {
    return { results: [], log: makeEmptyLog("Pencarian dihentikan: lokasi keberangkatan belum dipilih.") };
  }
  if (!hasDestLoc && !normalizeCity(destination)) {
    return { results: [], log: makeEmptyLog("Pencarian dihentikan: lokasi tujuan belum dipilih.") };
  }

  // Lokasi/kota asal tidak boleh sama dengan tujuan
  if (hasOriginLoc && hasDestLoc && originLocationId === destinationLocationId) {
    return { results: [], log: makeEmptyLog("Pencarian dihentikan: lokasi asal dan tujuan sama.") };
  }
  if (!hasOriginLoc && !hasDestLoc && normalizeCity(origin) === normalizeCity(destination)) {
    return { results: [], log: makeEmptyLog("Pencarian dihentikan: kota asal dan tujuan sama.") };
  }

  const passengers = normalizePassengerCount(criteria.passengers);
  if (passengers === null) {
    return { results: [], log: makeEmptyLog("Pencarian dihentikan: jumlah penumpang tidak valid.") };
  }

  // transportType hanya difilter jika nilainya valid
  const typeFilter =
    typeof transportType === "string" && TRANSPORT_TYPES.includes(transportType)
      ? transportType
      : null;

  const dateFilter =
    typeof departureDate === "string" && departureDate.trim() !== ""
      ? departureDate.trim()
      : null;

  const classFilter =
    typeof travelClass === "string" && travelClass.trim() !== ""
      ? travelClass.trim()
      : null;

  const originKey = normalizeCity(origin);
  const destinationKey = normalizeCity(destination);

  // Predicate Linear Search: setiap perbandingan yang benar-benar dijalankan
  // menaikkan stats.comparisons sehingga angka log berasal dari eksekusi nyata.
  const { results, stats, steps } = linearSearch(dataset, (ticket, statsRef) => {
    if (hasOriginLoc || hasDestLoc) {
      // Pencarian per lokasi spesifik (bandara/stasiun/terminal)
      if (hasOriginLoc) {
        statsRef.comparisons += 1;
        if (ticket.originLocationId !== originLocationId) return false;
      }
      if (hasDestLoc) {
        statsRef.comparisons += 1;
        if (ticket.destinationLocationId !== destinationLocationId) return false;
      }
      // Kota tetap dicocokkan bila hanya salah satu sisi memakai lokasi
      if (!hasOriginLoc) {
        statsRef.comparisons += 1;
        if (normalizeCity(ticket.origin) !== originKey) return false;
      }
      if (!hasDestLoc) {
        statsRef.comparisons += 1;
        if (normalizeCity(ticket.destination) !== destinationKey) return false;
      }
    } else {
      statsRef.comparisons += 1;
      if (normalizeCity(ticket.origin) !== originKey) return false;
      statsRef.comparisons += 1;
      if (normalizeCity(ticket.destination) !== destinationKey) return false;
    }
    if (typeFilter) {
      statsRef.comparisons += 1;
      if (ticket.transportType !== typeFilter) return false;
    }
    if (dateFilter) {
      statsRef.comparisons += 1;
      if (ticket.departureDate !== dateFilter) return false;
    }
    if (classFilter) {
      statsRef.comparisons += 1;
      if (ticket.travelClass !== classFilter) return false;
    }
    // Abaikan tiket dengan harga tidak valid
    statsRef.comparisons += 1;
    if (!Number.isFinite(Number(ticket.price))) return false;
    statsRef.comparisons += 1;
    if (ticket.price < 0) return false;
    // Sisa kursi harus mencukupi jumlah penumpang
    statsRef.comparisons += 1;
    if (ticket.availableSeats < passengers) return false;
    return true;
  });

  const log = {
    method: "Linear Search",
    criteriaText: describeCriteria(criteria, passengers),
    dataCount: dataset.length,
    visited: stats.visited,
    comparisons: stats.comparisons,
    found: results.length,
    // Langkah per-elemen dari eksekusi loop (indeks, data diperiksa, hasil
    // pencocokan, perbandingan kumulatif) untuk panel log di halaman hasil.
    steps,
    // Hasil 0 -> tampilkan tanggal yang MEMANG punya jadwal agar pencarian
    // berikutnya diarahkan ke tanggal sesuai data (lihat findAvailableDates).
    summary:
      results.length === 0
        ? summarizeResults(results) + availableDatesHintText(findAvailableDates(criteria, dataset))
        : summarizeResults(results),
  };

  return { results, log };
}

/**
 * Mencari tiket sesuai kriteria (wrapper ringkas dari searchTicketsWithLog).
 * @param {Object} criteria - Lihat komentar modul di atas.
 * @param {Object[]} [source] - Sumber tiket (default: semua tiket).
 * @returns {Object[]} Array hasil pencarian (tidak pernah null).
 */
export function searchTickets(criteria = {}, source = tickets) {
  return searchTicketsWithLog(criteria, source).results;
}

/** Validasi jumlah penumpang -> angka positif, atau null jika tidak valid. */
function normalizePassengerCount(value) {
  const n = Math.floor(Number(value ?? 1));
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

/**
 * Mengurutkan array tiket sesuai kriteria tugas dengan BUBBLE SORT.
 * Array asli TIDAK dimodifikasi: pengurutan bekerja pada salinan, sehingga
 * data tiket sumber tidak rusak akibat pengurutan.
 *
 * @param {Object[]} list - Array hasil pencarian.
 * @param {string} [criteriaKey="price_asc"] - Kunci kriteria dari SORT_OPTIONS
 *        ("price_asc" | "price_desc" | "departure_earliest" | "departure_latest"
 *         | "duration_fastest" | "duration_slowest").
 * @returns {{sorted: Object[], log: Object}} Hasil + log eksekusi algoritma
 *          (metode, kriteria, jumlah data, perbandingan, pertukaran,
 *           langkah per-pass/pertukaran, ringkasan).
 */
export function sortTickets(list, criteriaKey = "price_asc") {
  const source = Array.isArray(list) ? list : [];
  const spec = getSortSpec(criteriaKey);
  const { sorted, comparisons, swaps, steps } = bubbleSort(source, spec.compare);

  return {
    sorted,
    log: {
      method: "Bubble Sort",
      criterion: spec.label,
      criterionKey: spec.value,
      dataCount: source.length,
      comparisons,
      swaps,
      // Langkah nyata eksekusi (pertukaran & ringkasan tiap pass) untuk
      // panel log di halaman hasil; array sumber tetap tidak dimodifikasi.
      steps,
      summary: sorted.length > 0
        ? `${sorted.length} tiket terurut: ${spec.summarize(sorted)}`
        : "Tidak ada data untuk diurutkan.",
    },
  };
}

/**
 * Mengurutkan array tiket berdasarkan harga (kompatibel dengan API lama),
 * tetapi tetap memakai Bubble Sort implementasi sendiri — bukan Array.sort().
 * @param {Object[]} list - Array tiket (tidak dimodifikasi).
 * @param {"asc"|"desc"} [order="asc"] - "asc" = termurah dulu, "desc" = termahal dulu.
 * @returns {Object[]} Array baru hasil pengurutan.
 */
export function sortTicketsByPrice(list, order = "asc") {
  return sortTickets(list, order === "desc" ? "price_desc" : "price_asc").sorted;
}

/**
 * Memfilter tiket pada rentang harga minimum/maximum (loop manual,
 * bukan Array.filter) sehingga seluruh alur pemilihan tiket
 * (pencarian -> filter harga -> pengurutan) memakai algoritma sendiri.
 * @param {Object[]} list - Array tiket (tidak dimodifikasi).
 * @param {number} [minPrice] - Harga minimum (opsional).
 * @param {number} [maxPrice] - Harga maksimum (opsional).
 * @returns {Object[]} Array baru hasil filter.
 */
export function filterTicketsByPrice(list, minPrice, maxPrice) {
  if (!Array.isArray(list)) return [];
  const min = Number.isFinite(Number(minPrice)) && minPrice !== "" && minPrice != null ? Number(minPrice) : null;
  const max = Number.isFinite(Number(maxPrice)) && maxPrice !== "" && maxPrice != null ? Number(maxPrice) : null;

  const hasil = [];
  for (let i = 0; i < list.length; i += 1) {
    const ticket = list[i];
    if (min !== null && ticket.price < min) continue;
    if (max !== null && ticket.price > max) continue;
    hasil.push(ticket);
  }
  return hasil;
}

export default searchTickets;
