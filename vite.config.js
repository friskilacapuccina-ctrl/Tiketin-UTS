import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  // Repository Pages publishes this project under /Tiketin-UTS/.
  base: '/Tiketin-UTS/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    port: 3000,
    open: true,
    watch: {
      // Abaikan artefak kompilasi C++ & hasil build agar watcher Vite
      // tidak pernah mencoba memantau file yang terkunci (EBUSY).
      ignored: [
        '**/cpp/**/*.obj',
        '**/cpp/**/*.exe',
        '**/*.obj',
        '**/*.exe'
      ]
    }
  }
})
