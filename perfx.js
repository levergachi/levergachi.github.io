/* 레버가치 · 성적표 기간별 표 (perfx.js v1) — data.json 원장(ledger)을 '신호가 뜬 시기'별로 묶어 성적표 카드에 표 하나를 더한다. */
(function () {
  'use strict';
  if (window.__wbPerfx) return; window.__wbPerfx = 1;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function f1(v) { return (v >= 0 ? '+' : '') + v.toFixed(1) + '%'; }
  function days(a, b) { return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000); }
  function build(d) {
    var L = (d.ledger || []).filter(function (x) { return x && typeof x.r === 'number' && x.d; });
    var end = (d.perf && d.perf.last_bar) || L.reduce(function (m, x) { return x.d > m ? x.d : m; }, '');
    if (!L.length || !end) return null;
    var P = [['최근 7일', 7], ['최근 30일', 30], ['최근 90일', 90]];
    var rows = P.map(function (p) {
      var s = L.filter(function (x) { var k = days(x.d, end); return k >= 0 && k < p[1]; });
      if (!s.length) return [p[0], 0];
      var avg = s.reduce(function (t, x) { return t + x.r; }, 0) / s.length;
      var sp = s.filter(function (x) { return typeof x.spy === 'number'; });
      var spy = sp.length ? sp.reduce(function (t, x) { return t + x.spy; }, 0) / sp.length : NaN;
      var plus = s.filter(function (x) { return x.r > 0; }).length;
      return [p[0], s.length, avg, spy, plus / s.length * 100];
    });
    var wrap = el('div'); wrap.id = 'wbPerfx'; wrap.style.cssText = 'margin:12px 0';
    wrap.appendChild(el('div', null, '🗓 신호가 뜬 시기별')).style.cssText = 'font-weight:700;margin-bottom:6px';
    var tb = el('table'); tb.style.cssText = 'width:100%;border-collapse:collapse;font-size:14px';
    var hd = el('tr'); ['기간', '건수', '평균', '같은 기간 S&P500', '수익 비율'].forEach(function (h) { var c = el('th', null, h); c.style.cssText = 'text-align:right;padding:6px 4px;border-bottom:1px solid var(--line,#e5e7eb);font-weight:600;color:var(--mute,#64748b);font-size:12.5px'; hd.appendChild(c); });
    hd.firstChild.style.textAlign = 'left'; tb.appendChild(hd);
    rows.forEach(function (r) {
      var tr = el('tr'); var cells = r[1] ? [r[0], r[1] + '건', f1(r[2]), isFinite(r[3]) ? f1(r[3]) : '—', Math.round(r[4]) + '%'] : [r[0], '0건', '—', '—', '—'];
      cells.forEach(function (x, i) { var c = el('td', null, x); c.style.cssText = 'text-align:' + (i ? 'right' : 'left') + ';padding:7px 4px;border-bottom:1px solid var(--line,#eef0f3)'; if (i === 2 && r[1]) c.style.color = r[2] >= 0 ? 'var(--up,#c2410c)' : 'var(--dn,#1d4ed8)'; tr.appendChild(c); });
      tb.appendChild(tr);
    });
    wrap.appendChild(tb);
    var n = el('div', null, '신호가 뜬 날을 기준으로 묶은 값이에요. 수익률은 신호일 기준가 대비 ' + end + ' 종가까지이고, 건수가 적은 구간은 우연의 영향이 커서 참고만 해 주세요.');
    n.style.cssText = 'font-size:12.5px;color:var(--mute,#64748b);margin-top:6px;line-height:1.5'; wrap.appendChild(n);
    return wrap;
  }
  function place(wrap) {
    var perf = document.getElementById('perf'); if (!perf || document.getElementById('wbPerfx')) return !!perf && !!document.getElementById('wbPerfx');
    var tb = perf.querySelector('table');
    if (tb && tb.parentNode) tb.parentNode.insertBefore(wrap, tb.nextSibling); else perf.appendChild(wrap);
    return true;
  }
  function start() {
    fetch('data.json?t=' + Math.floor(Date.now() / 300000), { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (d) {
      var w = build(d); if (!w) return; var tries = 0;
      (function tick() { if (place(w) || ++tries > 40) return; setTimeout(tick, 500); })();
    }).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
