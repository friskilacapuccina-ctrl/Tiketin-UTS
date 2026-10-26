# PROGRESS — Tiketin-UTS

Ringkasan progres untuk melanjutkan pekerjaan di session OpenCode baru.
Terakhir diperbarui: **21 Oktober 2026 (sesi lanjutan — "Log Proses Algoritma")** —
**panel log algoritma ditampilkan kembali di halaman hasil pencarian**
(komponen baru `src/components/algorithmLogPanel.js`, `<details>` terlipat
bawaan di bawah grid hasil): dua bagian berjudul **"Log Pencarian (Linear
Search)"** (langkah per tiket diperiksa: nomor, id+moda+operator+jam, verdict
**cocok/tidak cocok**, perbandingan kumulatif) dan **"Log Pengurutan (Bubble
Sort)"** (tiap pass: perbandingan/pertukaran/elemen terkunci/berhenti dini;
tiap tukar: pasangan tiket + nilai kunci sesuai kriteria urutkan). Langkah
direkam **di dalam loop** algoritma (`steps` baru pada `linearSearch`/
`bubbleSort` → objek log `searchTicketsWithLog`/`sortTickets`) — algoritma,
kontra, dan hasil TIDAK berubah; cap 30 langkah/entri + catatan sisa di
console (`[Tiketin]` tetap); log console lama tidak dihapus; adaptif tema
terang/gelap. Terpasang untuk hasil kosong maupun berisi, sekali jalan maupun
pulang-pergi (per-leg), dan diperbarui saat ganti kriteria urutkan/filter
harga. Riwayat sesi sebelumnya (**21 Oktober 2026 — "Penyempurnaan Tiketin"**):
(1) **form pemesanan dirombak total menjadi alur bertahap** (`bookingForms.js`
ditulis ulang): stepper 4–5 langkah (Detail Perjalanan → Data Penumpang →
Kursi (bus) → Kontak → Ringkasan & Konfirmasi) dengan indikator langkah
aria-current, data per penumpang **dinamis** (nama, kategori dewasa/anak dgn
badge, tgl lahir, jenis kelamin, jenis identitas KTP/paspor, no. identitas wajib
hanya bila aturan transportasi meminta — kereta 10–20 digit), **email pemesan
wajib** + pemilih kode negara telepon (+62/+65/+60/+61/+44/+1), "informasi
tambahan" buka-tutup, validasi inline Bahasa Indonesia (bukan alert), anti
submit ganda, data tidak hilang saat kembali, ringkasan harga **jujur** (tanpa
pajak/biaya fiktif, dukung pulang-pergi) + disclaimer simulasi; backend
`booking.js` jadi sumber kebenaran (`isValidEmail`, `isValidPhone`,
`validatePassengerDetails`, pesanan kini menyimpan `contactName/contactPhone/
contactEmail/passengerDetails/specialRequest/travelNotes` **tanpa nomor
identitas** demi privasi). (2) **Simbol logo baru** orisinal konsep
"tiket + perjalanan": tile gradien biru–teal + tiket putih miring −6° bertakik
perforasi + garis perjalanan putus-putus bermata teal & pin tujuan biru —
dipakai konsisten di `logo-icon.svg`, `favicon.svg`, `logo-full(.light).svg`
(wordmark path dipertahankan; ukuran navbar 34px/hero 72px/footer/favicon
tanpa geser layout). (3) **Hero foto baru**: KCIC400AF + Gunung Manglayang
(foto Wikimedia Commons "KCIC400AF and Mount Manglayang" oleh Naufal Farras
(NFarras) for Transport for Bandung, **CC BY-SA 4.0** — URL asli tercatat di
`public/images/CREDITS.txt`), diolah Pillow (Color 1.12/Contrast 1.10/
Brightness 1.02) → `hero-travel.webp` 1920×1079, 248 kB; foto lama dibackup.
(4) **UI/UX & tema**: §17 CSS stepper/kartu penumpang/error inline/sticky nav/
blok konfirmasi, `.order-contact` + kategori penumpang + **catatan privasi**
(jujur: localStorage, bukan terenkripsi) di Pesanan Saya, tombol **"Lihat
Detail Pesanan"** pada footer modal sukses, `#successModal .modal-footer .btn`
sejajar selebar sama. (5) **Responsif diukur ulang nyata 1440/1000/785/540/390
px** × 4 konteks (beranda, hasil, modal, pesanan) × 2 tema via harness iframe
same-origin: **0 overflow horizontal di 40 baris ukuran**. (6) **Pengujian**:
`npm.cmd test` → **89 tes** (tambah 11 utk email/penumpang/kontak baru),
alur browser cari→pesan penuh (kereta, bus+kursi, pulang-pergi 3 penumpang),
validasi, pembatalan, ganti tema dgn modal terbuka, konsol 0 error; screenshot
visual (beranda, hasil, stepper+validasi, modal sukses, tema gelap, modal
@390). `npm.cmd run build` sukses; `cpp\build.bat` **51/51 exit 0**.
Riwayat sebelumnya: **20 Oktober 2026** (rombak visual Modern Travel + Playful
Brand, wordmark SVG → `<path>`, `syncSuccessBrand()`, responsif 1000/785/540/
390, unit test Vitest awal 78 tes).
Isi dokumen ini ditulis dari kondisi file & hasil pengujian yang
benar-benar sudah dijalankan.

---

## 1. Proyek, teknologi, struktur folder

- **Nama**: Tiketin-UTS — website pemesanan tiket pesawat/kereta/bus (tugas UTS Struktur Data).
- **Teknologi**: Vite 5 + vanilla JavaScript ES modules (tanpa framework), CSS manual, `"type": "module"`.
- **Struktur penting**:

```
index.html            # navbar (Beranda, Cari Tiket, Pesanan Saya), footer, 4 modal, toast
vite.config.js        # root ., output dist/, port 3000, watch.ignored (*.obj/*.exe)
package.json          # scripts: dev / build / preview
src/
  js/
    main.js           # bootstrap, navigasi halaman, render hasil + empty-state
                      # chip tanggal alternatif & rute lain; log ke console
    algorithms.js     # linearSearch, bubbleSort, SORT_OPTIONS, parser durasi
    search.js         # searchTicketsWithLog (Linear Search), sortTickets (Bubble Sort),
                      # findAvailableDates, sortDatesByProximity, findAlternativeRoutes,
                      # formatLongDate/ShortDate, filter harga (semua loop manual)
    booking.js        # validasi & penyimpanan pesanan ke localStorage
    orders.js         # riwayat & pembatalan pesanan
  components/         # searchForms, ticketCard, bookingForms, seatPicker, tripDetails
  data/               # tickets.js (902 tiket), cities.js, locations.js (10 bandara)
  css/main.css        # gaya .date-chip*, .alt-route*, .empty-hint, .autocomplete-*
                      # (gaya .process-* sudah dihapus bersama panel Detail proses)
cpp/                  # modul C++: ticket.h, ticket.cpp, main.cpp, build.bat, README.md, tiketin_test.exe
public/, dist/        # aset & hasil build produksi
```

**Cara menjalankan (mesin ini):**
- Dev server: `npm.cmd run dev` → http://localhost:3000 (pakai `npm.cmd`, karena `npm.ps1` diblokir execution policy).
- Build produksi: `npm.cmd run build`.
- Pengujian C++: `cpp\build.bat` (memakai MSVC `cl.exe` dari Visual Studio 2026; `g++`/`clang` TIDAK terpasang).
- **Aman berdampingan**: `cpp\build.bat` kini boleh dijalankan saat dev server masih hidup —
  `server.watch.ignored` (`**/*.obj`, `**/*.exe`) membuat Vite tidak me-watch artefak
  kompilasi, jadi crash watcher `EBUSY` lama tidak terulang (sudah diuji ulang, lihat bagian 6).

---

## 2. Fitur yang sudah selesai dan berfungsi (sudah diverifikasi di browser)

- Navigasi halaman: Beranda (hero + destinasi populer), Cari Tiket, Pesanan Saya; tema gelap/terang; toast; menu mobile; dropdown user.
- Form pencarian bertab **Semua / Pesawat / Kereta / Bus**, kini memakai **autocomplete dua langkah**: ketik nama kota → pilih dari daftar saran (hanya muncul saat mengetik, maks. 8; per tab hanya kota yang punya bandara/stasiun/terminal) → pilih lokasi spesifik kota itu pada `<select>` berisi **hanya** lokasi kota tersebut (bukan seluruh lokasi sekaligus). Dilanjutkan tanggal, penumpang, kelas, dan tipe perjalanan sekali jalan / pulang-pergi (bus: satu arah).
- Hasil pencarian: kartu tiket (hierarki baru: **ikon transportasi + operator** di header, rute lebih besar, jam tebal, kelompok **harga + tombol pilih** di `.ticket-actions`), jumlah hasil + **toolbar ringkas `.results-toolbar`** (dropdown **"Urutkan berdasarkan"** **6 opsi** + filter harga min/maks + "Terapkan" dalam satu baris kartu, tepat di bawah judul hasil). **Panel "Log Proses Algoritma"** (sesi lanjutan 21 Okt; menggantikan panel "Detail proses" lama yang dihapus sesi 19 Okt) menempel di bawah hasil — menampilkan **langkah nyata** Linear Search (per tiket: verdict cocok/tidak cocok + perbandingan kumulatif) dan Bubble Sort (per pass & pertukaran dgn data tiket + nilai kunci), terlipat bawaan, diperbarui saat ganti urutkan/filter; log **lengkap** tetap dicatat ke **console browser** (`console.info("[Tiketin] …")`).
- **Chip tanggal alternatif (BARU — sesi 19 Okt lanjutan)**: saat hasil pencarian 0, empty-state menampilkan judul "Tidak ada tiket untuk tanggal {tanggal panjang}" + **chip tanggal (tombol) yang benar-benar punya jadwal** untuk rute/kriteria tersebut (cek kelas & kursi), **diurutkan dari yang paling dekat tanggal pilihan** (Bubble Sort manual `sortDatesByProximity`), dan **dapat diklik** — memilih salah satunya langsung menjalankan pencarian ulang dengan tanggal itu (input tanggal form ikut diperbarui). Berlaku untuk leg pulang (pulang-pergi), termasuk chip inline pada grid pulang yang kosong.
- **Rute lain (BARU)**: bila rute yang dicari **tidak punya jadwal sama sekali**, empty-state menjelaskan "Belum ada jadwal simulasi untuk rute …" dan menampilkan **daftar rute lain yang tersedia** (`findAlternativeRoutes`: rute berbagi kota asal/tujuan, maks. 5, terurut kecocokan + jumlah tanggal) dengan label jelas **"bukan hasil pencarian Anda"** — bukan dianggap hasil cocok.
- Pemesanan lengkap: pilih tiket → modal detail → form pemesanan (pesawat: nama + kontak; kereta: + no. identitas; bus: peta kursi) → tersimpan ke localStorage → riwayat & pembatalan di "Pesanan Saya". **Kartu pesanan (desain baru sesi 20 Okt)**: grid info berlabel (operator, jenis, kelas, berangkat, tiba, bagasi, dll.), area penumpang berlatar, total menonjol, aksen kiri per status; **pembatalan kini memakai konfirmasi dua langkah inline** (klik "Batalkan Pesanan" → muncul "Yakin membatalkan pesanan ini?…" + tombol "Ya, Batalkan"/"Tidak"; tombol batal hilang pada pesanan yang sudah dibatalkan).
- **Sistem desain (BARU — sesi 20 Okt)**: design tokens di `:root` — palet **navy `#142B4A` (teks/latar gelap), ocean `#2563EB` (tombol utama), teal `#14B8A6` (aksen), cream `#FFF8EF` (latar alternatif/`section-alt`), sky `#EFF6FF` (ikon/manfaat), slate `#64748B` (teks sekunder)**; radius konsisten (10/14/20px), bayangan lembut, gradien halus hanya pada tombol utama & mark hero; tipografi **Plus Jakarta Sans** (Google Fonts) dengan hierarki `section-title` / `ticket-route` / `ticket-price` / `form-group label`; tombol `btn-primary` kini gradien biru (kontras teks putih) + varian gelap otomatis, `btn-danger` baru; tema gelap dipoles khusus (badge/chip/kursi/summary/secondary punya varian gelap agar kontras).
- **Identitas visual (didesain ulang total — sesi 20 Okt visual)**: sistem logo maskot "tiket bersahabat" buatan sendiri — badge gradien ocean→teal, tiket putih miring −7° dengan takik perforasi + garis putus-putus, mata navy & senyum + pipi koral (ramah, tidak kekanak-kanakan), **pesawat kertas kuning dengan jejak putus-putus**; siluet tetap terbaca di ukuran kecil. Tersedia: `logo-icon.svg` (ikon; dipakai navbar, footer, hero, favicon), `logo-full.svg` (horizontal, teks navy — latar terang), **`logo-full-light.svg` (horizontal, teks terang — otomatis dipakai modal sukses saat tema gelap)**. Navbar memakai ikon + wordmark HTML (adaptif tema), hero memakai maskot 72px, modal sukses memakai versi horizontal.
- **Beranda (dirombak — sesi 20 Okt)**: hero foto perjalanan (Whoosh) + overlay, tagline **"Perjalanan Seru, Semudah Itu."** + subjudul **"Temukan tiket pesawat, kereta api, dan bus untuk perjalananmu di berbagai kota Indonesia."**, **3 chip kategori transportasi (Pesawat/Kereta/Bus) berupa tombol yang benar-benar membuka pencarian dengan tab aktif**, bagian destinasi populer (4 kartu foto + deskripsi + ajakan "Cari jadwal →" yang muncul saat hover/fokus, selalu terlihat di layar sentuh, klik → pra-isi destinasi), bagian manfaat **4 kartu berikon stroke seragam** (Banyak Pilihan, Pencarian Praktis, Pesanan Tersimpan, Harga Transparan — tanpa klaim tak didukung).
- **Footer (diperbaiki — sesi 20 Okt)**: 4 kolom ringkas (identitas + Layanan + Navigasi + Tentang Proyek); **semua tautan palsu (`href="#"` tanpa fungsi) dihapus** — Layanan membuka pencarian dengan tab transportasi sesuai (`data-transport`), Navigasi & logo berfungsi (`data-page`), kolom Tentang berisi teks informatif (algoritma + keterangan data simulasi), tahun 2026; tinggi tautan 33px (≥ target 24px).
- **Tab "Laboratorium Struktur Data" sudah dihapus** dari nav desktop, nav mobile, link footer, dan logika `main.js` (tidak ada halaman/menu praktikum).
- `grep` seluruh `src/`: tidak ada pemanggilan `.sort(` maupun referensi `data-page="lab"` (sisa 2 kecocokan hanya komentar teks "bukan Array.sort()").

---

## 3. Sorting & searching yang diterapkan

**Searching — Linear Search** (`src/js/algorithms.js` → dipakai `searchTicketsWithLog()` di `search.js`):
- Menelusuri array `tickets` dari awal sampai akhir; SEMUA kriteria harus cocok: jenis transportasi, asal, tujuan, tanggal, kelas, harga valid, kursi ≥ jumlah penumpang.
- Menghitung nyata: `visited` (data diperiksa), `comparisons` (perbandingan), `found` (hasil).
- Tidak membuat tiket fiktif; hasil kosong ditampilkan dengan empty-state + log.
- **`findAvailableDates()` (loop manual)**: mengumpulkan tanggal keberangkatan yang tersedia untuk satu rute/kriteria TANPA filter tanggal (sisipan terurut, tanpa `Array.sort()`); dipakai `searchTicketsWithLog` untuk melengkapi log dan `main.js` untuk empty-state saat hasil 0.
- **`sortDatesByProximity(dates, preferredDate)` (BARU, Bubble Sort manual)**: mengurutkan tanggal berdasarkan **kedekatan (selisih hari terkecil) dengan tanggal pilihan pengguna**; tanggal dengan selisih sama (mis. H−1 & H+1) mempertahankan urutan menaik (tanggal lebih awal di depan) berkat sifat stabil bubble sort; tanpa tanggal pilihan → urutan menaik asli dipertahankan. Memilih chip tanggal memanggil `runSearch()` ulang.
- **`findAlternativeRoutes(criteria, source)` (BARU, loop manual)**: mengumpulkan rute LAIN yang berbagi kota asal ATAU kota tujuan dengan pencarian (menghormati jenis transportasi bila dipilih; rute yang persis dicari dilewati), memeriksa ketersediaan tanggal tiap kandidat dengan kriteria yang sama seperti pencarian biasa (kelas & kursi ≥ penumpang), lalu Bubble Sort manual: skor kecocokan kota menaik (0 = asal+tujuan sama, 1 = asal saja, 2 = tujuan saja), lalu jumlah tanggal menaik; hasil dibatasi 5. Hanya dipakai untuk tampilan informatif rute lain — bukan hasil pencocokan.

**Sorting — Bubble Sort** (`algorithms.js` → `sortTickets()` di `search.js`):
- Optimasi *early-exit*, bekerja pada **salinan array** (data sumber tidak pernah berubah).
- Menghitung nyata: `comparisons`, `swaps`.
- 6 kriteria (`SORT_OPTIONS`, bertambah 2 pada sesi 19 Okt): `price_asc` (Harga termurah), `price_desc` (Harga termahal), `departure_earliest` (Keberangkatan paling awal, kunci `tanggal jam`), `departure_latest` (Keberangkatan paling akhir — pembanding kebalikan `departure_earliest`), `duration_fastest` (Durasi tercepat, konversi "6j 40m" → menit), `duration_slowest` (Durasi terlama — pembanding kebalikan `duration_fastest`). Urutan dropdown: 4 opsi lama + "Keberangkatan paling akhir" setelah opsi awal dan "Durasi perjalanan terlama" di akhir.
- Dropdown langsung bereaksi pada event `change` (urutan kartu + log ikut berubah).

**Log** kini ditampilkan di halaman **dan** di console. Panel **"Log Proses Algoritma"** (`src/components/algorithmLogPanel.js`, sesi lanjutan 21 Okt — permintaan baru; panel "Detail proses" lama sempat dihapus sesi 19 Okt lanjutan dan kodenya sudah tidak ada, jadi panel dibangun ulang segar) menempel di bawah hasil pencarian: bagian "Log Pencarian (Linear Search)" memuat kriteria, chip statistik (data diperiksa/dikunjungi/perbandingan/ditemukan), dan **langkah per tiket** (nomor, id+moda+operator+jam, cocok/tidak cocok, perbandingan kumulatif); bagian "Log Pengurutan (Bubble Sort)" memuat chip statistik (data/perbandingan/pertukaran) dan **langkah per pass & pertukaran** (pasangan tiket + nilai kunci). Sumber datanya `steps` yang direkam di dalam loop `linearSearch`/`bubbleSort` (diteruskan ke objek log) — bukan angka simulasi. Panel terlipat bawaan, cap 30 langkah/entri + catatan sisanya di console. Log lengkap tetap dicatat ke **console browser**: `console.info("[Tiketin] Log pencarian Linear Search:", …)` dari `runSearch()` dan `console.info("[Tiketin] Log pengurutan Bubble Sort — <leg>:", …)` dari `applyFilterSort()` — memuat metode, kriteria, jumlah data diperiksa, perbandingan, pertukaran, ringkasan hasil, semua dari counter algoritma.

Filter harga min/maks (fitur pendukung) juga sudah diganti menjadi loop manual (bukan `Array.filter`), jadi seluruh alur pemilihan tiket memakai algoritma tulisan sendiri.

---

## 4. Kondisi data & formulir pencarian

- **`src/data/tickets.js`**: **902 tiket** = 112 tiket sesi lalu (30 data awal + 78 `GENERATED-EXTRA-TICKETS` + 4 `HALIM-EXTRA-TICKETS`, **tidak diubah**) **+ 582 jadwal** blok `DENSE-EXTRA-TICKETS` (sesi 19 Okt) **+ 208 jadwal** blok baru `NEW-ROUTES-TICKETS` (sesi 19 Okt lanjutan, literal, tanpa dependensi runtime):
  - **Riwayat sesi lalu (tetap valid)**: Bagian A (48) — tiap rute lama diberi tanggal D+2/D+4; Bagian B (30) — 15 rute arah-balik; Blok HALIM (4) — rute HLP↔DPS.
  - **Bagian A `DENSE` (350 tiket)**: **setiap kombinasi rute+tanggal yang sudah ada di-top-up menjadi minimal 4 tiket** (rute populer 5–6, contoh CGK→DPS 20 Okt = 6) dengan **operator berbeda dalam satu kombinasi, jam berangkat unik, harga unik (kelas premium ×1,3), durasi bervariasi (pesawat delta ≥30 menit → `stops: 1`), kelas mayoritas+minoritas, kursi campuran** — bukan tiket kembar.
  - **Bagian B `DENSE` (232 tiket)**: **jendela awal Oktober 2026 (1–14 Okt)** — tiap rute punya jadwal di jendela itu (rute populer 2–3 tanggal, rute lain 1 tanggal × 4 tiket).
  - **`NEW-ROUTES-TICKETS` (208 tiket, sesi 19 Okt lanjutan)**: audit menemukan **rute populer CGK↔SUB, CGK↔YIA, SUB↔DPS, KNO→CGK, CGK↔BPN, kereta Gambir↔Yogyakarta & Gubeng↔Yogyakarta, bus Pulo Gebang↔Bungurasih tidak punya tiket sama sekali** (penyebab "CGK→SUB 28 Okt = 0 tiket"); ditambahkan lewat generator `gen-new-routes.mjs` (dry-run → apply; idempoten via penanda blok) **4 tiket per rute+tanggal** pada tanggal 20–31 Okt — **operator/jam/harga/durasi/kelas berbeda, bukan kembar**.
  - ID tetap berurutan per jenis dan unik: maks `TKT-PLW-372`, `TKT-KRA-282`, `TKT-BUS-248` (902 ID unik, diverifikasi ulang).
  - Jendela jadwal **26 tanggal**: 2026-10-01..14 dan 2026-10-20..31; **15–19 Okt sengaja kosong** (kasus uji "tidak ada tiket" + chip tanggal alternatif). Per jenis: **pesawat 372, kereta 282, bus 248**.
  - **212 kombinasi rute lokasi+tanggal, SEMUA berisi minimal 4 tiket** (distribusi `{"4":161,"5":48,"6":3}`) — audit ulang `audit-data.mjs` **0 masalah**; `findAvailableDates` CGK→SUB = 6 tanggal; **CGK→SUB 28 Okt = 4 tiket**.
- **4 ketidakkonsistenan data LAMA ditemukan audit & diperbaiki** (semua pada tiket 001–010, bukan data baru):
  - `TKT-PLW-001` tiba 10:05 → **09:05** (07:15 + 1j 50m).
  - `TKT-PLW-004` tiba 19:00 → **18:00** (16:10 + 1j 50m).
  - `TKT-BUS-009` `bookedSeats` 24 → **28** (kapasitas 40 − 12 kursi tersisa).
  - `TKT-BUS-010` `bookedSeats` 16 → **20** (kapasitas 40 − 20 kursi tersisa).
- **`src/data/cities.js`**: **77 kota** dengan `transportTypes` masing-masing (tidak diubah).
- **`src/data/locations.js`**: **10 bandara** (`airport-*`, +kode IATA — kini termasuk **Halim Perdanakusuma / HLP** di Jakarta), **9 stasiun** (`station-*`), **9 terminal** (`terminal-*`).
- **Form pencarian** (`src/components/searchForms.js`) — tab tipe → **field dua langkah (SUDAH DIUBAH sesi lanjutan)**:
  - **Langkah 1 — input kota + autocomplete**: daftar saran (`role=listbox` + `role=combobox`) hanya tampil saat pengguna mengetik, maks. **8 saran**, cocok nama kota ATAU provinsi; di tab transportasi hanya kota yang **punya** bandara/stasiun/terminal (contoh: ketik "ja" → Jakarta "DKI Jakarta · 2 bandara"). Bisa dipilih pakai klik maupun keyboard (Arrow/Enter/Escape).
  - **Langkah 2 — `<select>` lokasi**: baru aktif setelah kota dipilih dan hanya berisi lokasi kota itu (Jakarta pesawat → **CGK & HLP**; Jakarta kereta → Gambir & Pasar Senen). Sebelumnya disabled: "— Pilih kota terlebih dahulu —"; mengubah teks kota manual mereset pilihan lokasi.
  - Form "Semua" kini **autocomplete nama kota** (bukan `<select>` 77 kota).
  - Sisanya tetap: tanggal berangkat, radio sekali jalan/pulang-pergi + tanggal pulang (pesawat & kereta), jumlah penumpang (dewasa + anak / satu field untuk bus), select kelas (opsi dari data tiket), tombol "Cari Tiket", tombol ⇄ (kini ikut menukar kota + lokasi terpilih).
  - Submit **memakai id lokasi yang dipilih pengguna** (`originLocationId`/`destinationLocationId`); `fillSearchForm` mengisi kota+lokasi bersamaan (pra-isi kartu destinasi memilih lokasi pertama kota itu, sama seperti perilaku lama).

---

## 5. Perubahan terakhir yang dilakukan (urutan kerja)

1. **Hapus tab Laboratorium** dari `index.html` (3 link) dan `main.js` (`PAGES`, `case "lab"`, `renderLabPage()`).
2. **Buat `src/js/algorithms.js`** (linearSearch, bubbleSort, SORT_OPTIONS, parser durasi/waktu).
3. **Ubah `search.js`**: `searchTicketsWithLog()` (Linear Search + log), `sortTickets()` (Bubble Sort + log), filter harga → loop manual.
4. **Ubah `main.js`**: log pencarian; jumlah hasil; dropdown urutkan; panel "Detail proses".
5. **Tambah gaya** di `src/css/main.css`; **tambah 6 tiket** (24 → 30); **buat modul C++** di `cpp/`.
6. **(Sesi sebelumnya — prioritas "data + logika pencarian") Perbaiki data & logika pencarian agar hasil tersedia pada berbagai rute & tanggal:**
   1. Audit data via impor modul langsung di browser → ditemukan: 0 rute punya >1 tanggal, 24 rute, 8 tanggal; plus 4 inkonsistensi data lama (daftar di bagian 4).
   2. `src/data/tickets.js` → +78 jadwal (30 → 108) lewat skrip generator literal; **4 inkonsistensi data lama diperbaiki**.
   3. `src/js/search.js` → tambah `findAvailableDates()`, `formatShortDate()`, `availableDatesHintText()`; log hasil 0 kini menyertakan daftar tanggal yang punya jadwal.
   4. `src/js/main.js` → empty-state & pesan leg pulang kosong menampilkan petunjuk tanggal (`joinShortDates`, impor helper baru).
   5. `src/css/main.css` → gaya `.empty-hint`.
   6. Jalankan ulang `npm.cmd run build` dan `cpp\build.bat`.
7. **(Sesi sebelumnya — koreksi crash watcher `EBUSY`)** (dev server mati saat `cpp\build.bat` berjalan bersamaan):
   1. `vite.config.js` → tambah `server.watch.ignored` (`**/*.obj`, `**/*.exe`).
   2. `cpp\build.bat` → `del /q *.obj` dipindah ke **segera setelah kompilasi** (sebelum tes), sehingga file objek tidak tinggal lama.
   3. Dev server dijalankan ulang bersih di port 3000 lalu diuji regresi (lihat bagian 6).
8. **(Sesi lanjutan — prioritas 2 "autocomplete" + prioritas 3 "regresi"):**
   1. `src/data/locations.js` → tambah `airport-hlp` (**Halim Perdanakusuma, HLP**, Jakarta) agar contoh "Jakarta → pilihan CGK & HLP" bisa dipenuhi (9 → 10 bandara).
   2. `src/data/tickets.js` → tambah **4 tiket simulasi rute HLP** (`TKT-PLW-037..040`, komentar blok `HALIM-EXTRA-TICKETS`) agar lokasi baru tidak jadi opsi mati → 108 → **112 tiket**, 39 → **41 rute**, semua rute tetap ≥2 tanggal.
   3. `src/components/searchForms.js` → ganti `<select>` panjang jadi **field dua langkah** (autocomplete kota → select lokasi kota terpilih); tambah `attachAutocomplete()`, `cityPoolGeneric()`, `cityPoolForTransport()`, `matchCityItems()`, `canonicalCityName()`; controller field disimpan di `WeakMap` untuk `fillSearchForm`; submit & tombol ⇄ disesuaikan.
   4. `src/css/main.css` → gaya `.autocomplete-list/option/main/sub/empty` + `.form-control:disabled`.
   5. Audit data ulang via skrip Node `audit.mjs` (folder temp, di luar proyek) → **0 masalah** (rincian bagian 6).
   6. Regresi prioritas 3 dijalankan penuh di browser (bagian 6), lalu `npm.cmd run build` dan `cpp\build.bat` dijalankan ulang.
9. **(Sesi 19 Oktober 2026 — variasi data + 6 opsi sorting + logo):**
   1. Audit statistik data via skrip Node (`audit-data.mjs`, `routes.mjs` di folder temp) → ditemukan **101 dari 106 kombinasi rute+tanggal hanya berisi 1 tiket** (penyebab hasil pencarian sering 1 kartu) dan **belum ada jadwal 1–14 Okt**.
   2. `src/data/tickets.js` → sisip blok `DENSE-EXTRA-TICKETS` (**+582 tiket**, 112 → 694) via `gen-dense-tickets.mjs` (dry-run dulu → angka diverifikasi → apply); semua kombinasi rute+tanggal kini 4–6 tiket; komentar header diperbarui.
   3. `src/js/algorithms.js` → tambah `departure_latest` & `duration_slowest` (label + `SORT_SPECS` + pembanding kebalikan; `SORT_OPTIONS` 4 → 6); komentar kriteria di `search.js` ikut diperbarui. Dropdown & log di `main.js` otomatis mengikuti (tanpa perubahan kode).
   4. Logo baru: buat `public/images/logo-icon.svg`, `public/images/logo-full.svg`, tulis ulang `public/favicon.svg`; `index.html` → ganti 2 SVG inline navbar/footer jadi `<img>`; `src/js/main.js` → tambah mark logo di hero; `src/css/main.css` → gaya `.hero-logo` (+1 versi di media query ≤640px).
   5. Pengujian penuh (bagian 6: Node + browser + dark mode + ponsel 390px), lalu `npm.cmd run build` dan `cpp\build.bat` dijalankan ulang.
10. **(Sesi 19 Oktober 2026 lanjutan — rute hilang + empty-state interaktif + hapus panel + logo maskot):**
    1. Audit matriks rute (Node, folder temp) → ditemukan **15 rute populer tidak punya tiket sama sekali** (CGK↔SUB, CGK↔YIA, SUB↔DPS, KNO→CGK, CGK↔BPN, Gambir↔Yogyakarta, Gubeng↔Yogyakarta, Pulo Gebang↔Bungurasih) — penyebab utama hasil 0; `findAvailableDates` sendiri sudah benar.
    2. `src/data/tickets.js` → sisip blok `NEW-ROUTES-TICKETS` (**+208 tiket**, 694 → **902**) via generator `gen-new-routes.mjs` (dry-run dulu → apply; idempoten via penanda blok); 4 tiket berbeda per rute+tanggal; komentar header diperbarui; audit ulang **0 masalah** (212 kombinasi ≥4 tiket; CGK→SUB 28 Okt = 4).
    3. `src/js/search.js` → tambah `formatLongDate()` ("28 Oktober 2026"), **`sortDatesByProximity()`** (Bubble Sort manual berdasarkan selisih hari terhadap tanggal pilihan; tie → tanggal menaik), **`findAlternativeRoutes()`** (loop manual; skor kecocokan kota 0/1/2 + jumlah tanggal; maks 5); komentar modul diperbarui.
    4. `src/js/main.js` → empty-state baru `buildEmptyState()` (judul tanggal panjang + chip tanggal alternatif terurut & diklik → `runSearch` ulang + input tanggal ikut diperbarui; rute tanpa jadwal → penjelasan + `buildAlternativeRoutesBlock()`); chip `buildDateChips()` juga dipakai pada grid pulang yang kosong (pulang-pergi); **hapus panel Detail proses total** (`buildProcessDetails`, `processRow`, `processBlock`, `fillProcessDetails`, `joinShortDates`, state `lastSearchLogs`); log pencarian & pengurutan dialihkan ke `console.info`.
    5. `src/css/main.css` → **hapus seluruh blok `.process-*`** (±96 baris + aturan media query); tambah gaya `.date-chips-block/-label`, `.date-chips`, `.date-chip` (pill outline → terisi saat hover), `.alt-routes`, `.alt-route-list`, `.alt-route-item/-name/-info`.
    6. Logo maskot baru: tulis ulang `public/images/logo-icon.svg`, `public/images/logo-full.svg`, `public/favicon.svg` (mata navy + senyum + pipi koral, perforasi + garis putus-putus, pesawat kertas kuning + jejak); iterasi via screenshot browser (hidung pesawat digeser agar lega dari sudut badge); path & ukuran file tidak berubah → navbar/hero/favicon ikut otomatis.
    7. Pengujian penuh (bagian 6 — Node + browser), lalu `npm.cmd run build` dan `cpp\build.bat` dijalankan ulang.
12. **(Sesi 20 Oktober 2026 — peningkatan kualitas visual seluruh website, 11 tahap):**
    1. **Audit**: baca `index.html`, seluruh `main.css` (1.859 baris), `main.js`, `searchForms.js`, `ticketCard.js`, `orders.js`, isi `public/` + `CREDITS.txt` → temuan: font Inter generik, footer penuh tautan `href="#"` palsu, hero & bagian manfaat datar, kontrol hasil terpisah dari jumlah hasil, pesanan tanpa konfirmasi pembatalan, `logo-full.svg` belum dipakai di mana pun.
    2. **Logo**: tulis ulang `public/images/logo-icon.svg` & `public/favicon.svg` (maskot tiket miring −7°, takik perforasi + garis putus-putus, pesawat kertas kuning + jejak, gradien `#2563EB`→`#14B8A6`); buat `public/images/logo-full.svg` (horizontal, teks navy) dan **`public/images/logo-full-light.svg`** (teks terang untuk tema gelap); logo navbar/footer diberi `data-page="home"` agar berfungsi; hero memakai maskot 72px; `logo-full` dipakai di modal sukses (src dipilih sesuai tema aktif `data-theme`).
    3. **Design tokens & tipografi**: `:root` ditulis ulang (token `--navy/--ocean/--teal/--cream/--sky`, radius 10/14/20px, bayangan lembut, `--bg-alt` → cream, `--text` → navy); `index.html` → Google Fonts **Plus Jakarta Sans** (mengganti Inter) + body font; gradien tombol utama; blok `[data-theme="dark"]` diperbarui + **§16 polesan tema gelap** (badge, chip tiket, kursi, booking-summary, btn-secondary, swap, date-chip, navbar).
    4. **Beranda**: tagline **"Perjalanan Seru, Semudah Itu."** + subjudul baru; 3 chip hero → **tombol kategori** yang membuka pencarian dengan tab aktif (`state.prefillTransportType` → `search.setActiveType`); bagian manfaat → **4 kartu dengan ikon stroke seragam** (helper `iconSvg()` via createElementNS); kartu destinasi + CTA **"Cari jadwal →"** (hover/fokus; selalu tampil di ≤640px); grid destinasi eksplisit 4/2/1 kolom.
    5. **Form & hasil pencarian**: label form navy 700 (bukan uppercase abu), fokus ocean + ring 3px; `.results-toolbar` baru (urutkan + filter harga ringkas dalam satu kartu, menempel jumlah hasil) di `renderResults` (class `results-toolbar-form`); kartu tiket + `.ticket-brand` (ikon pesawat/kereta/bus per tiket) & `.ticket-actions` (kelompok harga + tombol pilih), footer wrap + `white-space:nowrap` sisa kursi; koreksi `.search-section` — `margin-top:-90px` hanya untuk `.hero + .search-section` sehingga subjudul halaman Cari Tiket tidak tertutup kartu.
    6. **Pesanan & footer**: `orders.js` → konfirmasi pembatalan **dua langkah inline** (`order-cancel-confirm` + `btn-danger` baru; tombol batal hilang setelah pesanan dibatalkan, kelas `cancelled`); kartu pesanan → grid info berlabel + area penumpang berlatar + aksen status; `index.html` footer **ditulis ulang**: 4 kolom ringkas, **0 tautan palsu**, layanan `data-transport` membuka tab sesuai, teks Tentang Proyek (algoritma + disclaimer simulasi), tahun 2026, tinggi tautan 33px.
    7. **Aksesibilitas**: `:focus-visible` diuji dengan keyboard nyata (Tab → chip hero, outline solid 2.4px `#60a5fa`, offset 1.6px); semua field punya label terkait; semua `<img>` punya `alt`; `prefers-reduced-motion` ada di CSSOM; 0 tautan `href="#"` mati; 0 scroll horizontal (785px).
    8. **Pengujian & build**: alur penuh di browser (cari → pesan → lihat pesanan → batal 2 langkah), tema gelap (badge kontras, wordmark `logo-full-light`), screenshot 7 tampilan, 0 error konsol, 0 aset gagal; `npm.cmd run build` + `cpp\build.bat` dijalankan ulang — rincian di bagian 6.
13. **(Sesi 20 Oktober 2026 lanjutan — penyelesaian 4 masalah + unit test):**
    1. **Wordmark SVG → path**: unduh font **Plus Jakarta Sans ExtraBold (TTF statis)** dari Google Fonts (respons CSS berupa berkas EOT untuk UA lama → TTF diekstrak dari dalamnya; `usWeightClass=800` terverifikasi via opentype.js), konversi glyph "Tiket"+"in" (font-size 34, baseline y 43, tracking −0.5 — parameter identik `<text>` lama) memakai `opentype.js` yang dipasang **di folder temp di luar proyek** (package.json tidak tercampur dependency sekali-pakai) → `<text>` diganti `<path>` di `logo-full.svg` & `logo-full-light.svg`; tampilan diverifikasi screenshot di tema terang & gelap.
    2. **Sinkron tema–modal sukses**: `main.js` → fungsi baru `syncSuccessBrand()` (mengganti src logo horizontal sesuai `data-theme`); dipanggil dari `openSuccessModal()` **dan** `toggleTheme()` — logo modal ikut berganti seketika saat tema diganti tanpa membuka ulang modal (dibuktikan uji langsung; lihat bagian 6).
    3. **Logika tema → modul murni**: buat `src/js/theme.js` (`THEME_STORAGE_KEY`, `normalizeTheme()`, `toggleThemeName()`); `initTheme()`/`toggleTheme()` memakainya — perilaku & kunci localStorage `tiketin_theme` tetap sama, logika tema kini bisa diuji tanpa DOM.
    4. **Responsivitas diuji nyata di 4 lebar**: harness iframe (situs dimuat di iframe selebar tepat *W* px; untuk 1000px memakai `transform:scale(0.8)` agar muat di jendela 800px — media query tetap merespons 1000px) → screenshot + pemeriksaan DOM: home, form, hasil, kartu tiket, modal detail/booking/sukses, pesanan, footer; **0 overflow horizontal di 1000/785/540/390**; kontrol kecil (<32px) = 0 (input modal booking 44px); panel modal muat (390: 19–371; 540: 22–518); footer 785 = 2 kolom, 540/390 = 1 kolom; tema gelap diuji di 540 & 390. **Tidak ada komponen yang perlu diperbaiki** — CSS hasil sesi sebelumnya sudah benar. Keterbatasan jujur (bukan emulasi perangkat) dicatat di bagian 7 no.11a.
    5. **Unit test Vitest**: `npm.cmd install -D vitest@2.1.9` + skrip `"test": "vitest run"` (**tanpa file konfigurasi** — default Vitest cukup, environment node); 5 file di `tests/` dengan **data uji terkontrol** (array buatan, bukan data produksi) → **78 tes, 5 file, semua lulus**; 5 ekspektasi awal tes dikoreksi agar sesuai perilaku asli modul (durasi tak terbaca → 0 menit; `2026-02-30` bergulir di mesin tanggal JS; pesan validasi hanya muncul setelah pra-syarat lolos) — **logika bisnis TIDAK diubah demi tes**.
    6. Jalankan ulang `npm.cmd run build` (**17 modul** — `theme.js` ikut terbundel) dan `cpp\build.bat` (**51 lulus**) setelah semua kode berubah.
14. **(Sesi 21 Oktober 2026 — "Penyempurnaan Tiketin", urutan kerja):**
    1. **Audit awal** seluruh bagian prompt terhadap kondisi file (tanpa mengasumsikan isi), rencana 7 poin disampaikan, lalu eksekusi berurutan: logo → form stepper → hero → UI/UX → tes → responsif/verifikasi/dokumentasi.
    2. **Simbol logo baru** (4 file SVG ditulis ulang: `logo-icon.svg`, `favicon.svg`, `logo-full.svg`, `logo-full-light.svg`): tile rx15 gradien `#2563EB`→`#14B8A6`, tiket putih miring −6° dgn takik perforasi atas-bawah (x=41) + garis perforasi putus-putus, rute bermata teal `#14B8A6` → putus-putus biru → pin tujuan biru ber-mata putih, dua garis stub `#CBD5E1`; **wordmark path dipertahankan**; gradient id berbeda per file; bug salinan titik "i" (`L163.09 17.67`) ikut diperbaiki; semua lolos validasi XML + dirender & dilihat (ikon128/64/34px, horizontal di terang/gelap).
    3. **Form pemesanan bertahap**: `src/components/bookingForms.js` **ditulis ulang total** — stepper `<ol>` aria-current (`is-active`/`is-done`), panel per langkah (`.step-panel[hidden]`), kartu penumpang dibangun ulang per langkah (nilai per indeks dipertahankan), kode negara + select `bookingCountry`, blok `extra-details` (permintaan bantuan + catatan ketersediaan fitur), catatan privasi localStorage, panel konfirmasi (ringkasan pergi/pulang, data penumpang dgn mask `••••` last-4, kontak, rincian harga jujur + disclaimer), nav sticky `.stepper-nav` (Kembali/Lanjut), guard `dataset.submitting`, validasi semua langkah → lompat ke langkah pertama bermasalah.
    4. **Backend `booking.js`**: tambah `isValidEmail`/`isValidPhone`/`GENDER_VALUES`/`IDENTITY_TYPE_VALUES`/`validatePassengerDetails` (nama ≥2, kategori, tgl lahir valid & tidak masa depan, enum, identitas kereta wajib 10–20 digit, pesawat/bus opsional tapi diformat bila diisi); `contactEmail` **wajib**; order kini menyimpan `contactName`, `contactPhone`, `contactEmail`, `passengerDetails` (**tanpa `identityNumber`** — privasi), `specialRequest`, `travelNotes` (skema = superset; pesanan lama tetap terbaca).
    5. **Hero**: unduh 4 kandidat foto Commons (Padalarang/Manglayang/Kopo/Tegalluar) → pilih **Manglayang** (KCIC400AF + gunung, kabut pagi harmonis dgn overlay, subjek kanan) → Pillow enhance → `public/images/hero-travel.webp` (248.842 byte); backup foto lama ke folder temp; `CREDITS.txt` entry diganti (judul/pembuat/CC BY-SA4.0/URL Commons asli + catatan pengolahan Pillow).
    6. **UI/UX pendukung**: `index.html` + `main.js` → tombol **"Lihat Detail Pesanan"** (`#successOrdersBtn`) di footer modal sukses (tutup modal → `navigate("orders")`); `orders.js` → blok Pemesan (nama · telepon · email), suffix kategori `(Dewasa)`/`(Anak)` dari `passengerDetails`, info `specialRequest`/`travelNotes`, catatan privasi di bawah daftar; CSS **§17** (stepper, error inline `.field-error`, `.form-control.is-invalid`, tag Opsional, `.pax-card`+badge, `.phone-row`, `.extra-details`, `.privacy-note`, `.confirm-*`, sticky `.stepper-nav`, `.order-contact`, `#successModal .modal-footer .btn` sejajar, override gelap, `@media 640`).
    7. **Tes**: `tests/booking.test.js` — fixture `validBooking` ditambah `contactEmail` (perubahan skema sah), **11 tes baru** (`isValidEmail`, `isValidPhone`, `validatePassengerDetails` 7 asersi, simpanan field kontak baru + privasi identitas) → **89 tes semua lulus**; build Vite sukses.
    8. **Verifikasi browser menyeluruh** (rincian bagian 6): alur kereta/bus/pulang-pergi penuh, validasi inline, kursi bus, pembatalan, tema saat modal terbuka, konsol 0 error, screenshot visual; **responsif 1440/1000/785/540/390** via harness iframe same-origin (40 pengukuran 0 overflow, 2 tema); `cpp\build.bat` 51/51.
15. **(Sesi 21 Oktober 2026 lanjutan — "Log Proses Algoritma", urutan kerja):**
    1. **Audit kode** `algorithms.js`/`search.js`/`main.js`/`main.css` + riwayat PROGRESS (panel "Detail proses" lama sudah dihapus sesi 19 Okt lanjutan; proyek bukan git repo → tidak ada kode lama untuk dipulihkan, panel dibangun ulang segar dengan isi lebih detail).
    2. **Rekam langkah di dalam loop** (tanpa mengubah algoritma/hasil): `linearSearch()` kini mengembalikan `steps` (`visit` per elemen: indeks, item, verdict, perbandingan kumulatif); `bubbleSort()` kini mengembalikan `steps` (`swap` per pertukaran dgn pasangan data sebelum tukar + `pass` per iterasi: perbandingan, pertukaran, elemen terkunci, `earlyStop`); `searchTicketsWithLog()`/`sortTickets()` meneruskan `steps` ke objek log (skema = superset, `makeEmptyLog` dapat `steps: []`).
    3. **Komponen baru `algorithmLogPanel.js`**: `<details id="algoLogPanel">` dgn summary "Log Proses Algoritma", dua bagian berjudul ("Log Pencarian (Linear Search)" / "Log Pengurutan (Bubble Sort)"), entri per-leg ("Pencarian tiket pergi/pulang", "Tiket pergi/pulang"), chip statistik, daftar langkah bernomor (verdict cocok hijau / tidak cocok muted; baris tukar dgn nilai harga/jam/durasi via `criterionKey`), cap 30 langkah + catatan sisa di console, pesan kosong muted; label tiket `${id} · ${moda} ${operator} ${jam}`.
    4. **Wire di `main.js`**: `state.lastSearchLogs` diisi `runSearch()` (console.info lama TETAP); `renderResults()` membangun panel sekali — cabang hasil kosong menyematkan panel setelah empty-state, cabang berisi menempelkannya setelah grid — `updateSearchLogs()` dipanggil saat mount; `redraw()` mereset & mengumpulkan `sortLogEntries` dari `applyFilterSort()` lalu `updateSortLogs()` di akhir (ganti urutkan/filter ikut terlihat); komentar "tanpa panel di halaman" yang usang diperbarui.
    5. **CSS §18**: gaya panel memakai token tema (`--surface`/`--border`/`--bg-alt`/`--text-muted`/`--accent`) sehingga otomatis menyesuaikan mode terang/gelap; chevron CSS pada `summary::before`, `.algo-log-steps` border kiri teal + scroll `max-height:260px`, `@media 640` untuk ponsel.
    6. **Verifikasi browser (dev server 3001, data 902 tiket)**: pencarian kereta Gambir→Surabaya **31 kartu** (hasil tidak berubah) + panel terlipat bawaan di posisi terakhir hasil; log pencarian menampilkan **902 tiket diperiksa / 1089 perbandingan / 31 ditemukan** dgn langkah nyata (tiket pertama = pesawat "tidak cocok", `TKT-KRA-001` "cocok · 14 perbandingan kumulatif"); log sorting **455 perbandingan / 204 pertukaran** dgn baris tukar berisi pasangan tiket + harga; ganti ke "Keberangkatan paling akhir" → badge/baris tukar (tanggal+jam)/ringkasan ikut berubah; **pulang-pergi** → 2 entri log pencarian ("pergi" 6 tiket, "pulang" 0 + hint tanggal berjadwal) + 2 entri log sorting per-leg; filter harga Rp500.000 → log mencerminkan data terfilter (6→4 & 5→3 tiket diurutkan); hasil 0 (Gambir→Bandung tanpa jadwal) → panel tetap tampil dgn log lengkap; baris "Pass N selesai · … loop berhenti dini karena data sudah terurut" (optimasi early-exit) terverifikasi pada daftar kecil; tema gelap & terang dilihat lewat screenshot (chip, angka, verdict terbaca di keduanya); **konsol 0 error**.
    7. **Tes & build**: `npm.cmd run test` → **89/89 lulus** (tanpa perubahan tes — penambahan `steps` skema kompatibel); `npm.cmd run build` → sukses **18 modul** (modul panel baru ikut terbundel); `cpp\build.bat` → **51/51 exit 0**.

---

## 6. Hasil pengujian yang SUDAH benar-benar dijalankan

> **Catat:** blok pengujian pertama di bawah adalah rekaman **sesi lama** saat data
> masih 108/112 tiket. Angka **TERKINI** (902 tiket) ada pada blok
> **"Sesi 19 Oktober 2026 lanjutan"**, dan pengujian **paling baru** ada pada blok
> **"Sesi 21 Oktober 2026 lanjutan — Log Proses Algoritma"** tepat sebelum "Build"
> (panel log di halaman hasil, log per langkah algoritma, ganti sorting/filter,
> pulang-pergi, hasil 0, 2 tema); sebelumnya blok
> **"Sesi 21 Oktober 2026 — Penyempurnaan Tiketin"** (alur stepper penuh, uji
> kursi/pulang-pergi, responsif 5 lebar × 2 tema); blok
> **"Sesi 20 Oktober 2026 — peningkatan visual"** merekam sesi sebelumnya.

**Audit data (impor modul lewat browser — sesi sebelumnya, saat data 108 tiket)**
- 108 tiket; **0 masalah integritas**: ID unik, kota asal/tujuan valid, id lokasi ada & tipenya cocok transportasi, kota lokasi = kota tiket, kelas terisi, tanggal valid.
- **Konsistensi jadwal**: `arrivalTime - departureTime === duration` untuk **semua 108 tiket** (setelah 4 perbaikan data lama); `bookedSeats.length === capacity - availableSeats` untuk semua bus.
- **Setiap tiket ditemukan** oleh pencarian rute+tangganya (mode kota dan mode lokasi): 0 tiket yang lolos dari pencarian.
- Cakupan: 39 rute, **0 rute dengan hanya 1 tanggal**, 12 tanggal terisi; `findAvailableDates({Jakarta→Denpasar, plane})` = `["2026-10-20","2026-10-22","2026-10-24"]` sesuai data.
- Tidak ada duplikat (rute+tanggal+jam) maupun duplikat nomor penerbangan; tidak ada harga ≤0 / kursi <1.

**Browser (Vite dev server, interaksi DOM sungguhan — sesi sebelumnya, saat data 108 tiket)**
- **Regresi lama tetap lulus**: Pesawat CGK→DPS **20 Okt → 3 kartu** (Rp990.000 → Rp1.350.000 → Rp1.450.000 urut `price_asc`); log *"108 dari 108 tiket diperiksa"*, 141 perbandingan, ringkasan 3 tiket; log pengurutan *"3 data, 3 perbandingan, 3 pertukaran"*.
- **Hasil pada tanggal baru (dulu 0)**: Pesawat CGK→DPS **22 Okt → 1 kartu** (Lion Air 09:45, Tiket `TKT-PLW-011`).
- **Tanggal tanpa data tetap 0 + petunjuk**: CGK→DPS **25 Okt → 0 kartu**, empty-state *"Jadwal pergi tersedia pada tanggal: 20 Okt 2026, 22 Okt 2026, 24 Okt 2026. Pilih salah satu tanggal tersebut."*, log ringkasan juga memuat daftar tanggal yang sama; tidak ada tiket fiktif.
- **Berbagai rute & tanggal**: form "Semua" Jakarta → Denpasar tanpa tanggal → **5 kartu lintas 3 tanggal** (20, 22, 24 Okt); pencarian Jakarta→Denpasar tanggal 24 Okt → 1 kartu (log 108 dari 108, 157 perbandingan).
- **Sorting (5 tiket Jakarta→Denpasar)**: `price_desc` → Rp1.565.000 → Rp990.000 (**10 perbandingan, 6 pertukaran**); `departure_earliest` → 07:15 → 13:15 (**4 perbandingan, 0 pertukaran**); `duration_fastest` → 1j 40m → 2j 00m (**10 perbandingan, 4 pertukaran**); urutan kartu benar-benar berubah antar opsi.
- **Filter harga**: min Rp1.400.000 → 5 → **3 kartu**.
- **Regresi pulang-pergi (Kereta Gambir↔Gubeng)**: pergi 20 Okt + pulang 25 Okt → **"2 jadwal pergi · 1 jadwal pulang"**; pulang 24 Okt → "2 jadwal pergi · **0** jadwal pulang" + pesan *"Jadwal pulang tersedia pada tanggal: 25 Okt 2026, 27 Okt 2026, 29 Okt 2026."*
- **Pemesanan pesawat**: sort `price_desc` → pilih Batik Air (tiket baru `TKT-PLW-012`, BI-114) → modal detail → form → total **Rp1.565.000** → kode **JL-20261014-JFUA** tersimpan di localStorage `tiketin_orders` → muncul lengkap di "Pesanan Saya".
- **Pemesanan bus + peta kursi**: Bus Jakarta→Bandung 21 Okt → 2 kartu (Rosalia 16 kursi, CitiTrans 12 kursi) → peta kursi **40 tombol, 24 terkunci** (sesuai `bookedSeats` data) → pilih kursi 7A → kode **JL-20261014-Q5JH**, total Rp110.000, kursi 7A tercatat di pesanan.
- **Pembatalan**: batalkan pesanan bus → badge "Dibatalkan" + toast *"Pesanan … berhasil dibatalkan."*; pesanan lain tetap "Dikonfirmasi".
- Halaman Beranda (kartu fitur menampilkan **"108 jadwal simulasi"**) & Pesanan Saya dirender normal; **konsol browser 0 error, 0 warning**.

**Audit data (skrip Node `audit.mjs` di folder temp, sesi lanjutan — prioritas 2)**
- **112 tiket** (pesawat 40, kereta 36, bus 36) → **0 masalah**: ID unik; format tanggal `2026-10-DD`; kota asal/tujuan ada di `cities.js`; `origin/destinationLocationId` sesuai transportasi dan kota lokasi = kota tiket; `arrivalTime - departureTime === duration` untuk **semua** tiket; `bookedSeats` tanpa duplikat dan `capacity - bookedSeats === availableSeats` untuk semua bus; harga > 0; kursi ≥ 1; **36 nomor penerbangan semuanya unik** (termasuk 4 tiket baru).
- **41 rute unik, 0 rute dengan <2 tanggal**; 12 tanggal terisi dengan distribusi **7/5/8/10/12/13/14/13/9/10/6/5** tiket per tanggal (20…31 Okt); tiket HLP tercatat: `TKT-PLW-037` (HLP→DPS 23 Okt), `TKT-PLW-038` (27 Okt), `TKT-PLW-039` (DPS→HLP 25 Okt), `TKT-PLW-040` (31 Okt).

**Autocomplete asal/tujuan (browser, DOM sungguhan, sesi lanjutan — prioritas 2)**
- **Tab Pesawat, ketik "ja"** pada kota asal → daftar `role=listbox` muncul **hanya saat mengetik**, berisi **Jakarta** ("DKI Jakarta · 2 bandara") dan **Surabaya** ("Jawa Timur · 1 bandara"); kota tanpa bandara (Bogor dsb.) tidak muncul; `aria-expanded=true`, jumlah ≤ batas 8.
- **Pilih Jakarta** → input terisi "Jakarta", `<select>` bandara **aktif** dan hanya berisi placeholder "— Pilih bandara di Jakarta —", **Soekarno-Hatta (CGK)**, **Halim Perdanakusuma (HLP)**; fokus otomatis pindah ke select; daftar saran tertutup.
- **Tab Kereta**: Jakarta → hanya Gambir & Pasar Senen; Surabaya → hanya Surabaya Gubeng. **Tab Bus**: Jakarta → hanya Terminal Pulo Gebang. **Form "Semua"**: ketik "a" → **tepat 8 saran** dari 77 kota dan tidak ada lagi `<select>` 77 opsi.
- Sebelum kota dipilih, select lokasi **disabled** "— Pilih kota terlebih dahulu —"; mengubah teks kota (tanpa memilih saran) mereset select ke kondisi terkunci itu.
- **Pencarian memakai lokasi spesifik**: HLP → DPS, 23 Okt → **1 kartu** (`TKT-PLW-037`, Citilink QG-611, 06:45–08:40, Rp1.290.000); log: *"Asal: Bandara Halim Perdanakusuma (HLP)"*, *"Data diperiksa: 112 dari 112 tiket"*, 121 perbandingan.
- **Validasi**: kota tujuan dipilih tapi lokasi belum → submit → toast **"Pilih lokasi tujuan terlebih dahulu."** dan **0 kartu** (pencarian tidak pernah jalan dengan lokasi kabur).
- **Rute tanpa jadwal**: HLP→DPS 25 Okt → 0 kartu + petunjuk *"Jadwal pergi tersedia pada tanggal: 23 Okt 2026, 27 Okt 2026. Pilih salah satu tanggal tersebut."*

**Regresi menyeluruh (browser, sesi lanjutan — prioritas 3)**
- **Pra-isi kartu destinasi**: kartu "Yogyakarta" → kota terisi + lokasi otomatis `station-yogyakarta` (auto-pilih lokasi pertama kota, sama seperti perilaku form lama); kartu "Bali" (Denpasar) saat tab Kereta aktif → select terkunci *"— Pilih stasiun di Denpasar —"* (jujur: Denpasar tak punya stasiun di data simulasi).
- **Restore form** (Beranda → Cari Tiket): tab Kereta aktif, asal `Jakarta`/`station-gambir`, tujuan `Surabaya`/`station-gubeng`, 20 Okt, pulang 21 Okt, radio pulang-pergi ikut tercentang, hasil dirender ulang *"2 jadwal pergi · 0 jadwal pulang ditemukan"* + judul *"Hasil: Stasiun Gambir → Stasiun Surabaya Gubeng · Sel, 20 Okt 2026 (Pulang-pergi)"*.
- **Form "Semua"** Jakarta → Denpasar tanpa tanggal → **7 kartu lintas 5 tanggal** (20, 22, 23, 24, 27 Okt; naik dari 5 kartu/3 tanggal karena 2 tiket HLP); log Linear Search *"112 dari 112 tiket"*, **176 perbandingan**, 7 hasil.
- **Pesawat CGK→DPS 20 Okt → 3 kartu** tetap (urutan `price_asc`: Rp990.000 → Rp1.350.000 → Rp1.450.000).
- **Sorting (7 kartu Jakarta→Denpasar)** — semua 4 opsi diuji, urutan kartu & log berubah nyata: `price_asc` **21 perbandingan / 12 pertukaran** (Rp990.000 → Rp1.565.000); `price_desc` **20 / 8** (Rp1.565.000 → Rp990.000); `departure_earliest` **11 / 1** (07:15 → 19:40); `duration_fastest` **20 / 5** (1j 40m → 2j 00m).
- **Filter harga** Rp1.350.000–Rp1.500.000 pada 3 hasil CGK→DPS → **2 kartu** (Rp1.350.000, Rp1.450.000); angka "3 jadwal ditemukan" tidak ikut berubah karena dihitung sebelum filter (perilaku lama, lihat bagian 7).
- **Pulang-pergi kereta Gambir↔Gubeng**: pergi 20 + pulang 25 Okt → **"2 jadwal pergi · 1 jadwal pulang"**; pulang 21 Okt → 0 pulang + *"Jadwal pulang tersedia pada tanggal: 25 Okt 2026, 27 Okt 2026, 29 Okt 2026. Ubah tanggal pulang atau pilih sekali jalan."*
- **Bus Jakarta→Bandung 21 Okt → 2 kartu**; peta kursi **40 tombol, 24 terkunci**; klik kursi **7A** → kode **JL-20261014-0QSX**, total Rp110.000, kursi 7A tercatat, tampil di Pesanan Saya.
- **Pemesanan pesawat** CGK→DPS 20 Okt (Super Air Jet XT-455, Rp990.000, Budi Santoso) → kode **JL-20261014-A5V8**, tampil lengkap di Pesanan Saya.
- Tombol **⇄** diuji dua arah pada form bus: `Jakarta`/`terminal-pulo-gebang` ↔ `Bandung`/`terminal-leuwipanjang` bertukar kota **dan** lokasi, tukar-balik kembali semula.
- Halaman Beranda kini menampilkan **"112 jadwal simulasi"**; sepanjang sesi & pada reload akhir **konsol 0 pesan (0 error, 0 warning)**.

**Sesi 19 Oktober 2026 — data 694 tiket, 6 opsi sorting, logo baru (SEMUA dijalankan sesi ini)**

*Audit data (skrip Node di folder temp, diulang setelah apply):*
- `audit.mjs` → **694 tiket** (pesawat 248, kereta 226, bus 220), **0 masalah**: ID unik; `arrivalTime − departureTime === duration` untuk **semua** tiket; `capacity − bookedSeats === availableSeats` semua bus; HLP tetap 32 tiket.
- `audit-data.mjs` → 160 kombinasi rute+tanggal: distribusi **`{"4":109,"5":48,"6":3}`**, **0 kombinasi < 4**; kota-pasangan+tanggal pun semua ≥4 (maks 9 = Denpasar→Jakarta 25 Okt lintas CGK+HLP); 694 ID unik; 26 tanggal (1–14 & 20–31 Okt; **15–19 Okt kosong**); 41 rute.

*Sorting (skrip Node `sort-test.mjs` + verifikasi UI):*
- Pencarian **CGK→DPS 20 Okt = 6 tiket** (log: `visited=694`, found=6); **semua 6 kriteria** menghasilkan urutan benar: `price_asc` Rp990.000→Rp1.715.000 (12 perbandingan/5 pertukaran), `price_desc` kebalikan (15/10), `departure_earliest` 05:35→21:45 (15/9), `departure_latest` kebalikan (12/6), `duration_fastest` 1j 50m→2j 20m (9/2), `duration_slowest` kebalikan (15/7); **urutan kartu berbeda antar kriteria**; **array sumber tidak pernah dimodifikasi**; kasus **n=1**: 0 perbandingan/0 pertukaran; `bubbleSort([3,2,1])` → `1,2,3` (3/3).
- **16 Okt (tanpa jadwal) → 0 hasil** + hint *"Jadwal pergi tersedia pada tanggal: 1 Okt, 4 Okt, 11 Okt, 20 Okt, 22 Okt, 24 Okt"* (jendela lama+baru tercampur, sesuai data); **CGK→DPS 4 Okt (jendela awal) = 5 tiket**; **HLP→DPS 25 Okt tetap 0** (cela uji lama dipertahankan).

*Browser (interaksi DOM sungguhan via tool browser):*
- **Pesawat CGK→DPS 20 Okt → 6 kartu** (Super Air Jet Rp990.000 … Lion Air Bisnis Rp1.715.000; **6 operator berbeda**; jam 05:35–21:45 unik); halaman Beranda menampilkan **"694 jadwal simulasi"**; log Linear Search *"Data diperiksa 694 dari 694 tiket"*.
- **Dropdown kini 6 opsi**; siklus penuh keenam opsi dijalankan lewat handler UI asli (set select → Terapkan) → urutan kartu berubah benar per kriteria (harga naik/turun, jam naik/turun, durasi naik/turun); **pertukaran tiap kriteria nyata & berbeda**: 5/10/9/6/2/7 — persis hitungan Node. Log pengurutan terakhir: *"Bubble Sort — Kriteria: Durasi perjalanan terlama, Jumlah data 6, **Perbandingan 15, Pertukaran 7**, Ringkasan: 6 tiket terurut: 2j 20m → 1j 50m"*.
- **Bus Pulo Gebang→Giwangan 20 Okt → 6 kartu** (Rp210.000–Rp380.000, jam 10:15–23:15); form "Semua" **Jakarta→Denpasar 20 Okt → 6 kartu**; filter harga Rp300.000–Rp500.000 pada pulang-pergi → pergi **6→2**, pulang **5→2**, log sort n=2 (1 perbandingan, 0 pertukaran) — teks "6 jadwal pergi · 5 jadwal pulang" tidak ikut berubah karena dihitung sebelum filter (perilaku lama, §7 no.10).
- **Hasil 1 tiket aplikasi tetap jalan**: filter min=max Rp1.380.000 → **1 kartu** + log *"Jumlah data 1, Perbandingan 0, Pertukaran 0, Ringkasan: 1 tiket terurut: Rp1.380.000"* (tanpa klaim berlebihan).
- **Pulang-pergi kereta Gambir↔Gubeng** pergi 20 Okt + pulang 25 Okt → **"6 jadwal pergi · 5 jadwal pulang"** (sebelumnya 2·1) — regresi roundtrip setelah data tumbuh lulus.
- **Pemesanan setelah sorting**: urut `price_asc` → pilih kartu pertama (Garuda Indonesia CGK→DPS 4 Okt, GA-119, Rp1.320.000, Budi Santoso) → **kode JL-20261019-7484** muncul lengkap di "Pesanan Saya" (badge Dikonfirmasi).
- **Logo**: navbar & footer memakai `logo-icon.svg` (badge gradien + tiket + pin) tampil benar; hero halaman utama menampilkan mark 64px; **dark mode** (toggle tema gelap) logo tetap kontras; **mode ponsel 390px** (uji via halaman sementara `mobile-frame.html` berisi iframe 390px, dihapus setelah uji — tool browser tanpa pengaturan viewport): logo navbar 30px + hamburger, hero 52px, layout rapi. `favicon.svg` & `logo-full.svg` tersaji **200 image/svg+xml**.
- **Insiden jujur & perbaikan**: `logo-icon.svg` sempat *broken image* karena komentar XML memuat teks `--primary` (dua tanda hubung berturut dilarang di komentar XML); komentar ditulis ulang → ketiga SVG lolos validasi XML `[xml]` dan tampil normal setelah reload.
- **Konsol 0 error** pada seluruh percobaan (reload awal, pencarian, sorting, pemesanan, dark mode, navigasi); halaman beranda & hasil dirender normal.

**Sesi 19 Oktober 2026 lanjutan — 902 tiket, chip tanggal alternatif, panel dihapus, logo maskot (SEMUA dijalankan sesi ini)**

*Audit & helper Node (skrip `test-helpers.mjs`, `audit-data.mjs`, `audit-cgksub.mjs` di folder temp):*
- `audit-data.mjs` → **902 tiket**, 902 ID unik, **212 kombinasi rute+tanggal semua ≥4 tiket** (distribusi `{"4":161,"5":48,"6":3}`), **0 masalah**; per jenis: pesawat 372, kereta 282, bus 248 (diverifikasi langsung dari modul, bukan perkiraan ID).
- `findAvailableDates` CGK→SUB = **6 tanggal**; **CGK→SUB 28 Okt = 4 tiket** (masalah awal sesi teratasi).
- `test-helpers.mjs` (16 asersi, **semua lulus**): `sortDatesByProximity` — 28 Okt → `[28,27,29,21,20]` (jarak 0 di depan), 26 Okt → `[27,28,29,21,20]`, **tie H−1/H+1 → tanggal lebih awal di depan**, tanpa tanggal pilihan → urutan menaik, input `null` aman; `formatLongDate("2026-10-28")` = **"28 Oktober 2026"**; `findAlternativeRoutes` (HLP→YIA tanpa data) → **5 rute, 0 duplikat, rute pencarian sendiri tidak disertakan, skor kecocokan menaik** (CGK→YIA skor 0 dulu — kota asal & tujuan sama beda bandara — lalu 4 rute berawal Jakarta), semua kandidat punya tanggal >0, `buildReturnCriteria` tetap terbalik.

*Browser (interaksi DOM sungguhan via tool browser, dev server port 3001):*
- **CGK→SUB 28 Okt (form Pesawat) → "4 jadwal ditemukan" + 4 kartu** (Garuda dsb., CGK→Juanda) — kasus 0 tiket awal sesi **teratasi**; **panel `.process-details` tidak ada** (`processPanelExists: false`); dropdown urutkan tetap ada.
- **Console**: `"[Tiketin] Log pencarian Linear Search:"` (Array log) dan `"[Tiketin] Log pengurutan Bubble Sort — Hasil pencarian/Tiket pergi/Tiket pulang:"` tercatat nyata tiap pencarian/sorting; sepanjang sesi **0 error, 0 warning** di konsol.
- **CGK→SUB 15 Okt (tanpa tiket) → "0 jadwal ditemukan"** + judul **"Tidak ada tiket untuk tanggal 15 Oktober 2026."** + **6 chip** terurut kedekatan: `[21, 24, 4, 26, 28, 31 Okt]` (jarak 6/9/11/11/13/16; **tie 4 vs 26 Okt → 4 Okt di depan** ✓); tiap chip punya `aria-label` "Cari tiket pada …"; tidak ada blok rute lain (rute ini punya jadwal).
- **Klik chip "21 Okt 2026"** → pencarian ulang otomatis → **"4 jadwal ditemukan" + 4 kartu**, input `#searchDateInput` ikut terbarui **2026-10-21**, empty-state hilang.
- **Rute tanpa jadwal (HLP→YIA 28 Okt)** → judul tanggal + petunjuk **"Belum ada jadwal simulasi untuk rute Bandara Halim Perdanakusuma (HLP) → Bandara Internasional Yogyakarta (YIA) (Pesawat)."** + blok **"Rute lain yang tersedia (bukan hasil pencarian Anda):"** berisi **5 rute informatif** (CGK→YIA 3 tanggal; CGK→DPS, CGK→SUB 6 tanggal; CGK→KNO, CGK→SUP 4 tanggal) — tidak dianggap hasil cocok; 0 chip (rute memang tanpa data).
- **Sorting**: 6 opsi terdaftar; ganti ke "Keberangkatan paling awal" → urutan jam kartu berubah `[05:40, 09:55, 19:20, 14:25]` → `[05:40, 09:55, 14:25, 19:20]` (dari urutan harga termurah); log Bubble Sort baru tercatat di console.
- **Pulang-pergi (Pesawat CGK→SUB, pergi 4 Okt + pulang 15 Okt)** → **"4 jadwal pergi · 0 jadwal pulang ditemukan"**; grid pulang menampilkan **"Tidak ada jadwal pulang pada tanggal yang dipilih."** + **chip pulang inline "Tanggal pulang lain yang tersedia:"** `[22, 5, 25, 29 Okt]` (proximitas dari 15 Okt; tie 5 vs 25 → 5 Okt di depan) + hint "Pilih tanggal lain di atas atau ubah pencarian ke sekali jalan." **Klik chip "22 Okt 2026"** → **"4 jadwal pergi · 4 jadwal pulang"** (4+4 kartu; kartu pulang Lion Air SUB→CGK ✓), input `#searchReturnDateInput` = **2026-10-22**.
- **Validasi lama tetap bekerja**: pergi 28 Okt + pulang 15 Okt (pulang < pergi) → ditolak `validateSearchCriteria` (toast, pencarian tidak dijalankan, hasil lama tetap) — sesuai desain.
- **Form "Semua" (kota)**: Jakarta→Pontianak 15 Okt → judul tanggal + **4 chip** `[8, 24, 26, 28 Okt]` (proximitas dari 15 Okt ✓); klik "24 Okt 2026" → **4 kartu** (Sriwijaya CGK→SUP dsb.), input tanggal = 2026-10-24.
- **Aset**: `fetch` `/favicon.svg`, `/images/logo-icon.svg`, `/images/logo-full.svg` semuanya **HTTP 200**.
- **Screenshot visual (dilihat langsung)**: logo maskot tampil di navbar 30px (wajah terbaca) & hero 64px; halaman hasil menampilkan kartu + kontrol urutkan **tanpa panel log**; empty-state chip pil rapi; blok rute lain tersusun rapi; logo final (pesawat lega dari sudut badge).

**Sesi 20 Oktober 2026 — peningkatan visual (semua dijalankan nyata di browser, dev server port 3001):**
- **Beranda (verifikasi DOM)**: `hero-title` = **"Perjalanan Seru, Semudah Itu."**, subjudul = **"Temukan tiket pesawat, kereta api, dan bus untuk perjalananmu di berbagai kota Indonesia."**; 3 `.hero-badge` berupa **BUTTON** (Pesawat/Kereta Api/Bus); 4 `.benefit-card` + **4 ikon SVG**; 4 `.dest-cta` "Cari jadwal →"; footer 4 kolom (`footer-brand/links/links/footer-info`); font body **"Plus Jakarta Sans"**.
- **Chip kategori hero**: klik "Kereta Api" → halaman Cari Tiket, tab aktif **"Kereta Api"**, form `data-form-kind="train"` ✓.
- **Tautan footer**: "Pesan Tiket Bus" → tab aktif **"Bus"** ✓; "Pesanan Saya" → judul **"Pesanan Saya"** + empty-state ✓; **0 tautan `href="#"` tanpa `data-page`** (logo navbar & footer ikut `data-page="home"`).
- **Pencarian & sorting**: Jakarta→Surabaya **28 Okt** (form Semua) → **"4 jadwal ditemukan" + 4 kartu**; `departure_earliest` → jam **[05:40, 09:55, 14:25, 19:20]** (terurut ✓); `price_asc` → **[Rp1.050.000, Rp1.120.000, Rp1.260.000, Rp1.690.000]** ✓; dropdown tetap punya 6 opsi.
- **Empty-state**: 15 Okt → judul **"Tidak ada tiket untuk tanggal 15 Oktober 2026."** + **14 chip tanggal**; klik chip "21 Okt 2026" → pencarian ulang **4 kartu**, `#searchDateInput` = **2026-10-21** ✓.
- **Pemesanan penuh**: pilih tiket → modal detail → modal booking (isi kontak + textarea penumpang) → **modal sukses terbuka** dengan kode **`JL-20261020-AU8Q`** (toast "Pesanan … berhasil dibuat"); kartu pesanan: status **"Dikonfirmasi"**, total **Rp1.050.000**.
- **Pembatalan berkonfirmasi (dua langkah)**: klik "Batalkan Pesanan" → `order-cancel-confirm` **muncul**; klik "Tidak" → **hilang lagi**, tombol batal kembali; klik lagi + "Ya, Batalkan" → status **"Dibatalkan"**, kelas kartu `cancelled` ✓, **tombol batal hilang** ✓.
- **Tema gelap**: `data-theme=dark` → body `rgb(13,21,38)`, kartu `rgb(20,33,58)`, badge status `rgba(220,38,38,0.16)` (override §16 bekerja), navbar `rgba(13,21,38,0.9)`; **modal sukses di tema gelap otomatis memakai `logo-full-light.svg`** (wordmark terang terbaca — diverifikasi screenshot).
- **Aksesibilitas**: semua field form punya `<label>` terkait (**0 tak berlabel**); **0 `<img>` tanpa `alt`**; `prefers-reduced-motion` ada di CSSOM; **0 scroll horizontal** (viewport 785px); **fokus keyboard nyata (Tab)** → chip hero outline **solid 2.4px `rgb(96,165,250)` offset 1.6px**; tinggi tautan footer **33px** (setelah perbaikan; sebelumnya 18px).
- **Aset & konsol**: `network.list` → **0 aset status ≥400**; `console(level=error)` → **0 pesan** di semua halaman (beranda, Cari Tiket, Pesanan Saya, hasil, modal).
- **Screenshot visual (dilihat langsung)**: beranda hero (foto + maskot 72px + tagline + chip), destinasi 4 kolom + CTA, manfaat 4 kartu berikon, footer ringkas, halaman hasil (kartu + toolbar), pesanan terang (grid + total), pesanan gelap, empty-state + chip, form kereta, modal sukses terang (logo-full) & gelap (logo-full-light).

**Sesi 20 Oktober 2026 lanjutan — wordmark path, sinkron tema-modal, responsif 4 lebar, unit test Vitest (SEMUA dijalankan sesi ini, dev server port 3001):**
- **Wordmark → path (verifikasi visual)**: `/images/logo-full.svg` dibuka langsung di browser → "Tiket" navy + "in" teal tampil dengan bentuk huruf identik webfont (outline berasal dari TTF Plus Jakarta Sans ExtraBold resmi); varian light sama; **0 elemen `<text>` tersisa** di `public/`; berkas EOT asli tervalidasi (`numTables=16`, 781 glyph, semua huruf "Tiketin" tersedia).
- **Modal sukses + sinkron tema (uji langsung)**: alur penuh Jakarta→Surabaya 28 Okt → Pilih Tiket → Pesan Sekarang → Konfirmasi → **modal sukses terbuka** (kode `JL-20261020-99XP`, pengulangan `JL-20261020-XTJE`); src brand `/images/logo-full.svg` di tema terang ✓; **klik `#themeToggle` satu kali saat modal terbuka** → `data-theme=dark`, `localStorage.tiketin_theme=dark`, toast "Mode gelap aktif.", modal tetap terbuka, dan **src brand langsung berganti ke `/images/logo-full-light.svg`** — screenshot menampilkan wordmark terang ("Tiket" terang + "in" mint) di modal gelap ✓; toggle kembali → src pulih. *Insiden jujur*: percobaan pertama tampak "toggle balik lagi" karena **HMR Vite mengeksekusi ulang modul tanpa reload penuh sehingga listener klik ganda** — setelah reload penuh, satu klik = satu perubahan; artefak dev server, bukan bug aplikasi.
- **Responsif 4 lebar (iframe harness di dalam tab, jendela 800×670, `#app` asli disembunyikan agar harness bersih)**:
  - **1000px** (`transform:scale(0.8)`; `innerWidth=1000`, `mq992` tidak aktif → nav link penuh, form 3 kolom): **0 overflow horizontal**, **0 kontrol <32px**, hero+form & footer (4 kolom/2×2) tampil benar.
  - **785px** (`mq860` aktif → hamburger; form 2 baris): pencarian → **4 kartu**; panel detail muat (0–770 dari 785); halaman pesanan **5 kartu** rapi; **footer 2 kolom** (screenshot).
  - **540** (`innerWidth=540`, `mq540` aktif): home rapi (chip 2 baris); hasil + toolbar full-width; **panel booking 22–518, semua field 44px**; pesanan rapi; **tema gelap konsisten** (navbar navy, ikon bulan, form gelap); **footer 1 kolom**.
  - **390** (`innerWidth=390`): 0 overflow; kartu hasil rapi (operator "Garuda Ind…" terpotong elipsis wajar); **alur booking penuh di 390px → kode `JL-20261020-Y6WG`**, panel booking 19–371, **modal sukses muat + wordmark tampil**; pesanan **6 kartu** 1 kolom (kode pesanan wrap rapi); tema gelap OK; **footer 1 kolom** + copyright.
- **Koreksi kejujuran saat menguji (bukan bug aplikasi)**: (a) satu screenshot menampilkan badan modal "kosong" — DOM berisi `.trip-detail` 538px; screenshot ulang setelah paint menampilkan isi lengkap → artefak tangkapan transisi; (b) `contentWindow.innerWidth` kadang tertinggal satu panggilan dari perubahan `style.width` — keputusan diambil dari screenshot + `matchMedia`, bukan satu angka; (c) `zoom` pada iframe **tidak dipakai** karena media query internal tidak ikut (terbukti navbar berubah hamburger padahal innerWidth 1000) → pindah ke `transform:scale`; (d) `document.body.scrollHeight` = 0 setelah `#app` disembunyikan → ukur scroll lewat `documentElement`; (e) menutup modal mengembalikan fokus ke tombol "Pilih" sehingga scroll parent ikut ke atas → blur dulu sebelum scroll untuk screenshot footer.
- **Unit test (Vitest 2.1.9, environment node)**: `npm.cmd test` → **Test Files 5 passed (5) · Tests 78 passed (78)** — `search.test.js` 18, `sorting.test.js` 21, `validation.test.js` 15, `booking.test.js` 18, `theme.test.js` 6; durasi total ±2,9 detik. 5 kegagalan putaran pertama semuanya **ekspektasi tes yang salah** (tidak ada bug aplikasi; logika bisnis tidak diubah).
- **Konsol**: `console(level=error)` → **0 pesan** di seluruh sesi (setelah reload penuh & sepanjang harness responsif).

**Sesi 21 Oktober 2026 — Penyempurnaan Tiketin (SEMUA dijalankan sesi ini, dev server port 3001):**

*Unit test (`npm.cmd test`, setelah seluruh kode berubah):*
- **Test Files 5 passed (5) · Tests 89 passed (89), 0 gagal** (naik dari78): `booking.test.js` **29** (fixture `validBooking` kini memuat `contactEmail` — perubahan skema sah karena email jadi wajib; +11 tes baru: `isValidEmail`, `isValidPhone`, `validatePassengerDetails` — skema lama tanpa data rinci lolos, bukan array/jumlah salah ditolak, nama/kategori/tgl lahir, tgl lahir masa depan ditolak, enum gender/identitas, kereta wajibkan identitas, nomor pesawat diformat bila diisi, simpanan `contactEmail`/`passengerDetails` **tanpa `identityNumber`**/`specialRequest`/`travelNotes`), `search`18, `sorting`21, `validation`15, `theme`6.

*Browser — alur form bertahap (interaksi DOM sungguhan):*
- **Kereta Bandung→Yogyakarta 21 Okt →23 kartu** → pilih → detail → modal booking: stepper **4 langkah** (Detail·Penumpang·Kontak·Konfirmasi; langkah 1 aktif `aria-current="step"`), ringkasan perjalanan + jumlah penumpang + total **Rp335.000**; tombol "Kembali" tersembunyi di langkah 1.
- **Validasi inline**: Lanjut dari kartu penumpang kosong → tetap di "Data Penumpang" + **4 error merah** ("Nama minimal 2 karakter.", "Tanggal lahir wajib diisi.", "Pilih jenis identitas.", "No. identitas wajib diisi (10-20 digit angka).") + 4 field `.is-invalid`; setelah diisi → error hilang. Kontak kosong/email salah → **3 error** ("Nama pemesan minimal 2 karakter.", "Email tidak valid (contoh: nama@domain.com).", "Nomor telepon wajib diisi.") + tetap di langkah Kontak; label bertanda **"Wajib"/"Opsional"**, kode negara default **+62**, blok "Informasi tambahan" tertutup awal lalu dibuka & ikut tersimpan.
- **Kembali 3 langkah → Detail → maju lagi 3**: semua isian **tetap utuh** (nama, lahir, no. identitas, email, telepon, permintaan bantuan, jumlah penumpang) — data tidak hilang.
- **Submit2 klik berturut → TEPAT1 pesanan** (`JL-20261021-O95W`, `ordersInStorage=1`) → modal sukses dgn tombol **"Lihat Detail Pesanan"** + "Kembali ke Beranda"; klik "Lihat Detail" → halaman Pesanan Saya, kartu tampil: badge Dikonfirmasi, rincian, penumpang "• Budi Santoso (Dewasa)", **"Identitas tercatat untuk1 penumpang."** (tanpa angka identitas — `identityLeak=false`), blok Pemesan, catatan privasi localStorage, **mask konfirmasi "KTP ••••0001"** (hanya4 digit terakhir).
- **Bus Jakarta→Bandung** (peta kursi nyata: **40 tombol,24 terkunci**) → stepper **5 langkah (ada Kursi)**; label identitas kelamin/identitas/no. identitas bertanda **"Opsional"**; Lanjut tanpa memilih kursi → **diblokir** dgn error "Pilih tepat1 kursi (sudah dipilih0)."; klik kursi bebas → **1 terpilih** → lanjut lolos → total **Rp110.000** → pesanan `JL-20261021-39VW` menyimpan `selectedSeats:["7A"]`, `contactName/contactPhone` (+62 812999888777 lolos validasi), `passengerDetails` gender/identitas `null` (bus), **tanpa `identityNumber`**.
- **Pulang-pergi kereta +3 penumpang**: radio Pulang-Pergi → grup tanggal pulang tampil/aktif; pergi `TKT-KRA-002`21 Okt + pulang KAI Lodaya24 Okt → dua grid "Pilih Pergi/Pilih Pulang" → bar ringkasan **"Total per penumpang Rp735.000 ·3 penumpang = Rp2.205.000"** → tombol "Lanjutkan ke Detail" aktif → modal booking **2 blok ringkasan Pergi & Pulang**; **3 kartu penumpang** (badge Dewasa, Dewasa, **Anak**) terisi penuh → konfirmasi: "Harga per orang: Rp380.000 pergi + Rp355.000 pulang", "Jumlah penumpang:3 orang (2 dewasa,1 anak)", **Total: Rp2.205.000** (=735.000×3 ✓) → pesanan `JL-20261021-JSMZ` (`roundTrip:true`, `returnLeg` lengkap, kategori `[adult,adult,child]`); kartu Pesanan Saya menampilkan **baris "Pulang:"** lengkap (Yogyakarta → Bandung, lokasi, operator, jadwal) ✓.
- **Pembatalan**: tombol Batalkan → panel konfirmasi dua langkah muncul → "Ya, Batalkan" → badge **"Dibatalkan"**, tombol batal hilang, pesanan tetap tampil, status localStorage `cancelled` ✓ (2 kartu lain tetap Dikonfirmasi).
- **Tema saat modal terbuka**: buka modal booking di tema gelap → `#themeToggle` **gelap→terang→gelap** (3×, modal tetap terbuka, tanpa error) → submit di gelap → brand modal sukses **`/images/logo-full-light.svg`**; toggle saat modal sukses terbuka → terang = **`logo-full.svg`**, gelap = **`logo-full-light.svg`** (sinkron via `toggleTheme→syncSuccessBrand`) → kembalikan tema terang (keadaan awal) ✓.
- **Warna tema terhitung** (uji nonaktifkan transisi sesaat): gelap → body `rgb(13,21,38)`, teks `rgb(232,238,252)`, kartu `rgb(20,33,58)`; terang → `rgb(255,255,255)`/`rgb(20,43,74)` — perbedaan terbukti; nilai identik pada pembacaan pertama ternyata **transisi CSS terjeda karena tab tidak terlihat** (bukan bug; tab aktif → normal).
- **Konsol** `console(level=error)` → **0 pesan** pada seluruh sesi (beranda, hasil,3 alur pemesanan, pesanan, tema).

*Responsif (harness iframe same-origin — tab menulis ulang dokumen berisi iframe `src="/"` selebar tepat *W*; media query di dalam iframe merespons lebar — diverifikasi `matchMedia`):*
- **5 lebar (1440/1000/785/540/390) × 4 konteks (beranda, hasil pesawat20 kartu, modal pemesanan langkah Penumpang, Pesanan Saya4 kartu) × 2 tema =40 baris**: **`documentElement.scrollWidth − clientWidth =0` di SEMUA baris** dan **0 elemen** melewati tepi viewport (pindai semua elemen visible); stepper `scrollWidth≤clientWidth` (fit) di semua lebar.
- **Breakpoint terbukti di dalam iframe**: tautan desktop3 → hamburger pada785; `mq640` aktif hanya di540 &390 (false di785/1000/1440); form beranda grid5-kolom di1440; kartu hasil2-kolom di800 (screenshot); footer/section rapi (0 overflow).
- **Screenshot mobile @390**: modal stepper — dot+label4 langkah muat, kartu penumpang1-kolom dgn label lengkap ("Nama Lengkap (sesuai identitas)", "Tanggal Lahir", "Jenis Kelamin OPSIONAL", dst). *Koreksi kejujuran*: screenshot pertama tampak label hilang — dicek langsung label `display:block, visible, color navy, 12.8px, rect ada` → murni artefak paint screenshot pertama, bidik ulang tampil sempurna.
- **Batasan jujur**: jendela browser nyata **800×670 (DPR1.25)** — screenshot hanya mungkin pada lebar itu (atau terskala via harness); bukan emulasi perangkat (UA/touch/DPR tidak disimulasikan); yang diuji = perilaku media query & tata letak terhadap lebar.

*Screenshot visual (dilihat langsung):*
- Beranda terang: hero foto kereta + judul putih terbaca + chip kategori + form melayang; navbar logo ikon baru34px; **hasil pencarian**2 kolom (filter bar + kartu KAI + harga + Pilih Tiket); **modal stepper**800px (4 dot langkah, kartu Penumpang1 + badge Dewasa, **4 error inline merah**, nav Kembali/Lanjut); **modal sukses** (ikon+wordmark baru, kode/rute/pulang-pergi/3 penumpang, **2 tombol footer kini sejajar**); **beranda gelap** (destinasi + navbar navy + toast "Mode gelap aktif."); **modal @390** (harness).

**Sesi 21 Oktober 2026 lanjutan — Log Proses Algoritma (SEMUA dijalankan sesi ini, dev server port 3001, data902 tiket):**

*Panel log di halaman hasil (interaksi DOM sungguhan):*
- **Pencarian kereta Gambir→Surabaya (tanpa filter tanggal)** → **31 kartu** (hasil identik sebelum/sesudah perubahan) + `#algoLogPanel` ada sebagai **anak terakhir** `#searchResults`, **terlipat bawaan** (`details.open=false`), dua bagian berjudul "Log Pencarian (Linear Search)" & "Log Pengurutan (Bubble Sort)".
- **Isi log pencarian** (entri "Pencarian tiket"): chip **Data diperiksa 902 tiket · Tiket dikunjungi 902 · Perbandingan 1089 · Tiket ditemukan 31**; baris langkah bernomor menampilkan **data nyata** ("TKT-PLW-001 · Pesawat Garuda Indonesia 07:15 — tidak cocok · 1 perbandingan kumulatif", dst); tiket cocok (`TKT-KRA-001` di indeks ke-9) dgn verdict **"cocok"** hijau + perbandingan kumulatif14 (lanjut cek tipe/tanggal/kelas/kursi); **cap 30 baris** + catatan "…872 langkah lainnya tetap tersedia di console (prefiks [Tiketin])".
- **Isi log pengurutan** (entri "Hasil pencarian"): badge **"Bubble Sort — Harga termurah"**, chip **31 tiket · 455 perbandingan · 204 pertukaran** (angka nyata:465 perbandingan maks → early-exit pass terakhir;204 = jumlah inversi), baris tukar berisi **pasangan tiket + harga** ("Pass 1 · tukar posisi2: … KAI Batara Kala 20:00 (Rp470.000) ↔ … KAI Turangga 08:30 (Rp450.000)"), ringkasan "31 tiket terurut: Rp395.000 → Rp715.000".
- **Ganti kriteria urutkan** (select → "Keberangkatan paling akhir", event `change`) → badge log jadi **"Bubble Sort — Keberangkatan paling akhir"**, baris tukar menampilkan tanggal+jam ("(20 Okt 2026 06:30)"), statistik berubah (345 perbandingan / 184 pertukaran), ringkasan "21:00 → 07:35"; **3 kartu pertama = 21:00, 15:45, 12:10** — urutan kartu TETAP benar (log hanya tampilan).
- **Pulang-pergi (pergi 20 Okt, pulang 21 Okt)** → **2 entri log pencarian** ("Pencarian tiket pergi":6 tiket ditemukan dgn ringkasan operator+harga; "Pencarian tiket pulang":0 ditemukan + **hint tanggal berjadwal** 6/13/25/27/29 Okt) + **2 entri log pengurutan** per-leg ("Tiket pergi"6 tiket, "Tiket pulang"0 tiket — keduanya dgn statistik & ringkasan sendiri). Ubah tanggal pulang ke25 Okt → leg pulang berisi (5 tiket) → semua entri ikut diperbarui.
- **Filter harga min Rp500.000** (submit toolbar) → log sorting mencerminkan **data yang benar-benar diurutkan**: "Tiket pergi"6→**4 tiket** (12→6 perbandingan,4 pertukaran), "Tiket pulang"5→**3 tiket** (9→3 perbandingan); kartu tampil sesuai filter.
- **Hasil 0** (Gambir→Bandung — rute memang tanpa jadwal di data) → empty-state + **panel tetap terpasang** dgn log pencarian lengkap (902 diperiksa / 965 perbandingan / 0 ditemukan) — langkah algoritma tetap dapat diperiksa pengguna saat pencarian gagal.
- **Optimasi early-exit terlihat**: daftar kecil (filter min Rp690.000 →5 tiket) → langkah akhir "Pass2 selesai ·3 perbandingan,0 pertukaran — **loop berhenti dini karena data sudah terurut**" (kata "karena data sudah terurut" menggantikan rumusan berulang sesudah draft pertama; diverifikasi ulang lewat HMR).
- **Tema gelap & terang** (screenshot dilihat langsung): panel gelap dgn latar `#14213a`/entri `#101c33`, nomor langkah biru400, verdict "cocok" hijau; terang dgn entri krem, chip putih bertepi, semuanya terbaca; token tema dipakai penuh (pembacaan `--surface` gelap = `#14213a`); panel **terlipat kembali otomatis** saat hasil dirender ulang (perilaku `<details>` alami).
- **Konsol** `console(level=error)` → **0 pesan** pada seluruh sesi (pencarian, sorting, filter, pulang-pergi, ganti tema, reload).

**Build**
- **Sesi 21 Okt 2026 lanjutan (Log Proses Algoritma)**: `npm.cmd run test` → **89/89 lulus** (tanpa perubahan tes); `npm.cmd run build` → sukses, **18 modul** (bertambah1: `src/components/algorithmLogPanel.js`), artefak `dist/assets/index-C2zJtMqH.js` (**455,67 kB**) + `index-DkNqYXv-.css` (**39,90 kB** — naik dari37,50 setelah §18 panel log); `cpp\build.bat` → **51 tes lulus, 0 gagal, "SEMUA TES LULUS", exit0** — ketiganya dijalankan **setelah** seluruh perubahan kode sesi ini.
- **Sesi 21 Okt 2026 (sesi ini)**: `npm.cmd run test` → **89/89 lulus**; `npm.cmd run build` → sukses, **17 modul**, artefak `dist/assets/index-69IoK45Q.js` (**449,82 kB**) + `index-DEBcV3UJ.css` (**37,50 kB** — naik dari31,59 setelah §17 stepper); `cpp\build.bat` → **51 tes lulus, 0 gagal, "SEMUA TES LULUS", exit0** — ketiganya dijalankan **setelah** seluruh perubahan kode sesi ini.
- **Sesi 20 Okt 2026 lanjutan**: `npm.cmd run build` → sukses, **17 modul** (modul baru `src/js/theme.js` ikut terbundel), artefak `dist/assets/index-DgZNHLL6.js` (**430,04 kB**) + `index-T2lPy_5w.css` (31,59 kB); `npm.cmd test` → **78/78 tes lulus**; `cpp\build.bat` → **51 tes lulus, 0 gagal, "SEMUA TES LULUS", exit code 0** — semuanya dijalankan **setelah** seluruh perubahan kode sesi ini.
- **Sesi 20 Okt 2026 (peningkatan visual)**: `npm.cmd run build` → sukses, **16 modul**, artefak `dist/assets/index-Dj0R9tFo.js` (**429,86 kB**) + `index-T2lPy_5w.css` (**31,59 kB**, naik dari 25,7 kB setelah tokens/toolbar/gaya baru); `cpp\build.bat` (MSVC `cl /EHsc /std:c++17 /W4`) dijalankan setelah kode JS/CSS/aset berubah → kompilasi sukses + **51 tes lulus, 0 gagal, "SEMUA TES LULUS", exit code 0** (kode C++ tidak berubah sesi ini; dijalankan **setelah** build Vite selesai, dev server aktif — tidak ada insiden watcher).
- *Sesi 19 Okt 2026 lanjutan*: `npm.cmd run build` → sukses, 16 modul, artefak `index-NtV1YcSF.js` (**426,11 kB**) + `index-WG3rssv-.css` (25,69 kB); `cpp\build.bat` → 51 tes lulus.

*Riwayat build sesi-sesi sebelumnya:*
- `cpp\build.bat` (MSVC) → **51 tes lulus, 0 gagal, exit code 0** (sesi 19 Okt pagi).
- **Insiden jujur (sudah diperbaiki)**: `cpp\build.bat` pernah dijalankan saat dev server masih hidup → Vite watcher crash `EBUSY` pada `cpp\ticket.obj` dan dev server mati. Tidak ada kode aplikasi yang rusak; dev server dijalankan ulang dan uji asap lulus kembali.
- **Regresi setelah perbaikan (dijalankan sesi ini, bukan asumsi)**: `cpp\build.bat` dijalankan ulang **saat dev server aktif di port 3000** (persis kondisi pemicu insiden) → kompilasi sukses + **51 tes lulus, 0 gagal, exit 0**, server **tetap hidup** (HTTP 200, log tanpa error watcher), sisa `*.obj` = 0 file. Sebelumnya diverifikasi pula halaman utama, `main.js`, dan `algorithms.js` disajikan **HTTP 200** oleh Vite v5.4.21.
- **Sesi lanjutan (setelah autocomplete)**: `npm.cmd run build` → sukses, **16 modul**, artefak baru `dist/assets/index-CHgFm9Qu.js` + `index-CyKsfjlR.css`; `cpp\build.bat` dijalankan ulang sesuai aturan "bila kode berubah" (kode C++ sendiri tidak berubah) saat dev server aktif → **51 tes lulus, 0 gagal, exit 0**, lalu reload halaman tetap OK ("112 jadwal simulasi", konsol bersih).
- **Sesi 19 Oktober 2026 (data 694 + 6 opsi + logo)**: `npm.cmd run build` → sukses, **16 modul**, artefak baru `dist/assets/index-Bof74Yo0.js` (**348,22 kB** — memuat 694 tiket literal) + `index-DHRdAn6F.css` (25,85 kB); `cpp\build.bat` saat dev server aktif di 3000 → kompilasi sukses + **51 tes lulus, 0 gagal, exit 0** (kode C++ tidak berubah), server tetap hidup.

---

## 7. Kendala / batasan yang masih ada

1. **C++ tidak terhubung ke website** — browser tidak bisa menjalankannya; tidak diintegrasikan ke Vite. Ia program terpisah untuk memenuhi tugas Array/Pointer/Struct (dijelaskan di `cpp/README.md`). Jangan mengklaim website memakai pointer C++.
2. ~~Belum ada unit test otomatis untuk JavaScript~~ **(SELESAI — sesi lanjutan 20 Okt, diperbarui sesi 21 Okt)**: kini ada **Vitest 2.1.9** (devDependency) + skrip `npm.cmd test` (`vitest run`, environment node, tanpa file konfigurasi). 5 file di `tests/` (**89 tes setelah sesi 21 Okt, semua lulus**) menguji pencarian (Linear Search), pengurutan (Bubble Sort), validasi kriteria & pulang-pergi, penyimpanan/perhitungan/validasi pesanan (dengan stub `window.localStorage`) — termasuk email & data rinci penumpang — dan logika tema (`src/js/theme.js`). UI tetap diuji manual lewat browser; jsdom/happy-dom sengaja tidak dipasang.
3. ~~Form asal/tujuan masih `<select>` panjang~~ **(SELESAI — sesi lanjutan)**: kini autocomplete dua langkah (ketik kota → pilih saran → pilih bandara/stasiun/terminal kota itu). Batasan yang disengaja: saran dibatasi 8, hanya kota yang punya lokasi transportasi tab tersebut, dan kota tanpa lokasi transportasi tsb (mis. Denpasar di tab Kereta) menghasilkan select terkunci "Pilih kota terlebih dahulu" setelah kota diisi lewat pra-isi — pengguna tinggal memilih kota lain, sesuai data simulasi yang ada.
4. Log pencarian pulang-pergi: angka "hasil ditemukan" dihitung **sebelum** penyaringan validitas arah jadwal; bila ada yang disaring, jumlahnya ditambahkan ke ringkasan log.
5. Dropdown urutkan tidak ditampilkan bila hasil pencarian 0 (tidak ada yang bisa diurutkan).
6. ~~Dev server & build C++ saling bentrok~~ **(SELESAI — 14 Okt 2026 sesi koreksi)**: `server.watch.ignored` (`**/*.obj`, `**/*.exe`) sudah dipasang di `vite.config.js` dan `build.bat` menghapus `*.obj` segera setelah kompilasi; sudah diuji — `cpp\build.bat` berjalan saat dev server aktif tanpa crash (lihat bagian 6).
7. ~~Rute tipis (1–2 jadwal per kombinasi)~~ **(SELESAI — sesi 19 Okt)**: setiap kombinasi rute+tanggal kini berisi **4–6 tiket** (160 kombinasi); rute populer contoh CGK→DPS: 6 tiket pada 20 Okt + 5 tiket pada 22 & 24 Okt + 3 tanggal di jendela awal Okt.
8. `dist/` adalah artefak build — bangun ulang dengan `npm.cmd run build` bila kode berubah.
9. Belum ada peninjauan/acceptance akhir dari dosen/pengguna; pengujian di atas dilakukan oleh asisten selama pengembangan.
10. Angka `results-count` dihitung dari hasil pencarian **sebelum** filter harga (mis. 6 hasil → difilter 2 kartu, teks tetap "6 jadwal ditemukan"); ini perilaku lama yang sengaja tidak diubah agar tidak merusak alur yang sudah bekerja.
11. **Logo horizontal punya 2 varian**: `logo-full.svg` (teks navy `#142B4A`, latar terang) dan `logo-full-light.svg` (teks `#E8EEFC` + "in" `#5EEAD4`, tema gelap). Sejak sesi lanjutan 20 Okt, keduanya memakai **`<path>` hasil konversi glyph Plus Jakarta Sans ExtraBold** (bukan `<text>` dengan font sistem) sehingga wordmark tampil **identik di berbagai OS/perangkat**; konversi dilakukan offline via `opentype.js` + TTF resmi (skrip sekali-pakai di folder temp — bukan bagian proyek). Pemilihan src dilakukan `syncSuccessBrand()` yang dipanggil saat modal dibuka **dan** saat tema diganti — varian logo ikut berubah seketika tanpa membuka ulang modal (sudah diuji). Navbar memakai ikon `<img>` + teks HTML (adaptif tema).
11a. ~~Uji lebar sangat sempit (≤540px / 390px) tidak diulang pada sesi visual~~ **(SELESAI — sesi lanjutan 20 Okt)**: **1000 / 785 / 540 / 390 px semuanya diuji visual sungguhan** via iframe harness (situs dimuat di iframe selebar tepat *W* px di dalam tab yang sama; untuk 1000px memakai `transform:scale(0.8)` agar muat di jendela 800px — media query di dalam iframe tetap merespons 1000px, diverifikasi `matchMedia` + tampilan nav). Tiap lebar: screenshot home/hasil/modal/pesanan/footer (+tema gelap di 540/390) + pemeriksaan DOM (overflow horizontal, ukuran kontrol) — **semua lulus, tidak ada komponen yang perlu diperbaiki** (rincian bagian 6). Bukan emulasi perangkat: UA, touch, dan DPR tidak disimulasikan — yang diuji adalah perilaku media query & tata letak terhadap lebar, itulah sumber utama masalah responsif.
12. Jendela data **1–14 Okt 2026** adalah tanggal lampau dibanding hari ini (19 Okt 2026) — **disengaja** sesuai permintaan tugas agar tersedia dua window pengujian; form pencarian sengaja tidak membatasi tanggal minimal (tanpa atribut `min`). **15–19 Okt** sengaja dikosongkan sebagai kasus "tidak ada tiket".
13. Uji tampilan **ponsel** dilakukan lewat halaman sementara `mobile-frame.html` (iframe selebar 390px; file dihapus setelah uji) karena tool browser sesi ini tidak memiliki pengaturan viewport/device — bukan emulasi perangkat sungguhan, hanya media-query yang bereaksi terhadap lebar iframe.
14. ~~**Log pencarian/pengurutan sengaja tidak terlihat di halaman**~~ **(BERUBAH — sesi lanjutan 21 Okt, permintaan baru)**: kini ada **panel "Log Proses Algoritma"** di bawah hasil pencarian (`src/components/algorithmLogPanel.js`, terlipat bawaan) yang menampilkan langkah nyata Linear Search & Bubble Sort per data yang sedang diproses — dibangun ulang segar karena panel "Detail proses" lama sudah dihapus sesi 19 Okt lanjutan dan proyek bukan git repo (tidak ada riwayat kode untuk dipulihkan). Log **lengkap** tetap tersedia di **console browser** (buka DevTools → tab Console) dengan prefiks `[Tiketin]`; panel menampilkan maks. 30 langkah per entri + catatan sisanya. Algoritma/hasil tidak berubah — panel murni tampilan.
15. Chip tanggal alternatif menampilkan **semua tanggal berjadwal** rute/kriteria tersebut, termasuk tanggal yang lebih awal dari tanggal pilihan; pengurutan berdasarkan **kedekatan**, bukan filter "setelah tanggal". Untuk tanggal pulang, pasangan tetap divalidasi (`returnDate` tidak boleh sebelum `departureDate`, dan `isValidReturnLeg` berlaku saat memilih tiket) — jadi mengklik chip tanggal pulang yang lebih awal dari tanggal pergi akan ditolak validasi dengan toast yang jelas.

---

## 8. Daftar file yang diubah / dibuat

**Diubah/dibuat (sesi 21 Oktober 2026 lanjutan — "Log Proses Algoritma"):**
- `src/components/algorithmLogPanel.js` — **BARU**: `buildAlgorithmLogPanel()` → `<details class="algo-log-panel" id="algoLogPanel">` (terlipat bawaan) dgn dua bagian berjudul ("Log Pencarian (Linear Search)" / "Log Pengurutan (Bubble Sort)"), `updateSearchLogs(entries)`/`updateSortLogs(entries)`, entri per-leg, chip statistik, baris langkah bernomor (verdict cocok `.algo-log-hit` / tidak cocok `.algo-log-miss`; baris tukar dgn nilai harga/jam/durasi via `criterionKey`), cap **MAX_STEP_LINES=30** + catatan sisa di console, pesan kosong muted; label tiket `${id} · ${moda} ${operator} ${jam}`; impor `formatRupiah` (algorithms.js) & `formatShortDate` (search.js).
- `src/js/algorithms.js` — `linearSearch()` kini merekam `steps` (`visit`: index, item, pass, comparisons kumulatif) dan mengembalikannya; `bubbleSort()` kini merekam `steps` (`swap`: pass, index, pasangan a/b sebelum tukar; `pass`: perbandingan, pertukaran, settledIndex, earlyStop) dan mengembalikannya; **loop, kontra, hasil, dan return lama tidak berubah** (penambahan field = superset).
- `src/js/search.js` — `searchTicketsWithLog()`: destructure `steps` dari `linearSearch`, `steps` ikut di objek log (+`makeEmptyLog` dapat `steps: []`); `sortTickets()`: destructure `steps` dari `bubbleSort`, ikut di objek log; komentar diperbarui. Algoritma/hasil tidak berubah.
- `src/js/main.js` — impor `buildAlgorithmLogPanel`; `state.lastSearchLogs` (default `[]`) diisi `runSearch()` **sebelum** `renderResults` (console.info lama tetap); `renderResults()`: bangun panel + `updateSearchLogs(state.lastSearchLogs)` sebelum cabang kosong, sematkan panel setelah empty-state (hasil 0) ATAU setelah grid (berisi); `sortLogEntries` direset di `redraw()` & di-push `applyFilterSort()` (console.info sorting tetap), `updateSortLogs(sortLogEntries)` di akhir `redraw()`; komentar "tanpa panel di halaman" (3 tempat) diperbarui.
- `src/css/main.css` — **§18 baru** (~150 baris): `.algo-log-panel` (+`[open]` chevron via `summary::before`), `.algo-log-summary-bar/-title/-hint`, `.algo-log-body/-section/-section-title/-entries`, `.algo-log-entry(-head)` + `.algo-log-method`, `.algo-log-criteria`, `.algo-log-stats` (chip pil memakai token tema), `.algo-log-steps` (border kiri `--accent`, `max-height:260px` scroll), `.algo-log-step(-num)` (tabular-nums, `--primary`), `.algo-log-hit` (`--success`) / `.algo-log-miss`, `.algo-log-more/-summary/-empty`, `@media 640`.
- `PROGRESS.md` — perbarui header, bagian 3 (paragraf Log), bagian 5 (butir 15), bagian 6 (kutipan + blok uji sesi lanjutan + Build), bagian 7 (no.14), bagian 8 (blok ini).

**Diubah/dibuat (sesi 21 Oktober 2026 — "Penyempurnaan Tiketin"):**
- `public/images/logo-icon.svg` & `public/favicon.svg` — **simbol baru** (tile rx15 gradien `#2563EB`→`#14B8A6`, tiket putih miring −6° takik perforasi + garis putus-putus, rute bermata teal → pin tujuan biru, dua garis stub); ukuran tampil tidak berubah (navbar34px, hero72px) sehingga layout tidak bergeser.
- `public/images/logo-full.svg` & `public/images/logo-full-light.svg` — bagian **ikon** diganti simbol baru yang sama; **wordmark `<path>` dipertahankan utuh**; gradient id berbeda antar file (hindari tabrakan); bug salinan titik "i" (`L163.09 17.67`) diperbaiki.
- `public/images/hero-travel.webp` — **BARU** (foto lama `hero-travel-OLD-whoosh-cimeta.webp` dibackup ke folder temp): KCIC400AF + Gunung Manglayang, Commons "KCIC400AF and Mount Manglayang" © Naufal Farras (NFarras) for Transport for Bandung, **CC BY-SA 4.0**, diolah Pillow (Color1.12/Contrast1.10/Brightness1.02) → WebP q80,1920×1079, **248.842 byte**; `public/images/CREDITS.txt` entry1 diganti (judul/pembuat/lisensi/URL Commons asli + catatan pengolahan Pillow).
- `src/components/bookingForms.js` — **DITULIS ULANG TOTAL**: alur bertahap (stepper `<ol>` aria-current, panel per langkah, kartu penumpang dibangun ulang & nilai per indeks dipertahankan, kode negara `bookingCountry`, blok `extra-details`, catatan privasi, ringkasan konfirmasi dgn mask identitas `••••` + harga jujur + disclaimer, nav sticky `stepper-nav`, guard `dataset.submitting`, validasi seluruh langkah → lompat ke langkah pertama bermasalah); helper lama (`summaryLegLines`, `buildSummaryBlock`, `buildNumberGroup`) dipertahankan.
- `src/js/booking.js` — skema & validasi: doc skema diperbarui; **`isValidEmail`/`isValidPhone`/`GENDER_VALUES`/`IDENTITY_TYPE_VALUES`/`validatePassengerDetails`** diekspor; `contactEmail` wajib; `createBooking` menyimpan `contactName`, `contactPhone`, `contactEmail`, `passengerDetails` (**`identityNumber` TIDAK ikut disimpan** — privasi), `specialRequest`, `travelNotes` (trim+slice300); aturan identitas kereta lama (10–20 digit via `passengerIdentities`) tidak berubah; pesanan skema lama tetap terbaca (superset).
- `src/js/orders.js` — blok **`.order-contact`** (Pemesan: nama · telepon · email, tolerate field null), suffix kategori `(Dewasa)`/`(Anak)` dari `passengerDetails`, info `specialRequest`/`travelNotes`, **catatan privasi** di bawah judul daftar.
- `src/js/main.js` — `els.successOrdersBtn` + listener `closeModal(successModal); navigate("orders")`.
- `index.html` — tombol `#successOrdersBtn` **"Lihat Detail Pesanan"** di footer `#successModal` sebelum `#successCloseBtn`.
- `src/css/main.css` — **§17 baru** (~300 baris): `.booking-stepper`/`.stepper-dot`/`is-active`/`is-done`, `.step-panel[hidden]{display:none}` + `.btn[hidden]`/`.field-error[hidden]`, `.field-error` dgn penanda "!", `.is-invalid`, `.field-hint`, `.field-tag`/`-opt`, `.pax-list`/`.pax-card`/`.pax-badge` (+dark), `.phone-row`, `.extra-details` buka-tutup, `.privacy-note`, `.confirm-block`/`-title`/`-line`/`-total`, `.sim-note`, `.stepper-nav` sticky (margin −24px), `.booking-confirm-btn`, `.order-contact`, `.orders-privacy-note`, override gelap, `@media 640`; plus `#successModal .modal-footer .btn { flex:1 1 0; min-width:150px }` (2 tombol sukses sejajar — perbaikan setelah dilihat di screenshot).
- `tests/booking.test.js` — fixture `validBooking` + `contactEmail` (skema baru), impor fungsi baru, **+11 tes** → file berisi29 tes; total proyek **89 tes**.
- `PROGRESS.md` — perbarui header, bagian 5 (butir14), bagian 6 (blok sesi21 + Build), bagian 7 (no.2), bagian 8 (blok ini), bagian 9 (angka tes).

**Diubah/dibuat (sesi 20 Oktober 2026 lanjutan — wordmark path, sinkron tema-modal, responsif 4 lebar, unit test):**
- `public/images/logo-full.svg` & `public/images/logo-full-light.svg` — elemen `<text>`/`<tspan>` **diganti 2 elemen `<path>`** (outline glyph Plus Jakarta Sans ExtraBold dari TTF resmi Google Fonts; font-size 34, baseline 43, tracking −0.5, warna per segmen identik versi lama). **0 elemen `<text>` tersisa** di seluruh `public/`.
- `src/js/main.js` — tambah `syncSuccessBrand()` (memilih src varian logo horizontal sesuai `data-theme`); `openSuccessModal()` memakainya; `toggleTheme()` memanggilnya setelah atribut `data-theme` berubah; `initTheme()`/`toggleTheme()` kini memakai helper `src/js/theme.js` (kunci localStorage `tiketin_theme` & perilaku tidak berubah).
- `src/js/theme.js` — **BARU**: `THEME_STORAGE_KEY`, `normalizeTheme()`, `toggleThemeName()` — fungsi murni tanpa DOM, dipakai `main.js` dan diuji Vitest.
- `package.json` — devDependency **`vitest@2.1.9`** + skrip **`"test": "vitest run"`**; `package-lock.json` ikut terbarui.
- `tests/search.test.js` (18 tes), `tests/sorting.test.js` (21), `tests/validation.test.js` (15), `tests/booking.test.js` (18), `tests/theme.test.js` (6) — **BARU, total 78 tes**: data uji terkontrol (array buatan, bukan `tickets.js` produksi); `window.localStorage` distub untuk penyimpanan pesanan; lingkup: pencarian Linear Search, pengurutan Bubble Sort 6 kriteria + filter harga, validasi kriteria/pulang-pergi, penyimpanan & validasi pemesanan, logika tema.
- `PROGRESS.md` — perbarui header, bagian 5 (poin 13), bagian 6 (blok uji baru + Build), bagian 7 (no. 2, 11, 11a), bagian 8 (blok ini), bagian 9 (status & item unit test).

**Diubah/dibuat (sesi 20 Oktober 2026 — peningkatan kualitas visual, 11 tahap):**
- `index.html` — font Google: Inter → **Plus Jakarta Sans**; logo navbar diberi `data-page="home"` (width 34); **footer ditulis ulang** (4 kolom ringkas: brand + Layanan `data-transport` + Navigasi `data-page` + Tentang Proyek; 0 tautan palsu; tahun 2026).
- `src/css/main.css` — **`:root` ditulis ulang** (token `--navy/--ocean/--teal/--cream/--sky`, `--bg-alt`→cream, `--text`→navy, radius 10/14/20); body font Plus Jakarta Sans; tombol `btn-primary` gradien + **`btn-danger` baru**; navbar `.logo` navy 34px; hero (padding, `.hero-logo` 72px, `.hero-badge` = tombol interaktif); form (label navy 700, hover/fokus ocean ring); `.section-title::after` gradien ocean→teal; `.card:hover` border; **blok baru**: `.benefit-card/-icon`, `.dest-cta` (+ ≥540px selalu tampil), `.results-toolbar(-form)`, `.ticket-brand`, `.ticket-actions`, `.order-actions`, `.order-cancel-confirm[hidden]`, `.success-brand`, `.footer-info`; footer ringkas (padding tautan 33px); kartu tiket/pesanan direstrukturisasi (grid info, aksen status, `.order-card.cancelled`); **§16 polesan tema gelap** (badge, ticket-chip, booking-summary, seat-occupied, success-icon, btn-secondary, swap-btn, date-chip, navbar); **`.hero + .search-section { margin-top:-90px }`** (negatif hanya di beranda); `.dest-grid` 4/2/1 kolom; CTA dest ikut ≤640px.
- `src/js/main.js` — helper **`iconSvg()`** (SVG stroke via createElementNS); `state.prefillTransportType`; hero: tagline **"Perjalanan Seru, Semudah Itu."** + subjudul baru + **chip kategori tombol** (klik → `navigate("search")` dengan tab aktif); bagian manfaat **4 kartu berikon**; kartu destinasi + `.dest-cta`; `renderSearchPage` menerapkan `prefillTransportType` lewat `search.setActiveType`; handler `[data-page]` membaca `data-transport`; `renderResults` → `.results-toolbar` + `.results-toolbar-form`; **`openSuccessModal` menampilkan `logo-full.svg`/`logo-full-light.svg` sesuai tema**.
- `src/components/ticketCard.js` — helper **`transportIcon()`** (ikon pesawat/kereta/bus stroke); header kartu dibungkus `.ticket-brand` (ikon + operator); footer kartu → `.ticket-actions` (kelompok harga + tombol pilih).
- `src/js/orders.js` — `buildOrderCard`: kelas **`cancelled`** sesuai status; **konfirmasi pembatalan dua langkah** (`.order-actions`, `.order-cancel-confirm` dengan "Yakin membatalkan…", `Ya, Batalkan` → `cancelOrder`, `Tidak` → kembali; tombol batal disembunyikan selama konfirmasi).
- `public/images/logo-icon.svg` — **ditulis ulang**: maskot tiket miring −7°, takik perforasi kiri/kanan + garis putus-putus, mata navy r3 + senyum + pipi koral, pesawat kertas kuning + jejak, gradien `#2563EB`→`#14B8A6`.
- `public/favicon.svg` — ditulis ulang dengan mark yang sama (id gradien `tkGradFav`).
- `public/images/logo-full.svg` — **ditulis ulang**: ikon + wordmark "Tiket(in)" teks navy (id gradien `tkGradFull`).
- `public/images/logo-full-light.svg` — **BARU**: varian horizontal teks terang (`#E8EEFC`/"in" `#5EEAD4`) untuk tema gelap.
- `PROGRESS.md` — perbarui header, bagian 2, 5, 6, 7, 8, 9.

**Diubah (sesi 19 Oktober 2026 lanjutan — rute hilang + empty-state interaktif + hapus panel + logo maskot):**
- `src/data/tickets.js` — sisip blok literal `NEW-ROUTES-TICKETS` (**+208 tiket**, 694 → **902**) via generator `gen-new-routes.mjs` (idempoten via penanda blok); 15 rute populer yang sebelumnya 0 tiket kini punya jadwal; komentar header diperbarui. Data lama tidak disentuh.
- `src/js/search.js` — tambah `formatLongDate()`, `sortDatesByProximity()` (Bubble Sort manual), `findAlternativeRoutes()` (loop manual, skor kota 0/1/2, maks 5 rute); komentar modul diperbarui; logika lama tidak berubah.
- `src/js/main.js` — tambah `rerunSearchWithDate()`, `buildDateChips()`, `routeLabel()`, `buildAlternativeRoutesBlock()`, `buildEmptyState()`; empty-state & grid pulang kosong memakai chip tanggal dapat diklik; **hapus** `buildProcessDetails()`, `processRow()`, `processBlock()`, `fillProcessDetails()`, `joinShortDates()`, field `state.lastSearchLogs`; log pencarian & sorting → `console.info`; impor helper baru (+`TRANSPORT_LABELS`).
- `src/css/main.css` — **hapus seluruh gaya `.process-*`** (termasuk aturan media query); tambah gaya `.date-chips-block`, `.date-chips-label`, `.date-chips`, `.date-chip`, `.alt-routes`, `.alt-route-list`, `.alt-route-item`, `.alt-route-name`, `.alt-route-info`.
- `public/images/logo-icon.svg` — **ditulis ulang**: maskot tiket (mata navy r 2,7 + senyum + pipi koral), takik perforasi atas-bawah + garis putus-putus, pesawat kertas kuning (#fbbf24/#f59e0b) + jejak putus-putus, badge gradien #1e40af→#0d9488, kemiringan −8°.
- `public/images/logo-full.svg` — ditulis ulang dengan ikon maskot + wordmark "Tiket(in)" (lihat §7 no.11).
- `public/favicon.svg` — ditulis ulang dengan mark maskot yang sama (id gradien disingkat `fg`).
- `PROGRESS.md` — perbarui header, bagian 1, 2, 3, 4, 5, 6, 7, 8, 9.

**Diubah (sesi 19 Oktober 2026 — variasi data + 6 opsi sorting + logo lama):**
- `src/data/tickets.js` — sisip blok literal `DENSE-EXTRA-TICKETS` (**+582 tiket**, 112 → **694**) via generator sekali-pakai; Bagian A = top-up semua kombinasi rute+tanggal lama jadi ≥4 tiket, Bagian B = jendela 1–14 Okt; komentar header diperbarui. Data lama 112 tiket **tidak disentuh**.
- `src/js/algorithms.js` — tambah kriteria `departure_latest` (Keberangkatan paling akhir) & `duration_slowest` (Durasi perjalanan terlama): `SORT_OPTIONS` 4 → 6, `SORT_SPECS` + pembanding kebalikan, komentar modul diperbarui.
- `src/js/search.js` — hanya komentar daftar kriteria `sortTickets` (6 kunci); logika tidak berubah.
- `index.html` — ganti 2 SVG inline logo (navbar + footer) jadi `<img class="logo-icon" src="/images/logo-icon.svg" width=30 height=30>`; struktur `<a class="logo">` tetap.
- `src/js/main.js` — tambah mark `<img class="hero-logo">` di hero halaman utama (renderHomePage).
- `src/css/main.css` — gaya `.hero-logo` (64px, bayangan halus) + versi 52px pada media query ≤640px.
- `public/images/logo-icon.svg` — **BARU**: versi ikon logo (badge gradien #1e40af→#0d9488, tiket putih miring −12° dengan 2 lubang perforasi, garis stub, pin lokasi).
- `public/images/logo-full.svg` — **BARU**: versi ikon + wordmark "Tiket(in)" (lihat §7 no.11).
- `public/favicon.svg` — ditulis ulang dengan mark yang sama (ikon layers lama diganti).
- `PROGRESS.md` — perbarui bagian 1, 2, 3, 4, 5, 6, 7, 8, 9.

**Diubah (sesi koreksi crash watcher EBUSY):**
- `vite.config.js` — tambah `server.watch.ignored` (`**/*.obj`, `**/*.exe`) agar watcher Vite tidak memantau artefak kompilasi C++.
- `cpp/build.bat` — `del /q *.obj` dipindah ke segera setelah kompilasi (sebelum tes dijalankan).
- `PROGRESS.md` — perbarui bagian 1, 5, 6, 7, 8, 9 (insiden & perbaikan EBUSY).

**Diubah (sesi lanjutan — prioritas 2 "autocomplete" + prioritas 3 "regresi"):**
- `src/components/searchForms.js` — ganti select kota/lokasi jadi **field dua langkah + autocomplete** (`attachAutocomplete`, `cityPoolGeneric`, `cityPoolForTransport`, `matchCityItems`, `canonicalCityName`); controller field pada `WeakMap`; submit memakai `originLocationId` lokasi terpilih; `fillSearchForm` mengisi kota+lokasi bersamaan; tombol ⇄ menukar kota + lokasi.
- `src/data/locations.js` — tambah `airport-hlp` (**Halim Perdanakusuma / HLP**, Jakarta) → 10 bandara.
- `src/data/tickets.js` — tambah **4 tiket rute HLP** (blok `HALIM-EXTRA-TICKETS`, `TKT-PLW-037..040`); komentar header 108 → 112 tiket.
- `src/css/main.css` — gaya `.autocomplete-list`, `.autocomplete-option/main/sub/empty`, `.form-control:disabled`.
- `PROGRESS.md` — perbarui bagian 1, 2, 4, 5, 6, 7, 8, 9 (hasil sesi lanjutan).

**Diubah (sesi sebelumnya — prioritas "data + logika pencarian"):**
- `src/data/tickets.js` — +78 jadwal (30 → 108) pada blok `GENERATED-EXTRA-TICKETS`; perbaiki 4 inkonsistensi data lama (2 jam tiba, 2 `bookedSeats`); komentar header diperbarui.
- `src/js/search.js` — tambah `findAvailableDates()`, `formatShortDate()`, `availableDatesHintText()`; log hasil 0 menyertakan daftar tanggal berjadwal.
- `src/js/main.js` — petunjuk tanggal pada empty-state (pergi & pulang) dan pada pesan leg pulang kosong; impor helper baru.
- `src/css/main.css` — gaya `.empty-hint`.

**Diubah (sesi sebelumnya):**
- `index.html` — hapus 3 link tab Laboratorium.
- `src/js/main.js` — hapus halaman lab; log pencarian; jumlah hasil; dropdown urutkan; panel Detail proses.
- `src/js/search.js` — Linear Search + log, Bubble Sort + log, filter harga loop manual.
- `src/data/tickets.js` — +6 tiket (24 → 30).
- `src/css/main.css` — gaya `.results-count`, `.process-*`, responsif.

**Dibuat:**
- `src/js/algorithms.js`
- `cpp/ticket.h`, `cpp/ticket.cpp`, `cpp/main.cpp`, `cpp/build.bat`, `cpp/README.md`
- `cpp/tiketin_test.exe` (hasil kompilasi, boleh dihapus/di-build ulang)
- `PROGRESS.md` (file ini)

**Di luar proyek (bukan bagian repositori):** skrip generator & audit di folder temp
(`C:\Users\Terserah\AppData\Local\Temp\opencode\tiketin\`): `gen-extra-tickets.mjs`
(sesi lama), **`gen-dense-tickets.mjs`** (sesi 19 Okt — blok `DENSE-EXTRA-TICKETS`),
**`gen-new-routes.mjs`** (sesi 19 Okt lanjutan — blok `NEW-ROUTES-TICKETS`; punya
mode dry-run & `apply`, idempoten via penanda blok), `audit.mjs`,
**`audit-data.mjs`**, **`audit-cgksub.mjs`**, **`audit-routes2.mjs`**, **`routes.mjs`**,
**`sort-test.mjs`** (uji 6 kriteria sorting), **`test-helpers.mjs`** (uji
`sortDatesByProximity`, `findAlternativeRoutes`, `formatLongDate` — 16 asersi).
Semua skrip hanya menyusun/memeriksa literal; data final ada di
`tickets.js`, audit bisa dijalankan ulang kapan pun dengan `node <skrip>.mjs`.

**Diubah otomatis (artefak):** `dist/*` hasil `npm run build`.

---

## 9. Langkah berikutnya

> **Status sesi 20 Okt 2026 — peningkatan kualitas visual (11 tahap): SELESAI.**
> Audit → sistem logo (3 varian + favicon) → design tokens & Plus Jakarta Sans →
> rombak beranda → form pencarian → hasil pencarian → halaman pesanan (+konfirmasi
> pembatalan) → footer bebas tautan palsu → responsivitas/aksesibilitas → syarat UTS
> terjaga (data/algoritma C++ tak tersentuh, tanpa lab, tanpa panel Detail Proses) →
> pengujian & build (bagian 6). Sisa pekerjaan bersifat opsional (butir di bawah).
>
> **Status sesi lanjutan 20 Okt 2026 — 4 masalah audit tersisa: SELESAI.**
> (1) wordmark `<text>` → `<path>` di kedua varian logo modal sukses (verifikasi
> visual terang+gelap); (2) varian logo modal sukses **ikut berganti saat tema
> diganti** lewat `syncSuccessBrand()` (diuji langsung: modal terbuka → toggle →
> src berganti seketika); (3) responsivitas **diuji nyata di 1000/785/540/390 px**
> via iframe harness + screenshot (0 overflow, 0 kontrol <32px, footer/modal/
> pesanan/tema gelap teruji — tidak ada komponen yang perlu diperbaiki);
> (4) **unit test Vitest 78 tes, semua lulus** (`npm.cmd test`). Build ulang
> (17 modul) + `cpp\build.bat` 51/51 dijalankan setelah kode berubah; konsol 0
> error; rincian di bagian 5 poin 13 & bagian 6.

1. ~~Tiga perbaikan sesi 19 Okt lanjutan~~ **(SELESAI sesi 19 Okt lanjutan)**:
   (a) ~~rute populer tanpa tiket~~ — `NEW-ROUTES-TICKETS` +208 (902 tiket; CGK→SUB 28 Okt = 4);
   (b) ~~tanggal alternatif di empty-state~~ — chip terurut kedekatan, dapat diklik,
   + daftar rute lain untuk rute tanpa jadwal (chip juga untuk leg pulang);
   (c) ~~panel "Detail proses"~~ — dihapus dari UI, log dialihkan ke console;
   (d) ~~logo baru~~ — maskot tiket bersahabat (mata+senyum+pipi, perforasi, pesawat
   kuning, jejak putus-putus). Semua diuji nyata di browser + Node (bagian 6),
   `npm.cmd run build` & `cpp\build.bat` lulus.
2. ~~Autocomplete asal/tujuan~~ **(SELESAI — sesi lanjutan)**: sudah dikerjakan di
   `src/components/searchForms.js` + gaya `main.css` + data `locations.js`/`tickets.js`;
   `fillSearchForm` (pra-isi kartu destinasi & pencarian terakhir) teruji berfungsi
   (rincian di bagian 5 poin 8 dan bagian 6).
3. ~~Regresi menyeluruh (prioritas 3)~~ **(SELESAI sesi 19 Okt)**: search ada/kosong +
   petunjuk tanggal, 6 opsi sorting, filter harga, pulang-pergi, pra-isi/restore form,
   pemesanan pesawat & bus (peta kursi) — semua diuji di browser (bagian 6).
   **Pembatalan pesanan** terakhir diuji pada sesi sebelumnya dan tidak diulang sesi ini
   (kode `orders.js`/`booking.js` tidak berubah).
4. ~~**(Opsional) Unit test JS**~~ **(SELESAI — sesi lanjutan 20 Okt, diperbarui sesi 21 Okt)**: Vitest
   **2.1.9** terpasang + skrip `npm.cmd test`; 5 file di `tests/` (**89 tes —
   78 sesi20 + 11 sesi21 (email & data rinci penumpang) — semua lulus**) menguji `search.js` (Linear Search), `algorithms.js`/sorting (Bubble
   Sort 6 kriteria + filter harga), validasi kriteria & pulang-pergi,
   `booking.js` (storage/total/validasi), dan `theme.js`. Skrip Node folder temp
   (`sort-test.mjs`, `test-helpers.mjs`) masih ada sebagai pemeriksaan cepat.
5. **(Opsional) Dokumen tugas**: bila laporan struktur data diperlukan, susun dari
   bagian 3 & 6 file ini (algoritma + angka pengujian nyata).
6. **Jangan**: mengembalikan tab/menu Laboratorium atau halaman praktikum;
   **mengembalikan panel "Detail proses"** (sudah diminta dihilangkan — log cukup di
   console); mengganti algoritma buatan sendiri (`Array.sort()`, `Array.filter()`) —
   termasuk pada `findAvailableDates()`, `sortDatesByProximity()`, dan
   `findAlternativeRoutes()` yang semuanya memakai loop manual; mengklaim C++
   terintegrasi ke website.
7. Bila ada perubahan kode: jalankan ulang `npm.cmd run build` dan `cpp\build.bat`
   (kini aman dijalankan bersamaan dev server), lalu perbarui bagian 6 dokumen ini.
   Pada sesi 20 Okt (visual) keduanya sudah dijalankan ulang: build sukses (16 modul,
   JS 429,86 kB + CSS 31,59 kB) dan `cpp\build.bat` **51 tes lulus/exit 0** walau kode
   C++ tidak berubah.
8. **(Opsional) Jaga-jaga bila data tiket ditambah lagi**: gunakan kembali pola
   `gen-dense-tickets.mjs`/`gen-new-routes.mjs` (dry-run → cek statistik kombinasi
   ≥4 & ID unik → apply) dan jalankan ulang `audit-data.mjs` + `sort-test.mjs`;
   jangan menempel literal manual tanpa cek `arrivalTime/departureTime`,
   `bookedSeats`, dan kesatuan `flightNo`.
9. ~~**(Opsional) Konsistensi logo**~~ **(SELESAI — sesi lanjutan 20 Okt)**:
   teks `<text>` pada `logo-full.svg` & `logo-full-light.svg` **sudah dikonversi
   menjadi `<path>`** (glyph Plus Jakarta Sans ExtraBold dari TTF resmi; 0 `<text>`
   tersisa di `public/`) — lihat §7 no.11. Ikon navbar/hero/footer/favicon sudah
   path sejak sesi sebelumnya.
