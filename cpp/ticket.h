/**
 * Tiketin-UTS — ticket.h
 * Deklarasi struct Ticket, array, pointer, linear search, dan bubble sort
 * untuk tugas UTS Struktur Data (implementasi C++).
 *
 * Hubungan dengan website (jujur):
 * - Website Tiketin berjalan penuh dengan JavaScript di browser (src/js/*).
 * - File C++ ini TIDAK dijalankan oleh browser dan TIDAK diintegrasikan ke
 *   Vite/website. Fungsinya memenuhi tugas praktikum Array, Pointer, dan
 *   Struct: data tiket disimpan sebagai array of struct Ticket, diakses dan
 *   diproses lewat pointer, lalu diuji lewat program terpisah (main.cpp).
 */

#ifndef TIKETIN_TICKET_H
#define TIKETIN_TICKET_H

#include <string>

/** Struct data tiket — padanan dari objek tiket pada src/data/tickets.js. */
struct Ticket {
    std::string id;             // "TKT-PLW-001"
    std::string transportType;  // "plane" | "train" | "bus"
    std::string operatorName;   // "Garuda Indonesia" ("operator" = kata kunci C++)
    std::string origin;         // nama kota asal
    std::string destination;    // nama kota tujuan
    std::string departureDate;  // "YYYY-MM-DD"
    std::string departureTime;  // "HH:MM"
    std::string arrivalTime;    // "HH:MM"
    std::string duration;       // "1j 50m"
    long long price;            // rupiah (dibandingkan sebagai angka)
    int availableSeats;         // sisa kursi
    std::string travelClass;    // "Ekonomi" | "Eksekutif" | "Bisnis"
};

/** Kriteria pencarian: SEMUA kriteria terisi harus cocok (AND). */
struct SearchCriteria {
    std::string transportType;  // "" = semua jenis
    std::string origin;         // "" = bebas
    std::string destination;    // "" = bebas
    std::string departureDate;  // "" = semua tanggal
};

/** Statistik eksekusi linear search (diisi dari penghitungan nyata). */
struct SearchStats {
    int checked;      // jumlah elemen array yang diperiksa
    int comparisons;  // jumlah perbandingan kriteria
    int found;        // jumlah tiket yang cocok
};

/** Statistik eksekusi bubble sort (diisi dari penghitungan nyata). */
struct SortStats {
    int comparisons;  // jumlah perbandingan kunci
    int swaps;        // jumlah pertukaran elemen
};

/**
 * LINEAR SEARCH memakai pointer:
 * menelusuri array `tickets` dari alamat pertama sampai satu melewati
 * elemen terakhir, memeriksa seluruh kriteria per elemen.
 *
 * @param tickets  : pointer ke elemen pertama array tiket.
 * @param count    : jumlah elemen array.
 * @param criteria : kriteria pencarian.
 * @param out      : array pointer (const Ticket**) untuk menampung hasil,
 *                   maksimal maxOut entri.
 * @param maxOut   : kapasitas array out.
 * @param stats    : statistik penghitungan (boleh nullptr).
 * @return         : jumlah tiket yang cocok (dapat melebihi maxOut bila out penuh;
 *                   out hanya diisi sampai maxOut).
 */
int linearSearchTickets(const Ticket* tickets, int count,
                        const SearchCriteria& criteria,
                        const Ticket** out, int maxOut,
                        SearchStats* stats = nullptr);

/**
 * BUBBLE SORT memakai pointer:
 * mengurutkan array `tickets` di tempat (in-place) sesuai kunci.
 *
 * @param tickets : pointer ke elemen pertama array tiket (dapat diubah).
 * @param count   : jumlah elemen.
 * @param sortKey : "price_asc" | "price_desc" | "departure_earliest" | "duration_fastest"
 * @param stats   : statistik penghitungan (boleh nullptr).
 */
void bubbleSortTickets(Ticket* tickets, int count,
                       const std::string& sortKey, SortStats* stats = nullptr);

/** Ubah teks durasi "6j 40m" -> total menit (tak terbaca -> -1). */
int durationToMinutes(const std::string& duration);

/** Kunci waktu keberangkatan kronologis: "YYYY-MM-DD HH:MM". */
std::string departureKey(const Ticket& ticket);

/** Cetak satu tiket (menerima pointer; null -> pesan aman). */
void printTicket(const Ticket* ticket);

/** Cetak ringkasan statistik pencarian. */
void printSearchStats(const SearchStats& stats);

/** Cetak ringkasan statistik pengurutan. */
void printSortStats(const SortStats& stats);

#endif  // TIKETIN_TICKET_H
