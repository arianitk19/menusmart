/* boneMENU — UI kit: dom helpers, toast, haptics, modal, router, menu renderer */
window.BM = window.BM || {};
(function (BM) {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const ico = BM.ico, esc = BM.esc, money = BM.money;

  const haptic = k => { const m = { light: 8, med: 16, ok: [8, 26, 10], warn: [18, 36, 18] }; if (navigator.vibrate) try { navigator.vibrate(m[k] || 8); } catch (e) {} };
  function toast(msg, type) { const t = type || "ok"; const el = document.createElement("div"); el.className = "toast";
    el.innerHTML = ico(t === "warn" ? "warn" : t === "info" ? "info" : "check") + "<span>" + esc(msg) + "</span>";
    $("#toasts").appendChild(el); haptic(t === "warn" ? "warn" : "ok");
    setTimeout(() => { el.style.transition = "opacity .3s,transform .3s"; el.style.opacity = "0"; el.style.transform = "translateY(10px)"; setTimeout(() => el.remove(), 320); }, 2400); }
  function modal(html) { const bg = document.createElement("div"); bg.className = "mbg"; bg.innerHTML = '<div class="modal nosb">' + html + "</div>";
    $("#modal-root").appendChild(bg); bg.addEventListener("click", e => { if (e.target === bg) close(); });
    function close() { bg.style.animation = "fade .2s reverse forwards"; setTimeout(() => bg.remove(), 200); } return { el: bg, close }; }
  function pickImage(cb) { const i = document.createElement("input"); i.type = "file"; i.accept = "image/*"; i.onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => cb(r.result); r.readAsDataURL(f); }; i.click(); }

  /* ---------- router ---------- */
  const Router = (() => {
    const routes = {}; let cleanup = null, cur = null;
    const DOCK = [["/", "home"], ["/builder", "cube"], ["/qr", "qr"], ["/menu", "eye"]];
    const reg = (p, fn) => routes[p] = fn;
    const loc = () => (location.hash.replace(/^#/, "") || "/").split("?")[0];
    function dock() { const d = $("#dock"); const p = loc();
      d.innerHTML = DOCK.map(([path, i]) => '<a class="di' + (path === p ? " on" : "") + '" href="#' + path + '">' + ico(i) + "</a>").join("");
      $$(".di", d).forEach(a => a.addEventListener("click", () => haptic("light")));
      d.style.display = p === "/menu" ? "none" : ""; }
    function go() { const p = loc(); const fn = routes[p] || routes["/"]; const app = $("#app");
      if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
      const old = $(".view", app);
      const paint = () => { app.innerHTML = ""; const r = fn(app); cleanup = r && r.cleanup; dock(); app.scrollTop = 0; };
      if (old) { old.classList.add("leaving"); setTimeout(paint, 170); } else paint(); cur = p; }
    window.addEventListener("hashchange", go);
    return { reg, go, loc, dock };
  })();

  /* ---------- menu renderer (shared: builder preview + public) ---------- */
  const MenuView = (() => {
    function disc(p, d) { const a = parseFloat(p), b = parseFloat(d); if (isNaN(a) || isNaN(b) || b <= 0) return null; return (a * (1 - b / 100)).toFixed(2); }
    function card(it, cur) { const dp = disc(it.price, it.discount);
      const badges = (it.popular ? '<span class="bdg bdg-pop">Popular</span>' : "") + (it.isNew ? '<span class="bdg bdg-new">E re</span>' : "") + (it.discount && +it.discount > 0 ? '<span class="bdg bdg-off">-' + parseInt(it.discount) + "%</span>" : "");
      const price = dp ? '<span class="mv-old">' + money(it.price) + cur + '</span> <span class="mv-price">' + dp + cur + "</span>" : '<span class="mv-price">' + money(it.price) + cur + "</span>";
      return '<div class="mv-card' + (it.available === false ? " off" : "") + '" data-id="' + esc(it.id) + '" data-name="' + esc(it.name).toLowerCase() + '" data-pop="' + (it.popular ? 1 : 0) + '">' +
        (it.image ? '<div class="mv-img" style="background-image:url(' + JSON.stringify(it.image) + ')"></div>' : "") +
        '<div class="mv-b"><div class="mv-t"><span class="mv-n">' + esc(it.name) + "</span>" + (badges ? '<span class="mv-bd">' + badges + "</span>" : "") + "</div>" +
        (it.desc ? '<p class="mv-d">' + esc(it.desc) + "</p>" : "") +
        '<div class="mv-f">' + price + (it.available === false ? '<span class="mv-na">Mbaroi</span>' : "") + "</div></div></div>"; }
    function render(menu, opt) { opt = opt || {}; const cur = (menu && menu.currency) || "€"; const cats = (menu && menu.categories) || [];
      const hero = '<header class="mv-hero">' + (menu.logo ? '<img class="mv-logo" src="' + esc(menu.logo) + '">' : "") + '<h1 class="mv-biz">' + esc(menu.name || "Menu") + '</h1><div class="mv-acc"></div>' +
        (opt.search !== false ? '<div class="mv-search">' + ico("search") + '<input placeholder="Kërko në menu…"></div>' : "") + "</header>";
      const chips = cats.length ? '<div class="mv-chips nosb"><button class="mv-chip on" data-f="all">Të gjitha</button><button class="mv-chip" data-f="pop">' + ico("fire") + "Popular</button>" + cats.map((c, i) => '<button class="mv-chip" data-j="' + i + '">' + esc(c.name) + "</button>").join("") + "</div>" : "";
      const body = cats.length ? cats.map((c, i) => '<section class="mv-cat" id="mc' + i + '"><h2 class="mv-ch">' + esc(c.name) + "<span>" + c.items.length + "</span></h2><div class=\"mv-items\">" + (c.items.length ? c.items.map(it => card(it, cur)).join("") : '<div class="mv-empty">Ende s\'ka artikuj</div>') + "</div></section>").join("") : '<div class="mv-blank">' + ico("layers") + "<p>Menuja është bosh</p></div>";
      return '<div class="mv" style="--mp:' + esc(menu.primary || "#FF5C00") + ";color:" + esc(menu.text || "#0a0a0a") + '">' + hero + chips + '<main class="mv-main">' + body + '</main><footer class="mv-foot">Powered by <b>boneMENU</b></footer></div>'; }
    function bind(root) { if (!root) return; const q = $(".mv-search input", root); let filter = "all"; const cards = () => $$(".mv-card", root);
      function apply() { const term = (q && q.value || "").trim().toLowerCase(); cards().forEach(c => { const okt = !term || c.dataset.name.includes(term); const okf = filter === "all" || (filter === "pop" && c.dataset.pop === "1"); c.style.display = okt && okf ? "" : "none"; });
        $$(".mv-cat", root).forEach(s => { s.style.display = $$(".mv-card", s).some(c => c.style.display !== "none") ? "" : "none"; }); }
      q && q.addEventListener("input", apply);
      $$(".mv-chip", root).forEach(ch => ch.addEventListener("click", () => { if (ch.dataset.j != null) { const t = $("#mc" + ch.dataset.j, root); t && t.scrollIntoView({ behavior: "smooth", block: "start" }); haptic("light"); return; } $$(".mv-chip[data-f]", root).forEach(x => x.classList.remove("on")); ch.classList.add("on"); filter = ch.dataset.f; apply(); haptic("light"); })); }
    return { render, bind, card, disc };
  })();

  Object.assign(BM, { $, $$, haptic, toast, modal, pickImage, Router, MenuView });
})(window.BM);
