/* 레버가치 · 종목 카드 이미지 (share.js v1) — 종목의 등급·점수를 그림 한 장으로 저장/공유한다. 서버로 보내는 것은 없다. */
(function () {
  'use strict';
  if (window.__wbShareJs) return; window.__wbShareJs = 1;
  var GC = { S: '#7c3aed', A: '#0f766e', B: '#b45309', C: '#475569', D: '#94a3b8' };
  var cache = null;
  function load() { return cache ? Promise.resolve(cache) : fetch('stocks.json?t=' + Math.floor(Date.now() / 600000)).then(function (r) { return r.json(); }).then(function (j) { cache = j; return j; }); }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function fit(c, txt, max, w, font) { var s = max; do { c.font = font.replace('%', s); if (c.measureText(txt).width <= w || s <= 28) break; s -= 4; } while (true); return s; }
  function draw(it, upd) {
    var W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; var c = cv.getContext('2d');
    var F = '"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",-apple-system,sans-serif', g = String(it.g || '').charAt(0).toUpperCase(), col = GC[g] || '#475569';
    var bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0b3b38'); bg.addColorStop(1, '#0f1b2d'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,.06)'; rr(c, 60, 60, W - 120, H - 120, 48); c.fill();
    c.textBaseline = 'alphabetic'; c.textAlign = 'left'; c.fillStyle = '#fbbf24'; c.font = '800 38px ' + F; c.fillText('레버가치 저점반전 신호', 110, 160);
    c.fillStyle = 'rgba(255,255,255,.65)'; c.font = '600 30px ' + F; c.fillText('싸졌고, 튼튼하고, 다시 오르기 시작한 종목', 110, 212);
    var tk = String(it.t || ''), s1 = fit(c, tk, 150, W - 220, '900 %px ' + F); c.fillStyle = '#fff'; c.font = '900 ' + s1 + 'px ' + F; c.fillText(tk, 110, 420);
    var nm = String(it.n || '').replace(/\(.*\)$/, '').trim() || tk, s2 = fit(c, nm, 64, W - 220, '700 %px ' + F); c.fillStyle = 'rgba(255,255,255,.9)'; c.font = '700 ' + s2 + 'px ' + F; c.fillText(nm, 110, 510);
    c.fillStyle = col; c.beginPath(); c.arc(W / 2, 820, 190, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = '900 190px ' + F; c.fillText(String(it.g || '-'), W / 2, 890);
    c.font = '700 40px ' + F; c.fillStyle = 'rgba(255,255,255,.85)'; c.fillText('등급', W / 2, 1050);
    c.font = '800 64px ' + F; c.fillStyle = '#fff'; c.fillText((isFinite(it.s) ? (+it.s).toFixed(1) : '-') + ' / 100점', W / 2, 1135);
    c.textAlign = 'left'; c.fillStyle = 'rgba(255,255,255,.6)'; c.font = '500 27px ' + F; c.fillText('점수 기준 ' + (upd || '') + ' · 매수·매도 권유가 아니에요', 110, 1215);
    c.fillStyle = '#fbbf24'; c.font = '700 30px ' + F; c.fillText('levergachi.github.io', 110, 1262);
    return cv;
  }
  function out(cv, t) {
    cv.toBlob(function (b) {
      if (!b) return;
      var file; try { file = new File([b], 'levergachi-' + t + '.png', { type: 'image/png' }); } catch (e) {}
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: '레버가치 ' + t, url: location.origin + location.pathname + '?t=' + encodeURIComponent(t) }).catch(function () {}); return; }
      var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'levergachi-' + t + '.png'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    }, 'image/png');
  }
  window.__wbShare = function (t) {
    if (!/^[A-Za-z0-9.\-]{1,12}$/.test(t || '')) return;
    load().then(function (j) { var it = (j.items || []).filter(function (x) { return x.t === t; })[0]; if (!it) return; out(draw(it, j.updated), t); }).catch(function () {});
  };
})();
