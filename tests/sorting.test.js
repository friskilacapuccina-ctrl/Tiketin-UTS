/**
 * Unit test pengurutan (Bubble Sort) & filter harga dengan DATA UJI TERKONTROL.
 */
import { describe, it, expect } from "vitest";
import { sortTickets, sortTicketsByPrice, filterTicketsByPrice } from "../src/js/search.js";
import {
  bubbleSort,
  linearSearch,
  getSortSpec,
  durationToMinutes,
  minutesToDuration,
  departureKey,
  formatRupiah,
  SORT_OPTIONS,
} from "../src/js/algorithms.js";

function ticket(overrides = {}) {
  return {
    id: "T1",
    price: 1000000,
    departureDate: "2026-10-28",
    departureTime: "06:00",
    duration: "2j 00m",
    ...overrides,
  };
}

// Urutan sengaja tidak terurut untuk menguji setiap kriteria.
const LIST = [
  ticket({ id: "A", price: 1200000, departureTime: "14:00", duration: "2j 05m" }),
  ticket({ id: "B", price: 900000, departureTime: "05:40", duration: "1j 35m" }),
  ticket({ id: "C", price: 1500000, departureTime: "19:20", duration: "2j 10m" }),
  ticket({ id: "D", price: 1050000, departureDate: "2026-10-29", departureTime: "09:55", duration: "45m" }),
];

const ids = (list) => list.map((t) => t.id);

describe("sortTickets — 6 kriteria Bubble Sort", () => {
  it("price_asc: harga termurah dahulu", () => {
    expect(ids(sortTickets(LIST, "price_asc").sorted)).toEqual(["B", "D", "A", "C"]);
  });

  it("price_desc: harga termahal dahulu", () => {
    expect(ids(sortTickets(LIST, "price_desc").sorted)).toEqual(["C", "A", "D", "B"]);
  });

  it("departure_earliest: keberangkatan kronologis (tanggal lalu jam)", () => {
    expect(ids(sortTickets(LIST, "departure_earliest").sorted)).toEqual(["B", "A", "C", "D"]);
  });

  it("departure_latest: keberangkatan paling akhir dahulu", () => {
    expect(ids(sortTickets(LIST, "departure_latest").sorted)).toEqual(["D", "C", "A", "B"]);
  });

  it("duration_fastest: durasi tercepat dahulu", () => {
    expect(ids(sortTickets(LIST, "duration_fastest").sorted)).toEqual(["D", "B", "A", "C"]);
  });

  it("duration_slowest: durasi terlama dahulu", () => {
    expect(ids(sortTickets(LIST, "duration_slowest").sorted)).toEqual(["C", "A", "B", "D"]);
  });

  it("kunci tidak dikenal jatuh ke harga termurah", () => {
    expect(ids(sortTickets(LIST, "apapun").sorted)).toEqual(ids(sortTickets(LIST, "price_asc").sorted));
  });

  it("array asli TIDAK dimodifikasi oleh pengurutan", () => {
    const before = ids(LIST);
    sortTickets(LIST, "price_desc");
    expect(ids(LIST)).toEqual(before);
  });

  it("mengembalikan log Bubble Sort dengan perbandingan & pertukaran nyata", () => {
    const { log } = sortTickets(LIST, "price_asc");
    expect(log.method).toBe("Bubble Sort");
    expect(log.dataCount).toBe(4);
    expect(log.comparisons).toBeGreaterThan(0);
    expect(log.swaps).toBeGreaterThan(0);
  });

  it("menangani list kosong tanpa error", () => {
    const { sorted, log } = sortTickets([], "price_asc");
    expect(sorted).toEqual([]);
    expect(log.comparisons).toBe(0);
    expect(log.summary).toContain("Tidak ada data");
  });
});

describe("sortTicketsByPrice & filterTicketsByPrice", () => {
  it("sortTicketsByPrice asc/desc", () => {
    expect(ids(sortTicketsByPrice(LIST))).toEqual(["B", "D", "A", "C"]);
    expect(ids(sortTicketsByPrice(LIST, "desc"))).toEqual(["C", "A", "D", "B"]);
  });

  it("filter hanya minimum", () => {
    expect(ids(filterTicketsByPrice(LIST, 1200000))).toEqual(["A", "C"]);
  });

  it("filter hanya maksimum", () => {
    expect(ids(filterTicketsByPrice(LIST, undefined, 1050000))).toEqual(["B", "D"]);
  });

  it("filter rentang minimum–maksimum", () => {
    expect(ids(filterTicketsByPrice(LIST, 950000, 1250000))).toEqual(["A", "D"]);
  });

  it("tanpa batas mengembalikan semua & nilai tidak valid diabaikan", () => {
    expect(ids(filterTicketsByPrice(LIST))).toEqual(["A", "B", "C", "D"]);
    expect(ids(filterTicketsByPrice(LIST, "abc", ""))).toEqual(["A", "B", "C", "D"]);
  });
});

describe("algoritma inti (algorithms.js)", () => {
  it("bubbleSort mengurutkan salinan dan menghitung metrik", () => {
    const nums = [5, 1, 4, 2];
    const { sorted, comparisons, swaps } = bubbleSort(nums, (a, b) => a - b);
    expect(sorted).toEqual([1, 2, 4, 5]);
    expect(nums).toEqual([5, 1, 4, 2]);
    expect(comparisons).toBeGreaterThan(0);
    expect(swaps).toBeGreaterThan(0);
  });

  it("linearSearch menelusuri seluruh elemen & menghitung stat", () => {
    const { results, stats } = linearSearch([1, 2, 3, 4], (x, s) => {
      s.comparisons += 1;
      return x % 2 === 0;
    });
    expect(results).toEqual([2, 4]);
    expect(stats.visited).toBe(4);
    expect(stats.found).toBe(2);
    expect(stats.comparisons).toBe(4);
  });

  it("getSortSpec jatuh ke price_asc untuk kunci tak dikenal", () => {
    expect(getSortSpec("price_asc").label).toBe("Harga termurah");
    expect(getSortSpec("tidak-ada").value).toBe("price_asc");
    expect(SORT_OPTIONS).toHaveLength(6);
  });

  it("durationToMinutes & minutesToDuration", () => {
    expect(durationToMinutes("1j 50m")).toBe(110);
    expect(durationToMinutes("45m")).toBe(45);
    expect(durationToMinutes(90)).toBe(90);
    // String tanpa pola "j"/"m" sama sekali -> 0 menit (perilaku modul).
    expect(durationToMinutes("rusak")).toBe(0);
    // Bukan string / string kosong -> Infinity (diurutkan paling akhir).
    expect(durationToMinutes("")).toBe(Number.POSITIVE_INFINITY);
    expect(durationToMinutes(null)).toBe(Number.POSITIVE_INFINITY);
    expect(minutesToDuration(110)).toBe("1j 50m");
    expect(minutesToDuration(45)).toBe("45m");
  });

  it("departureKey menyusun kunci kronologis", () => {
    expect(departureKey(ticket({ departureDate: "2026-10-28", departureTime: "06:00" }))).toBe("2026-10-28 06:00");
  });

  it("formatRupiah", () => {
    expect(formatRupiah(1450000)).toBe("Rp1.450.000");
    expect(formatRupiah("rusak")).toBe("Rp-");
  });
});
