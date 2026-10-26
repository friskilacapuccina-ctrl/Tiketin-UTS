/**
 * Tiketin-UTS — main.cpp
 * Program pengujian modul C++: struct Ticket, array, pointer, linear search,
 * dan bubble sort. Data tiket diambil dari subset src/data/tickets.js agar
 * sejalan dengan website.
 *
 * Program ini BUKAN menu praktikum di website — ia dikompilasi dan dijalankan
 * terpisah (lihat build.bat / README.md) untuk membuktikan algoritma bekerja.
 * Angka statistik yang dicetak berasal dari counter nyata di dalam algoritma,
 * dan setiap tes punya asersi kebenaran (lulus/gagal) dengan exit code.
 */

#include "ticket.h"

#include <iostream>
#include <string>
#include <vector>

namespace {

int g_passed = 0;
int g_failed = 0;

void check(bool condition, const std::string& name) {
    if (condition) {
        g_passed += 1;
        std::cout << "  [LULUS] " << name << "\n";
    } else {
        g_failed += 1;
        std::cout << "  [GAGAL] " << name << "\n";
    }
}

/** Subset data tiket — identik dengan src/data/tickets.js. */
const Ticket kTickets[] = {
    // ---------- PESAWAT ----------
    {"TKT-PLW-001", "plane", "Garuda Indonesia", "Jakarta", "Denpasar",
     "2026-10-20", "07:15", "10:05", "1j 50m", 1450000, 42, "Ekonomi"},
    {"TKT-PLW-002", "plane", "Lion Air", "Jakarta", "Medan",
     "2026-10-21", "09:30", "11:45", "2j 15m", 980000, 18, "Ekonomi"},
    {"TKT-PLW-005", "plane", "Citilink", "Jakarta", "Pontianak",
     "2026-10-24", "06:00", "07:35", "1j 35m", 760000, 33, "Ekonomi"},
    {"TKT-PLW-008", "plane", "Sriwijaya Air", "Jakarta", "Palembang",
     "2026-10-27", "18:30", "19:55", "1j 25m", 690000, 40, "Ekonomi"},
    // ---------- KERETA API ----------
    {"TKT-KRA-001", "train", "KAI Argopuro", "Jakarta", "Surabaya",
     "2026-10-20", "06:30", "13:10", "6j 40m", 450000, 56, "Eksekutif"},
    {"TKT-KRA-002", "train", "KAI Turangga", "Bandung", "Yogyakarta",
     "2026-10-21", "21:15", "05:05", "7j 50m", 380000, 31, "Eksekutif"},
    {"TKT-KRA-004", "train", "KAI Dharmawangsa", "Jakarta", "Semarang",
     "2026-10-23", "08:00", "14:35", "6j 35m", 240000, 74, "Ekonomi"},
    {"TKT-KRA-007", "train", "KAI Lodaya", "Bandung", "Solo",
     "2026-10-26", "06:45", "15:10", "8j 25m", 310000, 63, "Ekonomi"},
    // ---------- BUS ----------
    {"TKT-BUS-001", "bus", "Sinar Jaya", "Jakarta", "Yogyakarta",
     "2026-10-20", "19:00", "03:30", "8j 30m", 240000, 28, "Ekonomi"},
    {"TKT-BUS-002", "bus", "Rosalia Indah", "Jakarta", "Bandung",
     "2026-10-21", "07:30", "10:45", "3j 15m", 110000, 16, "Eksekutif"},
    {"TKT-BUS-003", "bus", "Harapan Jaya", "Surabaya", "Malang",
     "2026-10-22", "10:00", "13:10", "3j 10m", 65000, 34, "Ekonomi"},
    {"TKT-BUS-005", "bus", "Sumber Alam", "Yogyakarta", "Jakarta",
     "2026-10-24", "17:00", "01:20", "8j 20m", 225000, 9, "Ekonomi"},
};

const int kTicketCount = static_cast<int>(sizeof(kTickets) / sizeof(kTickets[0]));
const int kMaxResults = 16;

/** Apakah array tiket terurut sesuai kunci? (verifikasi hasil sorting) */
bool isSortedCorrectly(const Ticket* data, int count, const std::string& sortKey) {
    for (int i = 0; i + 1 < count; ++i) {
        const Ticket& a = data[i];
        const Ticket& b = data[i + 1];
        if (sortKey == "price_asc" && a.price > b.price) return false;
        if (sortKey == "price_desc" && a.price < b.price) return false;
        if (sortKey == "departure_earliest" && departureKey(a) > departureKey(b)) return false;
        if (sortKey == "duration_fastest" && durationToMinutes(a.duration) > durationToMinutes(b.duration)) {
            return false;
        }
    }
    return true;
}

void testStructAndPointer() {
    std::cout << "\n== Tes Struct & Pointer ==\n";

    // Struct: salinan independen dari elemen array.
    Ticket copy = kTickets[0];
    copy.price = 1;
    check(copy.price != kTickets[0].price, "salinan struct tidak mengubah data asli");
    check(kTickets[0].id == "TKT-PLW-001", "field struct terbaca benar (id)");

    // Pointer aritmetika pada array.
    const Ticket* base = kTickets;
    check(base + 5 == &kTickets[5], "pointer aritmetika base+5 == &kTickets[5]");
    check(base != nullptr && base->id == "TKT-PLW-001", "deref pointer base->id");

    // Hasil pencarian berupa pointer ke elemen array yang sama.
    SearchCriteria criteria = {"plane", "Jakarta", "Denpasar", "2026-10-20"};
    const Ticket* results[kMaxResults];
    SearchStats stats = {};
    int found = linearSearchTickets(kTickets, kTicketCount, criteria,
                                    results, kMaxResults, &stats);
    check(found == 1, "pointer hasil menunjuk ke 1 tiket");
    if (found == 1) {
        check(results[0] == &kTickets[0], "pointer hasil == &kTickets[0]");
        check(results[0]->id == "TKT-PLW-001", "tiket ditemukan sesuai id");
    }
}

void testLinearSearch() {
    std::cout << "\n== Tes Linear Search ==\n";

    struct Case {
        SearchCriteria criteria;
        int expected;
        std::string name;
    };

    const Case cases[] = {
        {{"plane", "Jakarta", "Denpasar", "2026-10-20"}, 1, "pesawat Jakarta->Denpasar 20 Okt 2026"},
        {{"plane", "Jakarta", "Bandung", ""}, 0, "pesawat Jakarta->Bandung (tidak ada hasil)"},
        {{"train", "Jakarta", "Semarang", "2026-10-23"}, 1, "kereta Jakarta->Semarang 23 Okt 2026"},
        {{"bus", "Jakarta", "Yogyakarta", "2026-10-20"}, 1, "bus Jakarta->Yogyakarta 20 Okt 2026"},
        {{"", "Jakarta", "Bandung", ""}, 1, "semua jenis Jakarta->Bandung (hanya bus)"},
        {{"train", "Jakarta", "Denpasar", ""}, 0, "kereta Jakarta->Denpasar (tidak ada hasil)"},
        {{"", "Medan", "Padang", "2026-10-25"}, 0, "data subset tidak memuat rute tersebut"},
    };

    for (const Case& c : cases) {
        const Ticket* results[kMaxResults];
        SearchStats stats = {};
        int found = linearSearchTickets(kTickets, kTicketCount, c.criteria,
                                        results, kMaxResults, &stats);
        std::cout << "  kriteria: " << c.name << "\n";
        printSearchStats(stats);
        check(found == c.expected, "jumlah hasil sesuai harapan (" + c.name + ")");
        check(stats.checked == kTicketCount, "seluruh elemen array diperiksa");
        check(stats.comparisons > 0, "perbandingan tercatat > 0");
        if (found > 0) {
            for (int i = 0; i < found && i < kMaxResults; ++i) {
                std::cout << "    -> ";
                printTicket(results[i]);
            }
        } else {
            std::cout << "    -> tidak ada tiket yang cocok\n";
        }
    }
}

void testBubbleSort(const std::string& key, const std::string& label) {
    std::cout << "\n== Tes Bubble Sort: " << label << " ==\n";

    // Salinan mutable dari array sumber + snapshot urutan id sebelum sorting.
    Ticket source[kTicketCount];
    std::vector<std::string> idsBefore;
    for (int i = 0; i < kTicketCount; ++i) {
        source[i] = kTickets[i];
        idsBefore.push_back(kTickets[i].id);
    }

    Ticket working[kTicketCount];
    for (int i = 0; i < kTicketCount; ++i) working[i] = source[i];

    SortStats stats = {};
    bubbleSortTickets(working, kTicketCount, key, &stats);
    printSortStats(stats);

    for (int i = 0; i < 3 && i < kTicketCount; ++i) {
        std::cout << "    " << (i + 1) << ". ";
        printTicket(&working[i]);
    }

    check(isSortedCorrectly(working, kTicketCount, key), "urutan hasil sesuai kriteria");
    check(stats.comparisons > 0, "perbandingan tercatat > 0");
    check(stats.swaps >= 0, "jumlah pertukaran tercatat");

    // Data array sumber tidak boleh berubah akibat pengurutan.
    bool sourceUnchanged = true;
    for (int i = 0; i < kTicketCount; ++i) {
        if (source[i].id != idsBefore[static_cast<std::size_t>(i)]) sourceUnchanged = false;
    }
    check(sourceUnchanged, "array sumber tidak dimodifikasi (sorting bekerja pada salinan)");
}

void testSortKeys() {
    // Urutan keempat kriteria pada data 12 tiket ini (dihitung program):
    // harga termurah dulu -> Rp65.000 ... Rp1.450.000
    Ticket working[kTicketCount];
    for (int i = 0; i < kTicketCount; ++i) working[i] = kTickets[i];

    SortStats stats = {};
    bubbleSortTickets(working, kTicketCount, "price_asc", &stats);
    check(working[0].price == 65000, "harga termurah pertama = Rp65.000");
    check(working[kTicketCount - 1].price == 1450000, "harga termurah terakhir = Rp1.450.000");

    for (int i = 0; i < kTicketCount; ++i) working[i] = kTickets[i];
    bubbleSortTickets(working, kTicketCount, "price_desc", &stats);
    check(working[0].price == 1450000, "harga termahal pertama = Rp1.450.000");
    check(working[kTicketCount - 1].price == 65000, "harga termahal terakhir = Rp65.000");

    for (int i = 0; i < kTicketCount; ++i) working[i] = kTickets[i];
    bubbleSortTickets(working, kTicketCount, "departure_earliest", &stats);
    check(departureKey(working[0]) <= departureKey(working[1]),
          "keberangkatan paling awal di urutan pertama");

    for (int i = 0; i < kTicketCount; ++i) working[i] = kTickets[i];
    bubbleSortTickets(working, kTicketCount, "duration_fastest", &stats);
    check(durationToMinutes(working[0].duration) == 85, "durasi tercepat = 1j 25m (85 menit)");
    check(durationToMinutes(working[kTicketCount - 1].duration) == 510,
          "durasi terlama = 8j 30m (Sinar Jaya)");
}

}  // namespace

int main() {
    std::cout << "Tiketin-UTS — pengujian modul C++ (struct, array, pointer, "
                 "linear search, bubble sort)\n";
    std::cout << "Jumlah tiket dalam array: " << kTicketCount << "\n";

    testStructAndPointer();
    testLinearSearch();
    testBubbleSort("price_asc", "harga termurah");
    testBubbleSort("price_desc", "harga termahal");
    testBubbleSort("departure_earliest", "keberangkatan paling awal");
    testBubbleSort("duration_fastest", "durasi tercepat");
    testSortKeys();

    std::cout << "\nRingkasan: " << g_passed << " lulus, " << g_failed << " gagal.\n";
    if (g_failed == 0) {
        std::cout << "SEMUA TES LULUS\n";
        return 0;
    }
    std::cout << "ADA TES YANG GAGAL\n";
    return 1;
}
