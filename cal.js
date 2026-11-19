/* 레버가치 · 경제 캘린더 (cal.js v1) — calendar.json(공식 일정 수동 확인본)에서 앞으로 일정을 '오늘' 탭에 보여준다. */
(function () {
  'use strict';
  if (window.__wbCal) return; window.__wbCal = 1;
  var OKH = { 'www.bls.gov': 1, 'www.federalreserve.gov': 1 };
  var ICON = { fomc: '🏛️', cpi: '🛒', jobs: '👷' };
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function kstNow() { return new Date(Date.now() + 9 * 3600e3); }
  function ymd(d) { return d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2); }
  function diff(a, b) { return Math.round((Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / 86400000); }
  function wd(s) { return '일월화수목금토'[new Date(s + 'T00:00:00Z').getUTCDay()]; }
  function okSrc(u) { try { var x = new URL(u); return x.protocol === 'https:' && OKH[x.hostname]; } catch (e) { return false; } }
  function css() {
    var s = el('style'); s.id = 'wbCalCss';
    s.textContent = '#wbCal h2{margin:0 0 4px;font-size:17px}#wbCal ul{list-style:none;margin:8px 0 0;padding:0}#wbCal li{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-top:1px solid var(--line,#e5e7eb)}' +
      '#wbCal .dd{flex:0 0 auto;min-width:52px;text-align:center;border-radius:10px;background:var(--chip,#f1f5f9);padding:6px 4px;font-weight:800;font-size:13px;line-height:1.2}#wbCal .dd.soon{background:var(--brand,#0f766e);color:#fff}' +
      '#wbCal .nm{font-weight:700;line-height:1.35}#wbCal .mt{font-size:12.5px;color:var(--mute,#64748b);margin-top:3px;line-height:1.45}#wbCal a{color:inherit}#wbCal .ft{font-size:12px;color:var(--mute,#64748b);margin-top:8px;line-height:1.5}#today>#wbCal{order:1}';
    document.head.appendChild(s);
  }
  function build(j) {
    var today = ymd(kstNow());
    var ev = (j.events || []).filter(function (x) { return x && /^\d{4}-\d{2}-\d{2}$/.test(x.d) && x.n && okSrc(x.src) && (x.e || x.d) >= today; }).sort(function (a, b) { return a.d < b.d ? -1 : 1; }).slice(0, 5);
    var host = document.getElementById('today'); if (!host) return;
    css(); var c = el('div', 'card'); c.id = 'wbCal';
    c.appendChild(el('h2', null, '📅 경제 일정 (한국시간)'));
    if (!ev.length) { c.appendChild(el('div', 'mt', '등록된 앞으로의 일정이 없어요. 곧 갱신할게요.')); }
    else {
      var ul = el('ul');
      ev.forEach(function (x) {
        var k = diff(x.d, today), li = el('li'), dd = el('div', 'dd' + (k <= 3 ? ' soon' : ''), k === 0 ? '오늘' : k < 0 ? '진행 중' : 'D-' + k);
        var box = el('div'), nm = el('div', 'nm', (ICON[x.k] || '📌') + ' ' + x.n); box.appendChild(nm);
        var when = x.d.slice(5).replace('-', '/') + '(' + wd(x.d) + ')' + (x.e ? ' ~ ' + x.e.slice(5).replace('-', '/') : '') + (x.t ? ' ' + x.t : '');
        var m = el('div', 'mt', when + ' · 현지 ' + (x.us || '') + ' · '); var a = el('a', null, '공식 일정'); a.href = x.src; a.target = '_blank'; a.rel = 'noopener noreferrer'; m.appendChild(a);
        box.appendChild(m); li.appendChild(dd); li.appendChild(box); ul.appendChild(li);
      });
      c.appendChild(ul);
    }
    c.appendChild(el('div', 'ft', (j.note || '') + ' 결과 해석이나 예측은 하지 않고, 날짜만 알려 드려요. (확인일 ' + (j.updated || '') + ')'));
    var anchor = document.getElementById('wbNews') || document.getElementById('wbHeat') || document.getElementById('sigs');
    if (anchor && anchor.parentNode === host) host.insertBefore(c, anchor.nextSibling); else host.appendChild(c);
  }
  function start() {
    if (!document.getElementById('today')) return;
    fetch('calendar.json?t=' + Math.floor(Date.now() / 3600000), { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) { if (j && Array.isArray(j.events)) setTimeout(function () { build(j); }, 400); }).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
