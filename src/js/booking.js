/**
 * Tiketin-UTS — Alur pemesanan simulasi (ES module).
 * Menerima tiket terpilih (pergi, dan opsional pulang), memvalidasi data
 * penumpang sesuai jenis transportasi, menghitung total, membuat kode pesanan
 * unik, dan menyimpan ke localStorage.
 *
 * Skema pesanan (localStorage kunci STORAGE_KEY) — SUPERSET dari skema lama,
 * sehingga pesanan lama tetap tampil:
 * {
 *   code, ticketId, operator, transportType, origin, destination,
 *   originLocationId, destinationLocationId, originLocationName, destinationLocationName,
 *   departureDate, departureTime, arrivalTime, duration, travelClass,
 *   flightNo, baggageKg, stops,              // pesawat (bila ada)
 *   facilities,                              // bus (bila ada)
 *   unitPrice, passengers, passengerNames, totalPrice,
 *   adults, children,                        // pesawat/kereta (bila ada)
 *   passengerIdentities,                     // kereta (bila ada, array string)
 *   selectedSeats, capacity,                 // bus (bila ada)
 *   contactName, contactPhone, contactEmail,  // kontak pemesan (kini ikut tersimpan)
 *   passengerDetails,                         // data rinci per penumpang (baru)
 *   specialRequest, travelNotes,              // informasi tambahan opsional (baru)
 *   roundTrip, returnLeg, returnUnitPrice,   // pulang-pergi (bila ada)
 *   status: "confirmed" | "cancelled", createdAt: ISO string
 * }
 * Tidak ada data pembayaran sensitif yang disimpan.
 */

import { getLocationsForTicket, locationShortName } from "../data/locations.js";

export const STORAGE_KEY = "tiketin_orders";

/** Validasi & pembacaan localStorage yang aman (null jika tidak tersedia/rusak). */
export function readStoredOrders() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((o) => o && typeof o === "object" && typeof o.code === "string");
  } catch {
    return [];
  }
}

/** Menyimpan daftar pesanan. Mengembalikan true bila berhasil. */
export function writeStoredOrders(orders) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    return true;
  } catch {
    return false;
  }
}

/** Membuat kode pesanan unik, contoh "JL-20261021-8F3K". */
export function generateOrderCode() {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const randPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `JL-${datePart}-${randPart}`;
}

/** Menghitung total harga: (harga pergi + harga pulang opsional) × penumpang. */
export function calculateTotal(ticket, passengers, returnTicket = null) {
  const count = Math.floor(Number(passengers));
  const price = Number(ticket?.price);
  const returnPrice = returnTicket ? Number(returnTicket.price) : 0;
  if (!Number.isFinite(count) || count < 1) return NaN;
  if (!Number.isFinite(price) || price < 0) return NaN;
  if (!Number.isFinite(returnPrice) || returnPrice < 0) return NaN;
  return (price + returnPrice) * count;
}

/** Format tanggal tidak valid -> null; valid -> string asli. */
function validDateOrNull(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return Number.isNaN(new Date(`${value}T00:00:00`).getTime()) ? null : value;
}

/** Validasi email sederhana: tanpa spasi, punya domain bertitik. */
export function isValidEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** Validasi telepon: 8-16 karakter, angka/spasi/tanda + dan -. */
export function isValidPhone(value) {
  return typeof value === "string" && /^[0-9+\-\s]{8,16}$/.test(value.trim());
}

/** Nilai enum jenis kelamin & jenis identitas yang dikenali form. */
export const GENDER_VALUES = ["male", "female"];
export const IDENTITY_TYPE_VALUES = ["ktp", "sim", "passport", "kitas", "other"];

/**
 * Memvalidasi data rinci setiap penumpang (opsional — bila UI mengirimkannya).
 * Aturan identitas transportasi TIDAK berubah: nomor identitas kereta diverifikasi
 * lewat passengerIdentities (10-20 digit); untuk pesawat/bus nomor identitas
 * opsional dan hanya diformat bila diisi.
 * @param {Object[]|undefined} details - [{name, category, birthDate, gender, identityType, identityNumber}]
 * @param {number} count - Jumlah penumpang.
 * @param {string} [transportType] - Jenis transportasi tiket.
 * @returns {string[]} Daftar pesan error (kosong = valid).
 */
export function validatePassengerDetails(details, count, transportType) {
  const errors = [];
  if (details === undefined || details === null) return errors; // skema lama tanpa data rinci
  if (!Array.isArray(details)) {
    errors.push("Data penumpang tidak valid.");
    return errors;
  }
  if (details.length !== count) {
    errors.push("Jumlah data penumpang harus sama dengan jumlah penumpang.");
    return errors;
  }

  const needsIdentity = transportType === "train";
  const now = new Date();
  const todayIso = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  details.forEach((detail, index) => {
    const who = `penumpang ${index + 1}`;
    if (!detail || typeof detail !== "object") {
      errors.push(`Data ${who} tidak lengkap.`);
      return;
    }
    if (typeof detail.name !== "string" || detail.name.trim().length < 2) {
      errors.push(`Nama ${who} minimal 2 karakter.`);
    }
    if (detail.category !== "adult" && detail.category !== "child") {
      errors.push(`Kategori ${who} tidak valid.`);
    }
    if (detail.birthDate === undefined || detail.birthDate === null || detail.birthDate === "") {
      errors.push(`Tanggal lahir ${who} wajib diisi.`);
    } else if (!validDateOrNull(detail.birthDate)) {
      errors.push(`Tanggal lahir ${who} tidak valid.`);
    } else if (detail.birthDate > todayIso) {
      errors.push(`Tanggal lahir ${who} tidak boleh melewati hari ini.`);
    }
    if (detail.gender && !GENDER_VALUES.includes(detail.gender)) {
      errors.push(`Jenis kelamin ${who} tidak valid.`);
    }
    if (needsIdentity && !IDENTITY_TYPE_VALUES.includes(detail.identityType)) {
      errors.push(`Pilih jenis identitas untuk ${who}.`);
    } else if (detail.identityType && !IDENTITY_TYPE_VALUES.includes(detail.identityType)) {
      errors.push(`Jenis identitas ${who} tidak dikenal.`);
    }
    if (!needsIdentity && typeof detail.identityNumber === "string" && detail.identityNumber.trim() !== "") {
      if (!/^[0-9A-Za-z.\- ]{5,25}$/.test(detail.identityNumber.trim())) {
        errors.push(`Nomor identitas ${who} tidak valid.`);
      }
    }
  });
  return errors;
}

/**
 * Memvalidasi data pemesanan.
 * @param {Object} params
 * @param {Object} params.ticket - Tiket pergi terpilih.
 * @param {Object|null} [params.returnTicket] - Tiket pulang (pulang-pergi).
 * @param {number} params.passengers - Jumlah penumpang total.
 * @param {string[]} params.passengerNames - Nama setiap penumpang.
 * @param {string} [params.contactName] - Nama pemesan.
 * @param {string} [params.contactPhone] - Nomor telepon pemesan.
 * @param {string} [params.contactEmail] - Email pemesan (konfirmasi simulasi).
 * @param {Object[]} [params.passengerDetails] - Data rinci per penumpang (lihat validatePassengerDetails).
 * @param {string[]} [params.passengerIdentities] - No. identitas (kereta, simulasi).
 * @param {string[]} [params.selectedSeats] - Kursi terpilih (bus, dari peta kursi data).
 * @returns {string[]} Daftar pesan error (kosong = valid).
 */
export function validateBooking({
  ticket,
  returnTicket = null,
  passengers,
  passengerNames,
  contactName,
  contactPhone,
  contactEmail,
  passengerDetails,
  passengerIdentities,
  selectedSeats,
}) {
  const errors = [];
  const count = Math.floor(Number(passengers));

  if (!ticket || typeof ticket !== "object" || !ticket.id) {
    errors.push("Tiket tidak valid.");
    return errors;
  }
  if (!Number.isFinite(count) || count < 1) {
    errors.push("Jumlah penumpang minimal 1.");
  }
  if (!Array.isArray(passengerNames) || passengerNames.length !== count) {
    errors.push("Jumlah nama penumpang harus sama dengan jumlah penumpang.");
  } else if (passengerNames.some((n) => typeof n !== "string" || n.trim().length < 2)) {
    errors.push("Setiap nama penumpang minimal 2 karakter.");
  }
  if (typeof contactName !== "string" || contactName.trim().length < 2) {
    errors.push("Nama pemesan minimal 2 karakter.");
  }
  if (!isValidEmail(contactEmail)) {
    errors.push("Email pemesan tidak valid (contoh: nama@domain.com).");
  }
  if (!isValidPhone(contactPhone)) {
    errors.push("Nomor telepon tidak valid (8-16 digit).");
  }

  // Data rinci penumpang (bila dikirim — divalidasi per penumpang)
  if (Number.isFinite(count)) {
    errors.push(...validatePassengerDetails(passengerDetails, count, ticket?.transportType));
  }

  // Ketersediaan kursi (pergi & pulang)
  if (Number.isFinite(count) && count > Number(ticket.availableSeats)) {
    errors.push(`Kursi pergi tersisa hanya ${ticket.availableSeats}.`);
  }
  if (returnTicket) {
    if (typeof returnTicket !== "object" || !returnTicket.id) {
      errors.push("Tiket pulang tidak valid.");
    } else if (Number.isFinite(count) && count > Number(returnTicket.availableSeats)) {
      errors.push(`Kursi pulang tersisa hanya ${returnTicket.availableSeats}.`);
    }
  }

  // Tanggal perjalanan (bila tersedia pada data)
  const outDate = validDateOrNull(ticket.departureDate);
  if (ticket.departureDate && !outDate) {
    errors.push("Tanggal keberangkatan tiket tidak valid.");
  }
  if (returnTicket && typeof returnTicket === "object") {
    const retDate = validDateOrNull(returnTicket.departureDate);
    if (returnTicket.departureDate && !retDate) {
      errors.push("Tanggal pulang tiket tidak valid.");
    } else if (outDate && retDate && retDate < outDate) {
      errors.push("Jadwal pulang mendahului jadwal pergi.");
    }
  }

  // Identitas penumpang (kereta api — simulasi)
  if (ticket.transportType === "train") {
    if (!Array.isArray(passengerIdentities) || passengerIdentities.length !== count) {
      errors.push("Jumlah identitas penumpang harus sama dengan jumlah penumpang.");
    } else if (passengerIdentities.some((id) => typeof id !== "string" || !/^[0-9]{10,20}$/.test(id.trim()))) {
      errors.push("Setiap identitas harus 10-20 digit angka.");
    }
  }

  // Pemilihan kursi (bus — bila data kursi tersedia)
  if (ticket.transportType === "bus" && Number.isInteger(Number(ticket.capacity))) {
    const booked = Array.isArray(ticket.bookedSeats) ? ticket.bookedSeats : [];
    if (!Array.isArray(selectedSeats) || selectedSeats.length !== count) {
      errors.push(`Jumlah kursi harus sama dengan jumlah penumpang (${count}).`);
    } else if (new Set(selectedSeats).size !== selectedSeats.length) {
      errors.push("Terdapat kursi terpilih ganda.");
    } else if (selectedSeats.some((s) => booked.includes(s))) {
      errors.push("Ada kursi terpilih yang sudah terisi.");
    } else if (selectedSeats.some((s) => !/^[0-9]{1,2}[A-D]$/.test(String(s)))) {
      errors.push("Nomor kursi tidak valid.");
    }
  }

  return errors;
}

/** Snapshot label lokasi sebuah tiket untuk disimpan pada pesanan. */
function locationNamesFor(ticket) {
  const { originLocation, destinationLocation } = getLocationsForTicket(ticket);
  return {
    originLocationId: ticket.originLocationId ?? null,
    destinationLocationId: ticket.destinationLocationId ?? null,
    originLocationName: locationShortName(originLocation) || null,
    destinationLocationName: locationShortName(destinationLocation) || null,
  };
}

/** Membuat & menyimpan pesanan simulasi. */
/**
 * @param {Object} params - Lihat validateBooking.
 * @returns {{ok: boolean, order?: Object, errors: string[]}}
 */
export function createBooking({
  ticket,
  returnTicket = null,
  passengers,
  passengerNames,
  contactName,
  contactPhone,
  contactEmail,
  passengerDetails,
  passengersAdults,
  passengersChildren,
  passengerIdentities,
  selectedSeats,
  specialRequest,
  travelNotes,
}) {
  const errors = validateBooking({
    ticket,
    returnTicket,
    passengers,
    passengerNames,
    contactName,
    contactPhone,
    contactEmail,
    passengerDetails,
    passengerIdentities,
    selectedSeats,
  });
  if (errors.length > 0) return { ok: false, errors };

  const count = Math.floor(Number(passengers));
  const locNames = locationNamesFor(ticket);
  const returnUnitPrice = returnTicket ? Number(returnTicket.price) : 0;

  const order = {
    code: generateOrderCode(),
    ticketId: ticket.id,
    operator: ticket.operator,
    transportType: ticket.transportType,
    origin: ticket.origin,
    destination: ticket.destination,
    ...locNames,
    departureDate: ticket.departureDate,
    departureTime: ticket.departureTime,
    arrivalTime: ticket.arrivalTime,
    duration: ticket.duration,
    travelClass: ticket.travelClass,
    flightNo: ticket.flightNo ?? null,
    baggageKg: Number.isFinite(Number(ticket.baggageKg)) ? Number(ticket.baggageKg) : null,
    stops: Number.isInteger(ticket.stops) ? ticket.stops : null,
    facilities: Array.isArray(ticket.facilities) ? [...ticket.facilities] : null,
    unitPrice: Number(ticket.price),
    returnUnitPrice,
    passengers: count,
    passengerNames: passengerNames.map((n) => n.trim()),
    adults: Number.isFinite(Number(passengersAdults)) ? Number(passengersAdults) : count,
    children: Number.isFinite(Number(passengersChildren)) ? Number(passengersChildren) : 0,
    passengerIdentities: Array.isArray(passengerIdentities) ? passengerIdentities.map((id) => id.trim()) : null,
    selectedSeats: Array.isArray(selectedSeats) && selectedSeats.length > 0 ? [...selectedSeats] : null,
    capacity: Number.isInteger(Number(ticket.capacity)) ? Number(ticket.capacity) : null,
    // Kontak & data rinci (skema baru; pesanan lama tanpa field ini tetap tampil)
    contactName: typeof contactName === "string" && contactName.trim() ? contactName.trim() : null,
    contactPhone: typeof contactPhone === "string" && contactPhone.trim() ? contactPhone.trim() : null,
    contactEmail: typeof contactEmail === "string" && contactEmail.trim() ? contactEmail.trim() : null,
    passengerDetails: Array.isArray(passengerDetails)
      ? passengerDetails.map((d) => ({
          name: String(d?.name ?? "").trim(),
          category: d?.category === "child" ? "child" : "adult",
          birthDate: typeof d?.birthDate === "string" ? d.birthDate : "",
          gender: GENDER_VALUES.includes(d?.gender) ? d.gender : null,
          identityType: IDENTITY_TYPE_VALUES.includes(d?.identityType) ? d.identityType : null,
          // Nomor identitas TIDAK disimpan di sini (privasi); nomor kereta tetap
          // tersimpan pada passengerIdentities sesuai skema lama.
        }))
      : null,
    specialRequest: typeof specialRequest === "string" && specialRequest.trim() ? specialRequest.trim().slice(0, 300) : null,
    travelNotes: typeof travelNotes === "string" && travelNotes.trim() ? travelNotes.trim().slice(0, 300) : null,
    roundTrip: Boolean(returnTicket),
    returnLeg: returnTicket
      ? {
          ticketId: returnTicket.id,
          operator: returnTicket.operator,
          transportType: returnTicket.transportType,
          origin: returnTicket.origin,
          destination: returnTicket.destination,
          ...locationNamesFor(returnTicket),
          departureDate: returnTicket.departureDate,
          departureTime: returnTicket.departureTime,
          arrivalTime: returnTicket.arrivalTime,
          duration: returnTicket.duration,
          travelClass: returnTicket.travelClass,
          flightNo: returnTicket.flightNo ?? null,
          price: Number(returnTicket.price),
        }
      : null,
    totalPrice: calculateTotal(ticket, count, returnTicket),
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };

  const orders = readStoredOrders();
  orders.unshift(order);
  const saved = writeStoredOrders(orders);

  if (!saved) {
    return { ok: false, errors: ["Gagal menyimpan pesanan ke penyimpanan browser."] };
  }
  return { ok: true, order, errors: [] };
}

export default createBooking;
