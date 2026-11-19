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
    { k: 'cal', t: '📅 일정', f: function () { go('wbCal'); }, need: 'wbCal' },
    { k: 'my', t: '⭐ 내 종목', f: function () { clickTab('내 종목'); } },
    { k: 'link', t: '🔗 이 종목 링크', f: function () { copyLink(); }, need: '__wbcur' },
    { k: 'share', t: '📤 카드 저장', f: function () { if (window.__wbShare) window.__wbShare(cur); }, need: '__wbcur' },
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
      b.style.display = (it && it.need && !(it.need === '__wbcur' ? cur : document.getElementById(it.need))) ? 'none' : '';
    });
    var nav = document.querySelector('nav'); if (nav) document.documentElement.style.setProperty('--wbnav', nav.offsetHeight + 'px');
  }
  var cur = '', toastEl;
  function okT(t) { return /^[A-Za-z0-9.\-]{1,12}$/.test(t || ''); }
  function setUrl(t) { try { var u = new URL(location.href); u.searchParams.set('t', t); history.replaceState(null, '', u.pathname + u.search + u.hash); } catch (e) {} }
  function toast(msg) {
    if (!toastEl) { toastEl = el('div'); toastEl.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#111827;color:#fff;padding:9px 16px;border-radius:999px;font:600 14px sans-serif;z-index:2147482000;opacity:0;transition:opacity .2s;pointer-events:none'; document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.style.opacity = '1'; clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.style.opacity = '0'; }, 1800);
  }
  function copyLink() {
    if (!cur) return; var url = location.origin + location.pathname + '?t=' + encodeURIComponent(cur);
    function fb() { var ta = el('textarea'); ta.value = url; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast('링크를 복사했어요'); } catch (e) { toast(url); } ta.remove(); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { toast('링크를 복사했어요'); }, fb); else fb();
  }
  function openT(t) {
    var li = document.querySelector('li[data-t="' + t + '"]'); if (li) { li.click(); return true; }
    var q = document.getElementById('q'); if (!q) return false;
    q.value = t; q.dispatchEvent(new Event('input', { bubbles: true }));
    setTimeout(function () { var r = document.querySelector('#res li[data-t="' + t + '"]') || document.querySelector('#res li[data-t]'); if (r) r.click(); }, 300);
    return true;
  }
  function deep() {
    var t = ''; try { t = new URL(location.href).searchParams.get('t') || ''; } catch (e) {}
    if (!okT(t)) return; var tries = 0;
    (function tick() { if (document.getElementById('q') && document.querySelector('li[data-t]')) { openT(t); return; } if (++tries < 30) setTimeout(tick, 500); })();
  }
  document.addEventListener('click', function (e) {
    var li = e.target.closest && e.target.closest('li[data-t]'); if (!li) return;
    var t = li.getAttribute('data-t'); if (okT(t)) { cur = t; setUrl(t); sync(); }
  }, true);

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
    deep();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
