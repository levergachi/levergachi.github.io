/* 레버가치 · 공식 발표 모음 (news.js v1) — news.json(공식 RSS 링크 모음)을 '오늘' 탭에 카드로 보여준다.
   링크만 걸고 요약·해석은 하지 않는다. news.json이 없거나 깨지면 카드를 그리지 않는다. */
(function () {
  'use strict';
  if (window.__wbNews) return; window.__wbNews = 1;
  var SRC = { fed: { n: '연준(Fed)', f: 'us' }, sec: { n: 'SEC', f: 'us' }, dart: { n: 'DART 공시', f: 'kr' } };
  var HOST = { fed: 'www.federalreserve.gov', sec: 'www.sec.gov', dart: 'dart.fss.or.kr' };
  var SHOW = 8, filter = 'all', all = [], more = false, card, meta;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function kst(iso) {
    var d = new Date(iso); if (isNaN(d)) return '';
    var k = new Date(d.getTime() + 9 * 3600 * 1000), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(k.getUTCMonth() + 1) + '/' + p(k.getUTCDate()) + ' ' + p(k.getUTCHours()) + ':' + p(k.getUTCMinutes());
  }
  function okLink(i) { try { var u = new URL(i.l); return u.protocol === 'https:' && u.hostname === HOST[i.s]; } catch (e) { return false; } }
  function css() {
    if (document.getElementById('wbNewsCss')) return;
    var s = el('style'); s.id = 'wbNewsCss';
    s.textContent = '#wbNews .nh{display:flex;align-items:center;gap:8px;flex-wrap:wrap}#wbNews h2{margin:0;font-size:17px}' +
      '#wbNews .nc{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 4px}' +
      '#wbNews .nc button{appearance:none;border:1px solid var(--line,#ddd);background:var(--chip,#f1f5f9);color:inherit;border-radius:999px;padding:5px 11px;font:600 13px inherit;cursor:pointer}' +
      '#wbNews .nc button.on{background:var(--brand,#0f766e);border-color:var(--brand,#0f766e);color:#fff}' +
      '#wbNews ul{list-style:none;margin:6px 0 0;padding:0}#wbNews li{padding:9px 0;border-top:1px solid var(--line,#e5e7eb)}' +
      '#wbNews li a{color:inherit;text-decoration:none;display:block}#wbNews li a:hover .tt{text-decoration:underline}' +
      '#wbNews .tt{font-weight:600;line-height:1.4;word-break:break-word}#wbNews .mt{font-size:12.5px;color:var(--mute,#64748b);margin-top:3px}' +
      '#wbNews .bd{display:inline-block;font-size:11.5px;font-weight:700;border-radius:6px;padding:1px 6px;margin-right:6px;background:var(--chip,#f1f5f9)}' +
      '#wbNews .bd.w{background:#fef3c7;color:#92400e}#wbNews .mr{margin-top:8px;appearance:none;border:1px solid var(--line,#ddd);background:none;color:inherit;border-radius:9px;padding:7px 12px;font:600 13px inherit;cursor:pointer}' +
      '#wbNews .og{font-size:12.5px;color:var(--mute,#64748b);margin-top:2px;line-height:1.4;word-break:break-word}' +
      '#wbNews .ft{font-size:12px;color:var(--mute,#64748b);margin-top:10px;line-height:1.5}';
    document.head.appendChild(s);
  }
  function render() {
    var list = all.filter(function (i) { return filter === 'all' || SRC[i.s].f === filter || (filter === 'watch' && i.w); });
    var ul = card.querySelector('ul'); ul.textContent = '';
    var n = more ? list.length : Math.min(SHOW, list.length);
    for (var k = 0; k < n; k++) {
      var i = list[k], li = el('li'), a = el('a'); a.href = i.l; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.appendChild(el('div', 'tt', i.k || i.t)); if (i.k) a.appendChild(el('div', 'og', '원문: ' + i.t));
      var m = el('div', 'mt'); var b = el('span', 'bd' + (i.w ? ' w' : ''), (i.w ? '★ ' : '') + SRC[i.s].n + (i.k ? ' · 자동번역' : '')); m.appendChild(b);
      m.appendChild(document.createTextNode((i.co ? i.co + ' · ' : '') + kst(i.d) + ' (한국시간)'));
      a.appendChild(m); li.appendChild(a); ul.appendChild(li);
    }
    if (!list.length) ul.appendChild(el('li', 'mt', '이 구분에는 아직 올라온 발표가 없어요.'));
    var mr = card.querySelector('.mr'); mr.style.display = list.length > SHOW ? '' : 'none'; mr.textContent = more ? '접기' : '더 보기 (' + (list.length - SHOW) + '건)';
    [].forEach.call(card.querySelectorAll('.nc button'), function (b) { b.classList.toggle('on', b.dataset.f === filter); });
  }
  function build(j) {
    css();
    card = el('div', 'card'); card.id = 'wbNews';
    var h = el('div', 'nh'); h.appendChild(el('h2', null, '📰 공식 발표 모음')); card.appendChild(h);
    var nc = el('div', 'nc');
    [['all', '전체'], ['us', '🇺🇸 미국(Fed·SEC)'], ['kr', '🇰🇷 한국 공시'], ['watch', '★ 삼성전자·SK하이닉스']].forEach(function (x) {
      var b = el('button', null, x[1]); b.type = 'button'; b.dataset.f = x[0];
      b.addEventListener('click', function () { filter = x[0]; more = false; render(); }); nc.appendChild(b);
    });
    card.appendChild(nc); card.appendChild(el('ul'));
    var mr = el('button', 'mr'); mr.type = 'button'; mr.addEventListener('click', function () { more = !more; render(); }); card.appendChild(mr);
    meta = el('div', 'ft'); card.appendChild(meta);
    var upd = new Date(j.updated), hrs = (Date.now() - upd) / 3600000, txt = '연준·SEC 보도자료와 DART 주요 공시(실적·증자·배당·합병 등)의 제목만 모아 원문 링크로 연결해요. 요약·해석은 하지 않고, 영어 제목은 자동번역이라 틀릴 수 있어요. 원문 링크로 확인해 주세요.';
    if (!isNaN(upd)) txt += ' 마지막 수집 ' + kst(j.updated) + (hrs > 6 ? ' ⚠ 수집이 늦어지고 있어요.' : '') + '.';
    meta.textContent = txt;
    var anchor = document.getElementById('wbChg') || document.getElementById('sigs') || document.getElementById('brief');
    var host = document.getElementById('today'); if (!host) return;
    if (anchor && anchor.parentNode === host) host.insertBefore(card, anchor.nextSibling); else host.appendChild(card);
    render();
  }
  function start() {
    if (!document.getElementById('today')) return;
    var q = '?t=' + Math.floor(Date.now() / 600000);
    fetch('news.json' + q, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
      if (!j || !Array.isArray(j.items)) return;
      all = j.items.filter(function (i) { return i && SRC[i.s] && i.t && i.l && i.d && okLink(i); });
      if (!all.length) return; build(j);
    }).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
