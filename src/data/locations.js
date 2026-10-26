/**
 * Tiketin-UTS — Data lokasi khusus transportasi (ES module).
 * Memisahkan bandara (pesawat), stasiun (kereta api), dan terminal (bus)
 * agar setiap tiket merujuk lokasi sesuai transportType-nya, bukan teks bebas.
 *
 * Aturan:
 * - id unik dengan prefix tipe ("airport-", "station-", "terminal-").
 * - "city" harus persis sama dengan name kota di src/data/cities.js yang
 *   menjadi rujukan tiket di src/data/tickets.js.
 * - iataCode hanya diisi bila kode IATA bandara sudah umum/diverifikasi.
 * - Nama, kode, dan rute adalah data SIMULASI untuk UTS Struktur Data.
 *   Aplikasi tidak terhubung ke sistem reservasi resmi mana pun.
 */

export const airports = [
  { id: "airport-cgk", name: "Bandara Internasional Soekarno-Hatta", city: "Jakarta", iataCode: "CGK" },
  { id: "airport-hlp", name: "Bandara Halim Perdanakusuma", city: "Jakarta", iataCode: "HLP" },
  { id: "airport-dps", name: "Bandara Internasional I Gusti Ngurah Rai", city: "Denpasar", iataCode: "DPS" },
  { id: "airport-kno", name: "Bandara Internasional Kualanamu", city: "Medan", iataCode: "KNO" },
  { id: "airport-sub", name: "Bandara Internasional Juanda", city: "Surabaya", iataCode: "SUB" },
  { id: "airport-upg", name: "Bandara Internasional Sultan Hasanuddin", city: "Makassar", iataCode: "UPG" },
  { id: "airport-sup", name: "Bandara Supadio", city: "Pontianak", iataCode: "SUP" },
  { id: "airport-yia", name: "Bandara Internasional Yogyakarta", city: "Yogyakarta", iataCode: "YIA" },
  { id: "airport-bpn", name: "Bandara Sultan Aji Muhammad Sulaiman", city: "Balikpapan", iataCode: "BPN" },
  { id: "airport-plm", name: "Bandara Sultan Mahmud Badaruddin II", city: "Palembang", iataCode: "PLM" },
];

export const stations = [
  { id: "station-gambir", name: "Stasiun Gambir", city: "Jakarta" },
  { id: "station-pasar-senen", name: "Stasiun Pasar Senen", city: "Jakarta" },
  { id: "station-bandung", name: "Stasiun Bandung", city: "Bandung" },
  { id: "station-yogyakarta", name: "Stasiun Yogyakarta", city: "Yogyakarta" },
  { id: "station-gubeng", name: "Stasiun Surabaya Gubeng", city: "Surabaya" },
  { id: "station-malang", name: "Stasiun Malang", city: "Malang" },
  { id: "station-semarang-tawang", name: "Stasiun Semarang Tawang", city: "Semarang" },
  { id: "station-solo-balapan", name: "Stasiun Solo Balapan", city: "Solo" },
  { id: "station-palembang", name: "Stasiun Palembang", city: "Palembang" },
];

export const busTerminals = [
  { id: "terminal-pulo-gebang", name: "Terminal Pulo Gebang", city: "Jakarta" },
  { id: "terminal-leuwipanjang", name: "Terminal Leuwipanjang", city: "Bandung" },
  { id: "terminal-bungurasih", name: "Terminal Bungurasih (Purabaya)", city: "Surabaya" },
  { id: "terminal-giwangan", name: "Terminal Giwangan", city: "Yogyakarta" },
  { id: "terminal-arjosari", name: "Terminal Arjosari", city: "Malang" },
  { id: "terminal-terboyo", name: "Terminal Terboyo", city: "Semarang" },
  { id: "terminal-pinang-baris", name: "Terminal Pinang Baris", city: "Medan" },
  { id: "terminal-trimulya", name: "Terminal Trimulya", city: "Padang" },
  { id: "terminal-rajabasa", name: "Terminal Rajabasa", city: "Bandar Lampung" },
];

/** Daftar lokasi per jenis transportasi. */
const LOCATION_ARRAYS = { plane: airports, train: stations, bus: busTerminals };

const ALL_LOCATIONS_BY_ID = new Map(
  [...airports, ...stations, ...busTerminals].map((loc) => [loc.id, loc]),
);

/** Daftar lokasi untuk satu jenis transportasi (array kosong bila tidak dikenal). */
export function locationsForTransport(transportType) {
  return LOCATION_ARRAYS[transportType] ?? [];
}

/** Cari satu lokasi berdasarkan id apa pun (null bila tidak ada). */
export function getLocationById(id) {
  if (typeof id !== "string" || id === "") return null;
  return ALL_LOCATIONS_BY_ID.get(id) ?? null;
}

/**
 * Resolve lokasi asal & tujuan milik sebuah tiket sesuai transportType-nya.
 * @returns {{originLocation: Object|null, destinationLocation: Object|null}}
 */
export function getLocationsForTicket(ticket) {
  const empty = { originLocation: null, destinationLocation: null };
  if (!ticket) return empty;
  const list = LOCATION_ARRAYS[ticket.transportType];
  if (!list) return empty;
  return {
    originLocation: list.find((loc) => loc.id === ticket.originLocationId) ?? null,
    destinationLocation: list.find((loc) => loc.id === ticket.destinationLocationId) ?? null,
  };
}

/** Label ringkas lokasi: "Bandara Internasional Soekarno-Hatta (CGK)". */
export function locationShortName(loc) {
  if (!loc) return "";
  return loc.iataCode ? `${loc.name} (${loc.iataCode})` : loc.name;
}

/** Label lengkap lokasi: "Jakarta — Bandara Internasional Soekarno-Hatta (CGK)". */
export function locationLabel(loc) {
  if (!loc) return "";
  return `${loc.city} — ${locationShortName(loc)}`;
}
