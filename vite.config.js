import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import autoprefixer from 'autoprefixer';
import path from 'path';
import fs from 'fs';
import handlebars from 'handlebars';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const pages = {"index":{"outputDir":"./","lang":"en","title":"","cacheVersion":6,"meta":[{"name":"twitter:card","content":"summary"},{"property":"og:type","content":"website"},{"name":"robots","content":"index, follow"}],"scripts":{"head":"\n","body":"<script>\r\n// ===================== PARENT BRIDGE (rmctest.pages.dev) =====================\r\n(function () {\r\n  // 1) Autoriser uniquement vos iframes connues\r\n  const CHILD_ORIGINS = new Set([\r\n    'https://testrmc.pages.dev',   // <-- ton iframe enfant\r\n    // 'https://autre-env.pages.dev', // (optionnel) autre env\r\n  ]);\r\n\r\n  console.log('[parent] bridge init on', location.origin, 'allowed:', [...CHILD_ORIGINS]);\r\n\r\n  // 2) Optionnel : retrouver la fenêtre de l'iframe cible (pour être encore plus strict)\r\n  function getChildWindow(eventOrigin) {\r\n    const frames = Array.from(document.querySelectorAll('iframe'));\r\n    const target = frames.find(f => {\r\n      try { return f.src && new URL(f.src).origin === eventOrigin; } catch { return false; }\r\n    });\r\n    return target?.contentWindow || null;\r\n  }\r\n\r\n  // 3) Helpers IndexedDB très simples (DB: app-parent / store: kv)\r\n  function openDB() {\r\n    return new Promise((resolve, reject) => {\r\n      const req = indexedDB.open('app-parent', 1);\r\n      req.onupgradeneeded = () => {\r\n        console.log('[parent][idb] upgrade -> create store \"kv\"');\r\n        req.result.createObjectStore('kv', { keyPath: 'id' });\r\n      };\r\n      req.onsuccess = () => { console.log('[parent][idb] opened'); resolve(req.result); };\r\n      req.onerror   = () => reject(req.error);\r\n    });\r\n  }\r\n  async function idbSet(record) {\r\n    const db = await openDB();\r\n    return new Promise((resolve, reject) => {\r\n      const tx = db.transaction('kv', 'readwrite');\r\n      tx.objectStore('kv').put(record);\r\n      tx.oncomplete = () => { console.log('[parent][idb] saved', record); resolve(true); };\r\n      tx.onerror    = () => reject(tx.error);\r\n    });\r\n  }\r\n  async function idbGet(id) {\r\n    const db = await openDB();\r\n    return new Promise((resolve, reject) => {\r\n      const tx = db.transaction('kv', 'readonly');\r\n      const rq = tx.objectStore('kv').get(id);\r\n      rq.onsuccess = () => { console.log('[parent][idb] loaded', id, '->', rq.result); resolve(rq.result || null); };\r\n      rq.onerror   = () => reject(rq.error);\r\n    });\r\n  }\r\n\r\n  // 4) Réception des messages\r\n  window.addEventListener('message', async (e) => {\r\n    console.log('[parent] message received from', e.origin, e.data);\r\n\r\n    // a) bruit: messages envoyés par la page elle-même (même origin) → on ignore poliment\r\n    if (e.origin === location.origin) {\r\n      console.log('[parent] ignore self-origin message');\r\n      return;\r\n    }\r\n\r\n    // b) filtrage par origine autorisée\r\n    if (!CHILD_ORIGINS.has(e.origin)) {\r\n      console.warn('[parent] blocked message from unexpected origin:', e.origin);\r\n      return;\r\n    }\r\n\r\n    // c) filtrage par fenêtre: s'assurer que ça vient bien de l'iframe correspondante\r\n    const childWin = getChildWindow(e.origin);\r\n    if (childWin && e.source !== childWin) {\r\n      console.warn('[parent] message not from the registered iframe window');\r\n      return;\r\n    }\r\n\r\n    // d) filtrage par \"namespace\" : ne traiter QUE nos messages\r\n    const msg = e.data || {};\r\n    if (msg.__bridge !== 'IDB_BRIDGE') {\r\n      console.log('[parent] ignore non-bridge message');\r\n      return;\r\n    }\r\n\r\n    const { id, type, payload } = msg;\r\n\r\n    try {\r\n      if (type === 'PING') {\r\n        console.log('[parent] PING -> PONG');\r\n        e.source?.postMessage({ __bridge: 'IDB_BRIDGE', id, type: 'PONG' }, e.origin);\r\n        return;\r\n      }\r\n\r\n      if (type === 'IDB_SAVE') {\r\n        const recId = payload?.id || 'contact';\r\n        const data  = payload?.data || {};\r\n        await idbSet({ id: recId, ...data, _savedAt: Date.now() });\r\n        e.source?.postMessage({ __bridge: 'IDB_BRIDGE', id, type: 'OK' }, e.origin);\r\n        return;\r\n      }\r\n\r\n      if (type === 'IDB_LOAD') {\r\n        const recId = payload?.id || 'contact';\r\n        const data  = await idbGet(recId);\r\n        e.source?.postMessage({ __bridge: 'IDB_BRIDGE', id, type: 'DATA', data }, e.origin);\r\n        return;\r\n      }\r\n\r\n      console.warn('[parent] unknown type:', type);\r\n      e.source?.postMessage({ __bridge: 'IDB_BRIDGE', id, type: 'ERR', error: 'UNKNOWN_TYPE' }, e.origin);\r\n    } catch (err) {\r\n      console.error('[parent] error handling message:', err);\r\n      e.source?.postMessage({ __bridge: 'IDB_BRIDGE', id, type: 'ERR', error: String(err) }, e.origin);\r\n    }\r\n  });\r\n})();\r\n</script>\r\n\n"},"baseTag":{"href":"/","target":"_self"},"alternateLinks":[{"rel":"alternate","hreflang":"x-default","href":"https://0e8cfe3f-cccd-4fa8-81f0-f415ad4b1615.weweb-preview.io/"},{"rel":"alternate","hreflang":"en","href":"https://0e8cfe3f-cccd-4fa8-81f0-f415ad4b1615.weweb-preview.io/"}]}};

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
