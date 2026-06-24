/* boneMENU — public customer menu (search, filters, favorites, recently viewed) */
window.BM = window.BM || {}; BM.views = BM.views || {};
(function (BM) {
  "use strict";
  const { $, $$, ico, esc, toast, haptic, MenuView } = BM, S = BM.Store;
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  BM.views.menu = function (app) {
    const view = document.createElement("div"); view.className = "view"; view.style.padding = "0"; view.style.maxWidth = "560px"; app.appendChild(view);
    // pick menu by ?m= if present, else active
    const q = (location.hash.split("?")[1] || ""); const params = new URLSearchParams(q); const mId = params.get("m");
    const menu = (mId && S.menuById(mId)) || S.activeMenu();

    if (!menu || S.totalItems(menu) === 0) {
      view.innerHTML = '<div class="mv-blank" style="padding-top:120px">' + ico("layers") + "<p>Menuja s'është gati ende</p><a href=\"#/builder\" class=\"btn bp\" style=\"margin-top:18px;display:inline-flex\">Ndërto Menu</a></div>";
      return {};
    }

    view.innerHTML = '<button class="ico-btn" style="position:fixed;top:calc(14px + var(--st));left:14px;z-index:30;background:rgba(255,255,255,.92);color:#111" onclick="location.hash=\'#/\'">' + ico("back") + "</button>" + MenuView.render(menu, { search: true });
    const root = $(".mv", view); MenuView.bind(root);

    const FK = "bm_fav_" + menu.id, RK = "bm_rec_" + menu.id;
    let favs = new Set(lsGet(FK, [])); let rec = lsGet(RK, []);
    const all = {}; menu.categories.forEach(c => c.items.forEach(it => all[it.id] = it));

    $$(".mv-card", root).forEach(card => { const id = card.dataset.id; const b = document.createElement("button"); b.className = "mv-fav" + (favs.has(id) ? " on" : ""); b.innerHTML = ico("heart");
      b.addEventListener("click", e => { e.stopPropagation(); if (favs.has(id)) { favs.delete(id); b.classList.remove("on"); } else { favs.add(id); b.classList.add("on"); haptic("light"); } lsSet(FK, [...favs]); });
      card.appendChild(b); card.addEventListener("click", () => { rec = [id, ...rec.filter(x => x !== id)].slice(0, 8); lsSet(RK, rec); }); });

    const chips = $(".mv-chips", root); if (chips) { let ff = false; const fc = document.createElement("button"); fc.className = "mv-chip"; fc.innerHTML = ico("heart") + " Të preferuarat";
      fc.addEventListener("click", () => { ff = !ff; fc.classList.toggle("on", ff); $$(".mv-card", root).forEach(c => c.style.display = !ff || favs.has(c.dataset.id) ? "" : "none"); $$(".mv-cat", root).forEach(s => s.style.display = $$(".mv-card", s).some(c => c.style.display !== "none") ? "" : "none"); haptic("light"); }); chips.appendChild(fc); }

    if (rec.length) { const w = document.createElement("div"); w.style.cssText = "padding:0 18px 6px"; w.innerHTML = '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1.6px;color:#a1a1aa;margin:10px 0 9px">Parë së fundmi</div><div style="display:flex;gap:9px;overflow-x:auto;padding-bottom:5px">' + rec.filter(id => all[id]).map(id => '<span style="white-space:nowrap;font-size:11px;font-weight:700;background:#f4f4f5;padding:7px 12px;border-radius:99px;color:#52525b">' + esc(all[id].name) + "</span>").join("") + "</div>"; const main = $(".mv-main", root); main.parentNode.insertBefore(w, main); }
    return {};
  };
})(window.BM);
