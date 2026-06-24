/* boneMENU — inline SVG icon set (no external deps) */
window.BM = window.BM || {};
(function (BM) {
  const P = {
    home:'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
    cube:'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8',
    qr:'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z',
    eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    plus:'M12 5v14M5 12h14', minus:'M5 12h14',
    trash:'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14',
    edit:'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
    grip:'M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01',
    img:'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6',
    search:'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3',
    heart:'M12 21s-7-4.5-9.5-9C1 9 2.5 5 6 5c2 0 3 1 4 2 1-1 2-2 4-2 3.5 0 5 4 3.5 7C19 16.5 12 21 12 21z',
    fire:'M12 2c1 4-2 5-2 8a3 3 0 0 0 6 0c0-1 0-2-1-3 2 1 4 4 4 7a7 7 0 1 1-14 0c0-5 5-6 7-12z',
    check:'M20 6L9 17l-5-5', x:'M18 6L6 18M6 6l12 12',
    back:'M19 12H5M12 19l-7-7 7-7',
    download:'M12 3v12M7 10l5 5 5-5M5 21h14',
    print:'M6 9V3h12v6M6 18H4v-7h16v7h-2M8 14h8v7H8z', file:'M14 3H6v18h12V8zM14 3v5h5',
    vec:'M5 5h4v4H5zM15 15h4v4h-4zM9 7h6M7 9v6M17 9v6M9 17h6',
    device:'M5 3h14v14H5zM2 21h20M9 21v-2M15 21v-2',
    phone:'M7 2h10v20H7zM11 18h2', tablet:'M5 2h14v20H5zM11 18h2',
    layers:'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5', copy:'M9 9h11v11H9zM5 15H4V4h11v1',
    sparkle:'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
    undo:'M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3', redo:'M15 14l5-5-5-5M20 9H9a5 5 0 0 0 0 10h3',
    bolt:'M13 2L4 14h7l-1 8 9-12h-7z', warn:'M12 3l10 18H2zM12 10v5M12 18h.01',
    info:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v5M12 8h.01', share:'M4 12v8h16v-8M12 16V3M7 8l5-5 5 5'
  };
  BM.ico = function (name, cls) {
    const d = P[name] || '';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' + (cls ? ' class="' + cls + '"' : '') + '>' +
      d.split('M').filter(Boolean).map(s => '<path d="M' + s + '"/>').join('') + '</svg>';
  };
})(window.BM);
