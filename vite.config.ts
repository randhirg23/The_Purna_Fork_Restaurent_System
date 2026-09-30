import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  server: {
    port: 5173,
    watch: {
      ignored: [
        '**/data/**',
        '**/data/db.json',
        '**/.system_generated/**',
        '**/*.log'
      ]
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  plugins: [
    {
      name: 'serve-raw-css',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && (req.url.split('?')[0] === '/style.css')) {
            const cssPath = path.resolve(__dirname, 'style.css');
            if (fs.existsSync(cssPath)) {
              res.setHeader('Content-Type', 'text/css; charset=utf-8');
              res.end(fs.readFileSync(cssPath, 'utf-8'));
              return;
            }
          }
          next();
        });
      }
    }
  ]
});
