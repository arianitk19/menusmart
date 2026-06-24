/* ============================================================
   boneMENU — STORE  (reactive, IndexedDB, REAL data only)
   No seeded analytics, no fake numbers. Starts from zero.
   Global: window.BM (extended by other modules)
   ============================================================ */
window.BM = window.BM || {};
(function (BM) {
  "use strict";

  /* helpers */
  const uid = p => (p || "id") + "_" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = v => { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? "0.00" : n.toFixed(2); };
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  /* ---------- DB: IndexedDB + localStorage fallback ---------- */
  const DB = (() => {
    const NAME = "boneMENU", STORE = "kv", LS = "boneMENU_doc_";
    let dbp = null, useIDB = typeof indexedDB !== "undefined";
    const open = () => dbp || (dbp = new Promise((res, rej) => {
      try { const r = indexedDB.open(NAME, 1);
        r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE); };
        r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
      } catch (e) { rej(e); }
    }));
    async function get(k) {
      if (useIDB) { try { const db = await open(); return await new Promise((res, rej) => { const t = db.transaction(STORE, "readonly").objectStore(STORE).get(k); t.onsuccess = () => res(t.result); t.onerror = () => rej(t.error); }); } catch (e) { useIDB = false; } }
      try { const v = localStorage.getItem(LS + k); return v ? JSON.parse(v) : undefined; } catch (e) { return undefined; }
    }
    async function set(k, v) {
      try { localStorage.setItem(LS + k, JSON.stringify(v)); } catch (e) {}
      if (useIDB) { try { const db = await open(); return await new Promise((res, rej) => { const t = db.transaction(STORE, "readwrite").objectStore(STORE).put(v, k); t.onsuccess = () => res(1); t.onerror = () => rej(t.error); }); } catch (e) { useIDB = false; } }
    }
    const ls = k => { try { const v = localStorage.getItem(LS + k); return v ? JSON.parse(v) : undefined; } catch (e) { return undefined; } };
    return { get, set, ls, engine: () => useIDB ? "IndexedDB" : "localStorage" };
  })();

  /* ---------- schema ---------- */
  const VERSION = 5, KEY = "doc";
  const newMenu = name => ({
    id: uid("menu"), name: name || "Menuja Ime", currency: "€",
    primary: "#FF5C00", text: "#0a0a0a", logo: "",
    categories: [], qr: { style: "premium", color: "#000000", url: "" },
    createdAt: Date.now(), updated: Date.now()
  });
  const fresh = () => ({ v: VERSION, activeId: null, menus: [], meta: { created: Date.now(), updated: Date.now() } });

  /* ---------- migration from older boneMENU schemas (keeps user's real menus) ---------- */
  function migrate(raw) {
    if (!raw) return fresh();
    if (raw.v >= 5) return raw;
    const s = fresh();
    try {
      const oldMenus = raw.menus || (raw.business ? raw.menus : null);
      if (Array.isArray(raw.menus) && raw.menus.length) {
        s.menus = raw.menus.map(m => {
          const nm = newMenu(m.name);
          nm.id = m.id || nm.id;
          nm.logo = (raw.business && raw.business.logo) || m.logo || "";
          nm.primary = (raw.business && raw.business.primary) || m.primary || "#FF5C00";
          nm.text = (raw.business && raw.business.text) || m.text || "#0a0a0a";
          nm.categories = (m.categories || []).map(c => ({ id: c.id || uid("cat"), name: c.name || c.title || "Kategori",
            items: (c.items || []).map(it => ({ id: it.id || uid("it"), name: it.name || "", desc: it.desc || "", price: money(it.price), discount: it.discount || "", image: it.image || "", popular: !!it.popular, isNew: !!it.isNew, available: it.available !== false })) }));
          return nm;
        });
        s.activeId = (raw.menus.find(m => m.active) || raw.menus[0]).id;
      }
    } catch (e) {}
    return s;
  }

  /* ---------- reactive store ---------- */
  let state = fresh(), subs = new Set(), undoS = [], redoS = [], booting = false;
  const bc = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("bonemenu") : null;
  const snap = () => JSON.parse(JSON.stringify(state));

  async function boot() {
    booting = true;
    let raw = DB.ls(KEY) || (function () { try { return JSON.parse(localStorage.getItem("boneMENU_state")); } catch (e) { return null; } })();
    state = migrate(raw);
    if (!raw) await DB.set(KEY, state);
    try { const idb = await DB.get(KEY); if (idb && idb.meta && (!state.meta || idb.meta.updated >= state.meta.updated)) state = migrate(idb); } catch (e) {}
    booting = false; notify();
    if (bc) bc.onmessage = e => { if (e.data && e.data.type === "sync" && e.data.state) { state = e.data.state; notify(); } };
    window.addEventListener("storage", ev => { if (ev.key && ev.key.indexOf("boneMENU_doc_") === 0) { const r = DB.ls(KEY); if (r) { state = r; notify(); } } });
    return state;
  }

  const save = debounce(async () => { state.meta.updated = Date.now(); await DB.set(KEY, state); if (bc) bc.postMessage({ type: "sync", state: snap() }); }, 250);
  function notify() { if (booting) return; applyBrand(); subs.forEach(f => { try { f(state); } catch (e) { console.error(e); } }); }
  const sub = f => { subs.add(f); return () => subs.delete(f); };
  function mutate(fn, opt) { opt = opt || {}; if (!opt.noUndo) { undoS.push(snap()); if (undoS.length > 50) undoS.shift(); redoS.length = 0; } fn(state); save(); notify(); }
  function undo() { if (!undoS.length) return false; redoS.push(snap()); state = undoS.pop(); save(); notify(); return true; }
  function redo() { if (!redoS.length) return false; undoS.push(snap()); state = redoS.pop(); save(); notify(); return true; }
  const canUndo = () => undoS.length > 0, canRedo = () => redoS.length > 0;

  /* ---------- domain ---------- */
  const get = () => state;
  const menus = () => state.menus;
  const activeMenu = () => state.menus.find(m => m.id === state.activeId) || state.menus[0] || null;
  const menuById = id => state.menus.find(m => m.id === id);
  const setActive = id => { mutate(s => s.activeId = id, { noUndo: true }); };
  function createMenu(name) { const m = newMenu(name); mutate(s => { s.menus.push(m); s.activeId = m.id; }); return m; }
  function duplicateMenu(id) { const src = menuById(id); if (!src) return; const c = JSON.parse(JSON.stringify(src)); c.id = uid("menu"); c.name = src.name + " (kopje)"; c.createdAt = Date.now(); c.categories.forEach(cat => { cat.id = uid("cat"); cat.items.forEach(it => it.id = uid("it")); }); mutate(s => { s.menus.push(c); s.activeId = c.id; }); return c; }
  function deleteMenu(id) { mutate(s => { s.menus = s.menus.filter(m => m.id !== id); if (s.activeId === id) s.activeId = s.menus[0] ? s.menus[0].id : null; }); }
  const totalItems = m => (m ? [m] : state.menus).reduce((s, x) => s + x.categories.reduce((a, c) => a + c.items.length, 0), 0);
  function applyBrand() { const m = activeMenu(); document.documentElement.style.setProperty("--p", (m && m.primary) || "#FF5C00"); }
  const exportJSON = () => JSON.stringify(state, null, 2);
  function importJSON(str) { const o = JSON.parse(str); state = migrate(o); save(); notify(); }

  Object.assign(BM, { uid, esc, money, clamp, debounce,
    Store: { VERSION, boot, sub, mutate, undo, redo, canUndo, canRedo, get, menus, activeMenu, menuById, setActive, createMenu, duplicateMenu, deleteMenu, totalItems, applyBrand, exportJSON, importJSON, engine: DB.engine, newMenu } });
})(window.BM);
