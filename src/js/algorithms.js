/**
 * Tiketin-UTS — Modul algoritma Struktur Data (ES module).
 * Implementasi SENDIRI algoritma yang dipakai aplikasi pemesanan tiket:
 *
 * - Linear Search : menelusuri array tiket satu per satu sesuai kriteria
 *                  pencarian (jenis transportasi, asal, tujuan, tanggal, dll).
 * - Bubble Sort  : mengurutkan SALINAN array hasil pencarian berdasarkan
 *                  harga (termurah/termahal), waktu keberangkatan (paling
 *                  awal/paling akhir), atau durasi perjalanan (tercepat/
 *                  terlama).
 *
 * Kedua algoritma menghitung perbandingan dan pertukaran NYATA pada saat
 * dijalankan (counter yang dinaikkan di dalam loop), sehingga log yang tampil
 * di UI berasal dari eksekusi algoritma — bukan angka statis atau acak.
 *
 * Catatan jujur tentang "pointer" dan "struct":
 * - JavaScript tidak memiliki pointer seperti C++. Yang dipakai di sini adalah
 *   ARRAY OF OBJECT: src/data/tickets.js berisi array bernama `tickets` yang
 *   setiap elemennya adalah objek tiket (setara array of struct) — konsep
 *   Array & Struct diterapkan langsung pada data pemesanan.
 * - Implementasi `struct Ticket` beserta POINTER (referensi alamat elemen array)
 *   yang sesungguhnya ada di folder cpp/ (ticket.h, ticket.cpp, main.cpp),
 *   dikompilasi dan diuji terpisah dengan compiler C++. Kode C++ TIDAK
 *   dijalankan oleh browser dan tidak diintegrasikan ke website ini.
 */

/** Opsi pengurutan pada halaman hasil pencarian (satu sumber kebenaran). */
export const SORT_OPTIONS = [
  { value: "price_asc", label: "Harga termurah" },
  { value: "price_desc", label: "Harga termahal" },
  { value: "departure_earliest", label: "Keberangkatan paling awal" },
  { value: "departure_latest", label: "Keberangkatan paling akhir" },
  { value: "duration_fastest", label: "Durasi perjalanan tercepat" },
  { value: "duration_slowest", label: "Durasi perjalanan terlama" },
];

/** Format angka rupiah ringkas untuk log (1450000 -> "Rp1.450.000"). */
export function formatRupiah(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "Rp-";
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}

/** Harga tiket sebagai angka (NaN -> Infinity agar diurutkan paling akhir). */
function priceOf(ticket) {
  const n = Number(ticket?.price);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}

/**
 * Mengubah teks durasi ("1j 50m", "6j 40m", "45m") menjadi total menit.
 * Nilai tidak terbaca -> Infinity (diurutkan paling akhir).
 */
export function durationToMinutes(duration) {
  if (typeof duration === "number" && Number.isFinite(duration)) return duration;
  if (typeof duration !== "string" || duration.trim() === "") return Number.POSITIVE_INFINITY;
  const hourMatch = duration.match(/(\d+)\s*j/i);
  const minuteMatch = duration.match(/(\d+)\s*m/i);
  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
  const total = hours * 60 + minutes;
  return Number.isFinite(total) ? total : Number.POSITIVE_INFINITY;
}

/** Format menit -> teks durasi ("6j 40m") untuk ringkasan log. */
export function minutesToDuration(minutes) {
  if (!Number.isFinite(minutes)) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}j ${String(m).padStart(2, "0")}m` : `${m}m`;
}

/**
 * Kunci waktu keberangkatan kronologis: "YYYY-MM-DD HH:MM".
 * Berkas ISO-style sehingga perbandingan string = perbandingan waktu.
 */
export function departureKey(ticket) {
  const date = typeof ticket?.departureDate === "string" ? ticket.departureDate : "";
  const time = typeof ticket?.departureTime === "string" ? ticket.departureTime : "";
  return `${date} ${time}`;
}

/** Spesifikasi satu kriteria sorting: label, pembanding, dan ringkasan hasil. */
const SORT_SPECS = {
  price_asc: {
    value: "price_asc",
    label: "Harga termurah",
    compare: (a, b) => priceOf(a) - priceOf(b),
    summarize: (list) =>
      list.length > 1
        ? `${formatRupiah(list[0].price)} → ${formatRupiah(list[list.length - 1].price)}`
        : list.length === 1
          ? formatRupiah(list[0].price)
          : "Tidak ada data untuk diurutkan.",
  },
  price_desc: {
    value: "price_desc",
    label: "Harga termahal",
    compare: (a, b) => priceOf(b) - priceOf(a),
    summarize: (list) =>
      list.length > 1
        ? `${formatRupiah(list[0].price)} → ${formatRupiah(list[list.length - 1].price)}`
        : list.length === 1
          ? formatRupiah(list[0].price)
          : "Tidak ada data untuk diurutkan.",
  },
  departure_earliest: {
    value: "departure_earliest",
    label: "Keberangkatan paling awal",
    compare: (a, b) => {
      const ka = departureKey(a);
      const kb = departureKey(b);
      if (ka === kb) return 0;
      return ka < kb ? -1 : 1;
    },
    summarize: (list) =>
      list.length > 1
        ? `${list[0].departureTime} → ${list[list.length - 1].departureTime}`
        : list.length === 1
          ? list[0].departureTime
          : "Tidak ada data untuk diurutkan.",
  },
  departure_latest: {
    value: "departure_latest",
    label: "Keberangkatan paling akhir",
    compare: (a, b) => {
      const ka = departureKey(a);
      const kb = departureKey(b);
      if (ka === kb) return 0;
      return ka > kb ? -1 : 1; // kebalikan dari departure_earliest
    },
    summarize: (list) =>
      list.length > 1
        ? `${list[0].departureTime} → ${list[list.length - 1].departureTime}`
        : list.length === 1
          ? list[0].departureTime
          : "Tidak ada data untuk diurutkan.",
  },
  duration_fastest: {
    value: "duration_fastest",
    label: "Durasi perjalanan tercepat",
    compare: (a, b) => durationToMinutes(a?.duration) - durationToMinutes(b?.duration),
    summarize: (list) =>
      list.length > 1
        ? `${list[0].duration} → ${list[list.length - 1].duration}`
        : list.length === 1
          ? list[0].duration
          : "Tidak ada data untuk diurutkan.",
  },
  duration_slowest: {
    value: "duration_slowest",
    label: "Durasi perjalanan terlama",
    compare: (a, b) => durationToMinutes(b?.duration) - durationToMinutes(a?.duration), // kebalikan dari duration_fastest
    summarize: (list) =>
      list.length > 1
        ? `${list[0].duration} → ${list[list.length - 1].duration}`
        : list.length === 1
          ? list[0].duration
          : "Tidak ada data untuk diurutkan.",
  },
};

/** Ambil spesifikasi sorting (fallback ke harga termurah bila kunci tak dikenal). */
export function getSortSpec(criteriaKey) {
  return SORT_SPECS[criteriaKey] ?? SORT_SPECS.price_asc;
}

/**
 * LINEAR SEARCH — menelusuri array dari awal sampai akhir.
 * Predicate dipanggil untuk tiap elemen dan boleh menaikkan `stats.comparisons`
 * pada setiap perbandingan yang benar-benar dilakukannya.
 *
 * Selain hasil & statistik, fungsi ini merekam LANGKAH PER-ELEMEN yang benar-
 * benar diperiksa (`steps`): indeks, elemen yang sedang diproses, hasil
 * pencocokan, dan jumlah perbandingan kumulatif setelah elemen itu. Rekaman
 * tersedia bersama statistik eksekusi untuk pemanggil algoritma.
 *
 * @param {Array} list - Array sumber (tidak dimodifikasi).
 * @param {Function} predicate - (item, stats) => boolean.
 * @returns {{results: Array, stats: {visited: number, comparisons: number, found: number}, steps: Array}}
 */
export function linearSearch(list, predicate) {
  const stats = { visited: 0, comparisons: 0, found: 0 };
  const results = [];
  const steps = [];
  if (!Array.isArray(list)) return { results, stats, steps };

  for (let i = 0; i < list.length; i += 1) {
    stats.visited += 1; // satu elemen array diperiksa
    const item = list[i];
    const pass = predicate(item, stats);
    if (pass) {
      results.push(item);
      stats.found += 1;
    }
    steps.push({
      kind: "visit",
      index: i,
      item,
      pass,
      comparisons: stats.comparisons, // kumulatif setelah elemen ini
    });
  }
  return { results, stats, steps };
}

/**
 * BUBBLE SORT — mengurutkan SALINAN array (array asli tidak pernah berubah).
 *
 * Selain hasil, fungsi ini merekam LANGKAH ITERASI (`steps`) dari eksekusi
 * nyata: setiap pertukaran (pasangan elemen & posisi) dan ringkasan tiap pass
 * (jumlah perbandingan/pertukaran, elemen yang mengendap, berhenti dini).
 * Rekaman tersedia bersama statistik eksekusi untuk pemanggil algoritma.
 *
 * @param {Array} list - Array sumber.
 * @param {Function} compare - (a, b) => number (negatif bila a di depan).
 * @returns {{sorted: Array, comparisons: number, swaps: number, steps: Array}}
 */
export function bubbleSort(list, compare) {
  const sorted = Array.isArray(list) ? [...list] : [];
  let comparisons = 0;
  let swaps = 0;
  const steps = [];
  const n = sorted.length;

  for (let i = 0; i < n - 1; i += 1) {
    let swapped = false;
    let passComparisons = 0;
    let passSwaps = 0;
    for (let j = 0; j < n - 1 - i; j += 1) {
      comparisons += 1; // satu perbandingan kunci antar elemen
      passComparisons += 1;
      if (compare(sorted[j], sorted[j + 1]) > 0) {
        steps.push({
          kind: "swap",
          pass: i + 1,
          index: j,
          a: sorted[j],
          b: sorted[j + 1],
        });
        const temp = sorted[j];
        sorted[j] = sorted[j + 1];
        sorted[j + 1] = temp;
        swaps += 1;
        passSwaps += 1;
        swapped = true;
      }
    }
    steps.push({
      kind: "pass",
      pass: i + 1,
      comparisons: passComparisons,
      swaps: passSwaps,
      settledIndex: n - 1 - i, // elemen terakhir pass ini sudah pada posisi final
      earlyStop: !swapped, // optimasi: tidak ada pertukaran -> sudah terurut
    });
    // Optimasi: bila tidak ada pertukaran, array sudah terurut.
    if (!swapped) break;
  }

  return { sorted, comparisons, swaps, steps };
}

export default { SORT_OPTIONS, linearSearch, bubbleSort, getSortSpec };
