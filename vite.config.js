import { defineConfig } from 'vite'

export default defineConfig({
  base: '/muisyle-elysium/',
  publicDir: false,
  build: { outDir: 'dist', emptyOutDir: true, sourcemap: false }
})
