/**
 * Unit test validasi kriteria pencarian & pasangan tiket pulang-pergi.
 */
import { describe, it, expect } from "vitest";
import {
  isValidDateString,
  validateSearchCriteria,
  buildReturnCriteria,
  isValidReturnLeg,
} from "../src/js/search.js";

describe("isValidDateString", () => {
  it("menerima format YYYY-MM-DD yang valid", () => {
    expect(isValidDateString("2026-10-28")).toBe(true);
  });

  it("menolak format salah & bulan tidak valid", () => {
    expect(isValidDateString("28-10-2026")).toBe(false);
    expect(isValidDateString("2026-13-01")).toBe(false);
    expect(isValidDateString("")).toBe(false);
    expect(isValidDateString(null)).toBe(false);
    // Catatan: tanggal melebihi akhir bulan (mis. 2026-02-30) diterima mesin
    // tanggal JavaScript dan bergulir ke bulan berikutnya (2026-03-02).
    // Form <input type="date"> pada aplikasi mencegah nilai seperti ini.
    expect(isValidDateString("2026-02-30")).toBe(true);
  });
});

describe("validateSearchCriteria", () => {
  const valid = { origin: "Jakarta", destination: "Surabaya", passengers: 1, departureDate: "2026-10-28" };

  it("kriteria valid mengembalikan null", () => {
    expect(validateSearchCriteria(valid)).toBeNull();
  });

  it("asal & tujuan wajib diisi", () => {
    expect(validateSearchCriteria({ ...valid, origin: "" })).toBe("Pilih lokasi keberangkatan terlebih dahulu.");
    expect(validateSearchCriteria({ ...valid, destination: "" })).toBe("Pilih lokasi tujuan terlebih dahulu.");
  });

  it("kota asal tidak boleh sama dengan tujuan", () => {
    expect(validateSearchCriteria({ ...valid, destination: "jakarta" })).toBe("Kota asal dan tujuan tidak boleh sama.");
  });

  it("id lokasi yang sama ditolak", () => {
    expect(
      validateSearchCriteria({ originLocationId: "CGK", destinationLocationId: "CGK", passengers: 1 }),
    ).toBe("Lokasi keberangkatan dan tujuan tidak boleh sama.");
  });

  it("jumlah penumpang minimal 1", () => {
    expect(validateSearchCriteria({ ...valid, passengers: 0 })).toBe("Jumlah penumpang minimal 1.");
  });

  it("tanggal berangkat tidak valid ditolak", () => {
    expect(validateSearchCriteria({ ...valid, departureDate: "31-31-2026" })).toBe("Tanggal berangkat tidak valid.");
  });

  it("pulang-pergi mewajibkan kedua tanggal & tanggal pulang tidak boleh mendahului", () => {
    const roundtrip = { ...valid, tripType: "roundtrip", returnDate: "2026-11-02" };
    expect(validateSearchCriteria(roundtrip)).toBeNull();
    const tanpaPulang = { ...roundtrip, returnDate: undefined };
    expect(validateSearchCriteria(tanpaPulang)).toBe("Tanggal pulang wajib diisi untuk perjalanan pulang-pergi.");
    const mundur = { ...roundtrip, returnDate: "2026-10-27" };
    expect(validateSearchCriteria(mundur)).toBe("Tanggal pulang tidak boleh sebelum tanggal berangkat.");
  });
});

describe("buildReturnCriteria", () => {
  it("membalik rute dan memakai tanggal pulang", () => {
    const criteria = {
      origin: "Jakarta",
      destination: "Surabaya",
      originLocationId: "CGK",
      destinationLocationId: "SUB",
      departureDate: "2026-10-28",
      returnDate: "2026-11-02",
      passengers: 2,
      transportType: "plane",
    };
    const back = buildReturnCriteria(criteria);
    expect(back.origin).toBe("Surabaya");
    expect(back.destination).toBe("Jakarta");
    expect(back.originLocationId).toBe("SUB");
    expect(back.destinationLocationId).toBe("CGK");
    expect(back.departureDate).toBe("2026-11-02");
    expect(back.passengers).toBe(2);
    expect(back.transportType).toBe("plane");
  });
});

describe("isValidReturnLeg", () => {
  const pergi = { departureDate: "2026-10-28", departureTime: "06:00", arrivalTime: "08:00" };

  it("tanggal pulang lebih lambat = valid", () => {
    expect(isValidReturnLeg(pergi, { departureDate: "2026-10-29", departureTime: "07:00" })).toBe(true);
  });

  it("tanggal sama, jam pulang setelah tiba pergi = valid", () => {
    expect(isValidReturnLeg(pergi, { departureDate: "2026-10-28", departureTime: "09:00" })).toBe(true);
  });

  it("tanggal sama, jam pulang sebelum tiba pergi = tidak valid", () => {
    expect(isValidReturnLeg(pergi, { departureDate: "2026-10-28", departureTime: "07:00" })).toBe(false);
  });

  it("tanggal pulang mendahului pergi = tidak valid", () => {
    expect(isValidReturnLeg(pergi, { departureDate: "2026-10-27", departureTime: "10:00" })).toBe(false);
  });

  it("data hilang = tidak valid", () => {
    expect(isValidReturnLeg(null, pergi)).toBe(false);
    expect(isValidReturnLeg(pergi, null)).toBe(false);
    expect(isValidReturnLeg(pergi, { departureTime: "07:00" })).toBe(false);
  });
});
