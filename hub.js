/* 레버가치 · 시장 센터 메뉴 바 (hub.js v1) — '오늘' 탭 맨 위에 칩 메뉴를 달아 섹션으로 바로 이동한다. */
(function () {
  'use strict';
  if (window.__wbHub) return; window.__wbHub = 1;
  var host, bar;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function go(id) {
    var t = document.getElementById(id); if (!t) return;
    var nav = document.querySelector('nav'), h = (nav ? nav.offsetHeight : 0) + (bar ? bar.offsetHeight : 0) + 8;
    var y = t.getBoundingClientRect().top + window.pageYOffset - h;
    try { window.scrollTo({ top: y, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, y); }
  }
  function clickTab(txt) {
    var b = [].filter.call(document.querySelectorAll('nav button, nav a, nav [role=tab]'), function (x) { return x.textContent.trim().indexOf(txt) === 0; })[0];
    if (b) { b.click(); try { window.scrollTo(0, 0); } catch (e) {} }
  }
  var ITEMS = [
    { k: 'brief', t: '👀 한눈에', f: function () { go('brief'); } },
    { k: 'sigs', t: '🚦 저점매수 신호', f: function () { go('sigs'); } },
    { k: 'heat', t: '🗺️ 히트맵', f: function () { go('wbHeat'); }, need: 'wbHeat' },
    { k: 'news', t: '📰 뉴스', f: function () { go('wbNews'); }, need: 'wbNews' },
    { k: 'my', t: '⭐ 내 종목', f: function () { clickTab('내 종목'); } },
    { k: 'game', t: '🎮 원복 객장', f: function () { var o = document.getElementById('wbOpen'); if (o) o.click(); }, need: 'wbOpen' }
  ];
  function css() {
    var s = el('style'); s.id = 'wbHubCss';
    s.textContent = '#wbHub{position:sticky;top:var(--wbnav,64px);z-index:4;display:flex;gap:7px;overflow-x:auto;padding:8px 2px;margin:0 0 8px;background:var(--bg,#f8fafc);scrollbar-width:none;-webkit-overflow-scrolling:touch}' +
      '#wbHub::-webkit-scrollbar{display:none}' +
      '#wbHub button{flex:0 0 auto;appearance:none;border:1px solid var(--line,#d8dee6);background:var(--chip,#fff);color:inherit;border-radius:999px;padding:8px 14px;font:700 14px inherit;cursor:pointer;white-space:nowrap;touch-action:manipulation}' +
      '#wbHub button:hover{border-color:var(--brand,#0f766e)}#wbHub button:active{background:var(--brand,#0f766e);color:#fff}' +
      '#today>#wbHub{order:-9}#today>*{scroll-margin-top:120px}';
    document.head.appendChild(s);
  }
  function sync() {
    if (!bar) return;
    [].forEach.call(bar.querySelectorAll('button'), function (b) {
      var it = ITEMS.filter(function (x) { return x.k === b.dataset.k; })[0];
      b.style.display = (it && it.need && !document.getElementById(it.need)) ? 'none' : '';
    });
    var nav = document.querySelector('nav'); if (nav) document.documentElement.style.setProperty('--wbnav', nav.offsetHeight + 'px');
  }
  function build() {
    host = document.getElementById('today'); if (!host || document.getElementById('wbHub')) return;
    css(); bar = el('div'); bar.id = 'wbHub'; bar.setAttribute('role', 'navigation'); bar.setAttribute('aria-label', '시장 센터 메뉴');
    ITEMS.forEach(function (it) {
      var b = el('button', null, it.t); b.type = 'button'; b.dataset.k = it.k;
      b.addEventListener('click', it.f); bar.appendChild(b);
    });
    host.insertBefore(bar, host.firstChild); sync();
    try { new MutationObserver(sync).observe(host, { childList: true }); } catch (e) {}
    try { new MutationObserver(sync).observe(document.querySelector('.links') || document.body, { childList: true, subtree: !!document.querySelector('.links') }); } catch (e) {}
    window.addEventListener('resize', sync);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
