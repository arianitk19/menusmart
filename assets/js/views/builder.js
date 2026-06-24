/* boneMENU — Builder: real-time professional menu creation assistant */
window.BM = window.BM || {}; BM.views = BM.views || {};
(function (BM) {
  "use strict";
  const { $, $$, ico, esc, money, toast, haptic, modal, pickImage, MenuView } = BM, S = BM.Store;

  BM.views.builder = function (app) {
    const view = document.createElement("div"); view.className = "view"; app.appendChild(view);
    let menu = S.activeMenu();

    if (!menu) {
      view.innerHTML = '<div class="glass empty" style="margin-top:40px">' + ico("layers") +
        '<p style="font-weight:800;text-transform:uppercase;letter-spacing:2px;font-size:12px;margin:0 0 6px">Asnjë menu aktive</p>' +
        '<p class="t3" style="font-size:13px;margin:0 0 18px">Krijo një menu për të nisur ndërtimin.</p>' +
        '<button class="btn bp" id="mk" style="display:inline-flex">' + ico("plus") + ' Krijo Menu</button></div>';
      $("#mk", view).onclick = () => { const n = prompt("Emri i menusë:", "Menuja Ime"); if (n) { S.createMenu(n); location.hash = "#/builder"; BM.Router.go(); } };
      return {};
    }

    let dev = "phone", selCat = (menu.categories[0] || {}).id || null, editId = null;

    view.innerHTML =
      '<header class="row" style="justify-content:space-between;margin-bottom:16px"><div class="row" style="gap:10px"><a class="ico-btn" href="#/">' + ico("back") + '</a><div><div class="eyebrow">Builder</div><div class="dsp" id="mtitle" style="font-size:19px;margin-top:2px"></div></div></div>' +
        '<div class="row" style="gap:6px"><button class="ico-btn" id="undo" title="Zhbëj">' + ico("undo") + '</button><button class="ico-btn" id="redo" title="Ribëj">' + ico("redo") + '</button></div></header>' +
      '<div class="mtabs"><button id="tb" class="on">Ndërto</button><button id="tp">Preview</button></div>' +
      '<div class="studio"><aside class="cc">' +
        '<div class="cc-panel"><div class="ph">Identiteti<span class="ln"></span></div>' +
          '<input id="mname" class="fld" placeholder="Emri i menusë" style="margin-bottom:8px">' +
          '<button class="btn bg-ghost block" id="mlogo" style="margin-bottom:8px">' + ico("img") + ' Logo</button>' +
          '<div class="row" style="gap:8px;margin-bottom:8px"><div style="flex:1"><label class="lbl">Primar</label><input type="color" id="cprim" class="swatch"></div>' +
          '<div style="flex:1"><label class="lbl">Teksti</label><input type="color" id="ctext" class="swatch"></div>' +
          '<div style="width:70px"><label class="lbl">Monedha</label><input id="ccur" class="fld" maxlength="3" style="padding:13px 10px;text-align:center"></div></div></div>' +
        '<div class="cc-panel"><div class="ph">Kategoritë<span class="ln"></span></div>' +
          '<div class="row" style="gap:8px;margin-bottom:10px"><input id="cinp" class="fld" placeholder="Psh: Pijet, Pica…"><button class="ico-btn" id="cadd" style="background:var(--p);color:#fff;width:46px">' + ico("plus") + '</button></div><div id="clist"></div></div>' +
        '<div class="cc-panel" id="ipanel"><div class="ph" id="ititle">Artikujt<span class="ln"></span></div>' +
          '<button class="btn bp block" id="iadd" style="margin-bottom:10px">' + ico("plus") + ' Shto Artikull</button><div id="ilist"></div></div>' +
      '</aside>' +
      '<section class="ws-pane" id="ws"><div class="devbar">' +
        '<button class="devb on" data-d="phone">' + ico("phone") + '</button><button class="devb" data-d="android">' + ico("device") + '</button>' +
        '<button class="devb" data-d="tablet">' + ico("tablet") + '</button><button class="devb" data-d="desktop">' + ico("device") + '</button></div>' +
        '<div class="stage"><div class="frame phone" id="frame"><div class="scr nosb" id="scr"></div></div></div>' +
        '<div class="row" style="justify-content:center;gap:9px;margin-top:14px"><button class="btn bg-ghost" id="bprint">' + ico("print") + ' Print</button><button class="btn bg-ghost" onclick="location.hash=\'#/qr\'">' + ico("qr") + ' QR</button></div>' +
      '</section></div>';

    const mname = $("#mname", view), cprim = $("#cprim", view), ctext = $("#ctext", view), ccur = $("#ccur", view);
    const curMenu = () => S.activeMenu();
    const curCat = () => curMenu().categories.find(c => c.id === selCat);
    function sync() { const m = curMenu(); $("#mtitle", view).textContent = m.name || "Menu";
      if (document.activeElement !== mname) mname.value = m.name || "";
      if (document.activeElement !== cprim) cprim.value = m.primary || "#FF5C00";
      if (document.activeElement !== ctext) ctext.value = m.text || "#0a0a0a";
      if (document.activeElement !== ccur) ccur.value = m.currency || "€";
      $("#undo", view).disabled = !S.canUndo(); $("#redo", view).disabled = !S.canRedo(); }
    function preview() { $("#scr", view).innerHTML = MenuView.render(curMenu(), { search: dev !== "desktop" }); }

    function renderCats() { const m = curMenu(); const list = $("#clist", view);
      if (!m.categories.length) { list.innerHTML = '<p class="t3" style="font-size:11px;text-align:center;padding:10px">Shto kategorinë e parë ↑</p>'; return; }
      list.innerHTML = m.categories.map((c, i) => '<div class="lrow' + (c.id === selCat ? " sel" : "") + '" draggable="true" data-i="' + i + '"><span class="gr">' + ico("grip") + '</span><span class="nm" data-sel="' + c.id + '">' + esc(c.name) + '</span><span class="ct">' + c.items.length + '</span><button class="ico-btn" data-ren="' + c.id + '" style="width:30px;height:30px">' + ico("edit") + '</button><button class="ico-btn danger" data-del="' + c.id + '" style="width:30px;height:30px">' + ico("trash") + '</button></div>').join("");
      $$("[data-sel]", list).forEach(e => e.onclick = () => { selCat = e.dataset.sel; renderCats(); renderItems(); haptic("light"); });
      $$("[data-ren]", list).forEach(e => e.onclick = () => { const c = m.categories.find(x => x.id === e.dataset.ren); const n = prompt("Riemërto:", c.name); if (n) S.mutate(() => c.name = n); });
      $$("[data-del]", list).forEach(e => e.onclick = () => { if (!confirm("Fshi kategorinë?")) return; S.mutate(() => { const mm = curMenu(); mm.categories = mm.categories.filter(c => c.id !== e.dataset.del); }); if (selCat === e.dataset.del) selCat = (curMenu().categories[0] || {}).id || null; });
      dragSort(list, () => curMenu().categories, () => { renderCats(); preview(); }); }

    function renderItems() { const c = curCat(); const panel = $("#ipanel", view); if (!c) { panel.style.display = "none"; return; } panel.style.display = "";
      $("#ititle", view).childNodes[0].textContent = "Artikujt · " + c.name + " "; const list = $("#ilist", view); const cur = curMenu().currency || "€";
      if (!c.items.length) { list.innerHTML = '<p class="t3" style="font-size:11px;text-align:center;padding:10px">Ende s\'ka artikuj</p>'; return; }
      list.innerHTML = c.items.map((it, i) => '<div class="lrow" draggable="true" data-i="' + i + '"><span class="gr">' + ico("grip") + '</span>' + (it.image ? '<span style="width:28px;height:28px;border-radius:7px;background:#222 center/cover url(' + JSON.stringify(it.image) + ')"></span>' : "") + '<span class="nm">' + esc(it.name) + (it.popular ? " 🔥" : "") + '</span><span class="ct">' + money(it.price) + cur + '</span><button class="ico-btn" data-edit="' + it.id + '" style="width:30px;height:30px">' + ico("edit") + '</button><button class="ico-btn danger" data-del="' + it.id + '" style="width:30px;height:30px">' + ico("trash") + '</button></div>').join("");
      $$("[data-edit]", list).forEach(e => e.onclick = () => openProduct(e.dataset.edit));
      $$("[data-del]", list).forEach(e => e.onclick = () => S.mutate(() => { const cc = curCat(); cc.items = cc.items.filter(x => x.id !== e.dataset.del); }));
      dragSort(list, () => curCat().items, () => { renderItems(); preview(); }); }

    function dragSort(container, getArr, done) { let from = null;
      $$("[draggable=true]", container).forEach(row => {
        row.addEventListener("dragstart", () => { from = +row.dataset.i; row.style.opacity = ".4"; });
        row.addEventListener("dragend", () => { row.style.opacity = "1"; $$(".lrow", container).forEach(r => r.classList.remove("dover")); });
        row.addEventListener("dragover", e => { e.preventDefault(); row.classList.add("dover"); });
        row.addEventListener("dragleave", () => row.classList.remove("dover"));
        row.addEventListener("drop", e => { e.preventDefault(); const to = +row.dataset.i; if (from == null || from === to) return; S.mutate(() => { const arr = getArr(); const [x] = arr.splice(from, 1); arr.splice(to, 0, x); }); haptic("med"); done(); }); }); }

    function openProduct(id) { const c = curCat(); if (!c) return toast("Zgjidh një kategori", "warn"); editId = id || null; let pmImg = "";
      const it = id ? c.items.find(x => x.id === id) : null; pmImg = it ? (it.image || "") : "";
      const swc = on => 'class="sw' + (on ? " on" : "") + '"';
      const m = modal('<div class="row" style="justify-content:space-between;margin-bottom:16px"><h2 class="dsp" style="font-size:20px;margin:0">' + (it ? "Ndrysho Artikullin" : "Artikull i Ri") + '</h2><button class="ico-btn" id="px">' + ico("x") + '</button></div>' +
        '<div class="imgdrop" id="pimg">' + (pmImg ? "" : ico("img") + ' <span style="margin-left:6px">Foto (opsionale)</span>') + '</div>' +
        '<div style="margin-top:13px"><input id="pn" class="fld" placeholder="Emri i artikullit" style="margin-bottom:8px" value="' + (it ? esc(it.name) : "") + '">' +
        '<textarea id="pd" class="fld" rows="2" placeholder="Përshkrimi (opsional)" style="margin-bottom:8px;resize:none">' + (it ? esc(it.desc) : "") + '</textarea>' +
        '<div class="row" style="gap:8px;margin-bottom:13px"><input id="pp" class="fld" placeholder="Çmimi" inputmode="decimal" value="' + (it ? esc(it.price) : "") + '"><input id="pdisc" class="fld" placeholder="Zbritje %" inputmode="numeric" value="' + (it ? esc(it.discount) : "") + '"></div>' +
        '<div class="tog"><span>' + ico("fire") + 'Popular</span><div id="swp" ' + swc(it && it.popular) + '></div></div>' +
        '<div class="tog"><span>' + ico("sparkle") + 'Badge "E re"</span><div id="swn" ' + swc(it && it.isNew) + '></div></div>' +
        '<div class="tog"><span>' + ico("check") + 'Në dispozicion</span><div id="swa" ' + swc(!it || it.available !== false) + '></div></div>' +
        '<button class="btn bp block" id="psave" style="margin-top:13px">Ruaj</button></div>');
      if (pmImg) $("#pimg", m.el).style.backgroundImage = "url(" + JSON.stringify(pmImg) + ")";
      $("#px", m.el).onclick = m.close;
      ["swp", "swn", "swa"].forEach(id => $("#" + id, m.el).onclick = function () { this.classList.toggle("on"); haptic("light"); });
      $("#pimg", m.el).onclick = () => pickImage(d => { pmImg = d; const el = $("#pimg", m.el); el.style.backgroundImage = "url(" + JSON.stringify(d) + ")"; el.innerHTML = ""; });
      $("#psave", m.el).onclick = () => { const name = $("#pn", m.el).value.trim(); if (!name) return toast("Shkruaj emrin", "warn");
        const data = { name, desc: $("#pd", m.el).value.trim(), price: money($("#pp", m.el).value || 0), discount: $("#pdisc", m.el).value.trim(), image: pmImg, popular: $("#swp", m.el).classList.contains("on"), isNew: $("#swn", m.el).classList.contains("on"), available: $("#swa", m.el).classList.contains("on") };
        S.mutate(() => { const cc = curCat(); if (editId) Object.assign(cc.items.find(x => x.id === editId), data); else cc.items.push(Object.assign({ id: BM.uid("it") }, data)); });
        m.close(); toast(editId ? "U përditësua" : "U shtua"); haptic("ok"); }; }

    function setDev(d) { dev = d; const f = $("#frame", view); f.className = "frame " + d; f.innerHTML = (d === "desktop" ? '<div class="bar"><i></i><i></i><i></i></div>' : "") + '<div class="scr nosb" id="scr"></div>'; $$(".devb", view).forEach(b => b.classList.toggle("on", b.dataset.d === d)); preview(); haptic("light"); }
    function printMenu() { const m = curMenu(), cur = m.currency || "€", col = m.primary;
      const body = m.categories.map(c => '<h2 style="border-bottom:3px solid ' + col + ';display:inline-block;font-style:italic;text-transform:uppercase;font-size:18px;margin:18px 0 10px">' + esc(c.name) + "</h2>" + c.items.map(it => '<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #eee"><span style="font-weight:700">' + esc(it.name) + "</span><span style=\"font-weight:800;color:" + col + '">' + money(it.price) + cur + "</span></div>").join("")).join("");
      const w = window.open("", "_blank"); w.document.write('<html><head><title>' + esc(m.name) + '</title><style>@page{size:A4;margin:16mm}body{font-family:sans-serif;color:#111}h1{font-style:italic;text-transform:uppercase}</style></head><body><h1>' + esc(m.name) + "</h1>" + body + '<scr' + 'ipt>onload=()=>setTimeout(print,300)</scr' + "ipt></body></html>"); w.document.close(); }

    /* wiring */
    mname.oninput = () => S.mutate(() => curMenu().name = mname.value, { noUndo: true });
    cprim.oninput = () => S.mutate(() => curMenu().primary = cprim.value, { noUndo: true });
    ctext.oninput = () => S.mutate(() => curMenu().text = ctext.value, { noUndo: true });
    ccur.oninput = () => S.mutate(() => curMenu().currency = ccur.value || "€", { noUndo: true });
    $("#mlogo", view).onclick = () => pickImage(d => { S.mutate(() => curMenu().logo = d); toast("Logo u ngarkua"); });
    $("#cadd", view).onclick = () => { const v = $("#cinp", view).value.trim(); if (!v) return; const id = BM.uid("cat"); S.mutate(() => curMenu().categories.push({ id, name: v, items: [] })); selCat = id; $("#cinp", view).value = ""; renderCats(); renderItems(); haptic("med"); };
    $("#cinp", view).onkeydown = e => { if (e.key === "Enter") $("#cadd", view).click(); };
    $("#iadd", view).onclick = () => openProduct();
    $$(".devb", view).forEach(b => b.onclick = () => setDev(b.dataset.d));
    $("#bprint", view).onclick = printMenu;
    $("#undo", view).onclick = () => { if (!S.undo()) toast("Asgjë për të zhbërë", "info"); };
    $("#redo", view).onclick = () => S.redo();
    $("#tb", view).onclick = () => { $("#tb", view).classList.add("on"); $("#tp", view).classList.remove("on"); $("#ws", view).classList.remove("show"); };
    $("#tp", view).onclick = () => { $("#tp", view).classList.add("on"); $("#tb", view).classList.remove("on"); $("#ws", view).classList.add("show"); preview(); };

    function full() { sync(); renderCats(); renderItems(); preview(); S.applyBrand(); }
    full();
    const un = S.sub(BM.debounce(() => { sync(); renderCats(); renderItems(); preview(); }, 110));
    return { cleanup: un };
  };
})(window.BM);
