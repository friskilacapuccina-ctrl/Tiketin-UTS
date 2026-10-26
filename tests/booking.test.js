/**
 * Unit test logika pemesanan: penyimpanan pesanan (localStorage), perhitungan
 * total, kode pesanan, dan validasi data pemesanan.
 *
 * Catatan: modul booking.js membaca window.localStorage. Pada environment
 * Node (tanpa DOM), window disediakan lewat stub sederhana berikut sehingga
 * logika penyimpanan dapat diuji secara terpisah dari UI.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  STORAGE_KEY,
  readStoredOrders,
  writeStoredOrders,
  generateOrderCode,
  calculateTotal,
  validateBooking,
  createBooking,
  isValidEmail,
  isValidPhone,
  validatePassengerDetails,
} from "../src/js/booking.js";

/** localStorage palsu berbasis Map ( perilaku setItem/getItem sama ). */
function makeStorage() {
  const map = new Map();
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      map.set(k, String(v));
    },
  };
}

let storage;
beforeEach(() => {
  storage = makeStorage();
  globalThis.window = { localStorage: storage };
});

function planeTicket(overrides = {}) {
  return {
    id: "P1",
    transportType: "plane",
    operator: "Garuda Indonesia",
    origin: "Jakarta",
    destination: "Surabaya",
    departureDate: "2026-10-28",
    departureTime: "05:40",
    arrivalTime: "07:15",
    duration: "1j 35m",
    travelClass: "Ekonomi",
    price: 1050000,
    availableSeats: 24,
    ...overrides,
  };
}

/**
 * Fixture valid sesuai skema terbaru: pemesan kini menyertakan email
 * (field baru pada alur bertahap) — aturan lama yang lain tidak berubah.
 */
const validBooking = () => ({
  ticket: planeTicket(),
  passengers: 1,
  passengerNames: ["Budi Santoso"],
  contactName: "Budi Santoso",
  contactPhone: "081234567890",
  contactEmail: "budi@contoh.com",
});

describe("readStoredOrders / writeStoredOrders", () => {
  it("kunci penyimpanan sesuai kontrak UI", () => {
    expect(STORAGE_KEY).toBe("tiketin_orders");
  });

  it("mengembalikan [] bila tidak ada data", () => {
    expect(readStoredOrders()).toEqual([]);
  });

  it("roundtrip: ditulis lalu dibaca kembali", () => {
    const orders = [{ code: "JL-20261028-AAAA" }];
    expect(writeStoredOrders(orders)).toBe(true);
    expect(readStoredOrders()).toEqual(orders);
  });

  it("data rusak / bukan array / entri tanpa kode diabaikan", () => {
    storage.map.set(STORAGE_KEY, "{rusak");
    expect(readStoredOrders()).toEqual([]);
    storage.map.set(STORAGE_KEY, '{"code":"x"}');
    expect(readStoredOrders()).toEqual([]);
    storage.map.set(STORAGE_KEY, '[{"code":"JL-1"},{"tanpaKode":true},null]');
    expect(readStoredOrders()).toEqual([{ code: "JL-1" }]);
  });

  it("writeStoredOrders mengembalikan false bila storage melempar error", () => {
    globalThis.window = {
      localStorage: {
        getItem: () => null,
        setItem: () => {
          throw new Error("quota");
        },
      },
    };
    expect(writeStoredOrders([])).toBe(false);
  });
});

describe("generateOrderCode", () => {
  it("berformat JL-YYYYMMDD-XXXX", () => {
    expect(generateOrderCode()).toMatch(/^JL-\d{8}-[A-Z0-9]{4}$/);
  });
});

describe("calculateTotal", () => {
  it("harga per orang × jumlah penumpang", () => {
    expect(calculateTotal(planeTicket(), 2)).toBe(2100000);
  });

  it("menambah harga tiket pulang bila ada", () => {
    const back = planeTicket({ id: "P2", price: 500000 });
    expect(calculateTotal(planeTicket(), 1, back)).toBe(1550000);
  });

  it("input tidak valid menghasilkan NaN", () => {
    expect(Number.isNaN(calculateTotal(planeTicket(), 0))).toBe(true);
    expect(Number.isNaN(calculateTotal({ price: "abc" }, 1))).toBe(true);
  });
});

describe("validateBooking", () => {
  it("pemesanan pesawat yang valid mengembalikan []", () => {
    expect(validateBooking(validBooking())).toEqual([]);
  });

  it("tiket tidak valid ditolak", () => {
    const errors = validateBooking({ ...validBooking(), ticket: null });
    expect(errors).toContain("Tiket tidak valid.");
  });

  it("nama & kontak wajib memenuhi syarat", () => {
    expect(validateBooking({ ...validBooking(), passengers: 0 })).toContain("Jumlah penumpang minimal 1.");
    expect(validateBooking({ ...validBooking(), passengers: 2, passengerNames: ["Budi Santoso"] })).toContain(
      "Jumlah nama penumpang harus sama dengan jumlah penumpang.",
    );
    expect(validateBooking({ ...validBooking(), passengerNames: ["A"] })).toContain(
      "Setiap nama penumpang minimal 2 karakter.",
    );
    expect(validateBooking({ ...validBooking(), contactName: "" })).toContain("Nama pemesan minimal 2 karakter.");
    expect(validateBooking({ ...validBooking(), contactPhone: "12" })).toContain(
      "Nomor telepon tidak valid (8-16 digit).",
    );
  });

  it("email pemesan wajib ada & berformat benar", () => {
    expect(validateBooking({ ...validBooking(), contactEmail: undefined })).toContain(
      "Email pemesan tidak valid (contoh: nama@domain.com).",
    );
    expect(validateBooking({ ...validBooking(), contactEmail: "budi@" })).toContain(
      "Email pemesan tidak valid (contoh: nama@domain.com).",
    );
    expect(validateBooking({ ...validBooking(), contactEmail: "budi@contoh.com" })).toEqual([]);
  });

  it("jumlah penumpang melebihi kursi tersisa ditolak", () => {
    const errors = validateBooking({ ...validBooking(), passengers: 30, passengerNames: Array(30).fill("Penumpang Uji") });
    expect(errors.some((e) => e.includes("Kursi pergi tersisa hanya"))).toBe(true);
  });

  it("tiket pulang mendahului pergi ditolak", () => {
    const returnTicket = planeTicket({ id: "P2", departureDate: "2026-10-27" });
    const errors = validateBooking({ ...validBooking(), returnTicket });
    expect(errors).toContain("Jadwal pulang mendahului jadwal pergi.");
  });

  it("kereta api mewajibkan identitas 10–20 digit", () => {
    const train = planeTicket({ transportType: "train" });
    const base = { ...validBooking(), ticket: train };
    expect(validateBooking(base)).toContain("Jumlah identitas penumpang harus sama dengan jumlah penumpang.");
    expect(validateBooking({ ...base, passengerIdentities: ["123"] })).toContain("Setiap identitas harus 10-20 digit angka.");
    expect(validateBooking({ ...base, passengerIdentities: ["1234567890"] })).toEqual([]);
  });

  it("bus mewajibkan kursi valid, tidak ganda, dan belum terisi", () => {
    const bus = planeTicket({ transportType: "bus", capacity: 40, bookedSeats: ["1A"], availableSeats: 39 });
    const base = { ...validBooking(), ticket: bus };
    expect(validateBooking(base).some((e) => e.includes("Jumlah kursi"))).toBe(true);
    // Kursi ganda diuji dengan jumlah penumpang & nama yang sudah cocok (2 orang).
    const dua = { ...base, passengers: 2, passengerNames: ["Budi Santoso", "Anak Uji"] };
    expect(validateBooking({ ...dua, selectedSeats: ["2B", "2B"] })).toContain("Terdapat kursi terpilih ganda.");
    expect(validateBooking({ ...dua, selectedSeats: ["1A", "3C"] })).toContain("Ada kursi terpilih yang sudah terisi.");
    expect(validateBooking({ ...dua, selectedSeats: ["1Z", "3C"] })).toContain("Nomor kursi tidak valid.");
    expect(validateBooking({ ...dua, selectedSeats: ["2B", "3C"] })).toEqual([]);
  });
});

describe("isValidEmail / isValidPhone", () => {
  it("email: menerima format wajar, menolak yang salah", () => {
    expect(isValidEmail("budi@contoh.com")).toBe(true);
    expect(isValidEmail("  budi@contoh.co.id ")).toBe(true);
    expect(isValidEmail("budi@")).toBe(false);
    expect(isValidEmail("budi @contoh.com")).toBe(false);
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
  });

  it("telepon: 8-16 karakter angka/spasi/tanda + dan -", () => {
    expect(isValidPhone("081234567890")).toBe(true);
    expect(isValidPhone("+62 81234567890")).toBe(true);
    expect(isValidPhone("12")).toBe(false);
    expect(isValidPhone("081234567890123456")).toBe(false);
    expect(isValidPhone(undefined)).toBe(false);
  });
});

describe("validatePassengerDetails", () => {
  const detail = (overrides = {}) => ({
    name: "Budi Santoso",
    category: "adult",
    birthDate: "1990-03-12",
    gender: "male",
    identityType: "ktp",
    identityNumber: "3273012345670001",
    ...overrides,
  });

  it("data tidak dikirim (skema lama) dianggap valid", () => {
    expect(validatePassengerDetails(undefined, 1, "plane")).toEqual([]);
    expect(validatePassengerDetails(null, 1, "bus")).toEqual([]);
  });

  it("bukan array atau jumlah tidak cocok ditolak", () => {
    expect(validatePassengerDetails("salah", 1)).toContain("Data penumpang tidak valid.");
    expect(validatePassengerDetails([detail()], 2)).toContain(
      "Jumlah data penumpang harus sama dengan jumlah penumpang.",
    );
  });

  it("data lengkap valid untuk pesawat", () => {
    expect(validatePassengerDetails([detail()], 1, "plane")).toEqual([]);
  });

  it("nama, kategori, dan tanggal lahir divalidasi", () => {
    expect(validatePassengerDetails([detail({ name: "A" })], 1)).toContain("Nama penumpang 1 minimal 2 karakter.");
    expect(validatePassengerDetails([detail({ category: "senior" })], 1)).toContain(
      "Kategori penumpang 1 tidak valid.",
    );
    expect(validatePassengerDetails([detail({ birthDate: "" })], 1)).toContain(
      "Tanggal lahir penumpang 1 wajib diisi.",
    );
    expect(validatePassengerDetails([detail({ birthDate: "12-03-1990" })], 1)).toContain(
      "Tanggal lahir penumpang 1 tidak valid.",
    );
    expect(validatePassengerDetails([detail({ birthDate: "2999-01-01" })], 1)).toContain(
      "Tanggal lahir penumpang 1 tidak boleh melewati hari ini.",
    );
  });

  it("jenis kelamin & jenis identitas divalidasi bila diisi", () => {
    expect(validatePassengerDetails([detail({ gender: "lain" })], 1)).toContain(
      "Jenis kelamin penumpang 1 tidak valid.",
    );
    expect(validatePassengerDetails([detail({ identityType: "kartu" })], 1)).toContain(
      "Jenis identitas penumpang 1 tidak dikenal.",
    );
    // Opsional pada pesawat: kosong diperbolehkan
    expect(
      validatePassengerDetails([detail({ gender: "", identityType: "", identityNumber: "" })], 1, "plane"),
    ).toEqual([]);
  });

  it("kereta mewajibkan jenis identitas tiap penumpang", () => {
    expect(validatePassengerDetails([detail({ identityType: "" })], 1, "train")).toContain(
      "Pilih jenis identitas untuk penumpang 1.",
    );
    expect(validatePassengerDetails([detail()], 1, "train")).toEqual([]);
  });

  it("nomor identitas pesawat yang diisi harus berformat wajar", () => {
    expect(validatePassengerDetails([detail({ identityNumber: "ab" })], 1, "plane")).toContain(
      "Nomor identitas penumpang 1 tidak valid.",
    );
  });
});

describe("createBooking", () => {
  it("membuat pesanan valid & menyimpannya ke storage", () => {
    const { ok, order, errors } = createBooking(validBooking());
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
    expect(order.code).toMatch(/^JL-\d{8}-[A-Z0-9]{4}$/);
    expect(order.passengers).toBe(1);
    expect(order.unitPrice).toBe(1050000);
    expect(order.roundTrip).toBe(false);
    expect(readStoredOrders()).toHaveLength(1);
    expect(readStoredOrders()[0].code).toBe(order.code);
  });

  it("pemesanan tidak valid tidak disimpan", () => {
    const { ok } = createBooking({ ...validBooking(), ticket: null });
    expect(ok).toBe(false);
    expect(readStoredOrders()).toEqual([]);
  });

  it("menyimpan email, data rinci penumpang, & info tambahan (privasi identitas)", () => {
    const { ok, errors } = createBooking({
      ...validBooking(),
      passengerDetails: [
        {
          name: "Budi Santoso",
          category: "adult",
          birthDate: "1990-03-12",
          gender: "male",
          identityType: "ktp",
          identityNumber: "3273012345670001",
        },
      ],
      specialRequest: "Kursi dekat lorong bila memungkinkan",
      travelNotes: "Naik dari pintu 2",
    });
    expect(ok).toBe(true);
    expect(errors).toEqual([]);

    const stored = readStoredOrders()[0];
    expect(stored.contactEmail).toBe("budi@contoh.com");
    expect(stored.passengerDetails).toHaveLength(1);
    expect(stored.passengerDetails[0].name).toBe("Budi Santoso");
    expect(stored.passengerDetails[0].category).toBe("adult");
    expect(stored.passengerDetails[0].identityType).toBe("ktp");
    // Privasi: nomor identitas TIDAK ikut tersimpan pada data rinci
    expect(stored.passengerDetails[0].identityNumber).toBeUndefined();
    expect(stored.specialRequest).toBe("Kursi dekat lorong bila memungkinkan");
    expect(stored.travelNotes).toBe("Naik dari pintu 2");
  });
});
