import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
var basePath = process.env.VITE_BASE_PATH && process.env.VITE_BASE_PATH.trim() !== ''
    ? process.env.VITE_BASE_PATH
    : '/';
export default defineConfig({
    base: basePath,
    plugins: [react(), tailwindcss()],
    server: {
        port: 5173
    }
});
