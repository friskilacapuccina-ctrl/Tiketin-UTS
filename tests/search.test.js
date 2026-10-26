/**
 * Unit test pencarian tiket (Linear Search) dengan DATA UJI TERKONTROL.
 * Sumber data berupa array buatan sendiri — bukan data produksi — agar
 * hasil tes konsisten dan tidak bergantung pada src/data/tickets.js.
 */
import { describe, it, expect } from "vitest";
import {
  searchTicketsWithLog,
  searchTickets,
  findAvailableDates,
  sortDatesByProximity,
  TRANSPORT_TYPES,
  TRANSPORT_LABELS,
} from "../src/js/search.js";

/** Membuat objek tiket uji dengan field minimum yang dipakai pencarian. */
function ticket(overrides = {}) {
  return {
    id: "T1",
    transportType: "plane",
    origin: "Jakarta",
    destination: "Surabaya",
    departureDate: "2026-10-28",
    departureTime: "06:00",
    travelClass: "Ekonomi",
    price: 1000000,
    duration: "2j 00m",
    availableSeats: 40,
    ...overrides,
  };
}

const SOURCE = [
  ticket({ id: "P1" }),
  ticket({ id: "P2", departureTime: "19:00", price: 1450000 }),
  ticket({ id: "TR1", transportType: "train", duration: "9j 30m", price: 450000 }),
  ticket({ id: "B1", transportType: "bus", travelClass: "Eksekutif", duration: "12j 00m", price: 320000 }),
  ticket({ id: "P3", departureDate: "2026-10-29", price: 1100000 }),
];

const ids = (list) => list.map((t) => t.id);

describe("searchTicketsWithLog — penyaringan kriteria", () => {
  it("menyaring berdasarkan jenis transportasi", () => {
    const { results } = searchTicketsWithLog(
      { origin: "Jakarta", destination: "Surabaya", transportType: "train", passengers: 1 },
      SOURCE,
    );
    expect(ids(results)).toEqual(["TR1"]);
  });

  it("mengabaikan transportType yang tidak valid (semua jenis dicocokkan)", () => {
    const { results } = searchTicketsWithLog(
      { origin: "Jakarta", destination: "Surabaya", transportType: "ferry", passengers: 1 },
      SOURCE,
    );
    expect(ids(results)).toEqual(["P1", "P2", "TR1", "B1", "P3"]);
  });

  it("mencocokkan kota tanpa memperhatikan huruf besar/kecil & spasi", () => {
    const { results } = searchTicketsWithLog(
      { origin: "  jakarta ", destination: "SURABAYA", passengers: 1 },
      SOURCE,
    );
    expect(ids(results)).toEqual(["P1", "P2", "TR1", "B1", "P3"]);
  });

  it("menyaring berdasarkan tanggal keberangkatan", () => {
    const { results } = searchTicketsWithLog(
      { origin: "Jakarta", destination: "Surabaya", departureDate: "2026-10-29", passengers: 1 },
      SOURCE,
    );
    expect(ids(results)).toEqual(["P3"]);
  });

  it("menyaring berdasarkan kelas layanan", () => {
    const { results } = searchTicketsWithLog(
      { origin: "Jakarta", destination: "Surabaya", travelClass: "Eksekutif", passengers: 1 },
      SOURCE,
    );
    expect(ids(results)).toEqual(["B1"]);
  });

  it("mengabaikan tiket yang kursinya kurang dari jumlah penumpang", () => {
    const source = [ticket({ id: "S1", availableSeats: 1 }), ticket({ id: "S2", availableSeats: 5 })];
    const { results } = searchTicketsWithLog(
      { origin: "Jakarta", destination: "Surabaya", passengers: 2 },
      source,
    );
    expect(ids(results)).toEqual(["S2"]);
  });

  it("mengabaikan tiket dengan harga tidak valid", () => {
    const source = [ticket({ id: "H1", price: "abc" }), ticket({ id: "H2", price: -5 }), ticket({ id: "H3" })];
    const { results } = searchTicketsWithLog(
      { origin: "Jakarta", destination: "Surabaya", passengers: 1 },
      source,
    );
    expect(ids(results)).toEqual(["H3"]);
  });

  it("menolak pencarian dengan kota asal = tujuan", () => {
    const { results, log } = searchTicketsWithLog(
      { origin: "Jakarta", destination: "jakarta", passengers: 1 },
      SOURCE,
    );
    expect(results).toEqual([]);
    expect(log.summary).toContain("dihentikan");
  });

  it("mencocokkan berdasarkan id lokasi (bandara/stasiun/terminal)", () => {
    const source = [
      ticket({ id: "L1", originLocationId: "CGK", destinationLocationId: "SUB" }),
      ticket({ id: "L2", originLocationId: "SUB", destinationLocationId: "CGK" }),
    ];
    const { results } = searchTicketsWithLog(
      { originLocationId: "CGK", destinationLocationId: "SUB", passengers: 1 },
      source,
    );
    expect(ids(results)).toEqual(["L1"]);
  });

  it("mengembalikan log Linear Search dengan angka eksekusi nyata", () => {
    const { results, log } = searchTicketsWithLog(
      { origin: "Jakarta", destination: "Surabaya", transportType: "plane", passengers: 1 },
      SOURCE,
    );
    expect(log.method).toBe("Linear Search");
    expect(log.dataCount).toBe(SOURCE.length);
    expect(log.visited).toBe(SOURCE.length);
    expect(log.found).toBe(results.length);
    expect(log.comparisons).toBeGreaterThan(0);
  });

  it("merangkum tanggal alternatif pada log saat hasil 0", () => {
    const { results, log } = searchTicketsWithLog(
      { origin: "Jakarta", destination: "Surabaya", departureDate: "2026-11-15", passengers: 1 },
      SOURCE,
    );
    expect(results).toEqual([]);
    expect(log.summary).toContain("jadwal pada tanggal");
  });
});

describe("searchTickets (wrapper)", () => {
  it("mengembalikan array hasil yang sama dengan searchTicketsWithLog().results", () => {
    const criteria = { origin: "Jakarta", destination: "Surabaya", passengers: 1 };
    expect(ids(searchTickets(criteria, SOURCE))).toEqual(ids(searchTicketsWithLog(criteria, SOURCE).results));
  });

  it("sumber data terkontrol tidak pernah diubah oleh pencarian", () => {
    const before = JSON.stringify(SOURCE);
    searchTickets({ origin: "Jakarta", destination: "Surabaya", passengers: 1 }, SOURCE);
    expect(JSON.stringify(SOURCE)).toBe(before);
  });
});

describe("findAvailableDates", () => {
  it("mengembalikan tanggal unik terurut menaik tanpa memperhatikan filter tanggal", () => {
    const dates = findAvailableDates({ origin: "Jakarta", destination: "Surabaya" }, SOURCE);
    expect(dates).toEqual(["2026-10-28", "2026-10-29"]);
  });

  it("menghormati filter jenis transportasi", () => {
    const source = [
      ticket({ departureDate: "2026-10-21" }),
      ticket({ id: "TR", transportType: "train", departureDate: "2026-10-22" }),
    ];
    const dates = findAvailableDates({ origin: "Jakarta", destination: "Surabaya", transportType: "train" }, source);
    expect(dates).toEqual(["2026-10-22"]);
  });
});

describe("sortDatesByProximity", () => {
  it("mengurutkan berdasarkan kedekatan dengan tanggal pilihan", () => {
    // Jarak: 22 Okt = 1 hari, 21 Okt = 2 hari, 28 Okt = 5 hari dari 23 Okt.
    const dates = ["2026-10-21", "2026-10-28", "2026-10-22"];
    expect(sortDatesByProximity(dates, "2026-10-23")).toEqual(["2026-10-22", "2026-10-21", "2026-10-28"]);
  });

  it("mempertahankan urutan asli bila tanggal pilihan tidak valid", () => {
    const dates = ["2026-10-28", "2026-10-21"];
    expect(sortDatesByProximity(dates, "bukan-tanggal")).toEqual(["2026-10-28", "2026-10-21"]);
  });
});

describe("konstanta transportasi", () => {
  it("memuat tipe & label yang konsisten", () => {
    expect(TRANSPORT_TYPES).toEqual(["plane", "train", "bus"]);
    expect(TRANSPORT_LABELS.plane).toBe("Pesawat");
  });
});
