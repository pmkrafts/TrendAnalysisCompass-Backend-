import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'TrendAnalysisBackend',
            fileName: () => 'main.js',
            formats: ['es']
        },
        rollupOptions: {
            external: [
                'sqlite3',
                'fs',
                'path',
                'csv-parse',
                'dotenv',
                'stream',
                'os',
                'crypto',
                'util',
                'events',
                'buffer'
            ],
            output: {
                dir: 'dist'
            }
        },
        target: 'node18',
        outDir: 'dist',
        minify: false,
        ssr: true
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    },
    esbuild: {
        platform: 'node'
    },
    ssr: {
        target: 'node',
        noExternal: []
    }
});
