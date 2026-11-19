/* 레버가치 · 시장 히트맵 (heat.js v1) — heat.json(야후 시세 수집본)으로 미국·국장 대형주 트리맵을 그린다.
   면적=시총(대략), 빨강=상승·파랑=하락. heat.json이 없거나 깨지면 카드를 그리지 않는다. */
(function () {
  'use strict';
  if (window.__wbHeat) return; window.__wbHeat = 1;
  var DATA, mkt = 'us', card, cv, tip, rects = [], stocksSet = null;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function pct(r) { return r[5] > 0 && r[4] > 0 ? r[4] / r[5] - 1 : NaN; }
  function col(ch) {
    if (!isFinite(ch)) return '#3a3f4d';
    var t = Math.max(-1, Math.min(1, ch / 0.03)), a = Math.pow(Math.abs(t), 0.8), b = [62, 66, 82], g = t >= 0 ? [214, 40, 52] : [36, 98, 214];
    return 'rgb(' + b.map(function (v, i) { return Math.round(v + (g[i] - v) * a); }).join(',') + ')';
  }
  function kst(iso) { var d = new Date(iso); if (isNaN(d)) return ''; var k = new Date(d.getTime() + 9 * 3600e3), p = function (n) { return (n < 10 ? '0' : '') + n; }; return p(k.getUTCMonth() + 1) + '/' + p(k.getUTCDate()) + ' ' + p(k.getUTCHours()) + ':' + p(k.getUTCMinutes()); }
  // squarified treemap: items [{v, ...}] → rects
  function layout(items, x, y, w, h) {
    var out = [], arr = items.slice().sort(function (a, b) { return b.v - a.v; }), tot = arr.reduce(function (s, i) { return s + i.v; }, 0);
    if (!tot || w < 1 || h < 1) return out;
    var scale = (w * h) / tot; arr.forEach(function (i) { i.a = i.v * scale; });
    function worst(row, side) { var s = row.reduce(function (t, i) { return t + i.a; }, 0), mx = Math.max.apply(null, row.map(function (i) { return i.a; })), mn = Math.min.apply(null, row.map(function (i) { return i.a; })); return Math.max(side * side * mx / (s * s), (s * s) / (side * side * mn)); }
    var row = [], rem = arr.slice(), cx = x, cy = y, cw = w, ch = h;
    function flush() {
      var s = row.reduce(function (t, i) { return t + i.a; }, 0), side = Math.min(cw, ch), thick = s / side, pos = 0;
      row.forEach(function (i) {
        var len = i.a / thick;
        if (cw >= ch) out.push({ it: i, x: cx, y: cy + pos, w: thick, h: len }); else out.push({ it: i, x: cx + pos, y: cy, w: len, h: thick });
        pos += len;
      });
      if (cw >= ch) { cx += thick; cw -= thick; } else { cy += thick; ch -= thick; }
      row = [];
    }
    while (rem.length) {
      var i = rem[0], side = Math.min(cw, ch);
      if (!row.length || worst(row.concat([i]), side) <= worst(row, side)) { row.push(i); rem.shift(); } else flush();
    }
    if (row.length) flush();
    return out;
  }
  function draw() {
    var rows = DATA[mkt]; if (!rows || !rows.length) return;
    var pn = cv.parentNode, ps = getComputedStyle(pn), W = Math.floor((pn.clientWidth || 340) - (parseFloat(ps.paddingLeft) || 0) - (parseFloat(ps.paddingRight) || 0)) || 340, H = Math.round(W < 520 ? W * 1.2 : W * 0.6), dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    cv.style.width = W + 'px'; cv.style.height = H + 'px'; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = '#05070d'; c.fillRect(0, 0, W, H);
    var kr = mkt === 'kr', gs = {};
    rows.forEach(function (r) { (gs[r[2]] = gs[r[2]] || []).push({ v: r[3], r: r }); });
    var groups = Object.keys(gs).map(function (g) { return { g: g, v: gs[g].reduce(function (s, i) { return s + i.v; }, 0), items: gs[g] }; });
    rects = []; var up = 0, dn = 0, font = '-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif';
    layout(groups, 0, 0, W, H).forEach(function (gr) {
      var hd = Math.min(18, Math.max(12, gr.h * 0.12)), sw = 0, sc = 0;
      gr.it.items.forEach(function (t) { var ch = pct(t.r); if (isFinite(ch)) { sw += t.v; sc += t.v * ch; } });
      var avg = sw ? sc / sw : NaN;
      c.fillStyle = '#1a1f2b'; c.fillRect(gr.x + 0.5, gr.y + 0.5, gr.w - 1, hd);
      c.save(); c.beginPath(); c.rect(gr.x, gr.y, gr.w, hd + 1); c.clip();
      c.fillStyle = '#d5dbe6'; c.font = '800 ' + (hd * 0.68) + 'px ' + font; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(gr.it.g, gr.x + 4, gr.y + hd / 2 + 1);
      if (isFinite(avg) && gr.w > 90) { c.textAlign = 'right'; c.fillStyle = avg >= 0 ? '#ff7a82' : '#7fb0ff'; c.fillText((avg >= 0 ? '+' : '') + (avg * 100).toFixed(2) + '%', gr.x + gr.w - 4, gr.y + hd / 2 + 1); }
      c.restore();
      layout(gr.it.items, gr.x + 0.5, gr.y + hd + 1, gr.w - 1, gr.h - hd - 1.5).forEach(function (t) {
        var ch = pct(t.it.r); if (isFinite(ch)) { if (ch > 0) up++; else if (ch < 0) dn++; }
        var x = t.x + 0.7, y = t.y + 0.7, w = t.w - 1.4, h = t.h - 1.4; if (w < 2 || h < 2) return;
        c.fillStyle = col(ch); c.fillRect(x, y, w, h); rects.push({ x: x, y: y, w: w, h: h, r: t.it.r });
        var name = kr ? t.it.r[1] : t.it.r[0], fs = Math.min(w / (name.length * (kr ? 1.05 : 0.68) + 0.5), h * 0.4, 22); if (fs < 8) return;
        c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
        var two = h > fs * 2.1, cx = x + w / 2, cy = y + h / 2;
        c.font = '800 ' + fs + 'px ' + font; c.fillText(name, cx, cy - (two ? fs * 0.42 : 0));
        if (two) { c.font = '700 ' + (fs * 0.62) + 'px ' + font; c.fillStyle = 'rgba(255,255,255,.93)'; c.fillText(isFinite(ch) ? (ch >= 0 ? '+' : '') + (ch * 100).toFixed(2) + '%' : '—', cx, cy + fs * 0.55); }
        c.restore();
      });
    });
    card.querySelector('.hb').textContent = '▲ ' + up + '  ▼ ' + dn + '  (' + (kr ? '국장 ' : '미국 ') + rows.length + '종목)';
  }
  function showTip(r) {
    var ch = pct(r), usd = mkt === 'us';
    tip.textContent = '';
    var b = el('b', null, r[1] + (usd ? ' (' + r[0] + ')' : '')); tip.appendChild(b);
    tip.appendChild(document.createTextNode('  ' + (usd ? '$' : '') + r[4].toLocaleString('en-US', { maximumFractionDigits: r[4] >= 1000 ? 0 : 2 }) + (usd ? '' : '원') + '  ' + (isFinite(ch) ? (ch >= 0 ? '▲ +' : '▼ ') + (ch * 100).toFixed(2) + '%' : '')));
    if (usd && stocksSet && stocksSet[r[0]]) {
      var bt = el('button', 'tb', '레버가치 점수 보기'); bt.type = 'button'; bt.addEventListener('click', function () { openT(r[0], r[1]); }); tip.appendChild(document.createTextNode('  ')); tip.appendChild(bt);
    }
  }
  function openT(t, name) {
    var li = document.querySelector('li[data-t="' + t.replace(/"/g, '') + '"]'); if (li) { li.click(); return; }
    var q = document.getElementById('q'); if (!q) return;
    q.value = name || t; q.dispatchEvent(new Event('input', { bubbles: true }));
    setTimeout(function () { var r = document.querySelector('#res li[data-t="' + t.replace(/"/g, '') + '"]') || document.querySelector('#res li[data-t]'); if (r) r.click(); }, 250);
  }
  function css() {
    if (document.getElementById('wbHeatCss')) return; var s = el('style'); s.id = 'wbHeatCss';
    s.textContent = '#wbHeat h2{margin:0 0 6px;font-size:17px}#wbHeat .ht{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px}' +
      '#wbHeat .ht button{appearance:none;border:1px solid var(--line,#ddd);background:var(--chip,#f1f5f9);color:inherit;border-radius:999px;padding:5px 12px;font:700 13px inherit;cursor:pointer}' +
      '#wbHeat .ht button.on{background:var(--brand,#0f766e);border-color:var(--brand,#0f766e);color:#fff}#wbHeat .hb{font-size:12.5px;color:var(--mute,#64748b);margin-left:auto}' +
      '#wbHeat canvas{display:block;width:100%;border-radius:10px;cursor:pointer;touch-action:manipulation}' +
      '#wbHeat .tp{min-height:34px;margin-top:8px;font-size:14px;line-height:1.5}#wbHeat .tp .tb{appearance:none;border:1px solid var(--brand,#0f766e);background:none;color:var(--brand,#0f766e);border-radius:8px;padding:3px 9px;font:700 12.5px inherit;cursor:pointer}' +
      '#wbHeat .ft{font-size:12px;color:var(--mute,#64748b);margin-top:6px;line-height:1.5}#today>#wbHeat{order:-1}';
    document.head.appendChild(s);
  }
  function build() {
    css(); card = el('div', 'card'); card.id = 'wbHeat';
    card.appendChild(el('h2', null, '🗺️ 시장 히트맵'));
    var ht = el('div', 'ht');
    [['us', '🇺🇸 미국장'], ['kr', '🇰🇷 국장']].forEach(function (x) {
      var b = el('button', null, x[1]); b.type = 'button'; b.dataset.m = x[0];
      b.addEventListener('click', function () { mkt = x[0]; sync(); }); ht.appendChild(b);
    });
    ht.appendChild(el('span', 'hb')); card.appendChild(ht);
    cv = el('canvas'); cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', '시장 히트맵'); card.appendChild(cv);
    tip = el('div', 'tp', '칸을 누르면 종목 정보가 여기에 나와요.'); card.appendChild(tip);
    var ft = el('div', 'ft', '면적=시가총액(대략) · 빨강=상승 · 파랑=하락. 야후 파이낸스 시세(지연·마감가 포함) · 마지막 수집 ' + kst(DATA.updated) + ' · 재미·참고용이며 투자 권유가 아니에요.');
    card.appendChild(ft);
    cv.addEventListener('click', function (e) {
      var r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      for (var i = 0; i < rects.length; i++) { var t = rects[i]; if (x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h) { showTip(t.r); return; } }
    });
    var host = document.getElementById('today'), anchor = document.getElementById('wbChg') || document.getElementById('sigs') || document.getElementById('brief');
    if (!host) return;
    if (anchor && anchor.parentNode === host) host.insertBefore(card, anchor.nextSibling); else host.appendChild(card);
    var tm = 0; window.addEventListener('resize', function () { clearTimeout(tm); tm = setTimeout(draw, 150); });
    sync();
  }
  function sync() { [].forEach.call(card.querySelectorAll('.ht button'), function (b) { b.classList.toggle('on', b.dataset.m === mkt); }); tip.textContent = '칸을 누르면 종목 정보가 여기에 나와요.'; draw(); }
  function start() {
    if (!document.getElementById('today')) return;
    fetch('heat.json?t=' + Math.floor(Date.now() / 600000), { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
      if (!j || !Array.isArray(j.us) || !Array.isArray(j.kr) || !(j.us.length + j.kr.length)) return;
      var ok = function (a) { return a.filter(function (r) { return r && r.length >= 6 && r[3] > 0 && isFinite(r[4]) && isFinite(r[5]); }); };
      j.us = ok(j.us); j.kr = ok(j.kr); DATA = j; if (!j.us.length) mkt = 'kr';
      build();
      fetch('stocks.json?t=' + Math.floor(Date.now() / 600000)).then(function (r) { return r.json(); }).then(function (s) { stocksSet = {}; (s.items || []).forEach(function (i) { stocksSet[i.t] = 1; }); }).catch(function () {});
    }).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
