import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import autoprefixer from 'autoprefixer';
import path from 'path';
import fs from 'fs';
import handlebars from 'handlebars';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const pages = {"index":{"outputDir":"./","lang":"en","title":"","cacheVersion":5,"meta":[{"name":"twitter:card","content":"summary"},{"property":"og:type","content":"website"},{"name":"robots","content":"index, follow"}],"scripts":{"head":"\n","body":"<script>\r\n// ===================== PARENT BRIDGE (rmcparent.pages.dev) =====================\r\n(function () {\r\n  const CHILD_ORIGIN = 'https://testrmc.pages.dev';\r\n\r\n  console.log('[parent] bridge init on', location.origin);\r\n\r\n  // --- Mini helpers IndexedDB (DB: app-parent / store: kv) ---\r\n  function openDB() {\r\n    return new Promise((resolve, reject) => {\r\n      const req = indexedDB.open('app-parent', 1);\r\n      req.onupgradeneeded = () => {\r\n        console.log('[parent][idb] upgrade -> create store \"kv\"');\r\n        req.result.createObjectStore('kv', { keyPath: 'id' });\r\n      };\r\n      req.onsuccess = () => {\r\n        console.log('[parent][idb] opened');\r\n        resolve(req.result);\r\n      };\r\n      req.onerror = () => reject(req.error);\r\n    });\r\n  }\r\n  async function idbSet(record) {\r\n    const db = await openDB();\r\n    return new Promise((resolve, reject) => {\r\n      const tx = db.transaction('kv', 'readwrite');\r\n      tx.objectStore('kv').put(record);\r\n      tx.oncomplete = () => {\r\n        console.log('[parent][idb] saved', record);\r\n        resolve(true);\r\n      };\r\n      tx.onerror = () => reject(tx.error);\r\n    });\r\n  }\r\n  async function idbGet(id) {\r\n    const db = await openDB();\r\n    return new Promise((resolve, reject) => {\r\n      const tx = db.transaction('kv', 'readonly');\r\n      const rq = tx.objectStore('kv').get(id);\r\n      rq.onsuccess = () => {\r\n        console.log('[parent][idb] loaded', id, '->', rq.result);\r\n        resolve(rq.result || null);\r\n      };\r\n      rq.onerror = () => reject(rq.error);\r\n    });\r\n  }\r\n\r\n  // --- Réception des messages de l'iframe ---\r\n  window.addEventListener('message', async (e) => {\r\n    console.log('[parent] message received from', e.origin, e.data);\r\n\r\n    // Sécurité : on accepte UNIQUEMENT l’iframe attendue\r\n    if (e.origin !== CHILD_ORIGIN) {\r\n      console.warn('[parent] blocked message from unexpected origin:', e.origin);\r\n      return;\r\n    }\r\n\r\n    const src = e.source; // fenêtre de l’iframe\r\n    const { id, type, payload } = e.data || {};\r\n\r\n    try {\r\n      if (type === 'PING') {\r\n        console.log('[parent] PING -> PONG');\r\n        src?.postMessage({ id, type: 'PONG' }, e.origin);\r\n        return;\r\n      }\r\n\r\n      if (type === 'IDB_SAVE') {\r\n        const recId = payload?.id || 'contact';\r\n        const data = payload?.data || {};\r\n        await idbSet({ id: recId, ...data, _savedAt: Date.now() });\r\n        src?.postMessage({ id, type: 'OK' }, e.origin);\r\n        return;\r\n      }\r\n\r\n      if (type === 'IDB_LOAD') {\r\n        const recId = payload?.id || 'contact';\r\n        const data = await idbGet(recId);\r\n        src?.postMessage({ id, type: 'DATA', data }, e.origin);\r\n        return;\r\n      }\r\n\r\n      console.warn('[parent] unknown type:', type);\r\n      src?.postMessage({ id, type: 'ERR', error: 'UNKNOWN_TYPE' }, e.origin);\r\n    } catch (err) {\r\n      console.error('[parent] error handling message:', err);\r\n      src?.postMessage({ id, type: 'ERR', error: String(err) }, e.origin);\r\n    }\r\n  });\r\n})();\r\n</script>\r\n\n"},"baseTag":{"href":"/","target":"_self"},"alternateLinks":[{"rel":"alternate","hreflang":"x-default","href":"https://0e8cfe3f-cccd-4fa8-81f0-f415ad4b1615.weweb-preview.io/"},{"rel":"alternate","hreflang":"en","href":"https://0e8cfe3f-cccd-4fa8-81f0-f415ad4b1615.weweb-preview.io/"}]}};

// Read the main HTML template
const template = fs.readFileSync(path.resolve(__dirname, 'template.html'), 'utf-8');
const compiledTemplate = handlebars.compile(template);

// Generate an HTML file for each page with its metadata
Object.values(pages).forEach(pageConfig => {
    // Compile the template with page metadata
    const html = compiledTemplate({
        title: pageConfig.title,
        lang: pageConfig.lang,
        meta: pageConfig.meta,
        scripts: {
            head: pageConfig.scripts.head,
            body: pageConfig.scripts.body,
        },
        alternateLinks: pageConfig.alternateLinks,
        cacheVersion: pageConfig.cacheVersion,
        baseTag: pageConfig.baseTag,
    });

    // Save output html for each page
    if (!fs.existsSync(pageConfig.outputDir)) {
        fs.mkdirSync(pageConfig.outputDir, { recursive: true });
    }
    fs.writeFileSync(`${pageConfig.outputDir}/index.html`, html);
});

const rollupOptionsInput = {};
for (const pageName in pages) {
    rollupOptionsInput[pageName] = path.resolve(__dirname, pages[pageName].outputDir, 'index.html');
}

export default defineConfig(() => {
    return {
        plugins: [nodePolyfills({ include: ['events', 'stream', 'string_decoder'] }), vue()],
        base: "/",
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        css: {
            preprocessorOptions: {
                scss: {
                    api: 'modern-compiler',
                },
            },
            postcss: {
                plugins: [autoprefixer],
            },
        },
        build: {
            chunkSizeWarningLimit: 10000,
            rollupOptions: {
                input: rollupOptionsInput,
                onwarn: (entry, next) => {
                    if (entry.loc?.file && /js$/.test(entry.loc.file) && /Use of eval in/.test(entry.message)) return;
                    return next(entry);
                },
                maxParallelFileOps: 900,
            },
        },
        logLevel: 'warn',
    };
});
