/**
 * Tiketin-UTS — Helper tema gelap/terang (fungsi murni, tanpa DOM).
 * Dipisah dari main.js agar logika tema (penyimpanan & pergantian) dapat
 * diuji dengan unit test tanpa menjalankan seluruh UI. main.js tetap bertugas
 * membaca/menulis localStorage dan mengubah atribut data-theme di <html>.
 */

/** Kunci penyimpanan preferensi tema di localStorage. */
export const THEME_STORAGE_KEY = "tiketin_theme";

/**
 * Menormalkan nilai tema menjadi "dark" | "light".
 * Nilai apa pun selain "dark" dianggap tema terang (sama seperti perilaku CSS
 * yang hanya mengenali [data-theme="dark"]).
 * @param {string|null|undefined} value
 * @returns {"dark"|"light"}
 */
export function normalizeTheme(value) {
  return value === "dark" ? "dark" : "light";
}

/**
 * Menghitung tema berikutnya hasil pergantian (toggle).
 * Nilai tidak dikenal diperlakukan sebagai tema terang.
 * @param {string|null|undefined} current
 * @returns {"dark"|"light"}
 */
export function toggleThemeName(current) {
  return normalizeTheme(current) === "dark" ? "light" : "dark";
}
