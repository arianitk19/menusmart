/* boneMENU — QR studio (per-menu, offline-capable via SW-cached lib) */
window.BM = window.BM || {}; BM.views = BM.views || {};
(function (BM) {
  "use strict";
  const { $, $$, ico, esc, toast, haptic } = BM, S = BM.Store;
  const QLIB = "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js";
  const PDFLIB = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
  const loadScript = (() => { const c = {}; return src => c[src] || (c[src] = new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("offline")); document.head.appendChild(s); })); })();

  const STYLES = { premium:{n:"Premium",bg:"#fff",fg:"#0a0a0a",eye:"#FF5C00",round:1,label:"#0a0a0a"},
    minimal:{n:"Minimal",bg:"#fff",fg:"#111",eye:"#111",round:0,label:"#0a0a0a"},
    dark:{n:"Dark",bg:"#0a0a0a",fg:"#fff",eye:"#FF5C00",round:1,label:"#fff"},
    luxury:{n:"Luxury",bg:"#0a0a0a",fg:"#d4af37",eye:"#f0d77a",round:1,label:"#d4af37"},
    restaurant:{n:"Restaurant",bg:"#faf6ef",fg:"#3a2a1a",eye:"#a8431f",round:1,label:"#3a2a1a"},
    coffee:{n:"Coffee",bg:"#2b1d12",fg:"#e8dcc8",eye:"#c98a3c",round:1,label:"#e8dcc8"} };

  BM.views.qr = function (app) {
    const view = document.createElement("div"); view.className = "view"; app.appendChild(view);
    const menu = S.activeMenu();
    if (!menu) { view.innerHTML = '<div class="glass empty" style="margin-top:40px">' + ico("qr") + '<p class="t3" style="font-size:13px">Krijo ose hap një menu për të gjeneruar QR.</p><a class="btn bp" href="#/" style="display:inline-flex;margin-top:14px">Te Menutë</a></div>'; return {}; }

    let cur = (menu.qr && STYLES[menu.qr.style]) ? menu.qr.style : "premium", custom = (menu.qr && menu.qr.color && menu.qr.color !== STYLES[cur].fg) ? menu.qr.color : null, lastQR = null;
    let logoSrc = menu.logo || "";
    const defaultUrl = location.href.split("#")[0] + "#/menu?m=" + menu.id;

    view.innerHTML =
      '<header class="row" style="justify-content:space-between;margin-bottom:16px"><div class="row" style="gap:10px"><a class="ico-btn" href="#/">' + ico("back") + '</a><div><div class="eyebrow">Publiko</div><div class="dsp" style="font-size:19px;margin-top:2px">QR Studio</div></div></div></header>' +
      '<div class="mtabs"><button id="tb" class="on">Konfiguro</button><button id="tp">Preview</button></div>' +
      '<div class="studio"><aside class="cc">' +
        '<div class="cc-panel"><div class="ph">Lidhja<span class="ln"></span></div><input id="qurl" class="fld"><p class="t3" style="font-size:10px;margin:8px 0 0;line-height:1.5">QR-i përditësohet automatikisht. Përdor URL-në ku publikon menunë.</p></div>' +
        '<div class="cc-panel"><div class="ph">Stili<span class="ln"></span></div><div class="styles" id="sgrid"></div></div>' +
        '<div class="cc-panel"><div class="ph">Ngjyra<span class="ln"></span></div><div class="row" style="gap:8px;align-items:flex-end"><div style="flex:1"><label class="lbl">Pixel</label><input type="color" id="qcol" class="swatch"></div><button class="ico-btn" id="qreset">' + ico("undo") + '</button></div></div>' +
        '<div class="cc-panel"><div class="ph">Eksporto<span class="ln"></span></div><div class="g2"><button class="btn bp" id="epng">' + ico("img") + ' PNG</button><button class="btn bg-ghost" id="esvg">' + ico("vec") + ' SVG</button><button class="btn bg-ghost" id="epdf">' + ico("file") + ' PDF</button><button class="btn bg-ghost" id="eprint">' + ico("print") + ' Print</button></div></div>' +
      '</aside>' +
      '<section class="ws-pane" id="ws"><div class="stage" style="flex-direction:column"><div class="qr-card" id="card"><canvas id="qc"></canvas>' + (logoSrc ? '<div class="qr-logo" id="qlg"><img id="qlgi" src="' + esc(logoSrc) + '"></div>' : '<div class="qr-logo hide" id="qlg"><img id="qlgi"></div>') + '</div>' +
        '<div style="text-align:center;margin-top:20px" id="qlabel"><h2 class="dsp" style="font-size:24px;font-style:italic;text-transform:uppercase">' + esc(menu.name) + '</h2><div class="row" style="justify-content:center;gap:12px;margin-top:8px;opacity:.4"><span style="height:1px;width:30px;background:currentColor"></span><span style="font-size:9px;font-weight:800;letter-spacing:5px">SCAN &amp; ORDER</span><span style="height:1px;width:30px;background:currentColor"></span></div></div></div></section></div>';

    const qurl = $("#qurl", view), qcol = $("#qcol", view);
    qurl.value = (menu.qr && menu.qr.url) || defaultUrl;
    const url = () => qurl.value.trim() || defaultUrl;
    const fg = () => custom || STYLES[cur].fg;
    const inEye = (r, c, n) => { const z = 7; return (r < z && c < z) || (r < z && c >= n - z) || (r >= n - z && c < z); };
    const rr = (ctx, x, y, w, h, rad) => { if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, rad); ctx.fill(); } else ctx.fillRect(x, y, w, h); };

    function draw() { if (typeof qrcode === "undefined") return; const st = STYLES[cur]; const qr = qrcode(0, "H"); qr.addData(url()); qr.make(); lastQR = qr;
      const n = qr.getModuleCount(), margin = 3, cell = 8, total = (n + margin * 2) * cell; const cv = $("#qc", view); cv.width = total; cv.height = total; const ctx = cv.getContext("2d");
      ctx.fillStyle = st.bg; ctx.fillRect(0, 0, total, total);
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { if (!qr.isDark(r, c)) continue; ctx.fillStyle = inEye(r, c, n) ? st.eye : fg(); const x = (c + margin) * cell, y = (r + margin) * cell; if (st.round) rr(ctx, x + 1, y + 1, cell - 2, cell - 2, cell * .35); else ctx.fillRect(x, y, cell, cell); }
      $("#card", view).style.background = st.bg; $("#qlabel", view).style.color = st.label; $("#qlg", view).style.background = st.bg; }
    function svg() { const st = STYLES[cur]; const qr = lastQR || (() => { const q = qrcode(0, "H"); q.addData(url()); q.make(); return q; })(); const n = qr.getModuleCount(), margin = 3, cell = 10, total = (n + margin * 2) * cell;
      let r = '<rect width="' + total + '" height="' + total + '" fill="' + st.bg + '"/>';
      for (let i = 0; i < n; i++) for (let c = 0; c < n; c++) { if (!qr.isDark(i, c)) continue; const col = inEye(i, c, n) ? st.eye : fg(); const x = (c + margin) * cell, y = (i + margin) * cell; const rad = st.round ? ' rx="' + (cell * .32) + '"' : ""; const p = st.round ? 1 : 0; r += '<rect x="' + (x + p) + '" y="' + (y + p) + '" width="' + (cell - p * 2) + '" height="' + (cell - p * 2) + '"' + rad + ' fill="' + col + '"/>'; }
      return '<svg xmlns="http://www.w3.org/2000/svg" width="' + total + '" height="' + total + '" viewBox="0 0 ' + total + ' ' + total + '">' + r + "</svg>"; }
    const dl = (href, name) => { const a = document.createElement("a"); a.href = href; a.download = name; a.click(); };
    const fn = ext => "boneMENU-QR-" + (menu.name || "menu").replace(/\s+/g, "-").toLowerCase() + "." + ext;
    function compositePNG() { const st = STYLES[cur]; const src = $("#qc", view); const pad = 40, size = src.width, W = size + pad * 2;
      const cv = document.createElement("canvas"); cv.width = W; cv.height = W; const ctx = cv.getContext("2d");
      ctx.fillStyle = st.bg; if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(0, 0, W, W, 34); ctx.fill(); } else ctx.fillRect(0, 0, W, W);
      ctx.drawImage(src, pad, pad);
      return new Promise(res => { if (logoSrc) { const img = new Image(); img.onload = () => { const ls = size * .2, lx = (W - ls) / 2, ly = (W - ls) / 2; ctx.fillStyle = st.bg; if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(lx - 6, ly - 6, ls + 12, ls + 12, 14); ctx.fill(); } ctx.drawImage(img, lx, ly, ls, ls); res(cv); }; img.onerror = () => res(cv); img.src = logoSrc; } else res(cv); }); }
    async function ensureQR() { if (typeof qrcode !== "undefined") return true; try { await loadScript(QLIB); return true; } catch (e) { toast("QR kërkon internet herën e parë", "warn"); return false; } }
    function persist() { S.mutate(() => { S.activeMenu().qr = { style: cur, color: custom || STYLES[cur].fg, url: qurl.value }; }, { noUndo: true }); }

    function paintStyles() { $("#sgrid", view).innerHTML = Object.entries(STYLES).map(([k, s]) => '<button class="stylec' + (k === cur ? " sel" : "") + '" data-k="' + k + '"><div class="mini" style="background:' + s.bg + '"><i style="background:' + s.fg + '"></i><i style="background:' + s.eye + '"></i><i style="background:' + s.eye + '"></i><i style="background:' + s.fg + '"></i></div><span>' + s.n + "</span></button>").join("");
      $$(".stylec", view).forEach(b => b.onclick = () => { cur = b.dataset.k; custom = null; qcol.value = STYLES[cur].fg; paintStyles(); draw(); persist(); haptic("light"); }); }

    qurl.oninput = () => { draw(); persist(); };
    qcol.oninput = () => { custom = qcol.value; draw(); persist(); };
    $("#qreset", view).onclick = () => { custom = null; qcol.value = STYLES[cur].fg; draw(); };
    $("#epng", view).onclick = async () => { if (!await ensureQR()) return; draw(); const cv = await compositePNG(); dl(cv.toDataURL("image/png"), fn("png")); toast("PNG u eksportua"); haptic("ok"); };
    $("#esvg", view).onclick = async () => { if (!await ensureQR()) return; const b = new Blob([svg()], { type: "image/svg+xml" }); dl(URL.createObjectURL(b), fn("svg")); toast("SVG u eksportua"); haptic("ok"); };
    $("#epdf", view).onclick = async () => { if (!await ensureQR()) return; try { await loadScript(PDFLIB); } catch (e) { return toast("PDF kërkon internet", "warn"); } draw(); const cv = await compositePNG(); const J = window.jspdf.jsPDF; const pdf = new J({ unit: "mm", format: "a4" }); pdf.setFillColor(255, 255, 255); pdf.rect(0, 0, 210, 297, "F"); pdf.addImage(cv.toDataURL("image/png"), "PNG", 45, 50, 120, 120); pdf.setFontSize(24); pdf.text((menu.name || "Scan & Order").toUpperCase(), 105, 195, { align: "center" }); pdf.setFontSize(9); pdf.setTextColor(150); pdf.text("SCAN & ORDER · boneMENU", 105, 204, { align: "center" }); pdf.save(fn("pdf")); toast("PDF u eksportua"); haptic("ok"); };
    $("#eprint", view).onclick = async () => { if (!await ensureQR()) return; const w = window.open("", "_blank"); w.document.write('<html><head><title>QR</title><style>@page{size:A4;margin:0}body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif}h2{font-style:italic;text-transform:uppercase}</style></head><body>' + svg().replace("<svg ", '<svg width="360" height="360" ') + "<h2>" + esc(menu.name) + '</h2><p style="letter-spacing:5px;color:#888;font-size:11px">SCAN &amp; ORDER</p><scr' + 'ipt>onload=()=>setTimeout(print,300)</scr' + "ipt></body></html>"); w.document.close(); };
    $("#tb", view).onclick = () => { $("#tb", view).classList.add("on"); $("#tp", view).classList.remove("on"); $("#ws", view).classList.remove("show"); };
    $("#tp", view).onclick = () => { $("#tp", view).classList.add("on"); $("#tb", view).classList.remove("on"); $("#ws", view).classList.add("show"); };

    qcol.value = custom || STYLES[cur].fg; paintStyles();
    ensureQR().then(ok => { if (ok) draw(); });
    return {};
  };
})(window.BM);
