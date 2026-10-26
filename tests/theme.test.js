/**
 * Unit test logika tema (fungsi murni di src/js/theme.js).
 * Pemisahan ini memungkinkan pengujian tema tanpa menjalankan UI apa pun;
 * main.js memakai helper yang sama untuk membaca/menulis preferensi tema.
 */
import { describe, it, expect } from "vitest";
import { THEME_STORAGE_KEY, normalizeTheme, toggleThemeName } from "../src/js/theme.js";

describe("THEME_STORAGE_KEY", () => {
  it("memakai kunci penyimpanan yang dipakai aplikasi", () => {
    expect(THEME_STORAGE_KEY).toBe("tiketin_theme");
  });
});

describe("normalizeTheme", () => {
  it("hanya 'dark' yang dianggap gelap", () => {
    expect(normalizeTheme("dark")).toBe("dark");
  });

  it("nilai lain dinormalkan menjadi terang", () => {
    expect(normalizeTheme("light")).toBe("light");
    expect(normalizeTheme(null)).toBe("light");
    expect(normalizeTheme(undefined)).toBe("light");
    expect(normalizeTheme("DARK")).toBe("light");
    expect(normalizeTheme("banana")).toBe("light");
  });
});

describe("toggleThemeName", () => {
  it("bergantian terang <-> gelap", () => {
    expect(toggleThemeName("light")).toBe("dark");
    expect(toggleThemeName("dark")).toBe("light");
  });

  it("nilai tidak dikenal diperlakukan sebagai terang (menghasilkan gelap)", () => {
    expect(toggleThemeName(null)).toBe("dark");
    expect(toggleThemeName("sembarang")).toBe("dark");
  });

  it("toggle dua kali kembali ke tema awal", () => {
    expect(toggleThemeName(toggleThemeName("light"))).toBe("light");
    expect(toggleThemeName(toggleThemeName("dark"))).toBe("dark");
  });
});
