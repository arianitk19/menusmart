/* boneMENU — boot + PWA (install, service worker, gestures) */
(function (BM) {
  "use strict";
  const { $, $$, ico, Store, Router, toast, haptic } = BM;

  /* routes */
  Router.reg("/", BM.views.home);
  Router.reg("/builder", BM.views.builder);
  Router.reg("/qr", BM.views.qr);
  Router.reg("/menu", BM.views.menu);

  /* service worker + auto update */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").then(reg => {
        reg.addEventListener("updatefound", () => { const nw = reg.installing; nw && nw.addEventListener("statechange", () => { if (nw.state === "installed" && navigator.serviceWorker.controller) toast("Përditësim i ri — rifreskoje", "info"); }); });
      }).catch(() => {});
    });
  }

  /* install prompt */
  const standalone = (typeof matchMedia !== "undefined" && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  const DIS = "bm_install_dismiss"; let deferred = null;
  const snoozed = () => Date.now() - (+localStorage.getItem(DIS) || 0) < 7 * 864e5;
  function banner() {
    if ($("#install")) return; const b = document.createElement("div"); b.id = "install";
    b.innerHTML = '<div style="width:40px;height:40px;border-radius:11px;background:var(--p);display:flex;align-items:center;justify-content:center;flex:0 0 auto;color:#fff">' + ico("bolt") + "</div>" +
      '<div style="flex:1;min-width:0"><div style="font-weight:800;font-size:13px">Instalo boneMENU</div><div style="font-size:11px;color:var(--tx3)">App native, edhe offline.</div></div>' +
      '<button id="ix" style="color:var(--tx3);padding:8px;font-size:18px">&times;</button><button id="igo" class="btn bp" style="padding:10px 15px">Instalo</button>';
    document.body.appendChild(b);
    $("#ix", b).onclick = () => { b.classList.remove("show"); localStorage.setItem(DIS, Date.now()); };
    $("#igo", b).onclick = doInstall;
  }
  const showBanner = () => { const b = $("#install"); if (b) requestAnimationFrame(() => b.classList.add("show")); };
  function doInstall() { haptic("med"); if (deferred) { deferred.prompt(); deferred.userChoice.finally(() => { deferred = null; const b = $("#install"); if (b) b.classList.remove("show"); }); } else if (isIOS) iosGuide(); }
  function iosGuide() {
    const m = BM.modal('<div class="row" style="justify-content:space-between;margin-bottom:16px"><h2 class="dsp" style="font-size:18px;margin:0">Instalo në iPhone</h2><button class="ico-btn" id="gx">' + ico("x") + '</button></div>' +
      ['Shtyp <b>Share</b> në Safari', 'Zgjidh <b>Add to Home Screen</b>', 'Shtyp <b>Add</b> — gati!'].map((t, i) => '<div class="tog" style="cursor:default"><span><b style="color:var(--p)">' + (i + 1) + '.</b> ' + t + '</span></div>').join(''));
    $("#gx", m.el).onclick = m.close;
  }
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferred = e; if (!standalone && !snoozed()) { banner(); setTimeout(showBanner, 2500); } });
  window.addEventListener("appinstalled", () => { const b = $("#install"); if (b) b.classList.remove("show"); toast("boneMENU u instalua"); });
  if (isIOS && !standalone && !snoozed()) window.addEventListener("DOMContentLoaded", () => { banner(); setTimeout(showBanner, 3000); });

  /* keyboard undo/redo */
  window.addEventListener("keydown", e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? Store.redo() : Store.undo(); } });

  /* pull to refresh */
  (function () { let y0 = 0, pulling = false, bar; const appEl = $("#app");
    const mk = () => bar || (bar = Object.assign(document.createElement("div"), { style: "" }), bar.style.cssText = "position:fixed;top:0;left:0;width:100%;height:3px;background:var(--p);transform-origin:left;transform:scaleX(0);z-index:1400;transition:transform .2s", document.body.appendChild(bar), bar);
    appEl.addEventListener("touchstart", e => { if (appEl.scrollTop <= 0) { y0 = e.touches[0].clientY; pulling = true; } }, { passive: true });
    appEl.addEventListener("touchmove", e => { if (!pulling) return; const d = e.touches[0].clientY - y0; if (d > 0) mk().style.transform = "scaleX(" + BM.clamp(d / 200, 0, 1) + ")"; }, { passive: true });
    appEl.addEventListener("touchend", e => { if (!pulling) return; pulling = false; const d = e.changedTouches[0].clientY - y0; if (d > 130) { haptic("med"); mk().style.transform = "scaleX(1)"; Router.go(); setTimeout(() => { if (bar) bar.style.transform = "scaleX(0)"; }, 400); } else if (bar) bar.style.transform = "scaleX(0)"; });
  })();

  /* boot */
  (async function () {
    await Store.boot(); Store.applyBrand();
    if (!location.hash) location.hash = "#/";
    Router.dock(); Router.go();
  })();
})(window.BM);
