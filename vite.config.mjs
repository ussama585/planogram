import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import jsconfigPaths from 'vite-jsconfig-paths';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const API_URL = env.VITE_APP_BASE_NAME || '/';
    const PORT = 3000;

    return {
        server: {
            open: true,
            port: PORT,
            host: true
        },

        build: {
            chunkSizeWarningLimit: 1600
        },

        preview: {
            open: true,
            host: true
        },

        define: {
            global: 'window'
        },

        resolve: {
            alias: [
                {
                    find: '@',
                    replacement: path.resolve(__dirname, 'src')
                },
                {
                    find: /^~(.+)/,
                    replacement: path.resolve(__dirname, 'node_modules/$1')
                },
                {
                    find: /^src\/(.+)/,
                    replacement: path.resolve(__dirname, 'src/$1')
                },
                {
                    find: 'assets',
                    replacement: path.resolve(__dirname, 'src/assets')
                }
            ]
        },

        base: API_URL,
        plugins: [react(), jsconfigPaths()]
    };
});