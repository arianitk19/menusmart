/* boneMENU — Home: "Menutë e Mia" (real menu manager, no fake data) */
window.BM = window.BM || {}; BM.views = BM.views || {};
(function (BM) {
  "use strict";
  const { $, $$, ico, esc, toast, haptic, modal } = BM, S = BM.Store;

  BM.views.home = function (app) {
    const view = document.createElement("div"); view.className = "view"; app.appendChild(view);

    function build() {
      const menus = S.menus();
      const totItems = S.totalItems();
      view.innerHTML =
        '<header class="row rv" style="justify-content:space-between;margin-bottom:22px">' +
          '<div><div class="eyebrow">Menu OS</div><h1 class="dsp" style="font-size:30px;margin:7px 0 0">bone<span style="color:var(--p)">MENU</span></h1></div>' +
          '<div class="row"><button class="ico-btn" id="imp" title="Importo backup">' + ico("download") + '</button>' +
          '<button class="ico-btn" id="exp" title="Eksporto backup">' + ico("file") + "</button></div></header>" +
        '<div class="row rv" style="justify-content:space-between;margin-bottom:14px;animation-delay:.05s">' +
          '<div><div style="font-weight:800;font-size:15px">Menutë e Mia</div><div class="t3" style="font-size:12px;font-weight:600">' + menus.length + " menu · " + totItems + " artikuj</div></div>" +
          '<button class="btn bp" id="create">' + ico("plus") + " Menu e Re</button></div>" +
        '<div id="list"></div>';

      const list = $("#list", view);
      if (!menus.length) {
        list.innerHTML = '<div class="glass empty rv" style="animation-delay:.1s">' + ico("layers") +
          '<p style="font-weight:800;text-transform:uppercase;letter-spacing:2px;font-size:12px;margin:0 0 6px">Asnjë menu ende</p>' +
          '<p class="t3" style="font-size:13px;margin:0 0 18px">Krijo menunë tënde të parë profesionale në pak sekonda.</p>' +
          '<button class="btn bp" id="create2" style="display:inline-flex">' + ico("plus") + " Krijo Menu</button></div>";
        $("#create2", view).onclick = create;
      } else {
        list.innerHTML = menus.map((m, idx) => {
          const items = S.totalItems(m), letter = (m.name || "M").trim().charAt(0).toUpperCase();
          return '<div class="glass mcard rv" data-open="' + m.id + '" style="margin-bottom:11px;animation-delay:' + (0.08 + idx * 0.04) + 's">' +
            '<div class="thumb" style="background:' + esc(m.primary || "#FF5C00") + '">' + esc(letter) + "</div>" +
            '<div style="flex:1;min-width:0"><div style="font-weight:800;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(m.name) + "</div>" +
            '<div class="t3" style="font-size:12px;font-weight:600">' + m.categories.length + " kategori · " + items + " artikuj</div></div>" +
            '<div class="row" style="gap:6px" onclick="event.stopPropagation()">' +
              '<button class="ico-btn" data-qr="' + m.id + '" title="QR">' + ico("qr") + "</button>" +
              '<button class="ico-btn" data-dup="' + m.id + '" title="Dyfisho">' + ico("copy") + "</button>" +
              '<button class="ico-btn danger" data-del="' + m.id + '" title="Fshi">' + ico("trash") + "</button></div></div>";
        }).join("");
        $$("[data-open]", list).forEach(el => el.onclick = () => { S.setActive(el.dataset.open); haptic("light"); location.hash = "#/builder"; });
        $$("[data-qr]", list).forEach(el => el.onclick = () => { S.setActive(el.dataset.qr); location.hash = "#/qr"; });
        $$("[data-dup]", list).forEach(el => el.onclick = () => { S.duplicateMenu(el.dataset.dup); toast("Menu u dyfishua"); });
        $$("[data-del]", list).forEach(el => el.onclick = () => { const m = S.menuById(el.dataset.del); if (confirm('Fshi "' + m.name + '"?')) { S.deleteMenu(el.dataset.del); toast("U fshi"); } });
      }
      const c = $("#create", view); if (c) c.onclick = create;
      $("#exp", view).onclick = exportBackup;
      $("#imp", view).onclick = importBackup;
    }

    function create() {
      const m = BM.modal('<div class="row" style="justify-content:space-between;margin-bottom:16px"><h2 class="dsp" style="font-size:20px;margin:0">Menu e Re</h2><button class="ico-btn" id="cx">' + ico("x") + '</button></div>' +
        '<label class="lbl">Emri i menusë / biznesit</label><input id="cn" class="fld" placeholder="Psh: Bar Aroma" style="margin-bottom:14px">' +
        '<button class="btn bp block" id="cgo">Krijo dhe Hap</button>');
      const inp = $("#cn", m.el); setTimeout(() => inp.focus(), 50);
      $("#cx", m.el).onclick = m.close;
      const go = () => { const n = inp.value.trim(); if (!n) return toast("Shkruaj emrin", "warn"); S.createMenu(n); m.close(); haptic("ok"); location.hash = "#/builder"; };
      $("#cgo", m.el).onclick = go; inp.onkeydown = e => { if (e.key === "Enter") go(); };
    }
    function exportBackup() {
      if (!S.menus().length) return toast("S'ka çfarë të eksportohet", "warn");
      const blob = new Blob([S.exportJSON()], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "boneMENU-backup.json"; a.click(); toast("Backup u ruajt");
    }
    function importBackup() {
      const i = document.createElement("input"); i.type = "file"; i.accept = "application/json,.json";
      i.onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { S.importJSON(r.result); toast("Backup u rivendos"); } catch (er) { toast("Skedar i pavlefshëm", "warn"); } }; r.readAsText(f); };
      i.click();
    }

    build();
    const un = S.sub(BM.debounce(build, 120));
    return { cleanup: un };
  };
})(window.BM);
