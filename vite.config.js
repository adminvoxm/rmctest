import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import autoprefixer from 'autoprefixer';
import path from 'path';
import fs from 'fs';
import handlebars from 'handlebars';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const pages = {"index":{"outputDir":"./","lang":"en","title":"","cacheVersion":3,"meta":[{"name":"twitter:card","content":"summary"},{"property":"og:type","content":"website"},{"name":"robots","content":"index, follow"}],"scripts":{"head":"\n","body":"<script>\r\n(async function(){\r\n  // Ton ensureIdbForm() ici si tu l'as déjà. Sinon, remplace par ton code IDB.\r\n  async function ensureIdbForm() {\r\n    if (window.__idbReady) return window.__idbReady;\r\n    window.__idbReady = new Promise((resolve, reject) => {\r\n      const req = indexedDB.open('app-parent', 1);\r\n      req.onupgradeneeded = () => req.result.createObjectStore('kv', { keyPath: 'id' });\r\n      req.onsuccess = () => resolve(req.result);\r\n      req.onerror = () => reject(req.error);\r\n    });\r\n    return window.__idbReady;\r\n  }\r\n  async function idbSet(record) {\r\n    const db = await ensureIdbForm();\r\n    return new Promise((resolve, reject) => {\r\n      const tx = db.transaction('kv','readwrite');\r\n      tx.objectStore('kv').put(record);\r\n      tx.oncomplete = () => resolve(true);\r\n      tx.onerror = () => reject(tx.error);\r\n    });\r\n  }\r\n  async function idbGet(id) {\r\n    const db = await ensureIdbForm();\r\n    return new Promise((resolve, reject) => {\r\n      const tx = db.transaction('kv','readonly');\r\n      const rq = tx.objectStore('kv').get(id);\r\n      rq.onsuccess = () => resolve(rq.result || null);\r\n      rq.onerror = () => reject(rq.error);\r\n    });\r\n  }\r\n\r\n  const CHILD = 'https://testrmc.pages.dev';\r\n  window.addEventListener('message', async (e) => {\r\n    if (e.origin !== CHILD) return; // sécurité\r\n    const { id, type, payload } = e.data || {};\r\n    try {\r\n      if (type === 'IDB_SAVE') {\r\n        await idbSet({ id: payload.id || 'contact', ...payload.data, _at: Date.now() });\r\n        e.source?.postMessage({ id, type: 'OK' }, e.origin);\r\n      }\r\n      if (type === 'IDB_LOAD') {\r\n        const data = await idbGet(payload.id || 'contact');\r\n        e.source?.postMessage({ id, type: 'DATA', data }, e.origin);\r\n      }\r\n    } catch (err) {\r\n      e.source?.postMessage({ id, type: 'ERR', error: String(err) }, e.origin);\r\n    }\r\n  });\r\n})();\r\n</script>\r\n\n"},"baseTag":{"href":"/","target":"_self"},"alternateLinks":[{"rel":"alternate","hreflang":"x-default","href":"https://0e8cfe3f-cccd-4fa8-81f0-f415ad4b1615.weweb-preview.io/"},{"rel":"alternate","hreflang":"en","href":"https://0e8cfe3f-cccd-4fa8-81f0-f415ad4b1615.weweb-preview.io/"}]}};

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
