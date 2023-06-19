import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cesium from 'vite-plugin-cesium';

/** @type {import('vite').UserConfig} */
export default defineConfig({
  publicDir: "../public",
  root: "demo",
  plugins: [react(), cesium()]
})
