# Modul C++ Tiketin — Array, Pointer, Struct

Folder ini berisi **implementasi C++ terpisah** untuk memenuhi tugas UTS
Struktur Data (Array, Pointer, Struct, Searching, Sorting).

| File | Isi |
|---|---|
| `ticket.h` | `struct Ticket`, `struct SearchCriteria`, `struct SearchStats`, `struct SortStats`, deklarasi fungsi (semua memakai pointer). |
| `ticket.cpp` | Implementasi **Linear Search** (penelusuran array lewat pointer) dan **Bubble Sort** (in-place, akses elemen `*(tickets + j)`), plus parser durasi & kunci waktu. |
| `main.cpp` | Program pengujian: data 12 tiket (subset `src/data/tickets.js`), kasus pencarian ada/tidak ada hasil, pengurutan 4 kriteria, verifikasi urutan, dan pengecekan bahwa array sumber tidak dimodifikasi. |
| `build.bat` | Kompilasi + jalankan pengujian (MSVC, Windows). |

## Cara kompilasi & menguji

### Windows (MSVC — tersedia di mesin ini)
```bat
cpp\build.bat
```
Skrip otomatis mencari Visual Studio lewat `vswhere`, memuat `vcvars64.bat`,
lalu: `cl /EHsc /std:c++17 /W4 /tiketin_test.exe main.cpp ticket.cpp` dan
menjalankan `tiketin_test.exe`. Exit code `0` = semua tes lulus.

### Manual (MSVC)
```bat
call "C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvars64.bat"
cl /EHsc /std:c++17 /W4 /Fe:tiketin_test.exe main.cpp ticket.cpp
tiketin_test.exe
```

### GCC/Clang (mis. di Linux / MSYS2)
```bash
g++ -std=c++17 -Wall -Wextra -o tiketin_test main.cpp ticket.cpp
./tiketin_test
```

## Hubungan dengan website (penjelasan jujur)

- Website Tiketin berjalan penuh dengan **JavaScript di browser** (Vite +
  ES module di `src/js/`). Data tiket website adalah **array of object** di
  `src/data/tickets.js`; pencarian memakai Linear Search dan pengurutan memakai
  Bubble Sort di `src/js/algorithms.js` + `src/js/search.js`.
- Kode di folder ini **TIDAK dijalankan browser** dan **TIDAK diintegrasikan
  ke Vite/website**. Tidak ada klaim bahwa website memakai pointer C++.
- Nilai pendidikannya: memperlihatkan konsep yang sama dalam bahasa yang
  benar-benar memiliki **pointer** dan **struct**: `struct Ticket` disimpan di
  **array**, diakses lewat pointer (`base + i`, `->`), dicari dengan Linear
  Search, dan diurutkan dengan Bubble Sort — semuanya dikompilasi dan diuji
  sebagai program mandiri.
- Kedua implementasi memakai **algoritma dan kriteria yang sama** (harga
  termurah/termahal, keberangkatan paling awal, durasi tercepat) sehingga
  perilakunya sejalan dengan yang tampil di website.
