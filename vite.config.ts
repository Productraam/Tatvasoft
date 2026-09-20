import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const tenantRegistryPath = path.resolve(__dirname, '.tenant-registry.json');

function tenantRegistryPlugin() {
  return {
    name: 'tatva-tenant-registry',
    configureServer(server: { middlewares: { use: (handler: (req: any, res: any, next: () => void) => void) => void } }) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== '/__tatva/tenant-registry') {
          next();
          return;
        }

        if (req.method === 'GET') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(fs.existsSync(tenantRegistryPath) ? fs.readFileSync(tenantRegistryPath, 'utf8') : 'null');
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              if (!Array.isArray(parsed)) throw new Error('Invalid tenant registry');
              fs.writeFileSync(tenantRegistryPath, JSON.stringify(parsed));
              res.statusCode = 204;
              res.end();
            } catch {
              res.statusCode = 400;
              res.end('Invalid tenant registry');
            }
          });
          return;
        }

        res.statusCode = 405;
        res.end();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tenantRegistryPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: '/',
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
