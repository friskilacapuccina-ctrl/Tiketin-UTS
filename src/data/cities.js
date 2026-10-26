/**
 * Tiketin-UTS — Data kota di Indonesia (dummy)
 * Digunakan untuk pemesanan tiket pesawat, kereta api, dan bus.
 * Format: ES module.
 *
 * Nilai transportTypes konsisten menggunakan:
 *   - "plane"  (pesawat)
 *   - "train"  (kereta api)
 *   - "bus"    (bus / antar kota)
 *
 * "train" HANYA diberikan pada kota yang benar-benar punya jaringan
 * kereta antarkota yang relevan (Jawa, Sumatera, dan beberapa titik lain).
 * Nama kota yang dipakai di src/data/tickets.js dipertahankan persis agar
 * referensi origin/destination tidak putus.
 */

export const cities = [
  // ================= JAWA =================
  { id: "city-jakarta", name: "Jakarta", province: "DKI Jakarta", transportTypes: ["plane", "train", "bus"] },
  { id: "city-bandung", name: "Bandung", province: "Jawa Barat", transportTypes: ["plane", "train", "bus"] },
  { id: "city-bogor", name: "Bogor", province: "Jawa Barat", transportTypes: ["train", "bus"] },
  { id: "city-cirebon", name: "Cirebon", province: "Jawa Barat", transportTypes: ["train", "bus"] },
  { id: "city-bekasi", name: "Bekasi", province: "Jawa Barat", transportTypes: ["train", "bus"] },
  { id: "city-depok", name: "Depok", province: "Jawa Barat", transportTypes: ["train", "bus"] },
  { id: "city-semarang", name: "Semarang", province: "Jawa Tengah", transportTypes: ["plane", "train", "bus"] },
  { id: "city-solo", name: "Solo", province: "Jawa Tengah", transportTypes: ["plane", "train", "bus"] },
  { id: "city-yogyakarta", name: "Yogyakarta", province: "DI Yogyakarta", transportTypes: ["plane", "train", "bus"] },
  { id: "city-surabaya", name: "Surabaya", province: "Jawa Timur", transportTypes: ["plane", "train", "bus"] },
  { id: "city-malang", name: "Malang", province: "Jawa Timur", transportTypes: ["plane", "train", "bus"] },
  { id: "city-madiun", name: "Madiun", province: "Jawa Timur", transportTypes: ["train", "bus"] },
  { id: "city-kediri", name: "Kediri", province: "Jawa Timur", transportTypes: ["train", "bus"] },
  { id: "city-jember", name: "Jember", province: "Jawa Timur", transportTypes: ["train", "bus"] },
  { id: "city-tegal", name: "Tegal", province: "Jawa Tengah", transportTypes: ["train", "bus"] },
  { id: "city-purwokerto", name: "Purwokerto", province: "Jawa Tengah", transportTypes: ["train", "bus"] },

  // ================= SUMATERA =================
  { id: "city-medan", name: "Medan", province: "Sumatera Utara", transportTypes: ["plane", "train", "bus"] },
  { id: "city-padang", name: "Padang", province: "Sumatera Barat", transportTypes: ["plane", "train", "bus"] },
  { id: "city-palembang", name: "Palembang", province: "Sumatera Selatan", transportTypes: ["plane", "train", "bus"] },
  { id: "city-pekanbaru", name: "Pekanbaru", province: "Riau", transportTypes: ["plane", "train", "bus"] },
  { id: "city-bandar-lampung", name: "Bandar Lampung", province: "Lampung", transportTypes: ["plane", "train", "bus"] },
  { id: "city-banda-aceh", name: "Banda Aceh", province: "Aceh", transportTypes: ["plane", "bus"] },
  { id: "city-binjai", name: "Binjai", province: "Sumatera Utara", transportTypes: ["train", "bus"] },
  { id: "city-pematangsiantar", name: "Pematangsiantar", province: "Sumatera Utara", transportTypes: ["train", "bus"] },
  { id: "city-gunungsitoli", name: "Gunungsitoli", province: "Sumatera Utara", transportTypes: ["plane", "bus"] },
  { id: "city-bukittinggi", name: "Bukittinggi", province: "Sumatera Barat", transportTypes: ["bus"] },
  { id: "city-payakumbuh", name: "Payakumbuh", province: "Sumatera Barat", transportTypes: ["bus"] },
  { id: "city-bengkulu", name: "Bengkulu", province: "Bengkulu", transportTypes: ["plane", "bus"] },
  { id: "city-jambi", name: "Jambi", province: "Jambi", transportTypes: ["plane", "bus"] },
  { id: "city-pankalpinang", name: "Pangkal Pinang", province: "Kepulauan Bangka Belitung", transportTypes: ["plane", "bus"] },
  { id: "city-tanjungpinang", name: "Tanjung Pinang", province: "Kepulauan Riau", transportTypes: ["plane", "bus"] },
  { id: "city-batam", name: "Batam", province: "Kepulauan Riau", transportTypes: ["plane", "bus"] },
  { id: "city-serang", name: "Serang", province: "Banten", transportTypes: ["train", "bus"] },
  { id: "city-padangsidempuan", name: "Padang Sidempuan", province: "Sumatera Utara", transportTypes: ["train", "bus"] },
  { id: "city-lubuklinggau", name: "Lubuk Linggau", province: "Sumatera Selatan", transportTypes: ["train", "bus"] },
  { id: "city-prabumulih", name: "Prabumulih", province: "Sumatera Selatan", transportTypes: ["train", "bus"] },

  // ================= BALI & NUSA TENGGARA =================
  { id: "city-denpasar", name: "Denpasar", province: "Bali", transportTypes: ["plane", "bus"] },
  { id: "city-mataram", name: "Mataram", province: "Nusa Tenggara Barat", transportTypes: ["plane", "bus"] },
  { id: "city-bima", name: "Bima", province: "Nusa Tenggara Barat", transportTypes: ["plane", "bus"] },
  { id: "city-kupang", name: "Kupang", province: "Nusa Tenggara Timur", transportTypes: ["plane", "bus"] },
  { id: "city-ende", name: "Ende", province: "Nusa Tenggara Timur", transportTypes: ["plane", "bus"] },
  { id: "city-larantuka", name: "Larantuka", province: "Nusa Tenggara Timur", transportTypes: ["plane", "bus"] },
  { id: "city-sumbawa-besar", name: "Sumbawa Besar", province: "Nusa Tenggara Barat", transportTypes: ["plane", "bus"] },
  { id: "city-selong", name: "Selong", province: "Nusa Tenggara Barat", transportTypes: ["plane", "bus"] },

  // ================= KALIMANTAN =================
  { id: "city-balikpapan", name: "Balikpapan", province: "Kalimantan Timur", transportTypes: ["plane", "bus"] },
  { id: "city-pontianak", name: "Pontianak", province: "Kalimantan Barat", transportTypes: ["plane", "bus"] },
  { id: "city-bandjarmasin", name: "Banjarmasin", province: "Kalimantan Selatan", transportTypes: ["plane", "bus"] },
  { id: "city-samarinda", name: "Samarinda", province: "Kalimantan Timur", transportTypes: ["plane", "bus"] },
  { id: "city-palangkaraya", name: "Palangkaraya", province: "Kalimantan Tengah", transportTypes: ["plane", "bus"] },
  { id: "city-tarakan", name: "Tarakan", province: "Kalimantan Utara", transportTypes: ["plane", "bus"] },
  { id: "city-pangkalan-bun", name: "Pangkalan Bun", province: "Kalimantan Tengah", transportTypes: ["plane", "bus"] },
  { id: "city-sampit", name: "Sampit", province: "Kalimantan Tengah", transportTypes: ["plane", "bus"] },
  { id: "city-ketapang", name: "Ketapang", province: "Kalimantan Barat", transportTypes: ["plane", "bus"] },

  // ================= SULAWESI =================
  { id: "city-makassar", name: "Makassar", province: "Sulawesi Selatan", transportTypes: ["plane", "bus"] },
  { id: "city-manado", name: "Manado", province: "Sulawesi Utara", transportTypes: ["plane", "bus"] },
  { id: "city-palopo", name: "Palopo", province: "Sulawesi Selatan", transportTypes: ["plane", "bus"] },
  { id: "city-kendari", name: "Kendari", province: "Sulawesi Tenggara", transportTypes: ["plane", "bus"] },
  { id: "city-palu", name: "Palu", province: "Sulawesi Tengah", transportTypes: ["plane", "bus"] },
  { id: "city-gorontalo", name: "Gorontalo", province: "Gorontalo", transportTypes: ["plane", "bus"] },
  { id: "city-luwuk", name: "Luwuk", province: "Sulawesi Tengah", transportTypes: ["plane", "bus"] },
  { id: "city-baubau", name: "Bau-Bau", province: "Sulawesi Tenggara", transportTypes: ["plane", "bus"] },
  { id: "city-kotamobagu", name: "Kotamobagu", province: "Sulawesi Utara", transportTypes: ["plane", "bus"] },

  // ================= MALUKU =================
  { id: "city-ambon", name: "Ambon", province: "Maluku", transportTypes: ["plane", "bus"] },
  { id: "city-tual", name: "Tual", province: "Maluku", transportTypes: ["plane", "bus"] },
  { id: "city-ternate", name: "Ternate", province: "Maluku Utara", transportTypes: ["plane", "bus"] },
  { id: "city-sofifi", name: "Sofifi", province: "Maluku Utara", transportTypes: ["plane", "bus"] },
  { id: "city-saumlaki", name: "Saumlaki", province: "Maluku", transportTypes: ["plane", "bus"] },
  { id: "city-masohi", name: "Masohi", province: "Maluku", transportTypes: ["plane", "bus"] },

  // ================= PAPUA =================
  { id: "city-jayapura", name: "Jayapura", province: "Papua", transportTypes: ["plane", "bus"] },
  { id: "city-sorong", name: "Sorong", province: "Papua Barat Daya", transportTypes: ["plane", "bus"] },
  { id: "city-manokwari", name: "Manokwari", province: "Papua Barat", transportTypes: ["plane", "bus"] },
  { id: "city-merauke", name: "Merauke", province: "Papua Selatan", transportTypes: ["plane", "bus"] },
  { id: "city-timika", name: "Timika", province: "Papua Tengah", transportTypes: ["plane", "bus"] },
  { id: "city-biak", name: "Biak", province: "Papua", transportTypes: ["plane", "bus"] },
  { id: "city-nabire", name: "Nabire", province: "Papua Tengah", transportTypes: ["plane", "bus"] },
  { id: "city-wamena", name: "Wamena", province: "Papua Pegunungan", transportTypes: ["plane", "bus"] },
  { id: "city-waisai", name: "Waisai", province: "Papua Barat Daya", transportTypes: ["plane", "bus"] },
];

export default cities;
