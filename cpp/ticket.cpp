/**
 * Tiketin-UTS — ticket.cpp
 * Implementasi linear search (pointer) dan bubble sort (pointer, in-place)
 * untuk array struct Ticket.
 *
 * Semua angka statistik dihasilkan oleh counter yang dinaikkan di dalam
 * loop algoritma — bukan angka statis.
 */

#include "ticket.h"

#include <algorithm>  // std::swap
#include <cctype>
#include <iostream>
#include <sstream>

namespace {

/** Trim + huruf kecil untuk perbandingan kota (mirip normalizeCity di JS). */
std::string normalize(const std::string& value) {
    std::string result;
    result.reserve(value.size());
    for (char ch : value) {
        result.push_back(static_cast<char>(std::tolower(static_cast<unsigned char>(ch))));
    }
    // buang spasi di awal/akhir
    std::size_t begin = result.find_first_not_of(" \t\r\n");
    if (begin == std::string::npos) return "";
    std::size_t end = result.find_last_not_of(" \t\r\n");
    return result.substr(begin, end - begin + 1);
}

/** Perbandingan kunci pengurutan. true bila a harus berada setelah b. */
bool isAfter(const Ticket& a, const Ticket& b, const std::string& sortKey) {
    if (sortKey == "price_asc") return a.price > b.price;
    if (sortKey == "price_desc") return a.price < b.price;
    if (sortKey == "departure_earliest") {
        const std::string ka = departureKey(a);
        const std::string kb = departureKey(b);
        return ka > kb;
    }
    // default: durasi tercepat
    return durationToMinutes(a.duration) > durationToMinutes(b.duration);
}

}  // namespace

int durationToMinutes(const std::string& duration) {
    std::istringstream stream(duration);
    int total = 0;
    int value = 0;
    char unit = 0;
    bool parsedAny = false;
    while (stream >> value >> unit) {
        parsedAny = true;
        if (unit == 'j' || unit == 'J') {
            total += value * 60;
        } else if (unit == 'm' || unit == 'M') {
            total += value;
        }
    }
    return parsedAny ? total : -1;
}

std::string departureKey(const Ticket& ticket) {
    return ticket.departureDate + " " + ticket.departureTime;
}

int linearSearchTickets(const Ticket* tickets, int count,
                        const SearchCriteria& criteria,
                        const Ticket** out, int maxOut,
                        SearchStats* stats) {
    SearchStats localStats = {0, 0, 0};

    // Pointer berjalan: dari alamat elemen pertama sampai akhir array.
    const Ticket* current = tickets;
    const Ticket* end = tickets + count;

    for (; current != end; ++current) {
        localStats.checked += 1;  // satu elemen array diperiksa

        bool match = true;

        if (!criteria.transportType.empty()) {
            localStats.comparisons += 1;
            if (current->transportType != criteria.transportType) match = false;
        }
        if (match && !criteria.origin.empty()) {
            localStats.comparisons += 1;
            if (normalize(current->origin) != normalize(criteria.origin)) match = false;
        }
        if (match && !criteria.destination.empty()) {
            localStats.comparisons += 1;
            if (normalize(current->destination) != normalize(criteria.destination)) match = false;
        }
        if (match && !criteria.departureDate.empty()) {
            localStats.comparisons += 1;
            if (current->departureDate != criteria.departureDate) match = false;
        }

        if (match) {
            localStats.found += 1;
            if (out != nullptr && localStats.found <= maxOut) {
                // Menyimpan alamat elemen array lewat pointer-ke-pointer.
                out[localStats.found - 1] = current;
            }
        }
    }

    if (stats != nullptr) *stats = localStats;
    return localStats.found;
}

void bubbleSortTickets(Ticket* tickets, int count,
                       const std::string& sortKey, SortStats* stats) {
    SortStats localStats = {0, 0};
    if (tickets == nullptr || count < 2) {
        if (stats != nullptr) *stats = localStats;
        return;
    }

    for (int i = 0; i < count - 1; ++i) {
        bool swapped = false;
        for (int j = 0; j < count - 1 - i; ++j) {
            // Akses elemen array lewat pointer: *(tickets + j)
            Ticket* left = tickets + j;
            Ticket* right = tickets + j + 1;
            localStats.comparisons += 1;
            if (isAfter(*left, *right, sortKey)) {
                std::swap(*left, *right);
                localStats.swaps += 1;
                swapped = true;
            }
        }
        if (!swapped) break;  // sudah terurut
    }

    if (stats != nullptr) *stats = localStats;
}

void printTicket(const Ticket* ticket) {
    if (ticket == nullptr) {
        std::cout << "(tiket null)\n";
        return;
    }
    std::cout << ticket->id << " | " << ticket->operatorName
              << " | " << ticket->origin << " -> " << ticket->destination
              << " | " << ticket->departureDate << " " << ticket->departureTime
              << " | " << ticket->duration
              << " | Rp" << ticket->price
              << " | kursi " << ticket->availableSeats
              << " | " << ticket->travelClass << "\n";
}

void printSearchStats(const SearchStats& stats) {
    std::cout << "  metode=Linear Search"
              << " | data diperiksa=" << stats.checked
              << " | perbandingan=" << stats.comparisons
              << " | hasil=" << stats.found << "\n";
}

void printSortStats(const SortStats& stats) {
    std::cout << "  metode=Bubble Sort"
              << " | perbandingan=" << stats.comparisons
              << " | pertukaran=" << stats.swaps << "\n";
}
