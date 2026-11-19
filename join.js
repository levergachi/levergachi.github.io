/* 레버가치 · 텔레그램 가입 안내 (join.js v1) — '시작하기' 탭에 3단계 안내와 바로가기 버튼을 더한다. 가입 암호 정책은 그대로. */
(function () {
  'use strict';
  if (window.__wbJoin) return; window.__wbJoin = 1;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function findLink(re, host) { return [].filter.call(document.querySelectorAll('a'), function (a) { return re.test(a.textContent) && (!host || a.hostname === host); })[0]; }
  function css() {
    var s = el('style'); s.id = 'wbJoinCss';
    s.textContent = '#wbJoin h2{margin:0 0 4px;font-size:18px}#wbJoin .sub{color:var(--mute,#64748b);font-size:14px;line-height:1.5;margin-bottom:10px}' +
      '#wbJoin ol{list-style:none;margin:0;padding:0;counter-reset:s}#wbJoin li{counter-increment:s;display:flex;gap:12px;padding:12px 0;border-top:1px solid var(--line,#e5e7eb)}' +
      '#wbJoin li:before{content:counter(s);flex:0 0 auto;width:28px;height:28px;border-radius:50%;background:var(--brand,#0f766e);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center}' +
      '#wbJoin .t{font-weight:700;line-height:1.4}#wbJoin .d{font-size:13.5px;color:var(--mute,#64748b);margin-top:3px;line-height:1.5}' +
      '#wbJoin .bt{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}#wbJoin .bt a{text-decoration:none;border:1.5px solid var(--brand,#0f766e);color:var(--brand,#0f766e);border-radius:10px;padding:8px 12px;font-weight:700;font-size:14px}' +
      '#wbJoin .bt a.pri{background:var(--brand,#0f766e);color:#fff}#wbJoin details{border-top:1px solid var(--line,#e5e7eb);padding:10px 0}#wbJoin summary{cursor:pointer;font-weight:700}#wbJoin details p{margin:8px 0 0;font-size:14px;line-height:1.55;color:var(--mute,#64748b)}';
    document.head.appendChild(s);
  }
  function btn(txt, a, pri) { if (!a) return null; var b = el('a', pri ? 'pri' : '', txt); b.href = a.href; b.target = '_blank'; b.rel = 'noopener'; return b; }
  function build() {
    var sec = document.getElementById('start'); if (!sec || document.getElementById('wbJoin')) return !!document.getElementById('wbJoin');
    var ok = findLink(/오픈채팅/, 'open.kakao.com') || findLink(/오픈채팅/), tg = findLink(/텔레그램/, 't.me') || findLink(/텔레그램/);
    if (!ok && !tg) return false;
    css(); var c = el('div', 'card'); c.id = 'wbJoin';
    c.appendChild(el('h2', null, '🚀 3단계로 시작해요'));
    c.appendChild(el('div', 'sub', '처음이어도 순서대로 따라 하면 돼요. 신호는 드물게 오고, 조건이 맞았다는 알림일 뿐 매수 권유가 아니에요.'));
    var ol = el('ol');
    function step(t, d, btns) { var li = el('li'), b = el('div'); b.appendChild(el('div', 't', t)); b.appendChild(el('div', 'd', d)); if (btns && btns.length) { var w = el('div', 'bt'); btns.forEach(function (x) { if (x) w.appendChild(x); }); if (w.children.length) b.appendChild(w); } li.appendChild(b); ol.appendChild(li); }
    step('카카오톡 오픈채팅 \'레버가치\'에서 가입 암호 받기', '가입에는 암호가 필요해요. 카카오톡 오픈채팅에서 받을 수 있어요. 가입은 무료예요.', [btn('💬 오픈채팅 열기', ok, true)]);
    step('텔레그램 봇 열기', '텔레그램이 처음이면 앱부터 설치해 주세요. 이미 쓰고 있다면 아래 버튼으로 바로 열려요.', [btn('✈️ 텔레그램 봇 열기', tg, true), (function () { var a = el('a', null, '텔레그램 앱 받기'); a.href = 'https://telegram.org/apps'; a.target = '_blank'; a.rel = 'noopener'; return a; })()]);
    step('받은 암호를 봇 대화창에 그대로 보내기', '그다음부터 신호가 뜨면 텔레그램으로 알려 드려요. 종목 이름만 보내 보면 쉬운 카드로 답해요.', []);
    c.appendChild(ol);
    [['암호는 어디서 받나요?', '카카오톡 오픈채팅 \'레버가치\'에서 받을 수 있어요. 받은 암호는 텔레그램 봇 대화창에 그대로 보내면 돼요.'],
     ['신호가 자주 오나요?', '아니요, 드물어요. 조건이 다 맞을 때만 보내요. 오지 않는 날이 더 많을 수 있어요.'],
     ['알림 소리가 안 나요', '텔레그램 앱의 알림 설정에서 봇 대화의 알림이 켜져 있는지 확인해 주세요.']].forEach(function (q) {
      var d = el('details'); d.appendChild(el('summary', null, q[0])); d.appendChild(el('p', null, q[1])); c.appendChild(d);
    });
    var dd = el('details'); dd.appendChild(el('summary', null, '📲 앱처럼 홈 화면에 추가하기'));
    var pp = el('p', null, '안드로이드 크롬은 메뉴(⋮)에서 \'홈 화면에 추가\' 또는 \'앱 설치\'를, 아이폰 사파리는 공유 버튼에서 \'홈 화면에 추가\'를 누르면 아이콘으로 바로 열 수 있어요.');
    dd.appendChild(pp);
    function inst() { if (!window.__wbInstall || dd.querySelector('.wbinst')) return; var b = el('button', 'wbinst', '앱 설치하기'); b.type = 'button'; b.style.cssText = 'display:block;margin-top:8px;border:1.5px solid var(--brand,#0f766e);background:var(--brand,#0f766e);color:#fff;border-radius:10px;padding:8px 14px;font:700 14px inherit;cursor:pointer'; b.addEventListener('click', function () { try { window.__wbInstall.prompt(); } catch (e) {} }); dd.appendChild(b); }
    inst(); window.addEventListener('wb-install', inst);
    c.appendChild(dd);
    sec.insertBefore(c, sec.firstChild); return true;
  }
  function start() { var n = 0; (function tick() { if (build() || ++n > 30) return; setTimeout(tick, 500); })(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
